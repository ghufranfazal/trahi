import React from 'react';
import { AlertTriangle, Activity, AlertCircle, PhoneCall, RotateCcw } from 'lucide-react';

interface TrahiGPTErrorCardProps {
  errorType: 'CONFIG_MISSING' | 'RATE_LIMIT' | 'GENERAL_ERROR';
  onShowEmergencyContacts?: () => void;
  onRetry?: () => void;
}

export const TrahiGPTErrorCard: React.FC<TrahiGPTErrorCardProps> = ({
  errorType,
  onShowEmergencyContacts,
  onRetry,
}) => {
  if (errorType === 'CONFIG_MISSING') {
    return (
      <div className="p-4 rounded-3xl bg-amber-50/90 border border-amber-200 text-amber-950 shadow-2xs space-y-2">
        <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-amber-900">
          <AlertTriangle size={18} className="text-amber-600 shrink-0" />
          <span>Service Configuration Notice</span>
        </div>
        <p className="text-xs text-amber-800 font-medium leading-relaxed">
          TrahiGPT is currently unavailable — the AI service is not configured. Please contact support.
        </p>
      </div>
    );
  }

  if (errorType === 'RATE_LIMIT') {
    return (
      <div className="p-4 rounded-3xl bg-orange-50/95 border border-orange-200/90 text-orange-950 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-orange-900">
          <Activity size={18} className="text-orange-600 shrink-0" />
          <span>High Demand Notice</span>
        </div>
        <p className="text-xs text-orange-850 font-medium leading-relaxed">
          TrahiGPT is experiencing high demand right now. Please try again in a moment, or use the Emergency Contacts list below for immediate help.
        </p>
        {onShowEmergencyContacts && (
          <button
            type="button"
            onClick={onShowEmergencyContacts}
            className="w-full py-2.5 px-3 rounded-2xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
          >
            <PhoneCall size={14} />
            <span>View Emergency Contacts List</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 rounded-3xl bg-red-50/95 border border-red-200/90 text-red-950 shadow-2xs space-y-3">
      <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-red-900">
        <AlertCircle size={18} className="text-red-600 shrink-0" />
        <span>Connection Error</span>
      </div>
      <p className="text-xs text-red-850 font-medium leading-relaxed">
        Something went wrong reaching TrahiGPT. Please check your connection and try again.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="py-2 px-3.5 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
        >
          <RotateCcw size={14} />
          <span>Retry Message</span>
        </button>
      )}
    </div>
  );
};
