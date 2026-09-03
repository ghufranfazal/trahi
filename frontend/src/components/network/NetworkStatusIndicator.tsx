import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, 
  MessageSquare, 
  Radio, 
  Wifi, 
  WifiOff, 
  ChevronDown, 
  Check, 
  Sparkles, 
  Info, 
  Smartphone, 
  Layers,
  X,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { useNetwork, NetworkMode } from '../../context/NetworkContext.tsx';

export const NetworkStatusIndicator: React.FC = () => {
  const { 
    networkMode, 
    setNetworkMode, 
    isOnlineAuto, 
    isManualOverride, 
    resetToAutoDetection,
    setIsMeshModalOpen,
    setIsSMSModalOpen,
    dispatchNativeSMS
  } = useNetwork();

  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Configuration for each mode
  const modeConfig = {
    online: {
      label: 'Online (Cloud)',
      badge: 'Tier 1: Cloud Active',
      shortLabel: 'Online',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotColor: 'bg-emerald-500',
      icon: <Cloud size={14} className="text-emerald-600" />,
      desc: 'Real-time Firestore sync & AI voice processing enabled.',
    },
    sms: {
      label: 'No Internet (SMS)',
      badge: 'Tier 2: SMS Dispatch',
      shortLabel: 'SMS Mode',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      dotColor: 'bg-amber-500',
      icon: <MessageSquare size={14} className="text-amber-600" />,
      desc: 'No internet connection. SOS will launch 1-tap SMS to 112.',
    },
    mesh: {
      label: 'No Signal (BLE Mesh Demo)',
      badge: 'Tier 3: BLE Mesh Concept',
      shortLabel: 'BLE Mesh',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      dotColor: 'bg-purple-500',
      icon: <Radio size={14} className="text-purple-600" />,
      desc: 'No cellular/internet signal. Simulated peer-to-peer relay demo.',
    },
  };

  const current = modeConfig[networkMode];

  const handleSelectMode = (mode: NetworkMode) => {
    setNetworkMode(mode);
    setIsOpen(false);

    if (mode === 'mesh') {
      setIsMeshModalOpen(true);
    }
  };

  return (
    <div className="relative inline-block">
      {/* Network Indicator Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border shadow-2xs text-xs font-bold transition-all cursor-pointer hover:shadow-xs active:scale-95 ${current.color}`}
        title="Tap to switch emergency network dispatch tier"
        aria-label={`Network status: ${current.label}`}
      >
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${current.dotColor}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${current.dotColor}`} />
        </span>

        <span className="hidden sm:inline">{current.icon}</span>
        <span className="font-extrabold tracking-tight hidden md:inline">{current.label}</span>
        <span className="font-extrabold tracking-tight md:hidden">{current.shortLabel}</span>

        <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown / Modal Selector Popover */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile closing */}
            <div 
              className="fixed inset-0 z-40 bg-black/20 md:bg-transparent" 
              onClick={() => setIsOpen(false)} 
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 6 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white p-3 shadow-2xl border border-gray-100 z-50 text-left space-y-2"
            >
              {/* Popover Header */}
              <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-gray-100">
                <div>
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">
                    Network Dispatch Tiers
                  </span>
                  <h4 className="text-xs font-black text-gray-900">Choose Transmission Mode</h4>
                </div>
                {isManualOverride && (
                  <button
                    type="button"
                    onClick={resetToAutoDetection}
                    className="text-[10px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer bg-teal-50 px-2 py-0.5 rounded-md"
                    title="Reset to browser auto-detection"
                  >
                    <RefreshCw size={10} />
                    <span>Auto</span>
                  </button>
                )}
              </div>

              {/* Tiers List */}
              <div className="space-y-1.5">
                {/* TIER 1: Online (Cloud) */}
                <button
                  type="button"
                  onClick={() => handleSelectMode('online')}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-start justify-between gap-2 transition cursor-pointer ${
                    networkMode === 'online'
                      ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300'
                      : 'bg-gray-50/50 border-gray-200/80 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Cloud size={15} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-gray-900">Online (Cloud)</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                          Tier 1
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                        Full cloud connectivity. Firestore sync, Cloudinary voice audio & AI classification.
                      </p>
                    </div>
                  </div>
                  {networkMode === 'online' && <Check size={14} className="text-emerald-600 shrink-0 mt-1" />}
                </button>

                {/* TIER 2: No Internet (SMS) */}
                <button
                  type="button"
                  onClick={() => handleSelectMode('sms')}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-start justify-between gap-2 transition cursor-pointer ${
                    networkMode === 'sms'
                      ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-300'
                      : 'bg-gray-50/50 border-gray-200/80 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                      <MessageSquare size={15} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-gray-900">No Internet (SMS)</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                          Tier 2
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                        Pre-assembles emergency GPS distress payload & opens native 1-tap SMS to 112.
                      </p>
                    </div>
                  </div>
                  {networkMode === 'sms' && <Check size={14} className="text-amber-600 shrink-0 mt-1" />}
                </button>

                {/* TIER 3: No Signal (BLE Mesh Demo) */}
                <button
                  type="button"
                  onClick={() => handleSelectMode('mesh')}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-start justify-between gap-2 transition cursor-pointer ${
                    networkMode === 'mesh'
                      ? 'bg-purple-50/70 border-purple-300 ring-1 ring-purple-300'
                      : 'bg-gray-50/50 border-gray-200/80 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Radio size={15} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-gray-900">No Signal (BLE Mesh)</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                          Tier 3 Demo
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                        Visual simulation of peer-to-peer distress packet hopping across citizen phones.
                      </p>
                    </div>
                  </div>
                  {networkMode === 'mesh' && <Check size={14} className="text-purple-600 shrink-0 mt-1" />}
                </button>
              </div>

              {/* Status Note Footer */}
              <div className="p-2 bg-gray-50 rounded-xl text-[10px] text-gray-500 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnlineAuto ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  Device status: {isOnlineAuto ? 'Connected' : 'Offline'}
                </span>
                {networkMode === 'mesh' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setIsMeshModalOpen(true);
                    }}
                    className="font-bold text-purple-600 hover:underline cursor-pointer"
                  >
                    View Mesh Demo →
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
