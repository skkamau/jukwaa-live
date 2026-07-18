import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface HealthResponse {
  status: 'ok';
  service: 'jukwaa-api';
  timestamp: string;
  environment: string;
}

@Controller('health')
export class HealthController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'jukwaa-api',
      timestamp: new Date().toISOString(),
      environment: this.configService.get<string>(
        'app.environment',
        'development',
      ),
    };
  }
}
