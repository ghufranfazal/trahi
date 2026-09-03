import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Circle, 
  Marker, 
  Popup, 
  useMap 
} from 'react-leaflet';
import L from 'leaflet';
import { 
  Radio, 
  Activity, 
  MapPin, 
  RefreshCw, 
  Layers, 
  HeartHandshake, 
  AlertTriangle, 
  Clock, 
  Compass, 
  Info, 
  Filter,
  CheckCircle2,
  Navigation2,
  Volume2,
  Flame,
  Waves,
  HeartPulse,
  ShieldAlert,
  Building2,
  Car,
  HelpCircle,
  Check,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  fetchLiveEarthquakes, 
  FormattedEarthquake, 
  getMagnitudeConfig 
} from '../../services/earthquakeService.ts';
import { subscribeToSOSReports } from '../../services/firestoreService.ts';
import { SOSReport, EmergencyCategory } from '../../types.ts';
import { CrisisDetailsModal, SelectedCrisisItem } from './CrisisDetailsModal.tsx';
import { useLocation } from '../../context/LocationContext.tsx';
import { ProfileViewButton } from '../profile/ProfileViewButton.tsx';

// Category Configuration Definition
export interface CategoryConfig {
  key: string;
  label: string;
  color: string;
  pulseColor: string;
  bgBadgeClass: string;
  borderClass: string;
  textClass: string;
  svgIcon: string;
}

// Category Configuration Map
// Flood: blue | Fire: orange | Earthquake: brown | Medical: red | Crime/Violence: purple | Building Collapse: gray | Accident: yellow | Other: teal
export const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'Flood': {
    key: 'Flood',
    label: 'Flood',
    color: '#2563EB', // Blue
    pulseColor: 'rgba(37, 99, 235, 0.4)',
    bgBadgeClass: 'bg-blue-100 text-blue-800',
    borderClass: 'border-blue-300',
    textClass: 'text-blue-600',
    svgIcon: `<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" stroke="#ffffff" stroke-width="2" stroke-linecap="round" fill="none"/>`
  },
  'Fire': {
    key: 'Fire',
    label: 'Fire',
    color: '#EA580C', // Orange
    pulseColor: 'rgba(234, 88, 12, 0.4)',
    bgBadgeClass: 'bg-orange-100 text-orange-800',
    borderClass: 'border-orange-300',
    textClass: 'text-orange-600',
    svgIcon: `<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
  },
  'Earthquake': {
    key: 'Earthquake',
    label: 'Earthquake',
    color: '#854D0E', // Brown
    pulseColor: 'rgba(133, 77, 14, 0.4)',
    bgBadgeClass: 'bg-amber-900/15 text-amber-950',
    borderClass: 'border-amber-700',
    textClass: 'text-amber-800',
    svgIcon: `<path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
  },
  'Medical': {
    key: 'Medical',
    label: 'Medical',
    color: '#DC2626', // Red
    pulseColor: 'rgba(220, 38, 38, 0.4)',
    bgBadgeClass: 'bg-red-100 text-red-800',
    borderClass: 'border-red-300',
    textClass: 'text-red-600',
    svgIcon: `<path d="M12 6v12M6 12h12" stroke="#ffffff" stroke-width="3" stroke-linecap="round" fill="none"/><circle cx="12" cy="12" r="9" stroke="#ffffff" stroke-width="2" fill="none"/>`
  },
  'Crime/Violence': {
    key: 'Crime/Violence',
    label: 'Crime/Violence',
    color: '#9333EA', // Purple
    pulseColor: 'rgba(147, 51, 234, 0.4)',
    bgBadgeClass: 'bg-purple-100 text-purple-800',
    borderClass: 'border-purple-300',
    textClass: 'text-purple-600',
    svgIcon: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><line x1="12" y1="8" x2="12" y2="12" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="16" x2="12.01" y2="16" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>`
  },
  'Building Collapse': {
    key: 'Building Collapse',
    label: 'Building Collapse',
    color: '#4B5563', // Gray
    pulseColor: 'rgba(75, 85, 99, 0.4)',
    bgBadgeClass: 'bg-gray-200 text-gray-800',
    borderClass: 'border-gray-400',
    textClass: 'text-gray-700',
    svgIcon: `<rect x="4" y="2" width="16" height="20" rx="2" stroke="#ffffff" stroke-width="2" fill="none"/><line x1="9" y1="22" x2="9" y2="12" stroke="#ffffff" stroke-width="2"/><line x1="15" y1="22" x2="15" y2="12" stroke="#ffffff" stroke-width="2"/><line x1="8" y1="6" x2="8.01" y2="6" stroke="#ffffff" stroke-width="2"/><line x1="16" y1="6" x2="16.01" y2="6" stroke="#ffffff" stroke-width="2"/>`
  },
  'Accident': {
    key: 'Accident',
    label: 'Accident',
    color: '#CA8A04', // Yellow
    pulseColor: 'rgba(202, 138, 4, 0.4)',
    bgBadgeClass: 'bg-yellow-100 text-yellow-800',
    borderClass: 'border-yellow-300',
    textClass: 'text-yellow-700',
    svgIcon: `<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><line x1="12" y1="9" x2="12" y2="13" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>`
  },
  'Other': {
    key: 'Other',
    label: 'Other',
    color: '#0F9D8F', // Teal
    pulseColor: 'rgba(15, 157, 143, 0.4)',
    bgBadgeClass: 'bg-teal-100 text-teal-800',
    borderClass: 'border-teal-300',
    textClass: 'text-teal-700',
    svgIcon: `<circle cx="12" cy="12" r="2.5" fill="#ffffff"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" stroke="#ffffff" stroke-width="2" stroke-linecap="round" fill="none"/>`
  }
};

