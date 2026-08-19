require('dotenv').config({ path: '../../.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
async function main() {
  const events = await prisma.analyticsEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
  console.log('Events:', events);
}
main().catch(console.error).finally(() => prisma.$disconnect());
