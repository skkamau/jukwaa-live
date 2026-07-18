import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../database/prisma.service';
import { ChannelsService } from './channels.service';

describe('ChannelsService', () => {
  const prisma = { channel: { findFirst: jest.fn() } };
  const service = new ChannelsService(prisma as unknown as PrismaService);
  beforeEach(() => jest.clearAllMocks());

  it('returns only safe public channel and creator fields', async () => {
    prisma.channel.findFirst.mockResolvedValue({
      id: 'channel-1', slug: 'samuel-plays', name: 'Samuel Plays', description: 'Games',
      bannerUrl: null, status: 'ACTIVE', createdAt: new Date(),
      creatorProfile: {
        verifiedAt: null,
        user: { username: 'sam', displayName: 'Samuel', avatarUrl: null, bio: 'Builder' },
      },
    });
    const result = await service.findPublic('SAMUEL-PLAYS');
    expect(result).toMatchObject({ slug: 'samuel-plays', creator: { username: 'sam', verified: false } });
    expect(result.creator).not.toHaveProperty('email');
    expect(result.creator).not.toHaveProperty('passwordHash');
    expect(prisma.channel.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ slug: 'samuel-plays', status: 'ACTIVE', deletedAt: null }),
    }));
  });

  it('returns not found for unavailable channels', async () => {
    prisma.channel.findFirst.mockResolvedValue(null);
    await expect(service.findPublic('suspended')).rejects.toBeInstanceOf(NotFoundException);
  });
});
