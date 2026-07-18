import { registerAs } from '@nestjs/config';

export const APP_CONFIG_KEY = 'app';

export default registerAs(APP_CONFIG_KEY, () => ({
  environment: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
}));
