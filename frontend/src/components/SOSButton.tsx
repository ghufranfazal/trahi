import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, Mic, AlertTriangle, ShieldAlert, Cloud, MessageSquare, Smartphone, Zap } from 'lucide-react';
import { triggerHapticFeedback, SOSSubmissionResult } from '../services/sosSubmissionService.ts';
import { SOSFlowModal } from './sos/SOSFlowModal.tsx';
import { useNetwork } from '../context/NetworkContext.tsx';
import { useLocation } from '../context/LocationContext.tsx';

interface SOSButtonProps {
  onTriggerSOS?: () => void;
  onSOSSuccess?: (result: SOSSubmissionResult) => void;
}

export const SOSButton: React.FC<SOSButtonProps> = ({ onTriggerSOS, onSOSSuccess }) => {
  const { networkMode, dispatchNativeSMS, setIsMeshModalOpen } = useNetwork();
  const { location } = useLocation();

  // Hold state
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [holdProgress, setHoldProgress] = useState<number>(0); // 0 to 100%
  const [showModal, setShowModal] = useState<boolean>(false);
  const [holdHint, setHoldHint] = useState<string | null>(null);

  const holdTimerRef = useRef<any>(null);
  const holdStartTimestamp = useRef<number>(0);
  const HOLD_DURATION = 2000; // 2 seconds threshold

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    };
  }, []);

  const handleTriggerActivated = () => {
    // 1. Trigger Haptic Vibration & Audio Cue
    triggerHapticFeedback();

    if (onTriggerSOS) {
      onTriggerSOS();
    }

    // 2. Dispatch based on active network tier
    if (networkMode === 'mesh') {
      setIsMeshModalOpen(true);
    } else if (networkMode === 'sms') {
      dispatchNativeSMS({
        category: 'Emergency SOS Broadcast',
        latitude: location?.latitude,
        longitude: location?.longitude,
        address: location?.formattedAddress,
        transcript: 'Emergency SOS beacon triggered. Immediate rescue required.',
      });
    } else {
      // Tier 1: Online Cloud flow
      setShowModal(true);
    }
  };

  const handlePointerDown = (e: React.PointerEvent | React.TouchEvent | React.MouseEvent) => {
    // Prevent context menu or dragging
    setIsHolding(true);
    setHoldProgress(0);
    setHoldHint(null);
    holdStartTimestamp.current = Date.now();

    if (holdTimerRef.current) clearInterval(holdTimerRef.current);

    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartTimestamp.current;
      const progress = Math.min(100, (elapsed / HOLD_DURATION) * 100);
      setHoldProgress(progress);

      if (progress >= 100) {
        clearInterval(holdTimerRef.current);
        holdTimerRef.current = null;
        setIsHolding(false);
        setHoldProgress(0);

        handleTriggerActivated();
      }
    }, 25);
  };

  const handlePointerUp = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    if (isHolding) {
      const elapsed = Date.now() - holdStartTimestamp.current;
      setIsHolding(false);
      setHoldProgress(0);

      // If user released quickly (<2s), show helpful guidance
      if (elapsed < HOLD_DURATION) {
        setHoldHint("Press & hold for 2s to activate Emergency Broadcast");
        setTimeout(() => setHoldHint(null), 3000);
      }
    }
  };

  // Allow clicking as a fallback with quick tap trigger option
  const handleQuickActivate = () => {
    handleTriggerActivated();
  };

  // SVG circular radius calculation for 2s progress stroke
  const size = 200; // responsive diameter
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (holdProgress / 100) * circumference;

  return (
    <div id="sos-hero-section" className="w-full flex flex-col items-center justify-center text-center px-4 pt-1 sm:pt-2 pb-1">
      {/* Centered Heading */}
      <h2 id="emergency-question-title" className="text-2xl sm:text-3xl md:text-3xl font-black text-gray-900 leading-tight tracking-tight">
        Are you in emergency?
      </h2>

      {/* Subtext */}
      <p id="emergency-instruction-subtext" className="mt-2 sm:mt-2.5 text-xs sm:text-sm text-gray-500 leading-relaxed px-2 max-w-[320px] sm:max-w-[400px] mx-auto font-normal">
        Press & hold the SOS button for <strong className="font-bold text-gray-800">2 seconds</strong> to record your voice distress signal.
      </p>

      {/* SOS Button Area with Concentric Radar Rings & Hold Progress Ring */}
      <div 
        id="sos-interactive-container" 
        className="relative my-6 sm:my-8 md:my-9 flex items-center justify-center touch-none select-none"
      >
        {/* Outermost concentric soft ring */}
        <motion.div
          animate={{
            scale: isHolding ? [1.1, 1.25, 1.1] : [1, 1.04, 1],
            opacity: isHolding ? [0.25, 0.35, 0.25] : [0.08, 0.14, 0.08],
          }}
          transition={{
            duration: isHolding ? 0.8 : 2.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute w-[260px] h-[260px] sm:w-[300px] sm:h-[300px] md:w-[330px] md:h-[330px] rounded-full bg-[#F0294D] pointer-events-none"
        />

        {/* Middle concentric ring */}
        <motion.div
          animate={{
            scale: isHolding ? [1.05, 1.15, 1.05] : [1, 1.03, 1],
            opacity: isHolding ? [0.35, 0.5, 0.35] : [0.16, 0.22, 0.16],
          }}
          transition={{
            duration: isHolding ? 0.6 : 2.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.15,
          }}
          className="absolute w-[220px] h-[220px] sm:w-[255px] sm:h-[255px] md:w-[280px] md:h-[280px] rounded-full bg-[#F0294D] pointer-events-none"
        />

        {/* SVG Circular Hold Progress Border Ring */}
        <svg
          className="absolute w-[185px] h-[185px] sm:w-[215px] sm:h-[215px] md:w-[230px] md:h-[230px] pointer-events-none -rotate-90 z-20"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(240, 41, 77, 0.2)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Active progress fill stroke */}
          {isHolding && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#ffffff"
              strokeWidth={strokeWidth + 1}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-75 ease-linear shadow-lg"
            />
          )}
        </svg>

        {/* Core Solid Red/Pink SOS Button */}
        <motion.button
          id="main-sos-button"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchEnd={handlePointerUp}
          onTouchCancel={handlePointerUp}
          onMouseDown={handlePointerDown}
          onMouseUp={handlePointerUp}
          whileTap={{ scale: 0.93 }}
          whileHover={{ scale: 1.02 }}
          animate={{
            scale: isHolding ? 0.94 : 1,
            boxShadow: isHolding
              ? '0 0 45px rgba(240, 41, 77, 0.85)'
              : '0 15px 35px rgba(240, 41, 77, 0.4)',
          }}
          className="relative z-10 w-40 h-40 sm:w-46 sm:h-46 md:w-48 md:h-48 rounded-full bg-gradient-to-tr from-[#e0193d] to-[#F0294D] flex flex-col items-center justify-center cursor-pointer select-none transition-transform group shadow-2xl border-4 border-white/20 active:border-white/40"
          aria-label="Press and hold 2 seconds to activate SOS Emergency Broadcast"
        >
          <span className="text-white text-4xl sm:text-5xl font-black tracking-tighter drop-shadow-md group-hover:scale-105 transition-transform">
            SOS
          </span>
          <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-white/90 mt-1 flex items-center gap-1">
            <Mic size={11} className={isHolding ? "animate-bounce" : ""} />
            {isHolding ? `${Math.round(holdProgress)}% HOLD` : 'HOLD 2s'}
          </span>
        </motion.button>
      </div>

      {/* Helper instruction or short-press alert hint */}
      <AnimatePresence>
        {holdHint && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-4 py-2 rounded-2xl mb-2 shadow-xs max-w-xs mx-auto"
          >
            {holdHint}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Tap fallback link & Transmission Mode Pill */}
      <div className="mt-1 flex flex-col items-center gap-2">
        <button
          onClick={handleQuickActivate}
          className="text-xs font-bold text-gray-500 hover:text-[#F0294D] transition cursor-pointer underline decoration-dotted"
        >
          {networkMode === 'mesh' 
            ? 'Tap to launch BLE Mesh Vision Demo →' 
            : networkMode === 'sms'
            ? 'Tap to trigger 1-tap SMS dispatch →'
            : 'Or tap here to start voice SOS immediately →'}
        </button>

        {/* Transmission Channel Status */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-gray-100/90 text-gray-600 border border-gray-200">
          <span className="text-gray-400 font-medium">Channel:</span>
          {networkMode === 'online' ? (
            <span className="text-emerald-700 flex items-center gap-1">
              <Cloud size={12} /> Tier 1: Cloud Active (Firestore)
            </span>
          ) : networkMode === 'sms' ? (
            <span className="text-amber-700 flex items-center gap-1">
              <Smartphone size={12} /> Tier 2: 1-Tap SMS (112)
            </span>
          ) : (
            <span className="text-purple-700 flex items-center gap-1">
              <Zap size={12} /> Tier 3: BLE Mesh Simulation
            </span>
          )}
        </div>
      </div>

      {/* Full SOS Flow Modal (Recording -> 3s Cancel -> Broadcast -> Success) */}
      <SOSFlowModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSOSSuccess={onSOSSuccess}
      />
    </div>
  );
};
