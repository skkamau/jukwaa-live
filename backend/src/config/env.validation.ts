import * as Joi from 'joi';

export type NodeEnvironment = 'development' | 'test' | 'production';

export interface EnvironmentVariables extends Record<string, unknown> {
  NODE_ENV: NodeEnvironment;
  PORT: number;
  FRONTEND_ORIGIN: string;
  FRONTEND_ORIGINS?: string;
  DATABASE_URL: string;
  TRUST_PROXY: boolean;
  SESSION_TTL_DAYS: number;
  EMAIL_DELIVERY_MODE: 'console' | 'smtp';
  STREAMING_PROVIDER: 'mock';
  STREAM_STATUS_SYNC_SECONDS: number;
  ALLOW_MOCK_STREAMING_IN_PRODUCTION: boolean;
  AUTH_COOKIE_SAME_SITE: 'lax' | 'none';
}

const environmentSchema = Joi.object<EnvironmentVariables>({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  FRONTEND_ORIGIN: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .default('http://localhost:5173'),
  FRONTEND_ORIGINS: Joi.string().optional(),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),
  TRUST_PROXY: Joi.boolean().default(false),
  SESSION_TTL_DAYS: Joi.number().integer().min(1).max(365).default(30),
  EMAIL_DELIVERY_MODE: Joi.string().valid('console', 'smtp').default('console'),
  STREAMING_PROVIDER: Joi.string().valid('mock').default('mock'),
  STREAM_STATUS_SYNC_SECONDS: Joi.number().integer().min(2).max(300).default(10),
  ALLOW_MOCK_STREAMING_IN_PRODUCTION: Joi.boolean().default(false),
  AUTH_COOKIE_SAME_SITE: Joi.string().valid('lax', 'none').default('lax'),
  SMTP_HOST: Joi.when('EMAIL_DELIVERY_MODE', { is: 'smtp', then: Joi.string().required(), otherwise: Joi.string().optional() }),
  SMTP_PORT: Joi.number().port().default(587),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_USER: Joi.when('EMAIL_DELIVERY_MODE', { is: 'smtp', then: Joi.string().required(), otherwise: Joi.string().optional() }),
  SMTP_PASSWORD: Joi.when('EMAIL_DELIVERY_MODE', { is: 'smtp', then: Joi.string().required(), otherwise: Joi.string().optional() }),
  MAIL_FROM: Joi.string().default('Jukwaa Live <no-reply@jukwaa.live>'),
}).unknown(true);

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const { error, value } = environmentSchema.validate(config, {
    abortEarly: false,
    convert: true,
  });

  if (error) {
    throw new Error(`Environment validation failed: ${error.message}`);
  }

  if (
    value.NODE_ENV === 'production' &&
    typeof config.FRONTEND_ORIGIN !== 'string'
  ) {
    throw new Error(
      'Environment validation failed: FRONTEND_ORIGIN is required in production',
    );
  }

  const frontendOrigins = parseFrontendOrigins(
    value.FRONTEND_ORIGIN,
    value.FRONTEND_ORIGINS,
  );
  if (
    value.NODE_ENV === 'production' &&
    frontendOrigins.some((origin) => !origin.startsWith('https://'))
  ) {
    throw new Error(
      'Environment validation failed: production frontend origins must use HTTPS',
    );
  }

  if (
    value.AUTH_COOKIE_SAME_SITE === 'none' &&
    value.NODE_ENV !== 'production'
  ) {
    throw new Error(
      'Environment validation failed: AUTH_COOKIE_SAME_SITE=none requires a production Secure cookie',
    );
  }

  if (value.NODE_ENV === 'production' && value.EMAIL_DELIVERY_MODE === 'console') {
    throw new Error('Environment validation failed: EMAIL_DELIVERY_MODE=console is not allowed in production');
  }

  if (
    value.NODE_ENV === 'production' &&
    value.STREAMING_PROVIDER === 'mock' &&
    config.STREAMING_PROVIDER !== 'mock'
  ) {
    throw new Error(
      'Environment validation failed: STREAMING_PROVIDER must be explicitly set in production',
    );
  }

  if (
    value.NODE_ENV === 'production' &&
    value.STREAMING_PROVIDER === 'mock' &&
    value.ALLOW_MOCK_STREAMING_IN_PRODUCTION !== true
  ) {
    throw new Error(
      'Environment validation failed: mock streaming in production requires ALLOW_MOCK_STREAMING_IN_PRODUCTION=true',
    );
  }

  return value;
}

export function parseFrontendOrigins(
  primaryOrigin: string,
  additionalOrigins?: string,
): string[] {
  const candidates = [
    primaryOrigin,
    ...(additionalOrigins?.split(',') ?? []),
  ].map((origin) => origin.trim()).filter(Boolean);
  const normalized = candidates.map((origin) => {
    if (origin.includes('*')) {
      throw new Error(
        'Environment validation failed: frontend origins cannot contain wildcards',
      );
    }
    let parsed: URL;
    try {
      parsed = new URL(origin);
    } catch {
      throw new Error(
        `Environment validation failed: invalid frontend origin ${origin}`,
      );
    }
    if (
      !['http:', 'https:'].includes(parsed.protocol) ||
      parsed.username ||
      parsed.password ||
      (parsed.pathname !== '/' && parsed.pathname !== '') ||
      parsed.search ||
      parsed.hash
    ) {
      throw new Error(
        `Environment validation failed: frontend origin must be an HTTP(S) origin without a path: ${origin}`,
      );
    }
    return parsed.origin;
  });
  return [...new Set(normalized)];
}
