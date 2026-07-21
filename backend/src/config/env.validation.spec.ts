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

  it('allows disabled production email only with explicit opt-in', () => {
    const production = {
      NODE_ENV: 'production',
      FRONTEND_ORIGIN: 'https://jukwaa-live.vercel.app',
      DATABASE_URL: 'postgresql://test:test@db.example/jukwaa',
      EMAIL_DELIVERY_MODE: 'disabled',
      STREAMING_PROVIDER: 'mock',
      ALLOW_MOCK_STREAMING_IN_PRODUCTION: true,
    };

    expect(() => validateEnvironment(production)).toThrow(
      'disabled email in production requires ALLOW_DISABLED_EMAIL_IN_PRODUCTION=true',
    );
    expect(validateEnvironment({
      ...production,
      ALLOW_DISABLED_EMAIL_IN_PRODUCTION: true,
    }).EMAIL_DELIVERY_MODE).toBe('disabled');
  });

  it('continues to reject console email delivery in production', () => {
    expect(() => validateEnvironment({
      NODE_ENV: 'production',
      FRONTEND_ORIGIN: 'https://jukwaa-live.vercel.app',
      DATABASE_URL: 'postgresql://test:test@db.example/jukwaa',
      EMAIL_DELIVERY_MODE: 'console',
      STREAMING_PROVIDER: 'mock',
      ALLOW_MOCK_STREAMING_IN_PRODUCTION: true,
    })).toThrow('EMAIL_DELIVERY_MODE=console is not allowed in production');
  });

  it('normalizes exact prelaunch email allowlist entries', () => {
    const result = validateEnvironment({
      NODE_ENV: 'test',
      FRONTEND_ORIGIN: 'http://localhost:5173',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/jukwaa_test',
      PRELAUNCH_TEST_EMAILS: ' Tester@Example.com, second@example.com, tester@example.com ',
    });
    expect(result.PRELAUNCH_TEST_EMAILS).toBe('tester@example.com,second@example.com');
  });

  it.each(['*', '@example.com', '*.com', 'valid@example.com,*'])('rejects unsafe prelaunch allowlist %s', (emails) => {
    expect(() => validateEnvironment({
      NODE_ENV: 'test',
      FRONTEND_ORIGIN: 'http://localhost:5173',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/jukwaa_test',
      PRELAUNCH_TEST_EMAILS: emails,
    })).toThrow('PRELAUNCH_TEST_EMAILS');
  });

  it('requires prelaunch mode before enabling stream simulation', () => {
    expect(() => validateEnvironment({
      NODE_ENV: 'test',
      FRONTEND_ORIGIN: 'http://localhost:5173',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/jukwaa_test',
      ALLOW_PRELAUNCH_STREAM_SIMULATION: true,
    })).toThrow('prelaunch stream simulation requires ALLOW_PRELAUNCH_TEST_MODE=true');
  });

  it('requires disabled email delivery for production prelaunch mode', () => {
    expect(() => validateEnvironment({
      NODE_ENV: 'production',
      FRONTEND_ORIGIN: 'https://jukwaa-live.vercel.app',
      DATABASE_URL: 'postgresql://test:test@db.example/jukwaa',
      EMAIL_DELIVERY_MODE: 'smtp',
      SMTP_HOST: 'smtp.example.com',
      SMTP_USER: 'user',
      SMTP_PASSWORD: 'password',
      STREAMING_PROVIDER: 'mock',
      ALLOW_MOCK_STREAMING_IN_PRODUCTION: true,
      ALLOW_PRELAUNCH_TEST_MODE: true,
    })).toThrow('production prelaunch test mode requires EMAIL_DELIVERY_MODE=disabled');
  });
});