// Normalize category strings to canonical configuration keys
export function getCategoryConfig(rawCategory?: string): CategoryConfig {
  if (!rawCategory) return CATEGORY_CONFIGS['Other'];
  const cat = rawCategory.trim();

  if (cat.toLowerCase().includes('flood')) return CATEGORY_CONFIGS['Flood'];
  if (cat.toLowerCase().includes('fire')) return CATEGORY_CONFIGS['Fire'];
  if (cat.toLowerCase().includes('earthquake') || cat.toLowerCase().includes('quake')) return CATEGORY_CONFIGS['Earthquake'];
  if (cat.toLowerCase().includes('medic') || cat.toLowerCase().includes('health')) return CATEGORY_CONFIGS['Medical'];
  if (cat.toLowerCase().includes('crime') || cat.toLowerCase().includes('violenc') || cat.toLowerCase().includes('theft') || cat.toLowerCase().includes('attack')) return CATEGORY_CONFIGS['Crime/Violence'];
  if (cat.toLowerCase().includes('collapse') || cat.toLowerCase().includes('building') || cat.toLowerCase().includes('debris')) return CATEGORY_CONFIGS['Building Collapse'];
  if (cat.toLowerCase().includes('accident') || cat.toLowerCase().includes('crash') || cat.toLowerCase().includes('vehicle')) return CATEGORY_CONFIGS['Accident'];

  return CATEGORY_CONFIGS[cat] || CATEGORY_CONFIGS['Other'];
}

// Custom Marker Pin Icon for User-Reported SOS Crises
export const createCategoryPinIcon = (category?: string) => {
  const config = getCategoryConfig(category);

  return L.divIcon({
    className: 'trahi-category-pin-wrapper',
    html: `
      <div style="position: relative; width: 36px; height: 44px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; cursor: pointer;">
        <!-- Pulsing radar halo -->
        <div style="position: absolute; top: -1px; width: 34px; height: 34px; border-radius: 50%; background-color: ${config.pulseColor}; animation: ping-slow 2.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        
        <!-- Pin head circle with category SVG icon -->
        <div style="position: relative; z-index: 2; width: 32px; height: 32px; border-radius: 50%; background-color: ${config.color}; border: 2.5px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));">
            ${config.svgIcon}
          </svg>
        </div>
        
        <!-- Pin pointed tip -->
        <div style="position: relative; z-index: 1; width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 9px solid ${config.color}; margin-top: -3px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));"></div>
      </div>
    `,
    iconSize: [36, 44],
    iconAnchor: [18, 42],
    popupAnchor: [0, -40],
  });
};

