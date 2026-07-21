import { Body, Controller, Get, HttpCode, Post, Req, Res, ServiceUnavailableException, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { toPublicUser, type AuthenticatedRequestUser } from './auth.types';
import { CurrentUser } from './decorators/current-user.decorator';
import { EmailDto, LoginDto, RegisterDto, ResetPasswordDto, TokenDto } from './dto/auth.dto';
import { AuthGuard, type AuthenticatedRequest } from './guards/auth.guard';
import { SESSION_COOKIE, SessionService } from './session.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
  async register(@Body() input: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.register(input);
    response.cookie(SESSION_COOKIE, result.sessionToken, this.sessions.cookieOptions);
    return {
      user: result.user,
      emailDeliveryAvailable: result.emailDeliveryAvailable,
      capabilities: this.auth.capabilities(result.user.email, result.user.emailVerified),
    };
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 15 * 60_000 } })
  async login(@Body() input: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.login(input);
    response.cookie(SESSION_COOKIE, result.sessionToken, this.sessions.cookieOptions);
    return {
      user: result.user,
      capabilities: this.auth.capabilities(result.user.email, result.user.emailVerified),
    };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: AuthenticatedRequestUser) {
    const publicUser = toPublicUser(user);
    return {
      user: publicUser,
      capabilities: this.auth.capabilities(publicUser.email, publicUser.emailVerified),
    };
  }

  @Post('prelaunch/activate')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
  async activatePrelaunch(@CurrentUser() user: AuthenticatedRequestUser) {
    const activated = await this.auth.activatePrelaunch(user.id, user.email);
    return {
      user: activated,
      capabilities: this.auth.capabilities(activated.email, activated.emailVerified),
    };
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response): Promise<void> {
    await this.sessions.revoke(request.cookies?.[SESSION_COOKIE] as string | undefined);
    response.clearCookie(SESSION_COOKIE, { ...this.sessions.cookieOptions, maxAge: undefined });
  }

  @Post('logout-all')
  @HttpCode(204)
  @UseGuards(AuthGuard)
  async logoutAll(@Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response): Promise<void> {
    await this.sessions.revokeAll(request.user.id);
    response.clearCookie(SESSION_COOKIE, { ...this.sessions.cookieOptions, maxAge: undefined });
  }

  @Post('email/verify')
  @HttpCode(200)
  @Throttle({ default: { limit: 8, ttl: 15 * 60_000 } })
  async verifyEmail(@Body() input: TokenDto) {
    return { user: await this.auth.verifyEmail(input.token) };
  }

  @Post('email/resend')
  @HttpCode(202)
  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
  async resendVerification(@Body() input: EmailDto) {
    this.ensureEmailDeliveryAvailable();
    await this.auth.requestVerification(input.email);
    return { message: 'If the account is eligible, a verification email has been sent.' };
  }

  @Post('password/forgot')
  @HttpCode(202)
  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
  async forgotPassword(@Body() input: EmailDto) {
    this.ensureEmailDeliveryAvailable();
    await this.auth.requestPasswordReset(input.email);
    return { message: 'If an eligible account exists, a reset email has been sent.' };
  }

  @Post('password/reset')
  @HttpCode(204)
  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
  resetPassword(@Body() input: ResetPasswordDto): Promise<void> {
    return this.auth.resetPassword(input.token, input.password);
  }

  private ensureEmailDeliveryAvailable(): void {
    if (!this.auth.emailDeliveryAvailable) {
      throw new ServiceUnavailableException(
        'Email delivery is temporarily unavailable. Please try again later.',
      );
    }
  }
}
