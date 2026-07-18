import { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../database/prisma.service';
import { SessionService } from './session.service';
import { TokenService } from './token.service';

const activeUser = {
  id: 'user-1', email: 'user@example.com', username: 'user', displayName: 'User',
  avatarUrl: null, bio: null, role: 'VIEWER', status: 'ACTIVE',
  emailVerifiedAt: null, createdAt: new Date('2026-01-01'), deletedAt: null,
};

describe('SessionService', () => {
  const prisma = {
    authSession: {
      create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn(),
    },
  };
  const config = {
    get: jest.fn((key: string, fallback?: unknown) => ({
      'app.sessionDays': 30,
      'app.environment': 'test',
    })[key] ?? fallback),
  };
  const service = new SessionService(
    prisma as unknown as PrismaService,
    new TokenService(),
    config as unknown as ConfigService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('creates a database session containing a hash, never the raw cookie token', async () => {
    prisma.authSession.create.mockResolvedValue({});
    const raw = await service.create('user-1');
    const data = prisma.authSession.create.mock.calls[0][0].data;
    expect(raw).toHaveLength(43);
    expect(data.tokenHash).toHaveLength(64);
    expect(data.tokenHash).not.toBe(raw);
    expect(data.userId).toBe('user-1');
  });

  it('authenticates a valid active session', async () => {
    prisma.authSession.findUnique.mockResolvedValue({
      id: 'session-1', lastSeenAt: new Date(), expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null, user: activeUser,
    });
    await expect(service.authenticate('raw-token')).resolves.toMatchObject({ id: 'user-1', sessionId: 'session-1' });
  });

  it.each([
    ['missing', null],
    ['expired', { id: 's', lastSeenAt: new Date(), expiresAt: new Date(Date.now() - 1), revokedAt: null, user: activeUser }],
    ['revoked', { id: 's', lastSeenAt: new Date(), expiresAt: new Date(Date.now() + 60_000), revokedAt: new Date(), user: activeUser }],
    ['suspended user', { id: 's', lastSeenAt: new Date(), expiresAt: new Date(Date.now() + 60_000), revokedAt: null, user: { ...activeUser, status: 'SUSPENDED' } }],
    ['deleted user', { id: 's', lastSeenAt: new Date(), expiresAt: new Date(Date.now() + 60_000), revokedAt: null, user: { ...activeUser, deletedAt: new Date() } }],
  ])('rejects a %s session', async (_label, record) => {
    prisma.authSession.findUnique.mockResolvedValue(record);
    await expect(service.authenticate('raw-token')).resolves.toBeNull();
  });

  it('revokes the current session by hashed token and can revoke every user session', async () => {
    prisma.authSession.updateMany.mockResolvedValue({ count: 1 });
    await service.revoke('raw-token');
    expect(prisma.authSession.updateMany.mock.calls[0][0].where.tokenHash).toHaveLength(64);
    await service.revokeAll('user-1');
    expect(prisma.authSession.updateMany).toHaveBeenLastCalledWith(expect.objectContaining({ where: { userId: 'user-1', revokedAt: null } }));
  });

  it('sets hardened cookie attributes', () => {
    expect(service.cookieOptions).toMatchObject({ httpOnly: true, secure: false, sameSite: 'lax', path: '/' });
    expect(service.cookieOptions.maxAge).toBe(30 * 24 * 60 * 60 * 1000);
  });
});
