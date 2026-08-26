import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  AlertTriangle, 
  Activity, 
  Clock, 
  MapPin, 
  Radio, 
  Waves, 
  ExternalLink, 
  HeartHandshake, 
  ShieldAlert,
  Compass,
  Layers,
  ArrowRight,
  Play,
  Pause,
  Volume2
} from 'lucide-react';
import { FormattedEarthquake } from '../../services/earthquakeService.ts';
import { SOSReport } from '../../types.ts';
import { getCategoryConfig } from './DonorCrisisMapTab.tsx';

export type SelectedCrisisItem = 
  | { type: 'earthquake'; data: FormattedEarthquake }
  | { type: 'sos'; data: SOSReport };

interface CrisisDetailsModalProps {
  selectedItem: SelectedCrisisItem | null;
  onClose: () => void;
  onDonateToCrisis?: (title: string, reportId?: string) => void;
}

export const CrisisDetailsModal: React.FC<CrisisDetailsModalProps> = ({
  selectedItem,
  onClose,
  onDonateToCrisis,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioError, setAudioError] = useState(false);

  if (!selectedItem) return null;

  const isEarthquake = selectedItem.type === 'earthquake';
  const eqData = isEarthquake ? selectedItem.data : null;
  const sosData = !isEarthquake ? selectedItem.data : null;

  const categoryConfig = sosData ? getCategoryConfig(sosData.category) : null;

  const handleToggleAudio = (url: string) => {
    try {
      const audio = new Audio(url);
      if (isPlayingAudio) {
        setIsPlayingAudio(false);
      } else {
        setIsPlayingAudio(true);
        audio.play().catch(() => setAudioError(true));
        audio.onended = () => setIsPlayingAudio(false);
      }
    } catch {
      setAudioError(true);
    }
  };

  return (
    <AnimatePresence>
      <div 
        id="crisis-details-backdrop"
        className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          id="crisis-details-modal-box"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-auto text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Banner */}
          <div 
            style={{
              backgroundColor: isEarthquake 
                ? (eqData?.magnitude && eqData.magnitude >= 6.0 ? '#DC2626' : eqData?.magnitude && eqData.magnitude >= 4.0 ? '#EA580C' : '#D97706') 
                : (categoryConfig?.color || '#DC2626')
            }}
            className="p-5 sm:p-6 text-white relative shadow-inner"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-extrabold uppercase tracking-wide">
                {isEarthquake ? <Activity size={12} /> : <Radio size={12} className="animate-pulse" />}
                {isEarthquake ? 'USGS Live Seismic Event' : `${categoryConfig?.label || 'Ground SOS'} Emergency`}
              </span>
              {isEarthquake && eqData?.tsunamiWarning && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-950/80 text-red-200 text-[10px] font-extrabold animate-pulse">
                  <Waves size={11} /> Tsunami Watch
                </span>
              )}
            </div>

            <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
              {isEarthquake ? eqData?.place : (sosData?.userAddress || `${categoryConfig?.label || 'Distress'} Incident Location`)}
            </h3>

            <p className="text-xs text-white/80 mt-1 flex items-center gap-1.5">
              <Clock size={13} />
              {isEarthquake ? eqData?.timeFormatted : new Date(sosData?.timestamp || Date.now()).toLocaleString('en-IN')}
              {isEarthquake && ` (${eqData?.timeAgo})`}
            </p>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {isEarthquake && eqData ? (
              <>
                {/* Metric Cards Grid */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                    <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">Magnitude</span>
                    <span className="text-xl font-black text-gray-900">M {eqData.magnitude.toFixed(1)}</span>
                    <span className="text-[9px] font-bold block text-gray-500 mt-0.5">{eqData.severityLabel}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                    <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">Depth</span>
                    <span className="text-xl font-black text-gray-900">{eqData.depthKm} km</span>
                    <span className="text-[9px] font-bold block text-gray-500 mt-0.5">Hypocenter</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                    <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">Est. Radius</span>
                    <span className="text-xl font-black text-gray-900">~{eqData.radiusKm} km</span>
                    <span className="text-[9px] font-bold block text-gray-500 mt-0.5">Dashed Circle</span>
                  </div>
                </div>

                {/* Coordinates & USGS Meta */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      <MapPin size={14} className="text-gray-400" /> Exact Coordinates:
                    </span>
                    <span className="font-mono font-bold text-gray-900">
                      {eqData.latitude.toFixed(4)}°N, {eqData.longitude.toFixed(4)}°E
                    </span>
                  </div>

                  {eqData.feltReports !== null && (
                    <div className="flex items-center justify-between text-gray-600">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Activity size={14} className="text-gray-400" /> Community Felt Reports:
                      </span>
                      <span className="font-bold text-gray-900">{eqData.feltReports} citizen responses</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Layers size={14} className="text-gray-400" /> Data Source:
                    </span>
                    <span className="font-bold text-[#0F9D8F]">USGS Earthquake Hazard Program</span>
                  </div>
                </div>

                {/* Approximate affected area note */}
                <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/60 flex items-start gap-2.5 text-xs text-amber-900">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong className="font-bold">Official Government Data:</strong> The dashed circular boundary on the crisis map represents an estimated visual shockwave radius (~{eqData.radiusKm} km) based on USGS magnitude scaling (20 km × Magnitude).
                  </p>
                </div>
              </>
            ) : sosData ? (
              <>
                {/* Distress Transcript Box */}
                <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-700 flex items-center gap-1">
                      <Radio size={12} className="animate-pulse" /> Distress Voice / Text Transcript
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-white">
                      {sosData.status || 'Active'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 leading-relaxed italic bg-white p-3 rounded-xl border border-red-100 shadow-2xs">
                    "{sosData.transcript || 'Voice distress signal triggered by emergency beacon.'}"
                  </p>

                  {/* Audio Playback button if voiceUrl exists */}
                  {sosData.voiceUrl && (
                    <div className="pt-1 flex items-center justify-between">
                      <button
                        onClick={() => handleToggleAudio(sosData.voiceUrl!)}
                        className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        {isPlayingAudio ? <Pause size={13} /> : <Play size={13} />}
                        <span>{isPlayingAudio ? 'Pause Voice Recording' : 'Listen to Audio Dispatch'}</span>
                      </button>
                      <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <Volume2 size={11} /> 10s voice clip
                      </span>
                    </div>
                  )}
                </div>

                {/* AI Classified Category */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                  <span className="text-xs font-bold text-gray-500 uppercase">Classified Crisis Type</span>
                  <span 
                    style={{ backgroundColor: categoryConfig?.color ? `${categoryConfig.color}20` : '#FEE2E2', color: categoryConfig?.color || '#DC2626' }}
                    className="px-3.5 py-1 text-xs font-black rounded-full border border-gray-200"
                  >
                    {sosData.category || 'Emergency Distress'}
                  </span>
                </div>

                {/* Location & Time Info */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2 text-xs">
                  <div className="flex items-start justify-between text-gray-600">
                    <span className="flex items-center gap-1.5 font-medium shrink-0">
                      <MapPin size={14} className="text-gray-400" /> Location:
                    </span>
                    <span className="font-bold text-gray-900 text-right">
                      {sosData.userAddress || 'Ground rescue beacon'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Compass size={14} className="text-gray-400" /> GPS Coordinates:
                    </span>
                    <span className="font-mono font-bold text-gray-900">
                      {sosData.latitude.toFixed(4)}°N, {sosData.longitude.toFixed(4)}°E
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock size={14} className="text-gray-400" /> Broadcast Time:
                    </span>
                    <span className="font-bold text-gray-900">
                      {new Date(sosData.timestamp).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </span>
                  </div>
                </div>

                {/* Action note */}
                <div className="p-3 rounded-2xl bg-teal-50 border border-teal-100 flex items-start gap-2.5 text-xs text-teal-900">
                  <ShieldAlert size={16} className="text-[#0F9D8F] shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Verified Trahi relief teams and ground first responders are dispatched and funded directly by donor disbursements.
                  </p>
                </div>
              </>
            ) : null}
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-2.5 justify-end">
            {isEarthquake && eqData?.url && (
              <a
                href={eqData.url}
                target="_blank"
                rel="noreferrer noopener"
                className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl border border-gray-200 shadow-2xs transition flex items-center justify-center gap-1.5"
              >
                <span>USGS Event Page</span>
                <ExternalLink size={13} />
              </a>
            )}

            <button
              onClick={() => {
                if (onDonateToCrisis) {
                  const title = isEarthquake 
                    ? `Earthquake Relief: ${eqData?.place}` 
                    : `${categoryConfig?.label || 'SOS'} Distress Aid: ${sosData?.userAddress || 'Emergency Beacon'}`;
                  onDonateToCrisis(title, sosData?.id);
                }
                onClose();
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#0F9D8F] hover:bg-[#0c8579] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <HeartHandshake size={15} />
              <span>{isEarthquake ? 'Donate to Seismic Relief Fund' : `Fund Aid for this ${categoryConfig?.label || 'Crisis'} Beacon`}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
