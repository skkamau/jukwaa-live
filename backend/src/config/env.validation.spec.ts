import { validateEnvironment } from './env.validation';

describe('validateEnvironment', () => {
  it('accepts and converts a valid configuration', () => {
    const result = validateEnvironment({
      NODE_ENV: 'test',
      PORT: '3001',
      FRONTEND_ORIGIN: 'http://localhost:5173',
    });

    expect(result).toEqual(
      expect.objectContaining({
        NODE_ENV: 'test',
        PORT: 3001,
        FRONTEND_ORIGIN: 'http://localhost:5173',
      }),
    );
  });

  it('rejects invalid values with a clear startup error', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'staging',
        PORT: 'invalid',
        FRONTEND_ORIGIN: '*',
      }),
    ).toThrow('Environment validation failed');
  });

  it('requires an explicit production frontend origin', () => {
    expect(() => validateEnvironment({ NODE_ENV: 'production' })).toThrow(
      'FRONTEND_ORIGIN is required in production',
    );
  });
});
