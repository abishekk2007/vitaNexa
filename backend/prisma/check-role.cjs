const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const p = new PrismaClient();

p.user.findUnique({ where: { email: 'admin@vitanexa.com' } }).then(u => {
  console.log('DB role value:', JSON.stringify(u.role));
  console.log('DB role === ADMIN:', u.role === 'ADMIN');
  console.log('DB role === admin:', u.role === 'admin');
  
  const token = jwt.sign({ userId: u.id, email: u.email, role: u.role }, 'test-secret');
  const decoded = jwt.verify(token, 'test-secret');
  console.log('JWT payload:', JSON.stringify(decoded));
  
  const middlewareCheck = decoded.role !== 'ADMIN';
  console.log('Middleware would reject?', middlewareCheck);
  
  return p.$disconnect();
}).catch(e => {
  console.error('Error:', e);
  return p.$disconnect();
});
