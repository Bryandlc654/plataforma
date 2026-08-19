require('dotenv').config({ path: '../../.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
async function main() {
  const tId = 'eb462755-e801-4773-a718-f580e95e6864';
  const ut = await prisma.userTenant.findFirst({ where: { tenantId: tId } });
  console.log('UserTenant for test tenant:', ut);
}
main().catch(console.error).finally(() => prisma.$disconnect());
