import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class StreamLifecycleService {
  constructor(private readonly prisma: PrismaService) {}

  async markLive(streamId: string, providerStreamId?: string) {
    const result = await this.prisma.stream.updateMany({
      where: { id: streamId, status: 'PREPARING' },
      data: {
        status: 'LIVE',
        startedAt: new Date(),
        providerStreamId: providerStreamId ?? null,
      },
    });
    if (result.count !== 1) return this.invalidTransition(streamId, 'PREPARING', 'LIVE');
    return this.prisma.stream.findUniqueOrThrow({ where: { id: streamId } });
  }

  async markEnded(streamId: string) {
    const result = await this.prisma.stream.updateMany({
      where: { id: streamId, status: 'LIVE' },
      data: { status: 'ENDED', endedAt: new Date() },
    });
    if (result.count !== 1) return this.invalidTransition(streamId, 'LIVE', 'ENDED');
    return this.prisma.stream.findUniqueOrThrow({ where: { id: streamId } });
  }

  async cancelPreparing(streamId: string) {
    const result = await this.prisma.stream.updateMany({
      where: { id: streamId, status: 'PREPARING' },
      data: { status: 'CANCELLED', endedAt: new Date() },
    });
    if (result.count !== 1)
      return this.invalidTransition(streamId, 'PREPARING', 'CANCELLED');
    return this.prisma.stream.findUniqueOrThrow({ where: { id: streamId } });
  }

  private async invalidTransition(id: string, from: string, to: string): Promise<never> {
    const stream = await this.prisma.stream.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!stream) throw new NotFoundException('Stream not found');
    throw new ConflictException(`Cannot transition stream from ${stream.status}; expected ${from} before ${to}`);
  }
}
