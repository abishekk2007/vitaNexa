async function test() {
  const fullQuery = `[out:json];(node["amenity"="hospital"](around:5000,12.9716,77.5946););out center;`;
  const body = `data=${encodeURIComponent(fullQuery)}`;

  // Without charset
  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  console.log('Status:', response.status);
  if (!response.ok) {
    const text = await response.text();
    console.log('Resp:', text.substring(0, 200));
  } else {
    const data = await response.json();
    console.log('Elements:', data.elements?.length);
  }
}
test().catch(console.error);
