import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { PrismaService } from '../database/prisma.service';

interface HealthResponse {
  status: 'ok' | 'error';
  service: 'jukwaa-api';
  timestamp: string;
  environment: string;
  checks: {
    database: 'up' | 'down';
  };
}

@Controller('health')
export class HealthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async getHealth(
    @Res({ passthrough: true }) response: Response,
  ): Promise<HealthResponse> {
    const base = {
      service: 'jukwaa-api' as const,
      timestamp: new Date().toISOString(),
      environment: this.configService.get<string>(
        'app.environment',
        'development',
      ),
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        ...base,
        checks: { database: 'up' },
      };
    } catch {
      response.status(HttpStatus.SERVICE_UNAVAILABLE);
      return {
        status: 'error',
        ...base,
        checks: { database: 'down' },
      };
    }
  }
}
