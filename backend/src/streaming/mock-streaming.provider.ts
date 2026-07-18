import { Injectable } from '@nestjs/common';
import { StreamingProviderType } from '../generated/prisma/enums';
import type {
  CreatorStreamingConfiguration,
  PlaybackSource,
  ProviderBroadcastStatus,
  ProvisionedStreamingChannel,
  StreamingProvider,
} from './streaming-provider';

@Injectable()
export class MockStreamingProvider implements StreamingProvider {
  readonly type = StreamingProviderType.MOCK;
  private readonly liveChannels = new Set<string>();

  async provisionChannel(channelId: string): Promise<ProvisionedStreamingChannel> {
    return {
      provider: this.type,
      providerChannelId: `mock:${channelId}`,
      ingestEndpoint: null,
      playbackUrl: null,
    };
  }

  async getCreatorStreamingConfiguration(
    channelId: string,
  ): Promise<CreatorStreamingConfiguration> {
    void channelId;
    return { provider: 'mock', mode: 'development', realVideoAvailable: false };
  }

  async getStreamStatus(
    providerChannelId: string,
  ): Promise<ProviderBroadcastStatus> {
    return this.liveChannels.has(providerChannelId) ? 'LIVE' : 'OFFLINE';
  }

  async listLiveChannels(): Promise<string[]> {
    return [...this.liveChannels].sort();
  }

  async stopStream(providerChannelId: string): Promise<void> {
    this.liveChannels.delete(providerChannelId);
  }

  async resetStreamCredentials(channelId: string): Promise<void> {
    void channelId;
    // Mock mode has no credentials. The method keeps provider consumers generic.
  }

  async getPlaybackSource(providerChannelId: string): Promise<PlaybackSource> {
    void providerChannelId;
    return { provider: 'mock', kind: 'development-placeholder', url: null };
  }

  async setDevelopmentBroadcast(
    providerChannelId: string,
    status: ProviderBroadcastStatus,
  ): Promise<void> {
    if (status === 'LIVE') this.liveChannels.add(providerChannelId);
    else this.liveChannels.delete(providerChannelId);
  }
}
