import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Heart, 
  MapPin, 
  Battery, 
  Send, 
  Users, 
  CheckCircle2, 
  Loader2,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLocation } from '../../context/LocationContext.tsx';
import { updateUserSafetyStatus } from '../../services/firestoreService.ts';
import { SafetyCircleMember, SafetyStatus } from '../../types.ts';
import { SafetyCircleGuardModal } from './SafetyCircleGuardModal.tsx';
import { SafetyPingDispatchModal } from './SafetyPingDispatchModal.tsx';

interface FamilySafetyPingWidgetProps {
  familyMembers: SafetyCircleMember[];
  onOpenAddMember?: () => void;
  compact?: boolean;
}

export const FamilySafetyPingWidget: React.FC<FamilySafetyPingWidgetProps> = ({
  familyMembers,
  onOpenAddMember,
  compact = false,
}) => {
  const { user } = useAuth();
  const { location } = useLocation();

  const [isGuardOpen, setIsGuardOpen] = useState<boolean>(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);
  const [activeStatus, setActiveStatus] = useState<'SAFE' | 'DISTRESS'>('SAFE');
  const [batteryText, setBatteryText] = useState<string>('85% (Good)');
  const [loadingAction, setLoadingAction] = useState<'safe' | 'distress' | null>(null);

  // Capture battery percentage if supported
  const getBatteryLevel = async (): Promise<string> => {
    try {
      if ('getBattery' in navigator) {
        const battery: any = await (navigator as any).getBattery();
        const level = Math.round(battery.level * 100);
        return `${level}% (${battery.charging ? 'Charging' : 'Battery'})`;
      }
    } catch {}
    return '84% (Good)';
  };

  const handleTriggerPing = async (status: 'SAFE' | 'DISTRESS') => {
    // 1. Guard Check: Must have at least 1 family member
    if (!familyMembers || familyMembers.length === 0) {
      setIsGuardOpen(true);
      return;
    }

    setLoadingAction(status === 'SAFE' ? 'safe' : 'distress');
    setActiveStatus(status);

    const batt = await getBatteryLevel();
    setBatteryText(batt);

    const locationData = {
      latitude: location?.latitude || 28.5355,
      longitude: location?.longitude || 77.3910,
      address: location?.formattedAddress || location?.city || 'Delhi, India',
    };

    try {
      // 2. Update Firestore
      if (user?.uid) {
        await updateUserSafetyStatus(user.uid, status, locationData, batt);
      }

      setLoadingAction(null);
      // 3. Open multi-channel dispatch modal
      setIsDispatchModalOpen(true);
    } catch (err) {
      console.error('Failed to update safety status in Firestore:', err);
      setLoadingAction(null);
      setIsDispatchModalOpen(true);
    }
  };

  const locationCoords = {
    latitude: location?.latitude || 28.5355,
    longitude: location?.longitude || 77.3910,
    address: location?.formattedAddress || location?.city || 'Delhi, India',
  };

  return (
    <>
      <div className={`bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4 ${compact ? 'w-full' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#0F9D8F] flex items-center justify-center">
              <Heart size={18} className="fill-[#0F9D8F]/20" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 leading-tight">
                Family Safety Ping
              </h4>
              <p className="text-[11px] text-gray-400">
                1-tap status broadcast to your Safety Circle
              </p>
            </div>
          </div>

          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-100">
            {familyMembers.length} {familyMembers.length === 1 ? 'Contact' : 'Contacts'}
          </span>
        </div>

        {/* 1-Tap Action Buttons: "I'm Safe" and "I'm NOT Safe" */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* I'M SAFE BUTTON (EMERALD) */}
          <button
            type="button"
            onClick={() => handleTriggerPing('SAFE')}
            disabled={loadingAction !== null}
            className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 hover:from-emerald-600 hover:to-teal-800 active:scale-[0.98] text-white shadow-md shadow-emerald-500/20 transition flex items-center justify-between group cursor-pointer disabled:opacity-50"
          >
            <div className="text-left space-y-0.5">
              <span className="text-[10px] uppercase font-black tracking-wider text-emerald-100 block">
                All Clear
              </span>
              <span className="text-base font-black tracking-tight block">
                ✓ I'm Safe
              </span>
              <span className="text-[11px] text-emerald-100/90 block">
                Send GPS & status to family
              </span>
            </div>

            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-xs group-hover:scale-110 transition-transform">
              {loadingAction === 'safe' ? (
                <Loader2 size={20} className="animate-spin text-white" />
              ) : (
                <ShieldCheck size={22} className="stroke-[2.5]" />
              )}
            </div>
          </button>

          {/* I'M NOT SAFE BUTTON (RED DISTRESS) */}
          <button
            type="button"
            onClick={() => handleTriggerPing('DISTRESS')}
            disabled={loadingAction !== null}
            className="p-4 rounded-2xl bg-gradient-to-br from-[#F0294D] to-red-700 hover:from-[#d91e40] hover:to-red-800 active:scale-[0.98] text-white shadow-md shadow-red-500/20 transition flex items-center justify-between group cursor-pointer disabled:opacity-50"
          >
            <div className="text-left space-y-0.5">
              <span className="text-[10px] uppercase font-black tracking-wider text-red-100 block">
                Urgent Help
              </span>
              <span className="text-base font-black tracking-tight block">
                ⚠ I'm NOT Safe
              </span>
              <span className="text-[11px] text-red-100/90 block">
                Alert family with live coordinates
              </span>
            </div>

            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-xs group-hover:scale-110 transition-transform">
              {loadingAction === 'distress' ? (
                <Loader2 size={20} className="animate-spin text-white" />
              ) : (
                <AlertTriangle size={22} className="animate-bounce" />
              )}
            </div>
          </button>
        </div>

        {/* Telemetry info footer */}
        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
          <span className="flex items-center gap-1">
            <MapPin size={11} className="text-[#0F9D8F]" />
            {location?.city || location?.formattedAddress?.split(',')[0] || 'GPS Linked'}
          </span>
          <span className="flex items-center gap-1 font-mono">
            <Battery size={11} className="text-emerald-600" /> Auto-attached
          </span>
        </div>
      </div>

      {/* Guard Check Fallback Modal */}
      <SafetyCircleGuardModal
        isOpen={isGuardOpen}
        onClose={() => setIsGuardOpen(false)}
        onOpenAddMember={() => {
          if (onOpenAddMember) onOpenAddMember();
        }}
      />

      {/* Dispatch Modal for SMS & WhatsApp */}
      <SafetyPingDispatchModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        status={activeStatus}
        locationData={locationCoords}
        batteryLevel={batteryText}
        familyMembers={familyMembers}
      />
    </>
  );
};
