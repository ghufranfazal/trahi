export interface EarthquakeFeature {
  id: string;
  type: 'Feature';
  properties: {
    mag: number;
    place: string;
    time: number;
    updated: number;
    url: string;
    detail?: string;
    felt: number | null;
    cdi: number | null;
    mmi: number | null;
    alert: string | null;
    status: string;
    tsunami: number;
    sig: number;
    net: string;
    code: string;
    ids: string;
    sources: string;
    types: string;
    nst: number | null;
    dmin: number | null;
    rms: number | null;
    gap: number | null;
    magType: string;
    type: string;
    title: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number, number]; // [longitude, latitude, depth_km]
  };
}

export interface EarthquakeGeoJSON {
  type: 'FeatureCollection';
  metadata: {
    generated: number;
    url: string;
    title: string;
    status: number;
    api: string;
    count: number;
  };
  features: EarthquakeFeature[];
}

export interface FormattedEarthquake {
  id: string;
  magnitude: number;
  place: string;
  time: number;
  timeFormatted: string;
  timeAgo: string;
  latitude: number;
  longitude: number;
  depthKm: number;
  radiusKm: number;
  radiusMeters: number;
  severityColor: string;
  strokeColor: string;
  fillColor: string;
  severityLabel: string;
  severityBadgeClass: string;
  url: string;
  tsunamiWarning: boolean;
  feltReports: number | null;
}

// Calculate relative time string
export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Format full date time for display
export function formatDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  }).format(new Date(timestamp));
}

// Determine magnitude colors and labels
export function getMagnitudeConfig(mag: number) {
  if (mag >= 6.0) {
    return {
      severityColor: '#DC2626',
      strokeColor: '#B91C1C',
      fillColor: '#EF4444',
      severityLabel: 'Major / Severe',
      severityBadgeClass: 'bg-red-500 text-white border-red-600'
    };
  } else if (mag >= 4.0) {
    return {
      severityColor: '#EA580C',
      strokeColor: '#C2410C',
      fillColor: '#F97316',
      severityLabel: 'Moderate / Strong',
      severityBadgeClass: 'bg-amber-500 text-white border-amber-600'
    };
  } else {
    return {
      severityColor: '#CA8A04',
      strokeColor: '#A16207',
      fillColor: '#EAB308',
      severityLabel: 'Minor / Light',
      severityBadgeClass: 'bg-yellow-500 text-slate-900 border-yellow-600'
    };
  }
}

// Fetch live USGS earthquakes (magnitude 2.5+ in the past 7 days)
export async function fetchLiveEarthquakes(): Promise<FormattedEarthquake[]> {
  const USGS_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson';
  
  const response = await fetch(USGS_URL);
  if (!response.ok) {
    throw new Error(`USGS Earthquake API returned status ${response.status}`);
  }

  const data: EarthquakeGeoJSON = await response.json();

  return (data.features || []).map((feat) => {
    const mag = typeof feat.properties.mag === 'number' ? feat.properties.mag : 3.0;
    const [longitude, latitude, depthKm] = feat.geometry.coordinates;
    const radiusKm = Math.round(20 * mag);
    const radiusMeters = radiusKm * 1000;
    const config = getMagnitudeConfig(mag);

    return {
      id: feat.id,
      magnitude: mag,
      place: feat.properties.place || 'Unknown seismic location',
      time: feat.properties.time,
      timeFormatted: formatDateTime(feat.properties.time),
      timeAgo: formatTimeAgo(feat.properties.time),
      latitude,
      longitude,
      depthKm: typeof depthKm === 'number' ? Math.round(depthKm * 10) / 10 : 10,
      radiusKm,
      radiusMeters,
      severityColor: config.severityColor,
      strokeColor: config.strokeColor,
      fillColor: config.fillColor,
      severityLabel: config.severityLabel,
      severityBadgeClass: config.severityBadgeClass,
      url: feat.properties.url,
      tsunamiWarning: feat.properties.tsunami === 1,
      feltReports: feat.properties.felt
    };
  });
}
