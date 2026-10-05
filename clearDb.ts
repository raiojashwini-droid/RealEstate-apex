import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clear() {
  console.log('Clearing dummy deals...');
  await prisma.deal.deleteMany({});
  console.log('Deals deleted.');
}

clear()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
