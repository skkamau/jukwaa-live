import { PrismaPg } from '@prisma/adapter-pg';
import {
  ChannelStatus,
  CreatorStatus,
  Prisma,
  PrismaClient,
  UserRole,
  UserStatus,
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
