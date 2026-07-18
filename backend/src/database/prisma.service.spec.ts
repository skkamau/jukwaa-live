import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    const configService = {
      getOrThrow: jest
        .fn()
        .mockReturnValue('postgresql://test:test@localhost:5432/jukwaa_test'),
    } as unknown as ConfigService;
    service = new PrismaService(configService);
  });

  it('connects once during module initialization', async () => {
    const connect = jest.spyOn(service, '$connect').mockResolvedValue();

    await service.onModuleInit();

    expect(connect).toHaveBeenCalledTimes(1);
  });

  it('disconnects during module destruction', async () => {
    const disconnect = jest.spyOn(service, '$disconnect').mockResolvedValue();

    await service.onModuleDestroy();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
