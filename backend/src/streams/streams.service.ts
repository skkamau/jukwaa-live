import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isPrelaunchStreamSimulationAllowed } from '../config/prelaunch';
import { PrismaService } from '../database/prisma.service';
import {
  STREAMING_PROVIDER,
  type StreamingProvider,
} from '../streaming/streaming-provider';
import type { PrepareStreamDto, UpdateStreamDto } from './dto/stream.dto';
import { StreamLifecycleService } from './stream-lifecycle.service';
import { StreamStatusSyncService } from './stream-status-sync.service';
import {
  publicStreamSelect,
  toSafeStream,
  type SafeStreamRecord,
} from './stream.types';

@Injectable()
export class StreamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly lifecycle: StreamLifecycleService,
    private readonly sync: StreamStatusSyncService,
    @Inject(STREAMING_PROVIDER) private readonly provider: StreamingProvider,
  ) {}

  async prepare(userId: string, input: PrepareStreamDto) {
    const channel = await this.requireActiveOwnedChannel(userId);
    const existing = await this.prisma.stream.findFirst({
      where: { channelId: channel.id, status: { in: ['PREPARING', 'LIVE'] } },
      orderBy: { createdAt: 'desc' },
      select: publicStreamSelect,
    });
    if (existing?.status === 'PREPARING') return this.withPlayback(existing);
    if (existing) throw new ConflictException('This channel is already live');

    await this.ensureProviderConfig(channel.id);
    try {
      const stream = await this.prisma.stream.create({
        data: {
          channelId: channel.id,
          title: input.title,
          description: input.description || null,
          category: input.category,
          language: input.language,
          tags: input.tags,
          matureContent: input.matureContent,
          status: 'PREPARING',
          streamingProvider: this.provider.type,
        },
        select: publicStreamSelect,
      });
      return this.withPlayback(stream);
    } catch (error: unknown) {
      if (this.isUniqueConflict(error)) {
        const active = await this.prisma.stream.findFirst({
          where: { channelId: channel.id, status: { in: ['PREPARING', 'LIVE'] } },
          select: publicStreamSelect,
        });
        if (active?.status === 'PREPARING') return this.withPlayback(active);
        throw new ConflictException('This channel already has an active stream');
      }
      throw error;
    }
  }

  async current(userId: string) {
    const channel = await this.requireOwnedChannel(userId);
    const stream = await this.prisma.stream.findFirst({
      where: { channelId: channel.id },
      orderBy: { createdAt: 'desc' },
      select: publicStreamSelect,
    });
    return stream ? this.withPlayback(stream) : null;
  }

  async updateCurrent(userId: string, input: UpdateStreamDto) {
    const stream = await this.requireOwnedActiveStream(userId);
    const updated = await this.prisma.stream.update({
      where: { id: stream.id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && {
          description: input.description || null,
        }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.language !== undefined && { language: input.language }),
        ...(input.tags !== undefined && { tags: input.tags }),
        ...(input.matureContent !== undefined && {
          matureContent: input.matureContent,
        }),
      },
      select: publicStreamSelect,
    });
    return this.withPlayback(updated);
  }

  async cancelCurrent(userId: string) {
    const stream = await this.requireOwnedActiveStream(userId);
    if (stream.status !== 'PREPARING') {
      throw new ConflictException('Only a preparing stream can be cancelled');
    }
    await this.lifecycle.cancelPreparing(stream.id);
    return this.findPublicDetail(stream.id);
  }

  async streamingConfiguration(userId: string, email: string) {
    const channel = await this.requireActiveOwnedChannel(userId);
    await this.ensureProviderConfig(channel.id);
    const providerConfiguration =
      await this.provider.getCreatorStreamingConfiguration(channel.id);
    const developmentSimulationAvailable =
      this.config.get<string>('app.environment') !== 'production' &&
      this.provider.type === 'MOCK';
    const prelaunchTestMode =
      this.config.get<string>('app.environment') === 'production' &&
      isPrelaunchStreamSimulationAllowed(this.config, email);
    return {
      ...providerConfiguration,
      developmentSimulationAvailable,
      simulationAvailable: developmentSimulationAvailable || prelaunchTestMode,
      prelaunchTestMode,
    };
  }

  async simulateLive(userId: string, email: string) {
    this.assertSimulationAllowed(email);
    const stream = await this.requireOwnedActiveStream(userId);
    if (stream.status !== 'PREPARING') {
      throw new ConflictException('The stream must be preparing before it can go live');
    }
    const providerChannelId =
      stream.channel.streamingConfig?.providerChannelId;
    if (!providerChannelId || !this.provider.setDevelopmentBroadcast) {
      throw new ConflictException('Mock provider channel is not provisioned');
    }
    await this.provider.setDevelopmentBroadcast(providerChannelId, 'LIVE');
    await this.sync.synchronize();
    return this.findPublicDetail(stream.id);
  }

  async simulateEnd(userId: string, email: string) {
    this.assertSimulationAllowed(email);
    const stream = await this.requireOwnedActiveStream(userId);
    if (stream.status !== 'LIVE') {
      throw new ConflictException('The stream must be live before it can end');
    }
    const providerChannelId =
      stream.channel.streamingConfig?.providerChannelId;
    if (!providerChannelId || !this.provider.setDevelopmentBroadcast) {
      throw new ConflictException('Mock provider channel is not provisioned');
    }
    await this.provider.setDevelopmentBroadcast(providerChannelId, 'OFFLINE');
    await this.sync.synchronize();
    return this.findPublicDetail(stream.id);
  }

  async findLive() {
    const streams = await this.prisma.stream.findMany({
      where: {
        status: 'LIVE',
        channel: {
          status: 'ACTIVE',
          deletedAt: null,
          creatorProfile: {
            status: 'ACTIVE',
            user: { status: 'ACTIVE', deletedAt: null },
          },
        },
      },
      orderBy: { startedAt: 'desc' },
      select: publicStreamSelect,
    });
    return Promise.all(streams.map((stream) => this.withPlayback(stream)));
  }

  async findPublicDetail(id: string) {
    const stream = await this.prisma.stream.findFirst({
      where: {
        id,
        channel: {
          status: 'ACTIVE',
          deletedAt: null,
          creatorProfile: {
            status: 'ACTIVE',
            user: { status: 'ACTIVE', deletedAt: null },
          },
        },
      },
      select: publicStreamSelect,
    });
    if (!stream) throw new NotFoundException('Stream not found');
    return this.withPlayback(stream);
  }

  private async withPlayback(stream: SafeStreamRecord) {
    const providerChannelId = stream.channel.streamingConfig?.providerChannelId;
    const playback =
      stream.status === 'LIVE' && providerChannelId
        ? await this.provider.getPlaybackSource(providerChannelId)
        : null;
    return toSafeStream(stream, playback);
  }

  private async requireOwnedChannel(userId: string) {
    const channel = await this.prisma.channel.findFirst({
      where: {
        deletedAt: null,
        creatorProfile: { userId },
      },
      select: { id: true, status: true, creatorProfile: { select: { status: true } } },
    });
    if (!channel) throw new NotFoundException('Creator channel not found');
    return channel;
  }

  private async requireActiveOwnedChannel(userId: string) {
    const channel = await this.requireOwnedChannel(userId);
    if (channel.creatorProfile.status !== 'ACTIVE') {
      throw new ForbiddenException('Creator account is not active');
    }
    if (channel.status !== 'ACTIVE') {
      throw new ForbiddenException('Channel is not active');
    }
    return channel;
  }

  private async requireOwnedActiveStream(userId: string) {
    const channel = await this.requireActiveOwnedChannel(userId);
    const stream = await this.prisma.stream.findFirst({
      where: {
        status: { in: ['PREPARING', 'LIVE'] },
        channelId: channel.id,
      },
      orderBy: { createdAt: 'desc' },
      select: publicStreamSelect,
    });
    if (!stream) throw new NotFoundException('No active stream found');
    return stream;
  }

  private async ensureProviderConfig(channelId: string) {
    const existing = await this.prisma.streamingChannelConfig.findUnique({
      where: { channelId },
    });
    if (existing) {
      if (existing.provider !== this.provider.type) {
        throw new ConflictException('Channel is configured for another streaming provider');
      }
      return existing;
    }
    const provisioned = await this.provider.provisionChannel(channelId);
    try {
      return await this.prisma.streamingChannelConfig.create({
        data: {
          channelId,
          provider: provisioned.provider,
          providerChannelId: provisioned.providerChannelId,
          ingestEndpoint: provisioned.ingestEndpoint,
          playbackUrl: provisioned.playbackUrl,
        },
      });
    } catch (error: unknown) {
      if (this.isUniqueConflict(error)) {
        return this.prisma.streamingChannelConfig.findUniqueOrThrow({
          where: { channelId },
        });
      }
      throw error;
    }
  }

  private assertSimulationAllowed(email: string): void {
    const isDevelopmentMock =
      this.config.get<string>('app.environment') !== 'production' &&
      this.provider.type === 'MOCK';
    const isAllowlistedPrelaunch =
      this.config.get<string>('app.environment') === 'production' &&
      isPrelaunchStreamSimulationAllowed(this.config, email);
    if (!isDevelopmentMock && !isAllowlistedPrelaunch) {
      throw new ForbiddenException('Stream simulation is unavailable for this account');
    }
    if (!this.provider.setDevelopmentBroadcast) {
      throw new ForbiddenException('The configured provider cannot be simulated');
    }
  }

  private isUniqueConflict(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
  }
}
