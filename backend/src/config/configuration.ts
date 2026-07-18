import { registerAs } from '@nestjs/config';

export const APP_CONFIG_KEY = 'app';

export default registerAs(APP_CONFIG_KEY, () => ({
  environment: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL,
  trustProxy: process.env.TRUST_PROXY === 'true',
  sessionDays: Number(process.env.SESSION_TTL_DAYS ?? 30),
  mailMode: process.env.EMAIL_DELIVERY_MODE ?? 'console',
  streaming: {
    provider: process.env.STREAMING_PROVIDER ?? 'mock',
    statusSyncSeconds: Number(process.env.STREAM_STATUS_SYNC_SECONDS ?? 10),
    allowProductionMock:
      process.env.ALLOW_MOCK_STREAMING_IN_PRODUCTION === 'true',
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.MAIL_FROM ?? 'Jukwaa Live <no-reply@jukwaa.live>',
  },
}));
