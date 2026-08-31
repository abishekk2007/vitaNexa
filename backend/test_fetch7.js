async function test() {
  const fullQuery = `[out:json];(node["amenity"="hospital"](around:5000,12.9716,77.5946););out center;`;
  const body = `data=${encodeURIComponent(fullQuery)}`;

  // Try with http2: false
  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': '*/*',
    },
    body,
    // undici-specific option to force http/1.1
    ...(process.env.NODE_OPTIONS ? {} : {}),
  });
  console.log('Status:', response.status);
  if (response.ok) {
    const data = await response.json();
    console.log('Elements:', data.elements?.length);
  } else {
    const text = await response.text();
    console.log('Resp:', text.substring(0, 500));
  }
}
test().catch(console.error);
