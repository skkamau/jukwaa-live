import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { publicUserSelect, toPublicUser, type DatabaseUser, type PublicUser } from './auth.types';
import type { LoginDto, RegisterDto } from './dto/auth.dto';
import { MailService } from './mail.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { TokenService } from './token.service';

const VERIFICATION_TTL = 24 * 60 * 60 * 1000;
const RESET_TTL = 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly sessions: SessionService,
    private readonly tokens: TokenService,
    private readonly mail: MailService,
  ) {}

  async register(input: RegisterDto): Promise<{ user: PublicUser; sessionToken: string }> {
    const passwordHash = await this.passwords.hash(input.password);
    let user: DatabaseUser;
    try {
      user = await this.prisma.user.create({
        data: {
          email: input.email,
          username: input.username,
          displayName: input.displayName,
          passwordHash,
        },
        select: publicUserSelect,
      });
    } catch (error: unknown) {
      if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') {
        throw new ConflictException('An account with that email or username already exists');
      }
      throw error;
    }
    const verification = this.tokens.create();
    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: verification.hash,
        expiresAt: new Date(Date.now() + VERIFICATION_TTL),
      },
    });
    const sessionToken = await this.sessions.create(user.id);
    await this.mail.sendVerification(user.email, verification.raw);
    return { user: toPublicUser(user), sessionToken };
  }

  async login(input: LoginDto): Promise<{ user: PublicUser; sessionToken: string }> {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: input.identity }, { username: input.identity }] },
      select: { ...publicUserSelect, passwordHash: true, deletedAt: true },
    });
    const passwordValid = user?.passwordHash
      ? await this.passwords.verify(user.passwordHash, input.password)
      : await this.passwords.dummyVerify(input.password);
    if (!user || !passwordValid) {
      throw new UnauthorizedException('Invalid email, username, or password');
    }
    if (user.deletedAt || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('This account is not available');
    }
    return { user: toPublicUser(user), sessionToken: await this.sessions.create(user.id) };
  }

  async requestVerification(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt || user.status !== 'ACTIVE' || user.emailVerifiedAt) return;
    await this.prisma.emailVerificationToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    const token = this.tokens.create();
    await this.prisma.emailVerificationToken.create({
      data: { userId: user.id, tokenHash: token.hash, expiresAt: new Date(Date.now() + VERIFICATION_TTL) },
    });
    await this.mail.sendVerification(user.email, token.raw);
  }

  async verifyEmail(rawToken: string): Promise<PublicUser> {
    const token = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash: this.tokens.hash(rawToken) },
    });
    if (!token || token.usedAt || token.expiresAt <= new Date()) {
      throw new BadRequestException('This verification link is invalid or has expired');
    }
    const user = await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.emailVerificationToken.updateMany({
        where: { id: token.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (consumed.count !== 1) throw new BadRequestException('This verification link has already been used');
      return tx.user.update({
        where: { id: token.userId },
        data: { emailVerifiedAt: new Date() },
        select: publicUserSelect,
      });
    });
    return toPublicUser(user);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt || user.status !== 'ACTIVE' || !user.passwordHash) return;
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    const token = this.tokens.create();
    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: token.hash, expiresAt: new Date(Date.now() + RESET_TTL) },
    });
    await this.mail.sendPasswordReset(user.email, token.raw);
  }

  async resetPassword(rawToken: string, password: string): Promise<void> {
    const token = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: this.tokens.hash(rawToken) },
    });
    if (!token || token.usedAt || token.expiresAt <= new Date()) {
      throw new BadRequestException('This password reset link is invalid or has expired');
    }
    const passwordHash = await this.passwords.hash(password);
    await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.passwordResetToken.updateMany({
        where: { id: token.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (consumed.count !== 1) throw new BadRequestException('This password reset link has already been used');
      await tx.user.update({ where: { id: token.userId }, data: { passwordHash } });
      await tx.passwordResetToken.updateMany({
        where: { userId: token.userId, id: { not: token.id }, usedAt: null },
        data: { usedAt: new Date() },
      });
      await tx.authSession.updateMany({
        where: { userId: token.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });
  }
}
