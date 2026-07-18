import { validateEnvironment } from './env.validation';

describe('validateEnvironment', () => {
  it('accepts and converts a valid configuration', () => {
    const result = validateEnvironment({
      NODE_ENV: 'test',
      PORT: '3001',
      FRONTEND_ORIGIN: 'http://localhost:5173',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/jukwaa_test',
    });

    expect(result).toEqual(
      expect.objectContaining({
        NODE_ENV: 'test',
        PORT: 3001,
        FRONTEND_ORIGIN: 'http://localhost:5173',
        DATABASE_URL: 'postgresql://test:test@localhost:5432/jukwaa_test',
      }),
    );
  });

  it('rejects invalid values with a clear startup error', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'staging',
        PORT: 'invalid',
        FRONTEND_ORIGIN: '*',
        DATABASE_URL: 'not-a-postgres-url',
      }),
    ).toThrow('Environment validation failed');
  });

  it('requires an explicit production frontend origin', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://test:test@localhost:5432/jukwaa_test',
      }),
    ).toThrow('FRONTEND_ORIGIN is required in production');
  });

  it('requires a PostgreSQL database URL', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'test',
        FRONTEND_ORIGIN: 'http://localhost:5173',
      }),
    ).toThrow('DATABASE_URL');
  });
});
