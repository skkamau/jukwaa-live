import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ChannelsService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublic(slug: string) {
    const channel = await this.prisma.channel.findFirst({
      where: {
        slug: slug.trim().toLowerCase(),
        status: 'ACTIVE',
        deletedAt: null,
        creatorProfile: {
          status: 'ACTIVE',
          user: { status: 'ACTIVE', deletedAt: null },
        },
      },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        bannerUrl: true,
        status: true,
        createdAt: true,
        creatorProfile: {
          select: {
            verifiedAt: true,
            user: {
              select: {
                username: true,
                displayName: true,
                avatarUrl: true,
                bio: true,
              },
            },
          },
        },
      },
    });
    if (!channel) throw new NotFoundException('Channel not found');
    return {
      id: channel.id,
      slug: channel.slug,
      name: channel.name,
      description: channel.description,
      bannerUrl: channel.bannerUrl,
      status: channel.status,
      createdAt: channel.createdAt,
      creator: {
        ...channel.creatorProfile.user,
        verified: channel.creatorProfile.verifiedAt !== null,
      },
    };
  }
}
