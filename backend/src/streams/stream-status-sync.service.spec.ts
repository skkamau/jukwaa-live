import type { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../database/prisma.service';
import { MockStreamingProvider } from '../streaming/mock-streaming.provider';
import type { StreamLifecycleService } from './stream-lifecycle.service';
import { StreamStatusSyncService } from './stream-status-sync.service';

describe('StreamStatusSyncService', () => {
  const prisma = { stream: { findMany: jest.fn() } };
  const lifecycle = { markLive: jest.fn(), markEnded: jest.fn() };
  const config = { get: jest.fn().mockReturnValue(10) };
  const provider = new MockStreamingProvider();
  const service = new StreamStatusSyncService(
    prisma as unknown as PrismaService,
    config as unknown as ConfigService,
    lifecycle as unknown as StreamLifecycleService,
    provider,
  );
  beforeEach(() => jest.clearAllMocks());

  it('maps provider active/offline state through the centralized lifecycle service', async () => {
    await provider.setDevelopmentBroadcast('mock:channel-live', 'LIVE');
    prisma.stream.findMany.mockResolvedValue([
      { id: 'preparing', status: 'PREPARING', channel: { streamingConfig: { providerChannelId: 'mock:channel-live' } } },
      { id: 'live', status: 'LIVE', channel: { streamingConfig: { providerChannelId: 'mock:channel-offline' } } },
    ]);
    await service.synchronize();
    expect(lifecycle.markLive).toHaveBeenCalledWith('preparing', 'mock:channel-live');
    expect(lifecycle.markEnded).toHaveBeenCalledWith('live');
  });
});
