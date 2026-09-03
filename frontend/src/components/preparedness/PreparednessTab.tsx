import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  CheckSquare, 
  Square, 
  MapPin, 
  RefreshCw, 
  Thermometer, 
  Wind, 
  Activity, 
  PackageCheck, 
  Sparkles,
  Compass,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  ListTodo
} from 'lucide-react';
import { resolveRegionalRisk, HazardProfile, SafetyKitItem } from '../../services/hazardEngine.ts';
import { useLocation } from '../../context/LocationContext.tsx';

const CHECKLIST_STORAGE_KEY = 'trahi_safety_checklist';

export const PreparednessTab: React.FC = () => {
  const { location, refreshLocation, isLocating } = useLocation();
  const [profile, setProfile] = useState<HazardProfile | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedPreset, setSelectedPreset] = useState<string>('auto');

  // Load saved checklist state from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      if (saved) {
        setCheckedItems(JSON.parse(saved));
      }
    } catch (err) {
      console.warn('Could not read checklist from localStorage:', err);
    }
  }, []);

  // Detect location and load hazard profile
  const detectLocationAndLoad = (overrideLat?: number, overrideLng?: number, presetKey: string = 'custom') => {
    setIsLoading(true);
    setSelectedPreset(presetKey);

    if (overrideLat !== undefined && overrideLng !== undefined) {
      resolveRegionalRisk(overrideLat, overrideLng).then((res) => {
        setProfile(res);
        setIsLoading(false);
      });
      return;
    }

    if (location?.latitude && location?.longitude) {
      resolveRegionalRisk(location.latitude, location.longitude).then((res) => {
        setProfile(res);
        setIsLoading(false);
      });
      return;
    }

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolveRegionalRisk(pos.coords.latitude, pos.coords.longitude).then((res) => {
            setProfile(res);
            setIsLoading(false);
          });
        },
        () => {
          // Fallback to Delhi coordinates if location is blocked
          resolveRegionalRisk(28.6139, 77.2090).then((res) => {
            setProfile(res);
            setIsLoading(false);
          });
        },
        { timeout: 8000 }
      );
    } else {
      resolveRegionalRisk(28.6139, 77.2090).then((res) => {
        setProfile(res);
        setIsLoading(false);
      });
    }
  };

  useEffect(() => {
    detectLocationAndLoad(undefined, undefined, 'auto');
  }, [location?.latitude, location?.longitude]);

  // Toggle checklist item with LocalStorage sync
  const toggleChecklist = (id: string) => {
    const isCurrentlyChecked = checkedItems[id] ?? false;
    const updated = { ...checkedItems, [id]: !isCurrentlyChecked };
    setCheckedItems(updated);
    try {
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save checklist state:', err);
    }
  };

  // Reset checklist for current profile
  const resetChecklist = () => {
    if (!profile) return;
    const updated = { ...checkedItems };
    profile.safetyKitChecklist.forEach((item) => {
      updated[item.id] = false;
    });
    setCheckedItems(updated);
    localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(updated));
  };

  // Calculate packed progress
  const totalItems = profile?.safetyKitChecklist.length || 0;
  const packedItemsCount = profile
    ? profile.safetyKitChecklist.filter((item) => checkedItems[item.id] ?? item.defaultChecked).length
    : 0;
  const progressPercent = totalItems > 0 ? Math.round((packedItemsCount / totalItems) * 100) : 0;

  return (
    <div id="preparedness-tab-container" className="w-full max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-6">
      {/* 1. Header & Title Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0F9D8F] flex items-center justify-center shrink-0 shadow-inner">
              <Compass size={24} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  Regional Hazard Engine
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-black uppercase tracking-wider">
                  Live Kit
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Dynamic threat detection, localized action protocols & offline safety kit checklist.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => detectLocationAndLoad(undefined, undefined, 'auto')}
            disabled={isLoading || isLocating}
            className="flex items-center gap-1.5 px-3 py-2 bg-teal-50 hover:bg-teal-100/70 text-[#0F9D8F] font-bold text-xs rounded-xl transition cursor-pointer self-start sm:self-auto disabled:opacity-50"
          >
            <RefreshCw size={13} className={isLoading || isLocating ? 'animate-spin' : ''} />
            <span>{isLoading ? 'Resolving...' : 'GPS Auto-Detect'}</span>
          </button>
        </div>

        {/* 2. Hackathon Region Simulation Controls */}
        <div className="p-3.5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <Sparkles size={14} className="text-amber-400" />
              <span>Hackathon Simulation Toggles (Test Risk Matrices):</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">1-Tap Override</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <button
              type="button"
              onClick={() => detectLocationAndLoad(28.6139, 77.2090, 'delhi')}
              className={`p-2.5 rounded-xl border text-left font-bold transition cursor-pointer ${
                selectedPreset === 'delhi'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <p className="text-[10px] uppercase font-black opacity-80">Heatwave & Smog</p>
              <p className="truncate">Delhi NCR</p>
            </button>

            <button
              type="button"
              onClick={() => detectLocationAndLoad(27.7172, 85.3240, 'nepal')}
              className={`p-2.5 rounded-xl border text-left font-bold transition cursor-pointer ${
                selectedPreset === 'nepal'
                  ? 'bg-red-500 text-white border-red-400 shadow-md'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <p className="text-[10px] uppercase font-black opacity-80">Seismic & Floods</p>
              <p className="truncate">Nepal / Himalayas</p>
            </button>

            <button
              type="button"
              onClick={() => detectLocationAndLoad(26.1445, 91.7362, 'assam')}
              className={`p-2.5 rounded-xl border text-left font-bold transition cursor-pointer ${
                selectedPreset === 'assam'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <p className="text-[10px] uppercase font-black opacity-80">River Inundation</p>
              <p className="truncate">Assam Valley</p>
            </button>

            <button
              type="button"
              onClick={() => detectLocationAndLoad(19.0760, 72.8777, 'mumbai')}
              className={`p-2.5 rounded-xl border text-left font-bold transition cursor-pointer ${
                selectedPreset === 'mumbai'
                  ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-md'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <p className="text-[10px] uppercase font-black opacity-80">High Tide Surge</p>
              <p className="truncate">Mumbai Coast</p>
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading || !profile ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-[#0F9D8F]" />
          <p className="text-sm font-bold text-gray-700">
            Analyzing regional meteorological & seismic risk profile...
          </p>
          <p className="text-xs text-gray-400">
            Cross-referencing OpenWeather, USGS hazard feeds & municipal contingency rules.
          </p>
        </div>
      ) : (
        <>
          {/* 3. Threat Assessment & Live Environmental Telemetry Banner */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[#0F9D8F] font-bold text-xs">
                  <MapPin size={15} />
                  <span>{profile.regionName}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900">
                  {profile.activeThreat}
                </h3>
              </div>

              <span
                className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider self-start sm:self-auto border ${
                  profile.severity === 'CRITICAL'
                    ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                    : profile.severity === 'HIGH'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-teal-50 text-teal-800 border-teal-200'
                }`}
              >
                {profile.severity} RISK
              </span>
            </div>

            {/* Environmental Sensor Readouts */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {profile.temperature && (
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Thermometer size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold block uppercase">Temperature</span>
                    <span className="text-xs font-extrabold text-gray-900">{profile.temperature}</span>
                  </div>
                </div>
              )}

              {profile.airQuality && (
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <Wind size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold block uppercase">Air Quality</span>
                    <span className="text-xs font-extrabold text-gray-900">{profile.airQuality}</span>
                  </div>
                </div>
              )}

              {profile.seismicIndex && (
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-2.5 col-span-2 sm:col-span-1">
                  <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                    <Activity size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold block uppercase">Seismic Zone</span>
                    <span className="text-xs font-extrabold text-gray-900">{profile.seismicIndex}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. Precautionary Action Protocols */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <ShieldAlert className="text-amber-500 shrink-0" size={20} />
              <div>
                <h3 className="text-base sm:text-lg font-black text-gray-900">
                  Precautionary Action Protocols
                </h3>
                <p className="text-xs text-gray-500">
                  Follow these step-by-step contingency guidelines before the situation escalates:
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {profile.precautionarySteps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100 text-xs sm:text-sm text-amber-950 font-medium flex items-start gap-3"
                >
                  <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Dynamic Safety Kit Checklist (Offline Persisted in LocalStorage) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <PackageCheck size={22} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900">
                    Dynamic Emergency Safety Kit
                  </h3>
                  <p className="text-xs text-gray-500">
                    Tailored for {profile.regionName} • Saved offline on device
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetChecklist}
                  className="text-xs font-bold text-gray-400 hover:text-gray-700 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                  title="Reset Checklist"
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Checklist Progress Bar */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                <span>Checklist Readiness:</span>
                <span className="text-[#0F9D8F] font-mono">
                  {packedItemsCount} of {totalItems} items ready ({progressPercent}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`h-full rounded-full transition-all ${
                    progressPercent === 100 ? 'bg-emerald-500' : 'bg-[#0F9D8F]'
                  }`}
                />
              </div>
            </div>

            {/* Interactive Checklist Items */}
            <div className="space-y-2.5">
              {profile.safetyKitChecklist.map((item) => {
                const isChecked = checkedItems[item.id] ?? item.defaultChecked;

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleChecklist(item.id)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition select-none ${
                      isChecked
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                        : 'bg-gray-50/70 border-gray-200/80 hover:border-gray-300 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isChecked ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400 shrink-0" />
                      )}
                      <span className={`text-xs sm:text-sm font-bold ${
                        isChecked ? 'line-through text-gray-400' : 'text-gray-900'
                      }`}>
                        {item.item}
                      </span>
                    </div>

                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                      item.category === 'Medical'
                        ? 'bg-red-100 text-red-700'
                        : item.category === 'Power'
                        ? 'bg-amber-100 text-amber-700'
                        : item.category === 'Food'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-teal-100 text-teal-700'
                    }`}>
                      {item.category}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-gray-400 text-center">
              *Checklist status is persisted locally in your browser so you can access your emergency kit during blackouts.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
