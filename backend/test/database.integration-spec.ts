import { PrismaPg } from '@prisma/adapter-pg';
import {
  ChannelStatus,
  CreatorStatus,
  Prisma,
  PrismaClient,
  UserRole,
  UserStatus,
  StreamStatus,
  StreamingProviderType,
} from '../src/generated/prisma/client';

const runDatabaseTests = process.env.RUN_DATABASE_INTEGRATION_TESTS === 'true';
const describeDatabase = runDatabaseTests ? describe : describe.skip;

describeDatabase('PostgreSQL identity schema integration', () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for database integration tests');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  const suffix = `stage2_${Date.now()}`;
  const email = `${suffix}@example.test`;
  const username = suffix;
  const slug = `${suffix}-channel`;
  let userId: string;
  let creatorProfileId: string;

  afterAll(async () => {
    if (creatorProfileId) {
      const channels = await prisma.channel.findMany({ where: { creatorProfileId }, select: { id: true } });
      const channelIds = channels.map((channel) => channel.id);
      await prisma.stream.deleteMany({ where: { channelId: { in: channelIds } } });
      await prisma.streamingChannelConfig.deleteMany({ where: { channelId: { in: channelIds } } });
      await prisma.channel.deleteMany({ where: { creatorProfileId } });
      await prisma.creatorProfile.deleteMany({
        where: { id: creatorProfileId },
      });
    }
    if (userId) {
      await prisma.user.deleteMany({ where: { id: userId } });
    }
    await prisma.$disconnect();
  });

  it('creates and queries User -> CreatorProfile -> Channel', async () => {
    const user = await prisma.user.create({
      data: {
        email,
        username,
        displayName: 'Stage 2 Test User',
        role: UserRole.VIEWER,
        status: UserStatus.ACTIVE,
        creatorProfile: {
          create: {
            status: CreatorStatus.ACTIVE,
            channel: {
              create: {
                slug,
                name: 'Stage 2 Test Channel',
                status: ChannelStatus.ACTIVE,
              },
            },
          },
        },
      },
      include: {
        creatorProfile: { include: { channel: true } },
      },
    });

    userId = user.id;
    creatorProfileId = user.creatorProfile!.id;
    expect(user.creatorProfile?.channel?.slug).toBe(slug);
  });

  it.each([
    ['email', () => ({ email, username: `${username}_email` })],
    ['username', () => ({ email: `other_${email}`, username })],
  ])('rejects a duplicate %s', async (_field, identity) => {
    await expect(
      prisma.user.create({
        data: {
          ...identity(),
          displayName: 'Duplicate Identity',
        },
      }),
    ).rejects.toMatchObject({
      code: 'P2002',
    } satisfies Partial<Prisma.PrismaClientKnownRequestError>);
  });

  it('rejects a second CreatorProfile for the same User', async () => {
    await expect(
      prisma.creatorProfile.create({ data: { userId } }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('persists stream lifecycle records and enforces one active stream per channel', async () => {
    const channel = await prisma.channel.findUniqueOrThrow({ where: { creatorProfileId } });
    await prisma.streamingChannelConfig.create({
      data: {
        channelId: channel.id,
        provider: StreamingProviderType.MOCK,
        providerChannelId: `mock:${channel.id}`,
      },
    });
    const prepared = await prisma.stream.create({
      data: {
        channelId: channel.id,
        title: 'Stage 5A integration stream',
        category: 'Technology',
        language: 'English',
        tags: ['testing'],
        status: StreamStatus.PREPARING,
        streamingProvider: StreamingProviderType.MOCK,
      },
    });
    await expect(prisma.stream.create({
      data: {
        channelId: channel.id,
        title: 'Conflicting stream',
        category: 'Technology',
        language: 'English',
        streamingProvider: StreamingProviderType.MOCK,
      },
    })).rejects.toMatchObject({ code: 'P2002' });
    await prisma.stream.update({
      where: { id: prepared.id },
      data: { status: StreamStatus.LIVE, startedAt: new Date() },
    });
    const ended = await prisma.stream.update({
      where: { id: prepared.id },
      data: { status: StreamStatus.ENDED, endedAt: new Date() },
    });
    expect(ended.startedAt).not.toBeNull();
    expect(ended.endedAt).not.toBeNull();
  });

  it('rejects duplicate channel ownership and slugs', async () => {
    await expect(
      prisma.channel.create({
        data: {
          creatorProfileId,
          slug: `${slug}-second`,
          name: 'Second Channel',
        },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });

    const secondUser = await prisma.user.create({
      data: {
        email: `second_${email}`,
        username: `${username}_second`,
        displayName: 'Second Stage 2 User',
        creatorProfile: { create: {} },
      },
      include: { creatorProfile: true },
    });

    try {
      await expect(
        prisma.channel.create({
          data: {
            creatorProfileId: secondUser.creatorProfile!.id,
            slug,
            name: 'Duplicate Slug Channel',
          },
        }),
      ).rejects.toMatchObject({ code: 'P2002' });
    } finally {
      await prisma.creatorProfile.delete({
        where: { id: secondUser.creatorProfile!.id },
      });
      await prisma.user.delete({ where: { id: secondUser.id } });
    }
  });
});
