import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
try {
  const r = await prisma.$queryRawUnsafe("SHOW TABLES LIKE 'media'");
  console.log("media table:", r.length > 0 ? "EXISTS" : "MISSING");
} catch(e) {
  console.log("ERROR:", e.message);
}
await prisma.$disconnect();
