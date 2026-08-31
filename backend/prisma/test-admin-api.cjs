const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const http = require('http');

const p = new PrismaClient();
p.user.findUnique({ where: { email: 'admin@vitanexa.com' } }).then(u => {
  const secret = 'vitanexa-jwt-secret-key-2026';
  const token = jwt.sign({ userId: u.id, email: u.email, role: u.role }, secret, { expiresIn: '15m' });
  let ruleId = null;

  function test(method, path, body) {
    return new Promise((resolve) => {
      const opts = {
        hostname: 'localhost', port: 5000,
        path: '/api/microbiome/' + path,
        method, headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        }
      };
      const req = http.request(opts, res => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          console.log(method, path, '->', res.statusCode);
          if (method === 'POST' && res.statusCode === 201) {
            const created = JSON.parse(data);
            ruleId = created.id;
            console.log('  Created ID:', ruleId);
          }
          resolve();
        });
      });
      req.on('error', e => { console.log(method, path, 'FAILED:', e.message); resolve(); });
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  test('GET', 'rules')
    .then(() => test('POST', 'rules', { bacteriaName: 'CRUDTest', level: 'LOW', foodsToEat: ['Test'], foodsToAvoid: [], probiotics: [], prebiotics: [], medicalNotes: 'delete me' }))
    .then(() => {
      if (ruleId) return test('PUT', 'rules/' + ruleId, { bacteriaName: 'CRUDTest', level: 'LOW', foodsToEat: ['Updated'], foodsToAvoid: [], probiotics: [], prebiotics: [], medicalNotes: 'updated' });
    })
    .then(() => {
      if (ruleId) return test('DELETE', 'rules/' + ruleId);
    })
    .then(() => {
      console.log('\nAll CRUD operations succeeded!');
      return p.$disconnect();
    });
}).catch(e => { console.error(e); p.$disconnect(); });
