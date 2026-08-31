const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const http = require('http');

const p = new PrismaClient();
p.user.findUnique({ where: { email: 'admin@vitanexa.com' } }).then(u => {
  const secret = 'vitanexa-jwt-secret-key-2026';
  const token = jwt.sign({ userId: u.id, email: u.email, role: u.role }, secret, { expiresIn: '15m' });

  function fetch(method, path) {
    return new Promise((resolve) => {
      const opts = {
        hostname: 'localhost', port: 5000,
        path: '/api/microbiome/' + path,
        method, headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
      };
      const req = http.request(opts, res => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve({ status: res.statusCode, data }));
      });
      req.on('error', e => resolve({ status: 0, data: e.message }));
      req.end();
    });
  }

  async function test() {
    let r = await fetch('GET', 'species');
    let d = JSON.parse(r.data);
    console.log('GET species ->', r.status, 'count:', d.length);

    r = await fetch('GET', 'foods');
    d = JSON.parse(r.data);
    console.log('GET foods ->', r.status, 'count:', d.length);

    r = await fetch('GET', 'effects?limit=1');
    d = JSON.parse(r.data);
    console.log('GET effects ->', r.status, 'effects:', d.data ? d.data.length : d.length);

    r = await fetch('GET', 'analytics');
    d = JSON.parse(r.data);
    console.log('GET analytics ->', r.status, 'speciesCount:', d.speciesCount, 'foodCount:', d.foodCount, 'effectCount:', d.effectCount, 'ruleCount:', d.ruleCount);
    console.log('  evidenceDist sample:', JSON.stringify(d.evidenceDistribution?.slice(0,2)));
    console.log('  confidenceDist:', JSON.stringify(d.confidenceDistribution));

    const user = await p.user.findUnique({ where: { email: 'user@vitanexa.com' } });
    const userToken = jwt.sign({ userId: user.id, email: user.email, role: user.role }, secret, { expiresIn: '15m' });
    const opts2 = { hostname: 'localhost', port: 5000, path: '/api/microbiome/recommendations', method: 'GET', headers: { 'Authorization': 'Bearer ' + userToken } };
    r = await new Promise(resolve => {
      const req = http.request(opts2, res => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>resolve({status:res.statusCode,data:d})); });
      req.on('error',e=>resolve({status:0,data:e.message})); req.end();
    });
    d = JSON.parse(r.data);
    console.log('GET recommendations ->', r.status, 'TO_EAT:', d.TO_EAT?.length, 'TO_AVOID:', d.TO_AVOID?.length, 'PROBIOTIC:', d.PROBIOTIC?.length, 'PREBIOTIC:', d.PREBIOTIC?.length);

    const opts3 = { hostname: 'localhost', port: 5000, path: '/api/microbiome/health-score', method: 'GET', headers: { 'Authorization': 'Bearer ' + userToken } };
    r = await new Promise(resolve => {
      const req = http.request(opts3, res => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>resolve({status:res.statusCode,data:d})); });
      req.on('error',e=>resolve({status:0,data:e.message})); req.end();
    });
    d = JSON.parse(r.data);
    console.log('GET health-score ->', r.status, 'overallScore:', d.overallScore, 'breakdown:', JSON.stringify(d.breakdown));

    r = await fetch('GET', 'review/pending');
    d = JSON.parse(r.data);
    console.log('GET review/pending ->', r.status, 'count:', d.length);

    r = await fetch('GET', 'review/low-confidence');
    d = JSON.parse(r.data);
    console.log('GET review/low-confidence ->', r.status, 'count:', d.length);

    console.log('\nAll API tests passed!');
    await p.$disconnect();
  }
  test().catch(e => { console.error(e); p.$disconnect(); });
}).catch(e => { console.error(e); p.$disconnect(); });
