import type { NextFunction, Request, Response } from 'express';
import { createOriginValidationMiddleware } from './origin-validation.middleware';

describe('origin validation middleware', () => {
  const middleware = createOriginValidationMiddleware([
    'https://jukwaa-live.vercel.app',
  ]);
  const next = jest.fn() as NextFunction;
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response;
  beforeEach(() => jest.clearAllMocks());

  it('allows safe methods without an Origin header', () => {
    middleware({ method: 'GET', headers: {} } as Request, response, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('allows unsafe requests only from an explicitly trusted origin', () => {
    middleware({
      method: 'PATCH',
      headers: { origin: 'https://jukwaa-live.vercel.app' },
    } as Request, response, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it.each([undefined, 'https://attacker.example']) (
    'rejects an unsafe request from %s',
    (origin) => {
      middleware({ method: 'POST', headers: { origin } } as Request, response, next);
      expect(next).not.toHaveBeenCalled();
      expect(response.status).toHaveBeenCalledWith(403);
    },
  );
});
