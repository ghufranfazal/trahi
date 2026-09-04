import React from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Circle,
  useMap 
} from 'react-leaflet';
import L from 'leaflet';
import { 
  Maximize2, 
  HeartHandshake, 
  Layers, 
  Info, 
  Clock, 
  MapPin, 
  Radio, 
  Activity,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { SOSReport } from '../../types.ts';
import { FormattedEarthquake } from '../../services/earthquakeService.ts';
import { getCategoryConfig, createCategoryPinIcon, CATEGORY_CONFIGS } from '../donor/DonorCrisisMapTab.tsx';
import { ProfileViewButton } from '../profile/ProfileViewButton.tsx';

interface HomeMiniCrisisMapProps {
  sosReports: SOSReport[];
  earthquakes: FormattedEarthquake[];
  userLat?: number;
  userLng?: number;
  onExpandMap: () => void;
  onOpenDonate: (crisisTitle?: string, reportId?: string) => void;
  onSelectCrisis: (report: SOSReport) => void;
}

// Marker Icon for Verified USGS Earthquake Epicenter
const createEarthquakeMiniIcon = (mag: number, color: string) => {
  return L.divIcon({
    className: 'trahi-eq-mini-icon',
    html: `
      <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background-color: ${color}35; animation: ping-slow 2.6s infinite;"></div>
        <div style="position: relative; z-index: 2; width: 20px; height: 20px; border-radius: 50%; background-color: ${color}; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 9px; font-weight: 900;">
          ${mag.toFixed(1)}
        </div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
};

function MapCenteringHelper({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

export const HomeMiniCrisisMap: React.FC<HomeMiniCrisisMapProps> = ({
  sosReports,
  earthquakes,
  userLat,
  userLng,
  onExpandMap,
  onOpenDonate,
  onSelectCrisis,
}) => {
  const defaultCenter: [number, number] = userLat && userLng ? [userLat, userLng] : [20.5937, 78.9629];
  const defaultZoom = userLat && userLng ? 8 : 5;

  return (
    <div 
      id="home-embedded-crisis-map-card"
      className="w-full bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden flex flex-col"
    >
      {/* Mini Map Card Header */}
      <div className="p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <Radio size={18} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-gray-900 leading-none">
                Live Situational Crisis Map
              </h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700 uppercase">
                {sosReports.length} Active Pins
              </span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
              Live ground SOS distress signals & USGS seismic feeds
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenDonate('General Rapid Disaster Relief Fund')}
            className="px-3 py-1.5 bg-[#0F9D8F] hover:bg-[#0c8579] active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <HeartHandshake size={14} />
            <span>Donate</span>
          </button>

          <button
            type="button"
            onClick={onExpandMap}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
            title="Expand Full Screen Crisis Map"
          >
            <Maximize2 size={13} />
            <span className="hidden sm:inline">Full Map</span>
          </button>
        </div>
      </div>

      {/* Embedded Map Canvas */}
      <div className="w-full h-72 sm:h-80 relative z-0 bg-slate-100">
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          scrollWheelZoom={false}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapCenteringHelper center={defaultCenter} zoom={defaultZoom} />

          {/* 1. USGS Earthquakes (Dashed Circles + Epicenter Markers) */}
          {earthquakes.slice(0, 15).map((eq) => (
            <React.Fragment key={`home-mini-eq-${eq.id}`}>
              <Circle
                center={[eq.latitude, eq.longitude]}
                radius={eq.radiusMeters}
                pathOptions={{
                  color: eq.severityColor,
                  fillColor: eq.fillColor,
                  fillOpacity: 0.15,
                  weight: 1.8,
                  dashArray: '5, 6',
                }}
              />
              <Marker
                position={[eq.latitude, eq.longitude]}
                icon={createEarthquakeMiniIcon(eq.magnitude, eq.severityColor)}
              >
                <Popup className="trahi-custom-popup">
                  <div className="p-3 space-y-2 text-left font-sans">
                    <div className="flex items-center justify-between gap-1 border-b border-gray-100 pb-1.5">
                      <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                        M{eq.magnitude.toFixed(1)} Earthquake
                      </span>
                      <span className="text-[10px] text-gray-500 font-bold">{eq.timeAgo}</span>
                    </div>
                    <p className="text-xs font-bold text-gray-900">{eq.place}</p>
                    <button
                      onClick={() => onOpenDonate(`Seismic Relief Fund: ${eq.place}`)}
                      className="w-full py-1.5 bg-[#0F9D8F] text-white text-[11px] font-bold rounded-lg transition hover:bg-[#0c8579]"
                    >
                      Donate to Crisis Aid
                    </button>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}

          {/* 2. User-Reported SOS Beacons with 8 Category Pin Markers */}
          {sosReports.map((sos) => {
            const config = getCategoryConfig(sos.category);

            return (
              <Marker
                key={`home-mini-sos-${sos.id || sos.timestamp}`}
                position={[sos.latitude, sos.longitude]}
                icon={createCategoryPinIcon(sos.category)}
              >
                <Popup className="trahi-custom-popup">
                  <div className="p-3 space-y-2 text-left font-sans">
                    <div className="flex items-center justify-between gap-1 border-b border-gray-100 pb-1.5">
                      <span 
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${config.bgBadgeClass}`}
                      >
                        {config.label}
                      </span>
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                        {sos.status || 'Active'}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-gray-900 italic line-clamp-2">
                      "{sos.transcript || 'Emergency distress call logged.'}"
                    </p>

                    {sos.userAddress && (
                      <p className="text-[10px] text-gray-500 flex items-center gap-1 line-clamp-1">
                        <MapPin size={10} className="shrink-0" />
                        <span>{sos.userAddress}</span>
                      </p>
                    )}

                    <div className="grid grid-cols-3 gap-1 pt-1">
                      <button
                        onClick={() => onSelectCrisis(sos)}
                        className="py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-[10px] font-bold rounded-lg transition"
                      >
                        Details
                      </button>

                      <ProfileViewButton
                        userId={sos.userId}
                        variant="outline"
                        size="sm"
                        className="py-1 text-[10px] font-bold px-1"
                        customLabel="Profile"
                      />

                      <button
                        onClick={() => onOpenDonate(`Aid Fund: ${sos.userAddress || config.label}`, sos.id)}
                        className="py-1 bg-[#0F9D8F] hover:bg-[#0c8579] text-white text-[10px] font-bold rounded-lg transition"
                      >
                        Donate
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Floating Expand Map Tap Overlay in Bottom Bar */}
        <div 
          onClick={onExpandMap}
          className="absolute bottom-2.5 right-2.5 z-[400] bg-white/90 backdrop-blur-md hover:bg-white px-3 py-1.5 rounded-xl shadow-md border border-gray-200 text-[11px] font-extrabold text-gray-800 flex items-center gap-1.5 cursor-pointer transition"
        >
          <span>Explore Full Crisis Radar</span>
          <ChevronRight size={14} className="text-[#0F9D8F]" />
        </div>
      </div>

      {/* Mini Map Category Legend Summary Chips */}
      <div className="p-3 bg-gray-50/80 border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[10px] font-bold text-gray-600">
        <span className="text-gray-400 font-extrabold uppercase tracking-wider pl-1 shrink-0">Categories:</span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" /> Flood
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-600" /> Fire
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-900/15 text-amber-950 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-800" /> Quake
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-800 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600" /> Medical
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-600" /> Crime
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-200 text-gray-800 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-600" /> Collapse
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-600" /> Accident
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0F9D8F]" /> Other
        </span>
      </div>
    </div>
  );
};
