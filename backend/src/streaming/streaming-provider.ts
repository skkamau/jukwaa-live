import type { StreamingProviderType } from '../generated/prisma/enums';

export const STREAMING_PROVIDER = Symbol('STREAMING_PROVIDER');

export type ProviderBroadcastStatus = 'OFFLINE' | 'LIVE';

export interface ProvisionedStreamingChannel {
  provider: StreamingProviderType;
  providerChannelId: string;
  ingestEndpoint: string | null;
  playbackUrl: string | null;
}

export interface CreatorStreamingConfiguration {
  provider: 'mock';
  mode: 'development';
  realVideoAvailable: false;
}

export interface PlaybackSource {
  provider: 'mock';
  kind: 'development-placeholder';
  url: null;
}

export interface StreamingProvider {
  readonly type: StreamingProviderType;
  provisionChannel(channelId: string): Promise<ProvisionedStreamingChannel>;
  getCreatorStreamingConfiguration(
    channelId: string,
  ): Promise<CreatorStreamingConfiguration>;
  getStreamStatus(providerChannelId: string): Promise<ProviderBroadcastStatus>;
  listLiveChannels(): Promise<string[]>;
  stopStream(providerChannelId: string): Promise<void>;
  resetStreamCredentials(channelId: string): Promise<void>;
  getPlaybackSource(providerChannelId: string): Promise<PlaybackSource>;
  setDevelopmentBroadcast?(
    providerChannelId: string,
    status: ProviderBroadcastStatus,
  ): Promise<void>;
}
