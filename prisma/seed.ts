import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  const passwordHash = await bcrypt.hash('password123', 12);

  const users = [
    {
      email: 'alex.vance@apexacquire.com',
      firstName: 'Alexander',
      lastName: 'Vance',
      role: 'ADMIN',
      status: 'ACTIVE',
      passwordHash,
    },
    {
      email: 'elena.r@apexacquire.com',
      firstName: 'Elena',
      lastName: 'Rostova',
      role: 'MANAGER',
      status: 'ACTIVE',
      passwordHash,
    },
    {
      email: 'marcus.s@apexacquire.com',
      firstName: 'Marcus',
      lastName: 'Sterling',
      role: 'AGENT',
      status: 'ACTIVE',
      passwordHash,
    },
    {
      email: 'david.m@apexacquire.com',
      firstName: 'David',
      lastName: 'M',
      role: 'READ_ONLY',
      status: 'ACTIVE',
      passwordHash,
    },
  ];

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        // @ts-ignore - Prisma types might complain about enum but string is fine usually
        role: u.role,
        // @ts-ignore
        status: u.status,
        passwordHash: u.passwordHash,
      },
    });
    console.log(`Created user with id: ${user.id}`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
