import type { PrismaService } from '../database/prisma.service';
import { UsersService } from './users.service';

const databaseUser = {
  id: 'user-1', email: 'sam@example.com', username: 'sam', displayName: 'Sam',
  avatarUrl: null, bio: null, role: 'VIEWER', status: 'ACTIVE',
  emailVerifiedAt: new Date(), createdAt: new Date('2026-01-01'),
};

describe('UsersService', () => {
  const prisma = { user: { findFirst: jest.fn(), update: jest.fn() } };
  const service = new UsersService(prisma as unknown as PrismaService);
  beforeEach(() => jest.clearAllMocks());

  it('returns the authenticated safe user profile', async () => {
    prisma.user.findFirst.mockResolvedValue(databaseUser);
    await expect(service.getMe('user-1')).resolves.toMatchObject({
      id: 'user-1', displayName: 'Sam', emailVerified: true,
    });
  });

  it('updates only supported profile fields and returns no secrets', async () => {
    prisma.user.update.mockResolvedValue({
      ...databaseUser, displayName: 'Samuel', bio: 'Builder', avatarUrl: 'https://example.com/avatar.png',
    });
    const result = await service.updateMe('user-1', {
      displayName: 'Samuel', bio: 'Builder', avatarUrl: 'https://example.com/avatar.png',
    });
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-1' },
      data: { displayName: 'Samuel', bio: 'Builder', avatarUrl: 'https://example.com/avatar.png' },
    }));
    expect(result).not.toHaveProperty('passwordHash');
  });
});
