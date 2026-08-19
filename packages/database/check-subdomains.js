require('dotenv').config({ path: '../../.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
async function main() {
  const sites = await prisma.site.findMany({ select: { subdomain: true } });
  console.log(sites);
}
main().catch(console.error).finally(() => prisma.$disconnect());
