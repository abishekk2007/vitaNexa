async function test() {
  const fullQuery = `[out:json];(node["amenity"="hospital"](around:5000,12.9716,77.5946);node["amenity"="clinic"](around:5000,12.9716,77.5946);node["healthcare"="hospital"](around:5000,12.9716,77.5946);node["healthcare"="clinic"](around:5000,12.9716,77.5946););out center;`;
  const encoded = encodeURIComponent(fullQuery);
  const body = `data=${encoded}`;
  console.log('Body:', body.substring(0, 200));

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' },
    body,
  });
  console.log('Status:', response.status);
  console.log('StatusText:', response.statusText);
  if (!response.ok) {
    const text = await response.text();
    console.log('Response:', text.substring(0, 500));
  }
}
test().catch(console.error);
