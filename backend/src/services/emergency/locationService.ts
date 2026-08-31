export interface LocationResult {
  latitude: number;
  longitude: number;
  locationName?: string;
}

interface IpApiResponse {
  lat?: number; lon?: number; city?: string; region?: string; country?: string;
}

export async function getLocationFromIp(ip: string): Promise<LocationResult | null> {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=lat,lon,city,region,country`);
    const data: IpApiResponse = await response.json() as IpApiResponse;
    if (data && data.lat && data.lon) {
      return {
        latitude: data.lat,
        longitude: data.lon,
        locationName: `${data.city || ''}, ${data.region || ''}, ${data.country || ''}`.replace(/^, |, $/g, '') || undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
