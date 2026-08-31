async function test() {
  const fullQuery = `[out:json];(node["amenity"="hospital"](around:5000,12.9716,77.5946););out center;`;
  const body = `data=${encodeURIComponent(fullQuery)}`;
  
  console.log('Body length:', body.length);
  console.log('Body:', body);

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': '*/*',
    },
    body,
  });
  console.log('Status:', response.status);
  const text = await response.text();
  console.log('Resp:', text.substring(0, 300));
}
test().catch(console.error);