// Marker Icon for Verified USGS Earthquake Epicenter
const createEarthquakeCenterIcon = (mag: number, color: string) => {
  return L.divIcon({
    className: 'trahi-eq-center-icon',
    html: `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div style="position: absolute; width: 26px; height: 26px; border-radius: 50%; background-color: ${color}35; animation: ping-slow 2.6s infinite;"></div>
        <div style="position: relative; z-index: 2; width: 24px; height: 24px; border-radius: 50%; background-color: ${color}; border: 2px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 10px; font-weight: 900; font-family: system-ui, -apple-system, sans-serif;">
          ${mag.toFixed(1)}
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
};

// Custom Map Controller to smoothly pan & zoom
function MapPanController({ targetCenter, targetZoom }: { targetCenter: [number, number] | null; targetZoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (targetCenter) {
      map.setView(targetCenter, targetZoom, { animate: true, duration: 1.2 });
    }
  }, [targetCenter, targetZoom, map]);
  return null;
}

interface DonorCrisisMapTabProps {
  onNavigateToDonate: () => void;
}

export const DonorCrisisMapTab: React.FC<DonorCrisisMapTabProps> = ({ onNavigateToDonate }) => {
  const { location } = useLocation();

  // Primary Data Sources
  const [sosReports, setSosReports] = useState<SOSReport[]>([]);
  const [earthquakes, setEarthquakes] = useState<FormattedEarthquake[]>([]);
  const [loadingEarthquakes, setLoadingEarthquakes] = useState<boolean>(true);
  const [earthquakeError, setEarthquakeError] = useState<string | null>(null);

  // Category Filter States (All active by default)
  const [activeCategories, setActiveCategories] = useState<Record<string, boolean>>({
    'Flood': true,
    'Fire': true,
    'Earthquake': true,
    'Medical': true,
    'Crime/Violence': true,
    'Building Collapse': true,
    'Accident': true,
    'Other': true,
  });
  const [showVerifiedUSGS, setShowVerifiedUSGS] = useState<boolean>(true);

  // Filter Bar Drawer state (collapsed/expanded on mobile)
  const [isFilterBarExpanded, setIsFilterBarExpanded] = useState<boolean>(true);

  // Bottom-Left Legend Card state
  const [isLegendExpanded, setIsLegendExpanded] = useState<boolean>(true);

  // Selected item for details modal
  const [selectedCrisisItem, setSelectedCrisisItem] = useState<SelectedCrisisItem | null>(null);

  // Map Navigation State (Default: Centered on India [20.5937, 78.9629] with zoom 5)
  const [mapTarget, setMapTarget] = useState<{ center: [number, number]; zoom: number }>({
    center: [20.5937, 78.9629],
    zoom: 5,
  });

  // 1. Subscribe to Firestore "sos_reports" (Fetch all active documents)
  useEffect(() => {
    const unsubscribe = subscribeToSOSReports((reports) => {
      // Filter for active status as primary requirement
      const activeOnly = reports.filter((r) => !r.status || r.status === 'active');
      setSosReports(activeOnly);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch live USGS earthquakes from official feed
  const loadEarthquakeData = useCallback(async () => {
    setLoadingEarthquakes(true);
    setEarthquakeError(null);
    try {
      const data = await fetchLiveEarthquakes();
      setEarthquakes(data);
    } catch (err: any) {
      console.error("Failed to load live earthquakes from USGS:", err);
      setEarthquakeError("Live USGS feed unreachable. Showing latest cached telemetry.");
    } finally {
      setLoadingEarthquakes(false);
    }
  }, []);

  useEffect(() => {
    loadEarthquakeData();
  }, [loadEarthquakeData]);

  // Compute category counts for user-reported crises
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'Flood': 0,
      'Fire': 0,
      'Earthquake': 0,
      'Medical': 0,
      'Crime/Violence': 0,
      'Building Collapse': 0,
      'Accident': 0,
      'Other': 0,
    };

    sosReports.forEach((sos) => {
      const config = getCategoryConfig(sos.category);
      if (counts[config.key] !== undefined) {
        counts[config.key]++;
      } else {
        counts['Other']++;
      }
    });

    return counts;
  }, [sosReports]);

  // Filtered SOS Reports based on active category toggles
  const filteredSOSReports = useMemo(() => {
    return sosReports.filter((sos) => {
      const config = getCategoryConfig(sos.category);
      return activeCategories[config.key] !== false;
    });
  }, [sosReports, activeCategories]);

  // Toggle single category filter
  const toggleCategory = (key: string) => {
    setActiveCategories((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Toggle all categories on / off
  const areAllCategoriesActive = useMemo(() => {
    return Object.values(activeCategories).every(Boolean) && showVerifiedUSGS;
  }, [activeCategories, showVerifiedUSGS]);

  const toggleAllCategories = () => {
    const nextState = !areAllCategoriesActive;
    const updated: Record<string, boolean> = {};
    Object.keys(CATEGORY_CONFIGS).forEach((key) => {
      updated[key] = nextState;
    });
    setActiveCategories(updated);
    setShowVerifiedUSGS(nextState);
  };

  // Quick Map Navigation
  const handleFocusIndia = () => {
    setMapTarget({ center: [20.5937, 78.9629], zoom: 5 });
  };

  const handleFocusUserGPS = () => {
    if (location?.latitude && location?.longitude) {
      setMapTarget({ center: [location.latitude, location.longitude], zoom: 12 });
    }
  };

  return (
    <div 
      id="donor-crisis-map-screen"
      className="relative w-full h-[calc(100vh-120px)] sm:h-[calc(100vh-130px)] md:h-[calc(100vh-64px)] flex flex-col bg-slate-900 overflow-hidden select-none font-sans"
    >
      {/* ========================================================================= */}
      {/* 5. TOP FILTER BAR (Toggle categories on/off so donors focus on crises)   */}
      {/* ========================================================================= */}
      <div 
        id="crisis-map-top-filter-bar"
        className="absolute top-3 left-3 right-3 sm:left-4 sm:right-4 z-[500] pointer-events-none flex flex-col gap-2"
      >
        {/* Main Floating Glass Filter Container */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/90 p-2.5 sm:p-3 transition-all">
          {/* Header Row: Live stats & Global toggles */}
          <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-gray-100 flex-wrap">
            {/* Left: Crisis Radar Live Indicator */}
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
              </span>
              <span className="text-xs font-black text-gray-900 tracking-tight">Crisis Radar</span>
              <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {filteredSOSReports.length} Active Reports
              </span>
              {showVerifiedUSGS && (
                <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full hidden sm:inline-flex">
                  {earthquakes.length} USGS Quakes
                </span>
              )}
            </div>

            {/* Right: Map Centering & Refresh Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleAllCategories}
                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                title={areAllCategoriesActive ? "Clear all filters" : "Select all filters"}
              >
                {areAllCategoriesActive ? <X size={12} /> : <Check size={12} />}
                <span>{areAllCategoriesActive ? "Clear All" : "Select All"}</span>
              </button>

              <button
                onClick={handleFocusIndia}
                className="px-2.5 py-1 bg-gray-100 hover:bg-teal-50 hover:text-[#0F9D8F] text-gray-700 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                title="Recenter Map on India"
              >
                <Compass size={12} />
                <span className="hidden sm:inline">Focus India</span>
              </button>

              {location?.latitude && (
                <button
                  onClick={handleFocusUserGPS}
                  className="p-1 text-gray-600 hover:text-[#0F9D8F] hover:bg-teal-50 rounded-xl transition cursor-pointer"
                  title="Center on My GPS Location"
                >
                  <Navigation2 size={13} />
                </button>
              )}

              <button
                onClick={loadEarthquakeData}
                disabled={loadingEarthquakes}
                className="p-1 text-gray-600 hover:text-[#0F9D8F] hover:bg-gray-100 rounded-xl transition cursor-pointer"
                title="Refresh Live Feeds"
              >
                <RefreshCw size={13} className={loadingEarthquakes ? "animate-spin text-[#0F9D8F]" : ""} />
              </button>
            </div>
          </div>

          {/* Interactive Category Filter Pills (Horizontally Scrollable) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {/* 1. Community Categories */}
            {Object.entries(CATEGORY_CONFIGS).map(([key, config]) => {
              const isActive = activeCategories[key] !== false;
              const count = categoryCounts[key] || 0;

              return (
                <button
                  key={`filter-${key}`}
                  onClick={() => toggleCategory(key)}
                  className={`shrink-0 px-2.5 py-1 rounded-xl font-extrabold text-[11px] transition-all flex items-center gap-1.5 cursor-pointer border ${
                    isActive
                      ? `${config.bgBadgeClass} ${config.borderClass} shadow-2xs`
                      : 'bg-gray-50 text-gray-400 border-gray-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <span 
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: isActive ? config.color : '#9CA3AF' }}
                  />
                  <span>{config.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                    isActive ? 'bg-white/80 text-gray-900' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}

            {/* 2. Official USGS Earthquakes Toggle Pill */}
            <button
              onClick={() => setShowVerifiedUSGS(!showVerifiedUSGS)}
              className={`shrink-0 px-2.5 py-1 rounded-xl font-extrabold text-[11px] transition-all flex items-center gap-1.5 cursor-pointer border ${
                showVerifiedUSGS
                  ? 'bg-amber-100 text-amber-900 border-amber-400 shadow-2xs'
                  : 'bg-gray-50 text-gray-400 border-gray-200 opacity-60 hover:opacity-100'
              }`}
            >
              <div className="w-3 h-3 rounded-full border-1.5 border-dashed border-amber-600 bg-amber-200/50 shrink-0" />
              <span>USGS Earthquakes</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                showVerifiedUSGS ? 'bg-amber-200/80 text-amber-950' : 'bg-gray-200 text-gray-500'
              }`}>
                {earthquakes.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. FULL-SCREEN LEAFLET MAP (react-leaflet, centered on India by default)  */}
      {/* ========================================================================= */}
      <div className="w-full h-full relative z-0">
        <MapContainer
          center={mapTarget.center}
          zoom={mapTarget.zoom}
          scrollWheelZoom={true}
          zoomControl={true}
          className="w-full h-full"
        >
          {/* Base OpenStreetMap Tile Layer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Smooth Dynamic Pan/Zoom Controller */}
          <MapPanController targetCenter={mapTarget.center} targetZoom={mapTarget.zoom} />

          {/* ========================================================================= */}
          {/* 3. OFFICIAL EARTHQUAKE DATA (USGS Verified Layer: Dashed circles)          */}
          {/* ========================================================================= */}
          {showVerifiedUSGS && earthquakes.map((eq) => (
            <React.Fragment key={`usgs-eq-${eq.id}`}>
              {/* Dashed Circular Boundary (~20km x magnitude) */}
              <Circle
                center={[eq.latitude, eq.longitude]}
                radius={eq.radiusMeters}
                pathOptions={{
                  color: eq.severityColor,
                  fillColor: eq.fillColor,
                  fillOpacity: 0.18,
                  weight: eq.magnitude >= 6 ? 2.8 : eq.magnitude >= 4 ? 2.2 : 1.8,
                  dashArray: '6, 8', // Distinct dashed-line style for verified government data
                }}
              >
                <Popup className="trahi-custom-popup">
                  <div className="p-3.5 space-y-2.5 text-left font-sans">
                    {/* Header with "Official: Magnitude X.X earthquake" */}
                    <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
                        Official: Magnitude {eq.magnitude.toFixed(1)} earthquake
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                        <Clock size={11} /> {eq.timeAgo}
                      </span>
                    </div>

                    {/* Place Name */}
                    <div>
                      <h4 className="text-xs font-black text-gray-900 leading-snug">
                        {eq.place}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Depth: <strong className="text-gray-700">{eq.depthKm} km</strong> • Hypocenter
                      </p>
                    </div>

                    {/* USGS Verified Notice Badge */}
                    <div className="p-2 rounded-xl bg-amber-50/90 border border-amber-200/80 text-[10px] text-amber-950 leading-tight space-y-1">
                      <div className="font-bold flex items-center gap-1 text-amber-800">
                        <Activity size={12} /> Verified USGS Government Feed
                      </div>
                      <div>
                        Approx. Affected Radius: <strong>~{eq.radiusKm} km</strong> (Dashed shockwave boundary)
                      </div>
                    </div>

                    {/* Timestamp */}
                    <p className="text-[10px] text-gray-400">
                      {eq.timeFormatted}
                    </p>

                    {/* View Details Action Button */}
                    <button
                      onClick={() => setSelectedCrisisItem({ type: 'earthquake', data: eq })}
                      className="w-full py-2 bg-[#0F9D8F] hover:bg-[#0c8579] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                    >
                      <Info size={13} />
                      <span>View Details</span>
                    </button>
                  </div>
                </Popup>
              </Circle>

              {/* Center Epicenter Point Marker */}
              <Marker
                position={[eq.latitude, eq.longitude]}
                icon={createEarthquakeCenterIcon(eq.magnitude, eq.severityColor)}
              >
                <Popup className="trahi-custom-popup">
                  <div className="p-3.5 space-y-2.5 text-left font-sans">
                    <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
                        Official: Magnitude {eq.magnitude.toFixed(1)} earthquake
                      </span>
                      <span className="text-[10px] font-bold text-gray-500">
                        {eq.timeAgo}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-gray-900 leading-snug">
                        {eq.place}
                      </h4>
                      <p className="text-[11px] text-gray-600 mt-0.5">
                        Coordinates: {eq.latitude.toFixed(3)}°N, {eq.longitude.toFixed(3)}°E
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedCrisisItem({ type: 'earthquake', data: eq })}
                      className="w-full py-2 bg-[#0F9D8F] hover:bg-[#0c8579] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Info size={13} />
                      <span>View Details</span>
                    </button>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}

          {/* ========================================================================= */}
          {/* 2. USER-REPORTED CRISES (Primary Data Source from sos_reports)             */}
          {/* ========================================================================= */}
          {filteredSOSReports.map((sos) => {
            const config = getCategoryConfig(sos.category);

            return (
              <Marker
                key={`sos-report-${sos.id || sos.timestamp}`}
                position={[sos.latitude, sos.longitude]}
                icon={createCategoryPinIcon(sos.category)}
              >
                <Popup className="trahi-custom-popup">
                  <div className="p-3.5 space-y-2.5 text-left font-sans">
                    {/* Header with Category Badge & Status */}
                    <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                      <span 
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 ${config.bgBadgeClass}`}
                      >
                        <span 
                          className="w-2 h-2 rounded-full animate-pulse shrink-0" 
                          style={{ backgroundColor: config.color }} 
                        />
                        <span>{config.label}</span>
                      </span>

                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {sos.status || 'Active'}
                      </span>
                    </div>

                    {/* Distress Voice Transcript */}
                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
                        <Volume2 size={10} className={config.textClass} /> Distress Voice Transcript
                      </span>
                      <p className="text-xs font-semibold text-gray-900 leading-snug italic line-clamp-3">
                        "{sos.transcript || 'Emergency voice distress beacon broadcast.'}"
                      </p>
                    </div>

                    {/* Location & Formatted Timestamp */}
                    <div className="text-[11px] text-gray-500 space-y-1">
                      {sos.userAddress && (
                        <p className="font-bold text-gray-800 line-clamp-1 flex items-center gap-1">
                          <MapPin size={11} className="text-gray-400 shrink-0" />
                          <span>{sos.userAddress}</span>
                        </p>
                      )}
                      <p className="flex items-center gap-1 text-gray-400">
                        <Clock size={11} />
                        <span>
                          {new Date(sos.timestamp).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </p>
                    </div>

                    {/* Action Buttons: View Details & View Profile */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        onClick={() => setSelectedCrisisItem({ type: 'sos', data: sos })}
                        style={{ backgroundColor: config.color }}
                        className="w-full py-2 hover:brightness-110 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Info size={13} />
                        <span>Details</span>
                      </button>

                      <ProfileViewButton
                        userId={sos.userId}
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        customLabel="Profile"
                      />
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* ========================================================================= */}
      {/* 4. MAP LEGEND (Bottom-Left: Solid Pins vs. Dashed Verified USGS Circles)  */}
      {/* ========================================================================= */}
      <div 
        id="crisis-map-bottom-left-legend"
        className="absolute bottom-4 left-3 sm:left-4 z-[500] max-w-xs pointer-events-auto"
      >
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/90 overflow-hidden text-left transition-all">
          {/* Header with Collapse/Expand Toggle */}
          <div 
            onClick={() => setIsLegendExpanded(!isLegendExpanded)}
            className="px-3.5 py-2.5 bg-gray-50/90 hover:bg-gray-100/80 border-b border-gray-100 flex items-center justify-between cursor-pointer transition select-none"
          >
            <div className="flex items-center gap-1.5 text-xs font-black text-gray-900">
              <Layers size={14} className="text-[#0F9D8F]" />
              <span>Map Legend & Layers</span>
            </div>
            <span className="text-[10px] font-bold text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
              {isLegendExpanded ? 'Collapse' : 'Expand'}
            </span>
          </div>

          {isLegendExpanded && (
            <div className="p-3.5 space-y-3.5 text-xs max-h-[50vh] overflow-y-auto">
              {/* Section 1: Solid Pins (Community-Reported Crises colored by type) */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-gray-900 uppercase tracking-wider">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#F0294D]" />
                  <span>Solid Pins: Community Reports</span>
                </div>
                <p className="text-[10px] text-gray-500 leading-tight">
                  Live ground SOS distress beacons logged to Firestore, colored by emergency category:
                </p>

                {/* 8-Category Color Grid */}
                <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                  <div className="flex items-center gap-1.5 p-1 rounded-lg bg-blue-50/80 border border-blue-100">
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    <span className="font-bold text-blue-900 truncate">🌊 Flood (Blue)</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-1 rounded-lg bg-orange-50/80 border border-orange-100">
                    <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                    <span className="font-bold text-orange-900 truncate">🔥 Fire (Orange)</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-1 rounded-lg bg-amber-50/80 border border-amber-200">
                    <span className="w-2 h-2 rounded-full bg-amber-800 shrink-0" />
                    <span className="font-bold text-amber-950 truncate">🟤 Quake (Brown)</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-1 rounded-lg bg-red-50/80 border border-red-100">
                    <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                    <span className="font-bold text-red-900 truncate">🩺 Medical (Red)</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-1 rounded-lg bg-purple-50/80 border border-purple-100">
                    <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
                    <span className="font-bold text-purple-900 truncate">🛡️ Crime (Purple)</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-1 rounded-lg bg-gray-100 border border-gray-200">
                    <span className="w-2 h-2 rounded-full bg-gray-600 shrink-0" />
                    <span className="font-bold text-gray-900 truncate">🏢 Collapse (Gray)</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-1 rounded-lg bg-yellow-50/80 border border-yellow-200">
                    <span className="w-2 h-2 rounded-full bg-yellow-600 shrink-0" />
                    <span className="font-bold text-yellow-900 truncate">⚠️ Crash (Yellow)</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-1 rounded-lg bg-teal-50/80 border border-teal-100">
                    <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0" />
                    <span className="font-bold text-teal-900 truncate">🌐 Other (Teal)</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Dashed Circles (Verified USGS Earthquake Data) */}
              <div className="pt-2.5 border-t border-gray-100 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-950 uppercase tracking-wider">
                  <div className="w-3 h-3 rounded-full border-2 border-dashed border-amber-600 bg-amber-100 shrink-0" />
                  <span>Dashed Circles: Verified USGS Quakes</span>
                </div>
                <p className="text-[10px] text-gray-500 leading-tight">
                  Official government seismic data. Dashed circular boundary scales to estimated affected area (~20 km × Magnitude).
                </p>

                <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-[9px] font-bold">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-yellow-100 text-yellow-800 border border-yellow-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                    M 2.5 - 3.9
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-800 border border-orange-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    M 4.0 - 5.9
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-100 text-red-800 border border-red-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                    M 6.0+
                  </span>
                </div>
              </div>

              {/* Quick Donor Callout */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-medium">Click any pin or circle for details</span>
                <button
                  onClick={onNavigateToDonate}
                  className="text-[10px] font-bold text-[#0F9D8F] hover:underline cursor-pointer"
                >
                  Browse Crises →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom-Right Quick Relief Action Card */}
      <div className="absolute bottom-4 right-3 sm:right-4 z-[500] hidden sm:block pointer-events-auto">
        <button
          onClick={onNavigateToDonate}
          className="px-4 py-2.5 bg-[#0F9D8F] hover:bg-[#0c8579] text-white font-bold text-xs rounded-2xl shadow-xl transition flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <HeartHandshake size={16} />
          <span>Donate to High-Urgency Zones</span>
        </button>
      </div>

      {/* Details Modal when clicking "View Details" */}
      <CrisisDetailsModal
        selectedItem={selectedCrisisItem}
        onClose={() => setSelectedCrisisItem(null)}
        onDonateToCrisis={() => {
          setSelectedCrisisItem(null);
          onNavigateToDonate();
        }}
      />
    </div>
  );
};
