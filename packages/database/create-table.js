require('dotenv').config({ path: '../../.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`push_tokens\` (
      \`id\` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`token\` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`user_id\` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`device\` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
      \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`push_tokens_token_key\` (\`token\`),
      KEY \`push_tokens_user_id_idx\` (\`user_id\`),
      CONSTRAINT \`push_tokens_user_id_fkey\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("Created table push_tokens successfully.");
}
main().catch(console.error).finally(() => prisma.$disconnect());
