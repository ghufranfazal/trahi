import React, { useState } from 'react';
import { motion } from 'motion/react';

interface SOSButtonProps {
  onTriggerSOS?: () => void;
}

export const SOSButton: React.FC<SOSButtonProps> = ({ onTriggerSOS }) => {
  const [isPressed, setIsPressed] = useState(false);
  const [activatedFeedback, setActivatedFeedback] = useState(false);

  const handleClick = () => {
    setIsPressed(true);
    setActivatedFeedback(true);
    if (onTriggerSOS) {
      onTriggerSOS();
    }
    setTimeout(() => {
      setIsPressed(false);
    }, 400);
    setTimeout(() => {
      setActivatedFeedback(false);
    }, 2500);
  };

  return (
    <div id="sos-hero-section" className="w-full flex flex-col items-center justify-center text-center px-4 pt-1 sm:pt-2 pb-1">
      {/* Centered Heading */}
      <h2 id="emergency-question-title" className="text-2xl sm:text-3xl md:text-3xl font-black text-gray-900 leading-tight tracking-tight">
        Are you in emergency?
      </h2>

      {/* Subtext */}
      <p id="emergency-instruction-subtext" className="mt-2 sm:mt-2.5 text-sm sm:text-base text-gray-500 leading-relaxed px-2 max-w-[300px] sm:max-w-[380px] mx-auto font-normal">
        Click the button below to activate emergency mode, help will be here shortly.
      </p>

      {/* SOS Button Area with Concentric Radar Rings */}
      <div id="sos-interactive-container" className="relative my-6 sm:my-8 md:my-10 flex items-center justify-center">
        {/* Outermost concentric soft ring */}
        <motion.div
          animate={{
            scale: [1, 1.03, 1],
            opacity: [0.08, 0.12, 0.08],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute w-[250px] h-[250px] sm:w-[290px] sm:h-[290px] md:w-[320px] md:h-[320px] rounded-full bg-[#F0294D] pointer-events-none"
        />

        {/* Middle concentric ring */}
        <motion.div
          animate={{
            scale: [1, 1.02, 1],
            opacity: [0.18, 0.23, 0.18],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2,
          }}
          className="absolute w-[210px] h-[210px] sm:w-[245px] sm:h-[245px] md:w-[270px] md:h-[270px] rounded-full bg-[#F0294D] pointer-events-none"
        />

        {/* Core Solid Red/Pink SOS Button */}
        <motion.button
          id="main-sos-button"
          onClick={handleClick}
          whileTap={{ scale: 0.94 }}
          whileHover={{ scale: 1.03 }}
          className="relative z-10 w-38 h-38 sm:w-44 sm:h-44 md:w-48 md:h-48 rounded-full bg-[#F0294D] shadow-[0_15px_35px_rgba(240,41,77,0.4)] hover:shadow-[0_20px_45px_rgba(240,41,77,0.5)] flex items-center justify-center cursor-pointer select-none transition-transform group"
          aria-label="Activate SOS Emergency Broadcast"
        >
          <span className="text-white text-4xl sm:text-5xl font-black tracking-tighter drop-shadow-xs group-hover:scale-105 transition-transform">
            SOS
          </span>
        </motion.button>
      </div>

      {/* Visual confirmation if activated */}
      {activatedFeedback && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="text-xs sm:text-sm font-semibold text-[#F0294D] bg-red-50 border border-red-200 px-4 py-1.5 rounded-full mb-1 shadow-xs"
        >
          Emergency signal triggered (Demo Mode)
        </motion.div>
      )}
    </div>
  );
};

