import { ConflictException, UnauthorizedException } from '@nestjs/common';
import type { PrismaService } from '../database/prisma.service';
import { AuthService } from './auth.service';
import type { MailService } from './mail.service';
import type { PasswordService } from './password.service';
import type { SessionService } from './session.service';
import { TokenService } from './token.service';

const user = {
  id: 'user-1', email: 'njeri@example.com', username: 'njeri', displayName: 'Njeri',
  avatarUrl: null, bio: null, role: 'VIEWER', status: 'ACTIVE',
  emailVerifiedAt: null, createdAt: new Date('2026-01-01'),
};

describe('AuthService', () => {
  const prisma = {
    user: { create: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn() },
    emailVerificationToken: { create: jest.fn(), findUnique: jest.fn(), updateMany: jest.fn() },
    passwordResetToken: { create: jest.fn(), findUnique: jest.fn(), updateMany: jest.fn() },
    $transaction: jest.fn(),
  };
  const passwords = { hash: jest.fn(), verify: jest.fn(), dummyVerify: jest.fn() };
  const sessions = { create: jest.fn(), revokeAll: jest.fn() };
  const mail = { sendVerification: jest.fn(), sendPasswordReset: jest.fn() };
  const service = new AuthService(
    prisma as unknown as PrismaService,
    passwords as unknown as PasswordService,
    sessions as unknown as SessionService,
    new TokenService(),
    mail as unknown as MailService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    passwords.hash.mockResolvedValue('argon-hash');
    sessions.create.mockResolvedValue('raw-session');
    prisma.emailVerificationToken.create.mockResolvedValue({});
    prisma.passwordResetToken.create.mockResolvedValue({});
  });

  it('registers with a password hash, creates verification/session tokens, and returns no secret fields', async () => {
    prisma.user.create.mockResolvedValue(user);
    const result = await service.register({ email: user.email, username: user.username, displayName: user.displayName, password: 'long password value' });
    expect(passwords.hash).toHaveBeenCalledWith('long password value');
    expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ passwordHash: 'argon-hash' }) }));
    expect(prisma.emailVerificationToken.create.mock.calls[0][0].data.tokenHash).toHaveLength(64);
    expect(sessions.create).toHaveBeenCalledWith(user.id);
    expect(mail.sendVerification).toHaveBeenCalled();
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('returns a safe conflict for duplicate email or username', async () => {
    prisma.user.create.mockRejectedValue({ code: 'P2002' });
    await expect(service.register({ email: user.email, username: user.username, displayName: user.displayName, password: 'long password value' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('logs in with either normalized identity and creates a new session', async () => {
    prisma.user.findFirst.mockResolvedValue({ ...user, passwordHash: 'hash', deletedAt: null });
    passwords.verify.mockResolvedValue(true);
    const result = await service.login({ identity: user.email, password: 'long password value' });
    expect(result.sessionToken).toBe('raw-session');
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('uses dummy verification and a generic response for an unknown identity', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    passwords.dummyVerify.mockResolvedValue(false);
    await expect(service.login({ identity: 'unknown@example.com', password: 'wrong password' })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(passwords.dummyVerify).toHaveBeenCalled();
  });

  it.each(['SUSPENDED', 'BANNED', 'DEACTIVATED'])('rejects a %s account', async (status) => {
    prisma.user.findFirst.mockResolvedValue({ ...user, status, passwordHash: 'hash', deletedAt: null });
    passwords.verify.mockResolvedValue(true);
    await expect(service.login({ identity: user.email, password: 'long password value' })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('keeps password recovery enumeration-safe for missing users', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.requestPasswordReset('missing@example.com')).resolves.toBeUndefined();
    expect(mail.sendPasswordReset).not.toHaveBeenCalled();
  });

  it('uses the same successful forgot-password behavior for an existing account', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...user, deletedAt: null, passwordHash: 'hash' });
    prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
    await expect(service.requestPasswordReset(user.email)).resolves.toBeUndefined();
    expect(prisma.passwordResetToken.create.mock.calls[0][0].data.tokenHash).toHaveLength(64);
    expect(mail.sendPasswordReset).toHaveBeenCalled();
  });

  it('verifies a valid email token once in a transaction', async () => {
    prisma.emailVerificationToken.findUnique.mockResolvedValue({
      id: 'verification-1', userId: user.id, usedAt: null, expiresAt: new Date(Date.now() + 60_000),
    });
    const tx = {
      emailVerificationToken: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      user: { update: jest.fn().mockResolvedValue({ ...user, emailVerifiedAt: new Date() }) },
    };
    prisma.$transaction.mockImplementation((callback: (client: typeof tx) => unknown) => callback(tx));
    await expect(service.verifyEmail('raw-verification')).resolves.toMatchObject({ id: user.id });
    expect(tx.emailVerificationToken.updateMany).toHaveBeenCalled();
  });

  it.each([
    ['expired', { id: 'v', userId: user.id, usedAt: null, expiresAt: new Date(Date.now() - 1) }],
    ['used', { id: 'v', userId: user.id, usedAt: new Date(), expiresAt: new Date(Date.now() + 60_000) }],
  ])('rejects an %s verification token', async (_label, record) => {
    prisma.emailVerificationToken.findUnique.mockResolvedValue(record);
    await expect(service.verifyEmail('raw-verification')).rejects.toThrow();
  });

  it('resets a password, consumes all reset tokens, and revokes every session', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'reset-1', userId: user.id, usedAt: null, expiresAt: new Date(Date.now() + 60_000),
    });
    const tx = {
      passwordResetToken: { updateMany: jest.fn().mockResolvedValueOnce({ count: 1 }).mockResolvedValue({ count: 2 }) },
      user: { update: jest.fn().mockResolvedValue(user) },
      authSession: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) },
    };
    prisma.$transaction.mockImplementation((callback: (client: typeof tx) => unknown) => callback(tx));
    await service.resetPassword('raw-reset-token', 'new long password value');
    expect(tx.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: { passwordHash: 'argon-hash' } }));
    expect(tx.authSession.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: user.id, revokedAt: null } }));
    expect(tx.passwordResetToken.updateMany).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['expired', { id: 'r', userId: user.id, usedAt: null, expiresAt: new Date(Date.now() - 1) }],
    ['used', { id: 'r', userId: user.id, usedAt: new Date(), expiresAt: new Date(Date.now() + 60_000) }],
  ])('rejects an %s password-reset token', async (_label, record) => {
    prisma.passwordResetToken.findUnique.mockResolvedValue(record);
    await expect(service.resetPassword('raw-reset-token', 'new long password value')).rejects.toThrow();
  });
});
