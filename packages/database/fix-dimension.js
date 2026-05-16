const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Dropping and recreating Document embedding column...');
  await prisma.$executeRawUnsafe('ALTER TABLE "Document" DROP COLUMN IF EXISTS "embedding";');
  await prisma.$executeRawUnsafe('ALTER TABLE "Document" ADD COLUMN "embedding" vector(4096);');
  console.log('Success!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
