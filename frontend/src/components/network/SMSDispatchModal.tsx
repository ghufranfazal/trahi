import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  MessageSquare, 
  Send, 
  Copy, 
  Check, 
  ShieldAlert, 
  PhoneCall, 
  Navigation2, 
  AlertCircle,
  ExternalLink,
  Smartphone
} from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext.tsx';

export const SMSDispatchModal: React.FC = () => {
  const { 
    isSMSModalOpen, 
    setIsSMSModalOpen, 
    activeSMSPayload, 
    generateSMSPayload,
    dispatchNativeSMS 
  } = useNetwork();

  const [copied, setCopied] = useState<boolean>(false);

  if (!isSMSModalOpen || !activeSMSPayload) return null;

  const fullPayloadText = generateSMSPayload(activeSMSPayload);
  const recipientNumber = activeSMSPayload.recipient || '112';

  const handleCopy = () => {
    navigator.clipboard.writeText(fullPayloadText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleReopenSMS = () => {
    dispatchNativeSMS(activeSMSPayload);
  };

  return (
    <AnimatePresence>
      <div 
        id="sms-dispatch-modal-backdrop"
        className="fixed inset-0 z-[1100] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        onClick={() => setIsSMSModalOpen(false)}
      >
        <motion.div
          id="sms-dispatch-modal-box"
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="bg-white w-full max-w-sm sm:max-w-md rounded-3xl shadow-2xl border border-amber-200 overflow-hidden my-auto text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-br from-amber-500 to-orange-600 text-white relative">
            <button
              type="button"
              onClick={() => setIsSMSModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center backdrop-blur-xs shadow-inner">
                <Smartphone size={24} className="animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-white/20 text-white tracking-wider">
                  Tier 2: Offline Dispatch
                </span>
                <h3 className="text-lg font-black text-white mt-1 leading-tight">
                  One-Tap SMS Dispatch
                </h3>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {/* Primary Action Notice Requirement */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex items-start gap-3">
              <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wide text-amber-900">
                  Opening SMS — tap Send to broadcast your emergency
                </h4>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Your device's SMS app has been pre-filled. Because internet connectivity is unavailable, you must tap <strong>Send</strong> in your messaging app to transmit your GPS beacon to emergency services.
                </p>
              </div>
            </div>

            {/* Pre-filled SMS Payload Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Pre-filled SMS to <strong className="text-gray-900 font-mono">112 (National Emergency)</strong>
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-[11px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 font-mono text-xs text-gray-800 whitespace-pre-wrap select-all leading-relaxed shadow-inner">
                {fullPayloadText}
              </div>
            </div>

            {/* Launch Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleReopenSMS}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-orange-500/25 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Send size={16} />
                <span>Re-open Native SMS App</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href="tel:112"
                  className="py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition text-center cursor-pointer"
                >
                  <PhoneCall size={13} />
                  <span>Call 112 Voice</span>
                </a>

                <button
                  type="button"
                  onClick={() => setIsSMSModalOpen(false)}
                  className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            </div>

            {/* Footer Transparency Disclaimer */}
            <div className="text-[10px] text-gray-400 text-center flex items-center justify-center gap-1">
              <ShieldAlert size={12} className="text-gray-400" />
              <span>Standard SMS carrier charges may apply if applicable.</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
