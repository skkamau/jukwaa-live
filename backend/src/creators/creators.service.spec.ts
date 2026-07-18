import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../database/prisma.service';
import { CreatorsService, RESERVED_CHANNEL_SLUGS } from './creators.service';

const channel = {
  id: 'channel-1', slug: 'samuel-plays', name: 'Samuel Plays', description: null,
  bannerUrl: null, status: 'ACTIVE', createdAt: new Date('2026-01-01'),
};
const creator = {
  id: 'creator-1', status: 'ACTIVE', verifiedAt: null,
  createdAt: new Date('2026-01-01'), channel,
};

describe('CreatorsService', () => {
  const prisma = {
    user: { findFirst: jest.fn() },
    creatorProfile: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn() },
    channel: { update: jest.fn() },
    $transaction: jest.fn(),
  };
  const service = new CreatorsService(prisma as unknown as PrismaService);
  beforeEach(() => jest.clearAllMocks());

  it('returns null for a user without a creator profile', async () => {
    prisma.creatorProfile.findUnique.mockResolvedValue(null);
    await expect(service.getMe('user-1')).resolves.toBeNull();
  });

  it('atomically creates an active creator and channel for a verified user', async () => {
    prisma.user.findFirst.mockResolvedValue({ emailVerifiedAt: new Date(), creatorProfile: null });
    const tx = {
      creatorProfile: {
        create: jest.fn().mockResolvedValue({ id: 'creator-1' }),
        findUniqueOrThrow: jest.fn().mockResolvedValue(creator),
      },
      channel: { create: jest.fn().mockResolvedValue(channel) },
    };
    prisma.$transaction.mockImplementation((callback: (client: typeof tx) => unknown) => callback(tx));
    await expect(service.create('user-1', {
      name: 'Samuel Plays', slug: 'samuel-plays', description: 'Games',
    })).resolves.toMatchObject({ status: 'ACTIVE', channel: { slug: 'samuel-plays' } });
    expect(tx.creatorProfile.create).toHaveBeenCalledWith({ data: { userId: 'user-1', status: 'ACTIVE' } });
    expect(tx.channel.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ creatorProfileId: 'creator-1', slug: 'samuel-plays' }) }));
  });

  it('rejects unverified accounts before creating anything', async () => {
    prisma.user.findFirst.mockResolvedValue({ emailVerifiedAt: null, creatorProfile: null });
    await expect(service.create('user-1', { name: 'Sam', slug: 'sam-plays' })).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects a second creator profile', async () => {
    prisma.user.findFirst.mockResolvedValue({ emailVerifiedAt: new Date(), creatorProfile: { id: 'existing' } });
    await expect(service.create('user-1', { name: 'Sam', slug: 'sam-plays' })).rejects.toBeInstanceOf(ConflictException);
  });

  it.each(['admin', 'api', 'dashboard', 'channel', 'go-live'])('rejects reserved slug %s', async (slug) => {
    expect(RESERVED_CHANNEL_SLUGS.has(slug)).toBe(true);
    await expect(service.create('user-1', { name: 'Sam', slug })).rejects.toBeInstanceOf(ConflictException);
  });

  it('maps a database uniqueness race to a safe duplicate-slug response', async () => {
    prisma.user.findFirst.mockResolvedValue({ emailVerifiedAt: new Date(), creatorProfile: null });
    prisma.$transaction.mockRejectedValue({ code: 'P2002' });
    await expect(service.create('user-1', { name: 'Sam', slug: 'sam-plays' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('updates only the authenticated owner channel name and description', async () => {
    prisma.creatorProfile.findUnique.mockResolvedValue({ id: 'creator-1', status: 'ACTIVE', channel: { id: 'channel-1' } });
    prisma.channel.update.mockResolvedValue({});
    prisma.creatorProfile.findUniqueOrThrow.mockResolvedValue({ ...creator, channel: { ...channel, name: 'New Name' } });
    await service.updateChannel('user-1', { name: 'New Name', description: 'Updated' });
    expect(prisma.channel.update).toHaveBeenCalledWith({
      where: { id: 'channel-1' }, data: { name: 'New Name', description: 'Updated' },
    });
  });

  it('cannot update a channel not owned by the authenticated user', async () => {
    prisma.creatorProfile.findUnique.mockResolvedValue(null);
    await expect(service.updateChannel('other-user', { name: 'Nope' })).rejects.toBeInstanceOf(NotFoundException);
  });
});
