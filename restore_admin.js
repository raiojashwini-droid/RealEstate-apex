const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Password123!', 10);
  
  await prisma.user.update({
    where: { email: 'alex.vance@apexacquire.com' },
    data: {
      passwordHash: hashedPassword,
      status: 'ACTIVE'
    }
  });
  
  console.log('Admin user restored successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
