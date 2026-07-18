import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { CreateCreatorDto, UpdateChannelDto } from './dto/creator.dto';
import { creatorSelect, toCreatorResponse, type CreatorResponse } from './creator.types';

export const RESERVED_CHANNEL_SLUGS = new Set([
  'admin', 'api', 'browse', 'category', 'channel', 'clips', 'creator',
  'dashboard', 'earnings', 'following', 'forgot-password', 'go-live', 'help',
  'login', 'moderation', 'privacy', 'register', 'reset-password', 'settings',
  'support', 'terms', 'verify-email', 'wallet', 'watch',
]);

@Injectable()
export class CreatorsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string): Promise<CreatorResponse | null> {
    const creator = await this.prisma.creatorProfile.findUnique({
      where: { userId },
      select: creatorSelect,
    });
    return creator ? toCreatorResponse(creator) : null;
  }

  async create(userId: string, input: CreateCreatorDto): Promise<CreatorResponse> {
    if (RESERVED_CHANNEL_SLUGS.has(input.slug)) {
      throw new ConflictException('That channel URL is reserved');
    }
    const user = await this.prisma.user.findFirst({
      where: { id: userId, status: 'ACTIVE', deletedAt: null },
      select: { emailVerifiedAt: true, creatorProfile: { select: { id: true } } },
    });
    if (!user) throw new ForbiddenException('This account cannot create a channel');
    if (!user.emailVerifiedAt) {
      throw new ForbiddenException('Verify your email before creating a channel.');
    }
    if (user.creatorProfile) throw new ConflictException('This account already has a creator profile');

    try {
      const creator = await this.prisma.$transaction(async (tx) => {
        const profile = await tx.creatorProfile.create({
          data: { userId, status: 'ACTIVE' },
        });
        await tx.channel.create({
          data: {
            creatorProfileId: profile.id,
            slug: input.slug,
            name: input.name,
            description: input.description || null,
            status: 'ACTIVE',
          },
        });
        return tx.creatorProfile.findUniqueOrThrow({
          where: { id: profile.id },
          select: creatorSelect,
        });
      });
      return toCreatorResponse(creator);
    } catch (error: unknown) {
      if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') {
        throw new ConflictException('That channel URL is already taken');
      }
      throw error;
    }
  }

  async updateChannel(userId: string, input: UpdateChannelDto): Promise<CreatorResponse> {
    const creator = await this.prisma.creatorProfile.findUnique({
      where: { userId },
      select: { id: true, status: true, channel: { select: { id: true } } },
    });
    if (!creator || !creator.channel) throw new NotFoundException('Creator channel not found');
    if (creator.status !== 'ACTIVE') throw new ForbiddenException('Creator account is not active');
    await this.prisma.channel.update({
      where: { id: creator.channel.id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description || null }),
      },
    });
    const updated = await this.prisma.creatorProfile.findUniqueOrThrow({
      where: { userId },
      select: creatorSelect,
    });
    return toCreatorResponse(updated);
  }
}
