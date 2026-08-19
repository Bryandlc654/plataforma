require('dotenv').config({ path: '../../.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
async function main() {
  const user = await prisma.user.findFirst();
  if(!user) return console.log("No user found");
  await prisma.pushToken.create({
    data: { token: 'ExponentPushToken[dummy]', userId: user.id }
  });
  console.log("Created dummy token!");
  const tokens = await prisma.pushToken.findMany();
  console.log("Tokens:", tokens);
  await prisma.pushToken.deleteMany();
}
main().catch(console.error).finally(() => prisma.$disconnect());
