async function test() {
  const fullQuery = `[out:json];(node["amenity"="hospital"](around:5000,12.9716,77.5946););out center;`;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(fullQuery)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 
      'Accept': '*/*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });
  console.log('Status:', response.status);
  if (!response.ok) {
    const text = await response.text();
    console.log('Resp:', text.substring(0, 500));
  } else {
    const data = await response.json();
    console.log('Elements:', data.elements?.length);
  }
}
test().catch(console.error);
