const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Password123!', 10);
  
  const usersToCreate = [
    {
      email: 'elena.r@apexacquire.com',
      firstName: 'Elena',
      lastName: 'Rostova',
      role: 'MANAGER',
      status: 'ACTIVE'
    },
    {
      email: 'marcus.s@apexacquire.com',
      firstName: 'Marcus',
      lastName: 'Sterling',
      role: 'AGENT',
      status: 'ACTIVE'
    },
    {
      email: 'david.m@apexacquire.com',
      firstName: 'David',
      lastName: 'M',
      role: 'READ_ONLY',
      status: 'ACTIVE'
    }
  ];

  for (const u of usersToCreate) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        passwordHash: hashedPassword,
        status: u.status,
        role: u.role
      },
      create: {
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        passwordHash: hashedPassword,
        role: u.role,
        status: u.status
      }
    });
    console.log(`Upserted user: ${u.email}`);
  }
  
  console.log('All additional users restored successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
