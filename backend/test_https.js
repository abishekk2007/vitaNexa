const https = require('https');

async function test() {
  const fullQuery = `[out:json];(node["amenity"="hospital"](around:5000,12.9716,77.5946););out center;`;
  const enc = encodeURIComponent(fullQuery);
  const url = `https://overpass-api.de/api/interpreter?data=${enc}`;

  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
      console.log('Status:', res.statusCode);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const json = JSON.parse(data);
          console.log('Elements:', json.elements?.length);
        } else {
          console.log('Body:', data.substring(0, 500));
        }
        resolve();
      });
    }).on('error', reject);
  });
}
test().catch(console.error);
