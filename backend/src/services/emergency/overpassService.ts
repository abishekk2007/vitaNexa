import { execSync } from 'child_process';

export interface HospitalResult {
  name: string;
  type: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  distance: number;
  emergency?: string;
  hours24x7: boolean;
  hasEmergencyDept: boolean;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const SEARCH_QUERIES = [
  'node["amenity"="hospital"]',
];

async function queryOverpass(query: string): Promise<any[]> {
  try {
    const fullQuery = `[out:json];${query};out center;`;
    const encoded = encodeURIComponent(fullQuery);
    const stdout = execSync(
      `curl.exe -s "https://overpass-api.de/api/interpreter" -H "Content-Type: application/x-www-form-urlencoded" -d "data=${encoded}"`,
      { encoding: 'utf8', timeout: 25000, windowsHide: true }
    );
    if (stdout.startsWith('<')) { console.error('[Overpass] HTML response'); return []; }
    const data: any = JSON.parse(stdout);
    return data.elements || [];
  } catch (err) {
    console.error('[Overpass] Error:', err);
    return [];
  }
}

function getTagValue(tags: Record<string, string> | undefined, ...keys: string[]): string {
  if (!tags) return '';
  for (const key of keys) {
    if (tags[key]) return tags[key];
  }
  return '';
}

function isGovernment(tags: Record<string, string> | undefined): boolean {
  if (!tags) return false;
  const operator = (tags.operator || '').toLowerCase();
  const name = (tags.name || '').toLowerCase();
  return /government|govt|public|district|civil|state|central|ministry|municipal|city corporation|sarkari|sarkari|railway|defence|army|navy|air force|esi|esic/i.test(operator) ||
    /government|govt|district|civil|state|central|municipal|sarkari|railway|esi|esic/i.test(name) ||
    tags.ownership === 'public' ||
    tags['government'] === 'yes';
}

function isPrivate(tags: Record<string, string> | undefined): boolean {
  if (!tags) return false;
  const operator = (tags.operator || '').toLowerCase();
  const name = (tags.name || '').toLowerCase();
  return /private|pvt|trust|corporate|llp|ltd|hospital pvt|nursing home|diagnostic|clinic|eye|dental|ortho|neuro|cardio|cancer|fertility/i.test(operator) ||
    /private|ltd|pvt\b/i.test(name) ||
    tags.ownership === 'private';
}

export async function searchHospitals(lat: number, lng: number, radiusKm: number = 5): Promise<HospitalResult[]> {
  const radiusMeters = radiusKm * 1000;
  const results: HospitalResult[] = [];
  const seen = new Set<string>();

  const overpassQuery = `(${SEARCH_QUERIES.map(q => `${q}(around:${radiusMeters},${lat},${lng});`).join('')})`;

  const elements = await queryOverpass(overpassQuery);

  for (const el of elements) {
    if (el.type !== 'node' && el.type !== 'way') continue;
    const tags = el.tags || {};
    const name = tags.name || tags['name:en'] || '';
    if (!name || seen.has(name)) continue;
    seen.add(name);

    const elLat = el.lat ?? el.center?.lat;
    const elLng = el.lon ?? el.center?.lon;
    if (!elLat || !elLng) continue;

    const distance = haversine(lat, lng, elLat, elLng);
    if (distance > radiusKm) continue;

    const amenity = tags.amenity || tags.healthcare || 'hospital';
    const phone = getTagValue(tags, 'phone', 'contact:phone', 'emergency:phone');
    const address = [
      getTagValue(tags, 'addr:full', 'addr:street', 'addr:road'),
      getTagValue(tags, 'addr:city'),
      getTagValue(tags, 'addr:state'),
    ].filter(Boolean).join(', ');

    const hours = getTagValue(tags, 'opening_hours', 'service_times');
    const is24x7 = /24\/7|24x7|24 hours|open 24/i.test(hours) || tags['24h'] === 'yes';
    const hasEmergency = getTagValue(tags, 'emergency', 'healthcare:emergency') === 'yes' ||
      /emergency|casualty|trauma|accident/i.test(tags.description || '');

    const type = isGovernment(tags) ? 'Government' : isPrivate(tags) ? 'Private' : 'Private';

    results.push({
      name,
      type,
      address: address || getTagValue(tags, 'display_name'),
      phone: phone || '',
      latitude: elLat,
      longitude: elLng,
      distance: Math.round(distance * 100) / 100,
      hours24x7: is24x7,
      hasEmergencyDept: hasEmergency,
    });
  }

  results.sort((a, b) => a.distance - b.distance);
  return results;
}

export async function searchByCategory(lat: number, lng: number, city?: string): Promise<HospitalResult[]> {
  const radiusOptions = [1, 2, 5, 10, 20];
  let allResults: HospitalResult[] = [];

  for (const radius of radiusOptions) {
    const results = await searchHospitals(lat, lng, radius);
    allResults = allResults.concat(results);
    const seen = new Set<string>();
    allResults = allResults.filter(r => {
      if (seen.has(r.name)) return false;
      seen.add(r.name);
      return true;
    });
    if (allResults.length >= 50) break;
  }

  return allResults.slice(0, 50);
}
