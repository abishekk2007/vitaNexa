import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
try {
  const u = await p.user.findUnique({ where: { email: 'admin@vitanexa.com' } });
  if (u) {
    console.log('Admin user found:', JSON.stringify({ id: u.id, email: u.email, role: u.role, isActive: u.isActive }, null, 2));
  } else {
    console.log('ADMIN USER NOT FOUND - run: npm run seed');
  }
} catch (e) {
  console.error('Error:', e.message);
} finally {
  await p.$disconnect();
}
