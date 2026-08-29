import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, RefreshCw, Radio } from 'lucide-react';
import { useLocation } from '../context/LocationContext.tsx';

// Custom modern SVG pulse marker icon for Leaflet
const createPulseIcon = () => {
  return L.divIcon({
    className: 'trahi-map-marker',
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%);">
        <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background-color: rgba(15, 157, 143, 0.3); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; width: 22px; height: 22px; border-radius: 50%; background-color: #0F9D8F; border: 2.5px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center;">
          <div style="width: 7px; height: 7px; border-radius: 50%; background-color: #ffffff;"></div>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Component to dynamically re-center map if coordinates shift
function MapController({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 15, { animate: true });
  }, [lat, lng, map]);
  return null;
}

export const LocationMapWidget: React.FC = () => {
  const { location, isLocating, refreshLocation } = useLocation();

  // Fallback coords if not yet loaded (default to Mumbai/Delhi or previous point)
  const lat = location?.latitude ?? 19.0760;
  const lng = location?.longitude ?? 72.8777;

  // Format the location string as required: "City, State — Postcode"
  const locationDisplayText = location?.formattedAddress || "Detecting rescue location...";

  return (
    <div
      id="sos-location-map-widget"
      className="w-full max-w-sm sm:max-w-md md:max-w-lg mx-auto"
    >
      <div className="w-full bg-white rounded-3xl p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 transition-all">
        {/* TOP OF THE BOX: City, State, Postcode in medium-bold dark text */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-start gap-2 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-teal-50 text-[#0F9D8F] flex items-center justify-center shrink-0 mt-0.5">
              <MapPin size={15} className="stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                Current Location
              </span>
              <p
                id="sos-location-address-text"
                className="text-xs sm:text-sm font-bold text-gray-900 tracking-tight leading-snug truncate"
                title={locationDisplayText}
              >
                {locationDisplayText}
              </p>
            </div>
          </div>

          {/* Quick Refresh Button & GPS Indicator */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live</span>
            </span>
            <button
              onClick={() => refreshLocation()}
              disabled={isLocating}
              className="p-1 rounded-lg text-gray-400 hover:text-[#0F9D8F] hover:bg-gray-50 transition cursor-pointer"
              title="Refresh GPS Coordinates"
            >
              <RefreshCw size={13} className={isLocating ? "animate-spin text-[#0F9D8F]" : ""} />
            </button>
          </div>
        </div>

        {/* BELOW: Small embedded Leaflet map with soft fade/opacity overlay */}
        <div className="relative w-full h-32 sm:h-36 rounded-2xl overflow-hidden border border-gray-100/90 shadow-inner">
          <MapContainer
            center={[lat, lng]}
            zoom={15}
            scrollWheelZoom={false}
            dragging={false}
            zoomControl={false}
            attributionControl={false}
            doubleClickZoom={false}
            touchZoom={false}
            className="w-full h-full"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[lat, lng]} icon={createPulseIcon()} />
            <MapController lat={lat} lng={lng} />
          </MapContainer>

          {/* Soft Fade / Semi-Transparent White Gradient Overlay Effect on Top of Map Tiles */}
          <div
            className="absolute inset-0 pointer-events-none z-[400] bg-gradient-to-b from-white/35 via-white/15 to-white/45 backdrop-contrast-[0.92]"
            aria-hidden="true"
          />

          {/* Coordinates Tag Badge in Bottom Right Corner */}
          <div className="absolute bottom-2 right-2 z-[401] pointer-events-none px-2 py-0.5 rounded-md bg-white/85 backdrop-blur-xs border border-gray-200/60 text-[9px] font-mono font-bold text-gray-600 shadow-xs">
            {lat.toFixed(4)}°, {lng.toFixed(4)}°
          </div>
        </div>
      </div>
    </div>
  );
};
