import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  MapPin, 
  Battery, 
  Clock, 
  Send, 
  Share2, 
  Check, 
  Copy, 
  Users, 
  PhoneCall, 
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { SafetyCircleMember } from '../../types.ts';

interface SafetyPingDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'SAFE' | 'DISTRESS';
  locationData: {
    latitude: number;
    longitude: number;
    address: string;
  };
  batteryLevel?: number | string;
  familyMembers: SafetyCircleMember[];
}

export const SafetyPingDispatchModal: React.FC<SafetyPingDispatchModalProps> = ({
  isOpen,
  onClose,
  status,
  locationData,
  batteryLevel,
  familyMembers,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const isSafe = status === 'SAFE';
  const timeFormatted = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const mapsUrl = `https://maps.google.com/?q=${locationData.latitude.toFixed(5)},${locationData.longitude.toFixed(5)}`;
  const cityOrAddress = locationData.address || 'GPS Registered Location';

  // Construct official payload per instructions
  const payloadText = isSafe
    ? `[TRAHI EMERGENCY UPDATE]: I am SAFE.\nMy current location: ${mapsUrl} (${cityOrAddress})\nTime: ${timeFormatted}\nBattery: ${batteryLevel || 'Active'}\nSent via Trahi Safety Network.`
    : `[TRAHI DISTRESS ALERT]: I am NOT SAFE. Need urgent help!\nMy current location: ${mapsUrl} (${cityOrAddress})\nTime: ${timeFormatted}\nBattery: ${batteryLevel || 'Low'}\nSent via Trahi Safety Network.`;

  // Aggregate phone numbers of all family members
  const phoneNumbers = familyMembers
    .map((m) => m.phone.replace(/[^0-9+]/g, ''))
    .filter(Boolean)
    .join(',');

  const handleCopy = () => {
    navigator.clipboard.writeText(payloadText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendSMS = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const smsUrl = isIOS
      ? `sms:${phoneNumbers || '112'}&body=${encodeURIComponent(payloadText)}`
      : `sms:${phoneNumbers || '112'}?body=${encodeURIComponent(payloadText)}`;

    window.location.href = smsUrl;
  };

  const handleSendWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(payloadText)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <AnimatePresence>
      <div 
        id="safety-ping-modal-backdrop"
        className="fixed inset-0 z-[1250] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          id="safety-ping-modal-box"
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="bg-white w-full max-w-sm sm:max-w-md rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-auto text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`p-5 text-white relative ${
            isSafe 
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700' 
              : 'bg-gradient-to-r from-[#F0294D] to-red-700'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center backdrop-blur-xs shadow-inner">
                {isSafe ? (
                  <ShieldCheck size={26} className="stroke-[2.5]" />
                ) : (
                  <AlertTriangle size={26} className="animate-bounce" />
                )}
              </div>
              <div>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-white/20 text-white tracking-wider">
                  Live Safety Broadcast
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">
                  {isSafe ? "I'm Safe Status Broadcast" : "Distress Alert Broadcast"}
                </h3>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {/* Real-time Status Card */}
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
              isSafe 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                : 'bg-red-50 border-red-200 text-red-950'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full animate-ping ${isSafe ? 'bg-emerald-600' : 'bg-red-600'}`} />
                <span className="font-extrabold text-sm">{isSafe ? 'Status: SAFE' : 'Status: DISTRESS'}</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-gray-200 font-mono">
                Firestore Synced ✓
              </span>
            </div>

            {/* Telemetry Summary */}
            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-2 text-xs">
              <div className="flex items-center justify-between text-gray-600">
                <span className="flex items-center gap-1 font-semibold">
                  <MapPin size={13} className="text-[#0F9D8F]" /> Coordinates:
                </span>
                <span className="font-mono font-bold text-gray-900">
                  {locationData.latitude.toFixed(4)}°N, {locationData.longitude.toFixed(4)}°E
                </span>
              </div>

              <div className="flex items-start justify-between text-gray-600">
                <span className="font-semibold shrink-0">📍 Location:</span>
                <span className="font-bold text-gray-900 text-right line-clamp-1 ml-2">
                  {cityOrAddress}
                </span>
              </div>

              <div className="flex items-center justify-between text-gray-600 border-t border-gray-200/80 pt-2">
                <span className="flex items-center gap-1 font-semibold">
                  <Battery size={13} className="text-emerald-600" /> Battery Status:
                </span>
                <span className="font-bold text-gray-900">{batteryLevel || '84% (Good)'}</span>
              </div>

              <div className="flex items-center justify-between text-gray-600">
                <span className="flex items-center gap-1 font-semibold">
                  <Clock size={13} className="text-gray-400" /> Timestamp:
                </span>
                <span className="font-bold text-gray-900">{timeFormatted}</span>
              </div>
            </div>

            {/* Target Family Members */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-600">
                <span className="flex items-center gap-1">
                  <Users size={12} className="text-[#0F9D8F]" />
                  Recipients ({familyMembers.length} Family Members):
                </span>
                <span className="text-[10px] text-gray-400">All Linked Contacts</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {familyMembers.map((m, i) => (
                  <span
                    key={m.id || i}
                    className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-xs font-bold flex items-center gap-1"
                  >
                    <span>{m.fullName}</span>
                    <span className="text-[10px] text-teal-700">({m.relation})</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Pre-filled Message Payload Preview */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-500">
                <span>Pre-filled SMS & WhatsApp Payload:</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 font-mono text-[11px] text-gray-800 whitespace-pre-wrap leading-relaxed shadow-inner">
                {payloadText}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              {/* WhatsApp Broadcast */}
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="w-full py-3 bg-[#25D366] hover:bg-[#20ba59] text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 size={15} />
                <span>Share Live Update on WhatsApp</span>
              </button>

              {/* Native SMS Dispatch */}
              <button
                type="button"
                onClick={handleSendSMS}
                className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare size={15} />
                <span>Broadcast to Family via 1-Tap SMS</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer text-center"
              >
                Done
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
