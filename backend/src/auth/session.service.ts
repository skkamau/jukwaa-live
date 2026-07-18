import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions } from 'express';
import { PrismaService } from '../database/prisma.service';
import type { AuthenticatedRequestUser } from './auth.types';
import { publicUserSelect, toPublicUser } from './auth.types';
import { TokenService } from './token.service';

export const SESSION_COOKIE = 'jukwaa_session';

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly config: ConfigService,
  ) {}

  get cookieOptions(): CookieOptions {
    const days = this.config.get<number>('app.sessionDays', 30);
    return {
      httpOnly: true,
      secure: this.config.get<string>('app.environment') === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: days * 24 * 60 * 60 * 1000,
    };
  }

  async create(userId: string): Promise<string> {
    const token = this.tokens.create();
    const expiresAt = new Date(Date.now() + (this.cookieOptions.maxAge ?? 0));
    await this.prisma.authSession.create({
      data: { userId, tokenHash: token.hash, expiresAt },
    });
    return token.raw;
  }

  async authenticate(rawToken: string | undefined): Promise<AuthenticatedRequestUser | null> {
    if (!rawToken) return null;
    const now = new Date();
    const session = await this.prisma.authSession.findUnique({
      where: { tokenHash: this.tokens.hash(rawToken) },
      select: {
        id: true,
        lastSeenAt: true,
        expiresAt: true,
        revokedAt: true,
        user: { select: { ...publicUserSelect, deletedAt: true } },
      },
    });
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= now ||
      session.user.deletedAt ||
      session.user.status !== 'ACTIVE'
    ) return null;

    if (now.getTime() - session.lastSeenAt.getTime() > 5 * 60 * 1000) {
      void this.prisma.authSession.update({
        where: { id: session.id },
        data: { lastSeenAt: now },
      }).catch(() => undefined);
    }
    return { ...toPublicUser(session.user), sessionId: session.id };
  }

  async revoke(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    await this.prisma.authSession.updateMany({
      where: { tokenHash: this.tokens.hash(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAll(userId: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
