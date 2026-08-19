const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
p.refreshToken.deleteMany().then(r => {
  console.log(`${r.count} tokens eliminados`);
  p.$disconnect();
}).catch(e => {
  console.error(e);
  p.$disconnect();
});
