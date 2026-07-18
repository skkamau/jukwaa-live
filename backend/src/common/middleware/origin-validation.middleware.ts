import type { NextFunction, Request, Response } from 'express';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function createOriginValidationMiddleware(allowedOrigins: string[]) {
  const trusted = new Set(allowedOrigins);
  return (request: Request, response: Response, next: NextFunction): void => {
    if (SAFE_METHODS.has(request.method.toUpperCase())) {
      next();
      return;
    }
    const origin = request.headers.origin;
    if (typeof origin !== 'string' || !trusted.has(origin)) {
      response.status(403).json({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Request origin is not allowed',
      });
      return;
    }
    next();
  };
}
