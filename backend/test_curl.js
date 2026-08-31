const cp = require('child_process');
const query = '[out:json];(node["amenity"="hospital"](around:5000,12.9716,77.5946););out center;';
const enc = encodeURIComponent(query);
const body = `data=${enc}`;

const result = cp.execSync(
  `curl.exe -s "https://overpass-api.de/api/interpreter" -H "Content-Type: application/x-www-form-urlencoded" -d "${body}"`,
  { encoding: 'utf8', timeout: 15000 }
);
try {
  const json = JSON.parse(result);
  console.log('Elements:', json.elements?.length);
  json.elements?.slice(0, 5).forEach(el => console.log(' -', el.tags?.name));
} catch (e) {
  console.log('Resp:', result.substring(0, 500));
}
