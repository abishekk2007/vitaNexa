const { searchHospitals } = require('./dist/services/emergency/overpassService');

async function main() {
  console.time('search');
  try {
    const results = await searchHospitals(12.9716, 77.5946, 5);
    console.timeEnd('search');
    console.log('Count:', results.length);
    results.slice(0, 10).forEach(h => {
      console.log(`  ${h.distance}km ${h.name} [${h.type}] phone:${h.phone}`);
    });
  } catch (err) {
    console.error('Error:', err);
  }
}
main();
