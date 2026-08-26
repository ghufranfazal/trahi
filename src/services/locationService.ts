import { UserLocation } from '../types.ts';

// Haversine formula to calculate distance in meters between two lat/lng points
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const radLat1 = (lat1 * Math.PI) / 180;
  const radLat2 = (lat2 * Math.PI) / 180;
  const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

interface NominatimResponse {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    city_district?: string;
    county?: string;
    municipality?: string;
    state?: string;
    state_district?: string;
    province?: string;
    region?: string;
    postcode?: string;
    postal_code?: string;
    country?: string;
    [key: string]: string | undefined;
  };
  display_name?: string;
}

// Reverse-geocode coordinates using free OpenStreetMap Nominatim API
export async function reverseGeocodeCoords(
  latitude: number,
  longitude: number
): Promise<{
  city: string;
  state: string;
  district: string;
  block: string;
  postcode: string;
  formattedAddress: string;
}> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim error HTTP ${response.status}`);
    }

    const data: NominatimResponse = await response.json();
    const addr = data.address || {};

    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.suburb ||
      addr.city_district ||
      addr.municipality ||
      addr.county ||
      '';

    const state =
      addr.state ||
      addr.state_district ||
      addr.province ||
      addr.region ||
      '';

    const district =
      addr.county ||
      addr.state_district ||
      addr.district ||
      addr.city_district ||
      addr.suburb ||
      city ||
      '';

    const block =
      addr.subdistrict ||
      addr.tehsil ||
      addr.taluk ||
      addr.municipality ||
      addr.neighbourhood ||
      addr.town ||
      addr.village ||
      city ||
      '';

    const postcode =
      addr.postcode ||
      addr.postal_code ||
      '';

    // Format like: "Ikeja, Lagos State — 100001" or "Kurla, Maharashtra — 400070"
    let formattedParts: string[] = [];
    if (city && state) {
      formattedParts.push(`${city}, ${state}`);
    } else if (city) {
      formattedParts.push(city);
    } else if (state) {
      formattedParts.push(state);
    } else if (data.display_name) {
      const parts = data.display_name.split(',').map((s) => s.trim());
      formattedParts.push(parts.slice(0, 2).join(', '));
    } else {
      formattedParts.push(`Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`);
    }

    let finalFormatted = formattedParts.join(', ');
    if (postcode) {
      finalFormatted += ` — ${postcode}`;
    }

    return {
      city: city || state || 'Current Location',
      state: state || '',
      district: district || 'Current District',
      block: block || 'Current Block',
      postcode: postcode || '',
      formattedAddress: finalFormatted,
    };
  } catch (error) {
    console.warn('Reverse geocoding failed, using fallback coordinates formatting:', error);
    return {
      city: 'Current Location',
      state: '',
      district: '',
      block: '',
      postcode: '',
      formattedAddress: `Coordinates (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
    };
  }
}
