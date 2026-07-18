import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import type { SessionService } from '../session.service';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  const sessions = { authenticate: jest.fn() };
  const guard = new AuthGuard(sessions as unknown as SessionService);
  const request = { cookies: { jukwaa_session: 'raw-session' } } as Record<string, unknown>;
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  beforeEach(() => jest.clearAllMocks());

  it('rejects unauthenticated requests', async () => {
    sessions.authenticate.mockResolvedValue(null);
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('attaches the session-authenticated user to request context', async () => {
    const user = { id: 'user-1', sessionId: 'session-1' };
    sessions.authenticate.mockResolvedValue(user);
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toBe(user);
  });
});
