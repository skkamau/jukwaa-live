import * as Joi from 'joi';

export type NodeEnvironment = 'development' | 'test' | 'production';

export interface EnvironmentVariables extends Record<string, unknown> {
  NODE_ENV: NodeEnvironment;
  PORT: number;
  FRONTEND_ORIGIN: string;
  DATABASE_URL: string;
  TRUST_PROXY: boolean;
  SESSION_TTL_DAYS: number;
  EMAIL_DELIVERY_MODE: 'console' | 'smtp';
}

const environmentSchema = Joi.object<EnvironmentVariables>({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  FRONTEND_ORIGIN: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .default('http://localhost:5173'),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),
  TRUST_PROXY: Joi.boolean().default(false),
  SESSION_TTL_DAYS: Joi.number().integer().min(1).max(365).default(30),
  EMAIL_DELIVERY_MODE: Joi.string().valid('console', 'smtp').default('console'),
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

  if (value.NODE_ENV === 'production' && value.EMAIL_DELIVERY_MODE === 'console') {
    throw new Error('Environment validation failed: EMAIL_DELIVERY_MODE=console is not allowed in production');
  }

  return value;
}
