export interface GeocodingResult {
  display_name: string;
  short_name: string;
  lat: number;
  lng: number;
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GeocodingResult | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=id`,
      {
        headers: {
          'User-Agent': 'BalikIn/1.0 (https://balik.in)',
        },
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    const address = data.address || {};
    const parts = [
      address.road || address.pedestrian,
      address.neighbourhood || address.suburb || address.village,
      address.city || address.town || address.county,
    ].filter(Boolean);
    
    return {
      display_name: data.display_name || `${lat}, ${lng}`,
      short_name: parts.slice(0, 2).join(', ') || data.display_name,
      lat,
      lng,
    };
  } catch {
    return null;
  }
}

export function getGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function getOpenStreetMapUrl(lat: number, lng: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=16`;
}
