import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { publicUserSelect, toPublicUser, type PublicUser } from '../auth/auth.types';
import type { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, status: 'ACTIVE', deletedAt: null },
      select: publicUserSelect,
    });
    if (!user) throw new NotFoundException('User profile is unavailable');
    return toPublicUser(user);
  }

  async updateMe(userId: string, input: UpdateProfileDto): Promise<PublicUser> {
    const data = {
      ...(input.displayName !== undefined && { displayName: input.displayName }),
      ...(input.bio !== undefined && { bio: input.bio || null }),
      ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl || null }),
    };
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: publicUserSelect,
    });
    return toPublicUser(user);
  }
}
