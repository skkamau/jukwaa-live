import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../database/prisma.service';
import { MockStreamingProvider } from '../streaming/mock-streaming.provider';
import type { StreamLifecycleService } from './stream-lifecycle.service';
import type { StreamStatusSyncService } from './stream-status-sync.service';
import { StreamsService } from './streams.service';

const baseStream = {
  id: 'stream-1', title: 'Nairobi builders live', description: null,
  category: 'Technology', language: 'English', tags: ['coding'], matureContent: false,
  status: 'PREPARING', streamingProvider: 'MOCK', startedAt: null, endedAt: null,
  createdAt: new Date('2026-07-18T10:00:00Z'),
  channel: {
    id: 'channel-1', slug: 'samuel-plays', name: 'Samuel Plays',
    streamingConfig: { providerChannelId: 'mock:channel-1' },
    creatorProfile: { user: { username: 'sam', displayName: 'Samuel', avatarUrl: null } },
  },
};
const input = {
  title: 'Nairobi builders live', category: 'Technology', language: 'English',
  tags: ['coding'], matureContent: false,
};

describe('StreamsService', () => {
  const prisma = {
    channel: { findFirst: jest.fn() },
    stream: {
      findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(),
    },
    streamingChannelConfig: {
      findUnique: jest.fn(), create: jest.fn(), findUniqueOrThrow: jest.fn(),
    },
  };
  const configValues: Record<string, unknown> = {
    'app.environment': 'development',
    'app.mailMode': 'console',
    'app.prelaunch.enabled': false,
    'app.prelaunch.allAccounts': false,
    'app.prelaunch.emails': [],
    'app.prelaunch.streamSimulation': false,
    'app.streaming.provider': 'mock',
  };
  const config = { get: jest.fn((key: string, fallback?: unknown) => configValues[key] ?? fallback) };
  const lifecycle = { cancelPreparing: jest.fn() };
  const sync = { synchronize: jest.fn() };
  const provider = new MockStreamingProvider();
  const service = new StreamsService(
    prisma as unknown as PrismaService,
    config as unknown as ConfigService,
    lifecycle as unknown as StreamLifecycleService,
    sync as unknown as StreamStatusSyncService,
    provider,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    configValues['app.environment'] = 'development';
    configValues['app.mailMode'] = 'console';
    configValues['app.prelaunch.enabled'] = false;
    configValues['app.prelaunch.allAccounts'] = false;
    configValues['app.prelaunch.emails'] = [];
    configValues['app.prelaunch.streamSimulation'] = false;
    prisma.channel.findFirst.mockResolvedValue({
      id: 'channel-1', status: 'ACTIVE', creatorProfile: { status: 'ACTIVE' },
    });
    prisma.streamingChannelConfig.findUnique.mockResolvedValue({
      channelId: 'channel-1', provider: 'MOCK', providerChannelId: 'mock:channel-1',
    });
  });

  it('creates a PREPARING stream for the authenticated active creator', async () => {
    prisma.stream.findFirst.mockResolvedValue(null);
    prisma.stream.create.mockResolvedValue(baseStream);
    await expect(service.prepare('user-1', input)).resolves.toMatchObject({
      id: 'stream-1', status: 'PREPARING', playback: null,
    });
    expect(prisma.channel.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ creatorProfile: { userId: 'user-1' } }),
    }));
    expect(prisma.stream.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ channelId: 'channel-1', status: 'PREPARING' }),
    }));
  });

  it('returns an existing PREPARING stream instead of creating duplicates', async () => {
    prisma.stream.findFirst.mockResolvedValue(baseStream);
    await expect(service.prepare('user-1', input)).resolves.toMatchObject({ id: 'stream-1' });
    expect(prisma.stream.create).not.toHaveBeenCalled();
  });

  it('rejects a second stream while the channel is LIVE', async () => {
    prisma.stream.findFirst.mockResolvedValue({ ...baseStream, status: 'LIVE' });
    await expect(service.prepare('user-1', input)).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects non-creators, suspended creators, and inactive channels', async () => {
    prisma.channel.findFirst.mockResolvedValueOnce(null);
    await expect(service.prepare('viewer', input)).rejects.toBeInstanceOf(NotFoundException);
    prisma.channel.findFirst.mockResolvedValueOnce({ id: 'channel-1', status: 'ACTIVE', creatorProfile: { status: 'SUSPENDED' } });
    await expect(service.prepare('creator', input)).rejects.toBeInstanceOf(ForbiddenException);
    prisma.channel.findFirst.mockResolvedValueOnce({ id: 'channel-1', status: 'SUSPENDED', creatorProfile: { status: 'ACTIVE' } });
    await expect(service.prepare('creator', input)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('updates only the authenticated owner active stream metadata', async () => {
    prisma.stream.findFirst.mockResolvedValue(baseStream);
    prisma.stream.update.mockResolvedValue({ ...baseStream, title: 'Updated title' });
    await service.updateCurrent('user-1', { title: 'Updated title' });
    expect(prisma.stream.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ channelId: 'channel-1' }),
    }));
  });

  it.each([
    ['SUSPENDED', 'ACTIVE'],
    ['ACTIVE', 'SUSPENDED'],
    ['ACTIVE', 'ARCHIVED'],
  ])('blocks stream mutation when creator is %s and channel is %s', async (creatorStatus, channelStatus) => {
    prisma.channel.findFirst.mockResolvedValue({
      id: 'channel-1',
      status: channelStatus,
      creatorProfile: { status: creatorStatus },
    });
    await expect(service.updateCurrent('user-1', { title: 'Forbidden update' }))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.stream.update).not.toHaveBeenCalled();
  });

  it.each([
    ['update metadata', () => service.updateCurrent('user-1', { title: 'Blocked' })],
    ['cancel', () => service.cancelCurrent('user-1')],
    ['simulate live', () => service.simulateLive('user-1', 'owner@example.com')],
    ['simulate end', () => service.simulateEnd('user-1', 'owner@example.com')],
  ])('re-checks active creator/channel status before %s', async (_label, mutate) => {
    prisma.channel.findFirst.mockResolvedValue({
      id: 'channel-1', status: 'ACTIVE', creatorProfile: { status: 'SUSPENDED' },
    });
    await expect(mutate()).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.stream.update).not.toHaveBeenCalled();
    expect(lifecycle.cancelPreparing).not.toHaveBeenCalled();
    expect(sync.synchronize).not.toHaveBeenCalled();
  });

  it('cancels only an owned PREPARING stream', async () => {
    prisma.stream.findFirst
      .mockResolvedValueOnce(baseStream)
      .mockResolvedValueOnce({ ...baseStream, status: 'CANCELLED' });
    lifecycle.cancelPreparing.mockResolvedValue({});
    await expect(service.cancelCurrent('user-1')).resolves.toMatchObject({ status: 'CANCELLED' });
    expect(lifecycle.cancelPreparing).toHaveBeenCalledWith('stream-1');
  });

  it('blocks mock simulation in production before changing provider state', async () => {
    configValues['app.environment'] = 'production';
    await expect(service.simulateLive('user-1', 'owner@example.com')).rejects.toBeInstanceOf(ForbiddenException);
    expect(sync.synchronize).not.toHaveBeenCalled();
  });

  it('never advertises development simulation controls in production', async () => {
    configValues['app.environment'] = 'production';
    await expect(service.streamingConfiguration('user-1', 'owner@example.com')).resolves.toMatchObject({
      provider: 'mock',
      realVideoAvailable: false,
      developmentSimulationAvailable: false,
      simulationAvailable: false,
      prelaunchTestMode: false,
    });
  });

  it('allows an exactly allowlisted owner to simulate in production when both flags are enabled', async () => {
    configValues['app.environment'] = 'production';
    configValues['app.mailMode'] = 'disabled';
    configValues['app.prelaunch.enabled'] = true;
    configValues['app.prelaunch.emails'] = ['owner@example.com'];
    configValues['app.prelaunch.streamSimulation'] = true;
    prisma.stream.findFirst
      .mockResolvedValueOnce(baseStream)
      .mockResolvedValueOnce({ ...baseStream, status: 'LIVE', startedAt: new Date() });
    sync.synchronize.mockResolvedValue(undefined);

    await expect(service.simulateLive('user-1', 'owner@example.com')).resolves.toMatchObject({ status: 'LIVE' });
    expect(sync.synchronize).toHaveBeenCalled();
  });

  it('advertises prelaunch controls only to the exactly allowlisted creator', async () => {
    configValues['app.environment'] = 'production';
    configValues['app.mailMode'] = 'disabled';
    configValues['app.prelaunch.enabled'] = true;
    configValues['app.prelaunch.emails'] = ['owner@example.com'];
    configValues['app.prelaunch.streamSimulation'] = true;

    await expect(service.streamingConfiguration('user-1', 'owner@example.com')).resolves.toMatchObject({
      developmentSimulationAvailable: false,
      simulationAvailable: true,
      prelaunchTestMode: true,
    });
    await expect(service.streamingConfiguration('user-1', 'other@example.com')).resolves.toMatchObject({
      simulationAvailable: false,
      prelaunchTestMode: false,
    });
  });

  it('allows every active channel owner to use demo live controls when all-account prelaunch access is enabled', async () => {
    configValues['app.environment'] = 'production';
    configValues['app.mailMode'] = 'disabled';
    configValues['app.prelaunch.enabled'] = true;
    configValues['app.prelaunch.allAccounts'] = true;
    configValues['app.prelaunch.streamSimulation'] = true;
    prisma.stream.findFirst
      .mockResolvedValueOnce(baseStream)
      .mockResolvedValueOnce({ ...baseStream, status: 'LIVE', startedAt: new Date() });
    sync.synchronize.mockResolvedValue(undefined);

    await expect(service.streamingConfiguration('user-1', 'anyone@example.com')).resolves.toMatchObject({
      simulationAvailable: true,
      prelaunchTestMode: true,
    });
    await expect(service.simulateLive('user-1', 'anyone@example.com')).resolves.toMatchObject({ status: 'LIVE' });
  });

  it('blocks non-allowlisted creators from production simulation', async () => {
    configValues['app.environment'] = 'production';
    configValues['app.mailMode'] = 'disabled';
    configValues['app.prelaunch.enabled'] = true;
    configValues['app.prelaunch.emails'] = ['owner@example.com'];
    configValues['app.prelaunch.streamSimulation'] = true;

    await expect(service.simulateLive('user-1', 'other@example.com')).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.stream.findFirst).not.toHaveBeenCalled();
  });

  it('does not let an allowlisted non-owner simulate another channel', async () => {
    configValues['app.environment'] = 'production';
    configValues['app.mailMode'] = 'disabled';
    configValues['app.prelaunch.enabled'] = true;
    configValues['app.prelaunch.emails'] = ['owner@example.com'];
    configValues['app.prelaunch.streamSimulation'] = true;
    prisma.channel.findFirst.mockResolvedValue(null);

    await expect(service.simulateLive('other-user', 'owner@example.com')).rejects.toBeInstanceOf(NotFoundException);
    expect(sync.synchronize).not.toHaveBeenCalled();
  });

  it('returns only LIVE records from the public list and no credentials', async () => {
    prisma.stream.findMany.mockResolvedValue([{ ...baseStream, status: 'LIVE', startedAt: new Date() }]);
    const result = await service.findLive();
    expect(prisma.stream.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: 'LIVE' }),
    }));
    expect(result[0]).not.toHaveProperty('providerStreamId');
    expect(result[0]).not.toHaveProperty('streamKey');
    expect(result[0].creator).not.toHaveProperty('email');
  });
});
