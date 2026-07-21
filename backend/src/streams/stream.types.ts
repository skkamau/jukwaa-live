import type { PlaybackSource } from '../streaming/streaming-provider';

export const publicStreamSelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  language: true,
  tags: true,
  matureContent: true,
  status: true,
  streamingProvider: true,
  startedAt: true,
  endedAt: true,
  createdAt: true,
  channel: {
    select: {
      id: true,
      slug: true,
      name: true,
      streamingConfig: {
        select: { providerChannelId: true },
      },
      creatorProfile: {
        select: {
          user: {
            select: {
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  },
} as const;

export interface SafeStreamRecord {
  id: string;
  title: string;
  description: string | null;
  category: string;
  language: string;
  tags: string[];
  matureContent: boolean;
  status: string;
  streamingProvider: string;
  startedAt: Date | null;
  endedAt: Date | null;
  createdAt: Date;
  channel: {
    id: string;
    slug: string;
    name: string;
    streamingConfig: { providerChannelId: string | null } | null;
    creatorProfile: {
      user: {
        username: string;
        displayName: string;
        avatarUrl: string | null;
      };
    };
  };
}

export function toSafeStream(
  stream: SafeStreamRecord,
  playback: PlaybackSource | null,
) {
  return {
    id: stream.id,
    title: stream.title,
    description: stream.description,
    category: stream.category,
    language: stream.language,
    tags: stream.tags,
    matureContent: stream.matureContent,
    status: stream.status,
    startedAt: stream.startedAt,
    endedAt: stream.endedAt,
    createdAt: stream.createdAt,
    recordingAvailable: false,
    streamingProvider: stream.streamingProvider,
    channel: {
      id: stream.channel.id,
      slug: stream.channel.slug,
      name: stream.channel.name,
    },
    creator: stream.channel.creatorProfile.user,
    playback,
  };
}
