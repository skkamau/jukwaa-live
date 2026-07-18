import { ConflictException } from '@nestjs/common';
import type { PrismaService } from '../database/prisma.service';
import { StreamLifecycleService } from './stream-lifecycle.service';

describe('StreamLifecycleService', () => {
  const prisma = {
    stream: {
      updateMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
  };
  const service = new StreamLifecycleService(prisma as unknown as PrismaService);
  beforeEach(() => jest.clearAllMocks());

  it('transitions PREPARING to LIVE and sets startedAt', async () => {
    prisma.stream.updateMany.mockResolvedValue({ count: 1 });
    prisma.stream.findUniqueOrThrow.mockResolvedValue({ id: 'stream-1', status: 'LIVE' });
    await service.markLive('stream-1', 'mock:channel-1');
    expect(prisma.stream.updateMany).toHaveBeenCalledWith({
      where: { id: 'stream-1', status: 'PREPARING' },
      data: expect.objectContaining({
        status: 'LIVE',
        startedAt: expect.any(Date),
        providerStreamId: 'mock:channel-1',
      }),
    });
  });

  it('transitions LIVE to ENDED and sets endedAt', async () => {
    prisma.stream.updateMany.mockResolvedValue({ count: 1 });
    prisma.stream.findUniqueOrThrow.mockResolvedValue({ id: 'stream-1', status: 'ENDED' });
    await service.markEnded('stream-1');
    expect(prisma.stream.updateMany).toHaveBeenCalledWith({
      where: { id: 'stream-1', status: 'LIVE' },
      data: { status: 'ENDED', endedAt: expect.any(Date) },
    });
  });

  it('cancels PREPARING without deleting its history record', async () => {
    prisma.stream.updateMany.mockResolvedValue({ count: 1 });
    prisma.stream.findUniqueOrThrow.mockResolvedValue({ id: 'stream-1', status: 'CANCELLED' });
    await service.cancelPreparing('stream-1');
    expect(prisma.stream.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'CANCELLED' }),
    }));
  });

  it('rejects an invalid transition', async () => {
    prisma.stream.updateMany.mockResolvedValue({ count: 0 });
    prisma.stream.findUnique.mockResolvedValue({ status: 'ENDED' });
    await expect(service.markLive('stream-1')).rejects.toBeInstanceOf(ConflictException);
  });
});
