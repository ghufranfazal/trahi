import React, { useState } from 'react';
import { ShieldAlert, X, ArrowRight, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext.tsx';

interface ProfileCompletionBannerProps {
  onNavigateToProfile: () => void;
}

export const ProfileCompletionBanner: React.FC<ProfileCompletionBannerProps> = ({
  onNavigateToProfile,
}) => {
  const { userProfile } = useAuth();
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  // If profile is already completed or dismissed, do not render banner
  if (userProfile?.profileCompleted || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        id="profile-completion-banner"
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-1"
      >
        <div className="bg-gradient-to-r from-amber-500/10 via-teal-500/10 to-amber-500/5 border border-amber-300/60 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-2xs backdrop-blur-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0">
              <UserPlus size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-gray-800 leading-snug truncate sm:whitespace-normal">
                Complete your profile so responders know more about you in an emergency.
              </p>
              <p className="hidden sm:block text-[11px] text-gray-500 font-medium">
                Add optional blood group, emergency details, and location for faster dispatch.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="banner-complete-profile-btn"
              onClick={onNavigateToProfile}
              className="px-3 py-1.5 bg-[#0F9D8F] hover:bg-[#0c8579] active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <span>Complete Profile</span>
              <ArrowRight size={13} />
            </button>

            <button
              id="banner-dismiss-btn"
              onClick={() => setIsDismissed(true)}
              className="w-7 h-7 rounded-xl hover:bg-gray-200/60 text-gray-400 hover:text-gray-600 flex items-center justify-center transition cursor-pointer"
              title="Dismiss for now"
              aria-label="Dismiss banner"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
