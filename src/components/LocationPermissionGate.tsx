import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Navigation, ShieldAlert, CheckCircle, RefreshCw, AlertCircle, Settings, Globe } from 'lucide-react';
import { useLocation } from '../context/LocationContext.tsx';

export const LocationPermissionGate: React.FC = () => {
  const { permissionState, isLocating, errorDetail, requestLocationPermission } = useLocation();

  const handleEnableClick = async () => {
    await requestLocationPermission();
  };

  return (
    <div
      id="location-permission-modal-container"
      className="fixed inset-0 z-50 bg-[#F7F7F8] flex flex-col items-center justify-center p-4 sm:p-6 select-none overflow-y-auto"
    >
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-red-100/30 rounded-full blur-3xl pointer-events-none" />

      {/* Main Center Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-gray-200/80 relative z-10 text-center"
      >
        {/* Radar MapPin Visual Icon */}
        <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          {/* Animated concentric pulse */}
          <motion.div
            animate={{ scale: [1, 1.35, 1], opacity: [0.35, 0.05, 0.35] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full bg-[#0F9D8F]"
          />
          <div className="relative z-10 w-16 h-16 rounded-2xl bg-teal-50 border-2 border-teal-100 text-[#0F9D8F] flex items-center justify-center shadow-inner">
            <Navigation className="w-8 h-8 stroke-[2.2] animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#F0294D] border-2 border-white flex items-center justify-center text-white shadow-xs">
            <MapPin size={12} className="stroke-[3]" />
          </div>
        </div>

        {/* Title */}
        <h2 id="location-gate-title" className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
          Location Access Required
        </h2>

        {/* Core Message as required */}
        <p id="location-gate-description" className="mt-3 text-sm text-gray-600 leading-relaxed font-normal">
          Location access is required for <strong className="text-gray-900 font-semibold">Trahi</strong> to work.
          Please enable location to continue.
        </p>

        {/* Value props bullet list */}
        <div className="my-5 p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100 text-left space-y-2 text-xs text-gray-600">
          <div className="flex items-center gap-2.5">
            <CheckCircle size={14} className="text-[#0F9D8F] shrink-0" />
            <span>Pinpoint exact rescue coordinates during emergency SOS</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle size={14} className="text-[#0F9D8F] shrink-0" />
            <span>Dispatch disaster relief to your exact district & pincode</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle size={14} className="text-[#0F9D8F] shrink-0" />
            <span>Encrypted transmission to local rescue network</span>
          </div>
        </div>

        {/* Denied / Error guidance banner */}
        {permissionState === 'denied' && (
          <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-left text-xs text-amber-900 space-y-2">
            <div className="flex items-start gap-2 font-bold text-amber-800">
              <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <span>Permission currently blocked by browser</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800">
              Go to your browser or app settings and allow location access for this site, or click the lock/settings icon next to the URL bar to enable location.
            </p>
          </div>
        )}

        {errorDetail && permissionState !== 'denied' && (
          <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-left text-xs text-red-700 flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span className="text-[11px]">{errorDetail}</span>
          </div>
        )}

        {/* Primary Action Button: "Enable Location" */}
        <button
          id="enable-location-btn"
          onClick={handleEnableClick}
          disabled={isLocating}
          className="w-full py-3.5 px-5 bg-[#0F9D8F] hover:bg-[#0c8579] active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-lg shadow-[#0F9D8F]/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-60"
        >
          {isLocating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Acquiring High-Accuracy GPS...</span>
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4" />
              <span>Enable Location</span>
            </>
          )}
        </button>

        {/* Help / Guidance note */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
          <Settings size={12} className="text-gray-400" />
          <span>Need help? Open Site Settings in browser & set Location to Allow</span>
        </div>
      </motion.div>
    </div>
  );
};
