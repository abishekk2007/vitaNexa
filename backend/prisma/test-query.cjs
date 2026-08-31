const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findUnique({ where: { email: 'admin@vitanexa.com' } })
  .then(u => {
    if (u) {
      console.log('User found:', JSON.stringify({id: u.id, email: u.email, role: u.role, isActive: u.isActive}));
    } else {
      console.log('USER NOT FOUND');
    }
    return p.$disconnect();
  })
  .catch(e => {
    console.error('ERROR:', e.message);
    return p.$disconnect();
  });
