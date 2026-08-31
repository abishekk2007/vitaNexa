const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findMany({ select: { email: true, role: true, isActive: true, name: true } }).then(r => {
  console.log(JSON.stringify(r, null, 2));
  p.$disconnect();
});
