const https = require('https');

function test() {
  const fullQuery = `[out:json];(node["amenity"="hospital"](around:5000,12.9716,77.5946););out center;`;
  const enc = encodeURIComponent(fullQuery).replace(/%20/g, '+');
  const body = `data=${enc}`;

  const options = {
    hostname: 'overpass-api.de',
    path: '/api/interpreter',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': '*/*',
      'Content-Length': Buffer.byteLength(body),
    },
  };

  const req = https.request(options, (res) => {
    console.log('Status:', res.statusCode);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        const json = JSON.parse(data);
        console.log('Elements:', json.elements?.length);
        json.elements?.slice(0, 5).forEach(el => console.log(' -', el.tags?.name));
      } else {
        console.log('Resp:', data.substring(0, 300));
      }
    });
  });
  req.on('error', console.error);
  req.write(body);
  req.end();
}
test();
