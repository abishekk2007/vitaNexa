const http = require('http');

// Test 1: Check frontend HTML
http.get('http://localhost:5173', r => {
  let b = '';
  r.on('data', c => b += c);
  r.on('end', () => {
    console.log('=== Frontend HTML ===');
    console.log('Length:', b.length);
    console.log('Has root div:', b.includes('id="root"'));
    console.log('Has script tag:', b.includes('<script'));
    console.log('Has module script:', b.includes('type="module"'));
  });
});

// Test 2: Login as admin
const loginData = JSON.stringify({ email: 'admin@vitanexa.com', password: 'password123' });
const req = http.request({
  hostname: 'localhost', port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) }
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    const j = JSON.parse(b);
    const token = j.accessToken;
    console.log('\n=== Auth ===');
    console.log('Login status:', res.statusCode);
    console.log('Token:', token ? token.slice(0, 20) + '...' : 'MISSING');

    // Test 3: Fetch rules
    http.get({
      hostname: 'localhost', port: 5000,
      path: '/api/microbiome/rules',
      headers: { 'Authorization': 'Bearer ' + token }
    }, r2 => {
      let b2 = '';
      r2.on('data', c => b2 += c);
      r2.on('end', () => {
        try {
          const d = JSON.parse(b2);
          console.log('\n=== Rules API ===');
          console.log('Status:', r2.statusCode);
          console.log('Is array:', Array.isArray(d));
          console.log('Length:', Array.isArray(d) ? d.length : 'NOT_ARRAY');
          if (!Array.isArray(d)) console.log('Type:', typeof d, 'Keys:', Object.keys(d));
        } catch (e) {
          console.log('\n=== Rules API ERROR ===');
          console.log('Status:', r2.statusCode);
          console.log('Raw:', b2.slice(0, 200));
        }
      });
    }).on('error', e => console.log('Rules fetch error:', e.message));

    // Test 4: Fetch species
    http.get({
      hostname: 'localhost', port: 5000,
      path: '/api/microbiome/species',
      headers: { 'Authorization': 'Bearer ' + token }
    }, r3 => {
      let b3 = '';
      r3.on('data', c => b3 += c);
      r3.on('end', () => {
        try {
          const d = JSON.parse(b3);
          console.log('\n=== Species API ===');
          console.log('Status:', r3.statusCode);
          console.log('Is array:', Array.isArray(d));
          console.log('Length:', Array.isArray(d) ? d.length : 'NOT_ARRAY');
        } catch (e) {
          console.log('\n=== Species API ERROR ===');
          console.log('Status:', r3.statusCode);
          console.log('Raw:', b3.slice(0, 200));
        }
      });
    }).on('error', e => console.log('Species fetch error:', e.message));
  });
});
req.write(loginData);
req.end();
