import * as Joi from 'joi';

export type NodeEnvironment = 'development' | 'test' | 'production';

export interface EnvironmentVariables extends Record<string, unknown> {
  NODE_ENV: NodeEnvironment;
  PORT: number;
  FRONTEND_ORIGIN: string;
}

const environmentSchema = Joi.object<EnvironmentVariables>({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  FRONTEND_ORIGIN: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .default('http://localhost:5173'),
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

  return value;
}
