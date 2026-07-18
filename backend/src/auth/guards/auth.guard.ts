import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { SessionService, SESSION_COOKIE } from '../session.service';
import type { AuthenticatedRequestUser } from '../auth.types';

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedRequestUser;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = await this.sessions.authenticate(request.cookies?.[SESSION_COOKIE] as string | undefined);
    if (!user) throw new UnauthorizedException('Authentication required');
    request.user = user;
    return true;
  }
}
