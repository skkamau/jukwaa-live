import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import {
  STREAMING_PROVIDER,
  type StreamingProvider,
} from '../streaming/streaming-provider';
import { StreamLifecycleService } from './stream-lifecycle.service';

@Injectable()
export class StreamStatusSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StreamStatusSyncService.name);
  private timer?: NodeJS.Timeout;
  private synchronizing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly lifecycle: StreamLifecycleService,
    @Inject(STREAMING_PROVIDER) private readonly provider: StreamingProvider,
  ) {}

  onModuleInit(): void {
    const seconds = this.config.get<number>('app.streaming.statusSyncSeconds', 10);
    this.timer = setInterval(() => void this.runSafely(), seconds * 1000);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async synchronize(): Promise<void> {
    const liveProviderChannels = new Set(await this.provider.listLiveChannels());
    const streams = await this.prisma.stream.findMany({
      where: {
        status: { in: ['PREPARING', 'LIVE'] },
        streamingProvider: this.provider.type,
      },
      select: {
        id: true,
        status: true,
        channel: {
          select: {
            streamingConfig: { select: { providerChannelId: true } },
          },
        },
      },
    });

    for (const stream of streams) {
      const providerChannelId = stream.channel.streamingConfig?.providerChannelId;
      if (!providerChannelId) continue;
      const active = liveProviderChannels.has(providerChannelId);
      if (stream.status === 'PREPARING' && active) {
        await this.lifecycle.markLive(stream.id, providerChannelId);
      } else if (stream.status === 'LIVE' && !active) {
        await this.lifecycle.markEnded(stream.id);
      }
    }
  }

  private async runSafely(): Promise<void> {
    if (this.synchronizing) return;
    this.synchronizing = true;
    try {
      await this.synchronize();
    } catch {
      this.logger.warn('Streaming provider status synchronization failed');
    } finally {
      this.synchronizing = false;
    }
  }
}
