import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  ChannelStatus,
  CreatorStatus,
  PrismaClient,
  UserRole,
  UserStatus,
} from '../src/generated/prisma/client';

const environment = process.env.NODE_ENV ?? 'development';
const connectionString = process.env.DATABASE_URL;

if (environment === 'production') {
  throw new Error('Development seed refused: NODE_ENV is production');
}

if (!connectionString) {
  throw new Error('Development seed requires DATABASE_URL');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  const viewer = await prisma.user.upsert({
    where: { email: 'amina.viewer@example.test' },
    update: {
      username: 'amina_viewer',
      displayName: 'Amina Viewer',
      status: UserStatus.ACTIVE,
    },
    create: {
      email: 'amina.viewer@example.test',
      username: 'amina_viewer',
      displayName: 'Amina Viewer',
      role: UserRole.VIEWER,
      status: UserStatus.ACTIVE,
    },
  });

  const creatorUser = await prisma.user.upsert({
    where: { email: 'njeri.creator@example.test' },
    update: {
      username: 'njeri_creator',
      displayName: 'Njeri Creator',
      status: UserStatus.ACTIVE,
    },
    create: {
      email: 'njeri.creator@example.test',
      username: 'njeri_creator',
      displayName: 'Njeri Creator',
      bio: 'Fictional Vyrlo development creator.',
      role: UserRole.VIEWER,
      status: UserStatus.ACTIVE,
    },
  });

  const creatorProfile = await prisma.creatorProfile.upsert({
    where: { userId: creatorUser.id },
    update: { status: CreatorStatus.ACTIVE },
    create: {
      userId: creatorUser.id,
      status: CreatorStatus.ACTIVE,
    },
  });

  await prisma.channel.upsert({
    where: { creatorProfileId: creatorProfile.id },
    update: {
      slug: 'njeri-live-lab',
      name: 'Njeri Live Lab',
      status: ChannelStatus.ACTIVE,
    },
    create: {
      creatorProfileId: creatorProfile.id,
      slug: 'njeri-live-lab',
      name: 'Njeri Live Lab',
      description: 'Fictional channel used to verify Stage 2 relationships.',
      status: ChannelStatus.ACTIVE,
    },
  });

  const relation = await prisma.user.findUnique({
    where: { id: creatorUser.id },
    include: {
      creatorProfile: { include: { channel: true } },
    },
  });

  if (!relation?.creatorProfile?.channel) {
    throw new Error('Seed relationship verification failed');
  }

  console.log(
    `Development seed complete: ${viewer.username}, ${relation.username}, ${relation.creatorProfile.channel.slug}`,
  );
}

main()
  .catch(() => {
    console.error(
      'Development seed failed. Check database connectivity and migration state.',
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
