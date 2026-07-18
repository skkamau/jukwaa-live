import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApplication } from './app.setup';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  configureApplication(app);
  app.enableShutdownHooks();

  const configService = app.get(ConfigService);
  const environment = configService.getOrThrow<string>('app.environment');
  const port = configService.getOrThrow<number>('app.port');
  const logger = new Logger('Bootstrap');

  await app.listen(port, '0.0.0.0');
  logger.log(`Jukwaa API started in ${environment} mode`);
  logger.log(`Listening on port ${port} at /api/v1`);
}

void bootstrap();
