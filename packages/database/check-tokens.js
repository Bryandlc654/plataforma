require('dotenv').config({ path: '../../.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
async function main() {
  const tokens = await prisma.pushToken.findMany();
  console.log("TOKENS IN DB:");
  console.log(tokens);
}
main().catch(console.error).finally(() => prisma.$disconnect());
