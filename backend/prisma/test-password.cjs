const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  try {
    const user = await p.user.findUnique({ where: { email: 'admin@vitanexa.com' } });
    if (!user) { console.log('Admin user not found'); return; }
    console.log('User:', user.email, user.role, user.isActive);
    console.log('Password hash:', user.password.substring(0, 20) + '...');
    
    // Test password
    const bcrypt = require('bcryptjs');
    const match = await bcrypt.compare('password123', user.password);
    console.log('Password match for password123:', match);
    
    // Try alternate common passwords
    for (const pw of ['admin123', 'Admin123', 'admin@123', 'Admin@123', 'password', 'vitanexa']) {
      const m = await bcrypt.compare(pw, user.password);
      if (m) console.log('Found matching password:', pw);
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await p.$disconnect();
  }
}
main();
