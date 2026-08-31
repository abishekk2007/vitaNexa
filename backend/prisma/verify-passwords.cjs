const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();

async function main() {
  const users = await p.user.findMany({ select: { email: true, role: true, isActive: true, password: true } });
  for (const u of users) {
    const match = await bcrypt.compare('password123', u.password);
    console.log(u.email, '| role:', u.role, '| active:', u.isActive, '| password match:', match);
  }
  await p.$disconnect();
}
main().catch(e => { console.error(e); p.$disconnect(); });
