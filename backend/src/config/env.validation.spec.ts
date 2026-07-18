import { parseFrontendOrigins, validateEnvironment } from './env.validation';

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

  it('normalizes an explicit frontend origin allow-list', () => {
    expect(parseFrontendOrigins(
      'https://jukwaa.live/',
      'https://www.jukwaa.live, https://jukwaa.live',
    )).toEqual(['https://jukwaa.live', 'https://www.jukwaa.live']);
  });

  it.each([
    'https://*.vercel.app',
    'https://jukwaa.live/path',
    'https://user:password@jukwaa.live',
  ])('rejects unsafe frontend origin configuration %s', (origin) => {
    expect(() => parseFrontendOrigins('https://jukwaa.live', origin)).toThrow(
      'Environment validation failed',
    );
  });

  it('rejects insecure production origins', () => {
    expect(() => validateEnvironment({
      NODE_ENV: 'production',
      FRONTEND_ORIGIN: 'http://jukwaa.example',
      DATABASE_URL: 'postgresql://test:test@db.example/jukwaa',
      EMAIL_DELIVERY_MODE: 'smtp',
      SMTP_HOST: 'smtp.example',
      SMTP_USER: 'user',
      SMTP_PASSWORD: 'password',
      STREAMING_PROVIDER: 'mock',
      ALLOW_MOCK_STREAMING_IN_PRODUCTION: true,
    })).toThrow('production frontend origins must use HTTPS');
  });

  it('requires SameSite=None cookies to be Secure production cookies', () => {
    expect(() => validateEnvironment({
      NODE_ENV: 'test',
      FRONTEND_ORIGIN: 'http://localhost:5173',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/jukwaa_test',
      AUTH_COOKIE_SAME_SITE: 'none',
    })).toThrow('AUTH_COOKIE_SAME_SITE=none requires a production Secure cookie');
  });
});
