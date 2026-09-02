import React, { useState } from 'react';
import { Info, X, PhoneCall, ShieldAlert, LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext.tsx';
import { NetworkStatusIndicator } from './network/NetworkStatusIndicator.tsx';

interface HeaderProps {
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenProfile }) => {
  const [showInfo, setShowInfo] = useState(false);
  const { userProfile, signOut } = useAuth();

  const avatarUrl = userProfile?.profilePictureUrl || (userProfile?.userId ? `https://api.dicebear.com/9.x/avataaars/svg?seed=${userProfile.userId}` : null);

  return (
    <>
      <header id="main-header" className="w-full flex items-center justify-between px-4 sm:px-6 md:px-8 pt-4 sm:pt-5 pb-3 gap-2">
        {/* Left: Red exclamation badge + Emergency call title */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div 
            id="emergency-icon-badge" 
            className="w-6 h-6 sm:w-7 sm:h-7 bg-[#F0294D] rounded-full flex items-center justify-center shrink-0 shadow-xs"
          >
            <span className="text-white text-xs sm:text-sm font-bold leading-none">!</span>
          </div>
          <div>
            <h1 id="emergency-call-title" className="text-[#1A1A1A] font-bold text-sm sm:text-base uppercase tracking-wide">
              Emergency call
            </h1>
            <span className="hidden sm:inline-block text-[11px] text-gray-400 font-medium">
              National Emergency Gateway Connected
            </span>
          </div>
        </div>

        {/* Center/Right: Network Status Indicator & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Multi-State Network Indicator & Toggle */}
          <NetworkStatusIndicator />
          {/* Active User Badge on mobile */}
          {userProfile && (
            <div className="md:hidden flex items-center gap-1.5 px-2 py-1 bg-white rounded-full border border-gray-200 shadow-2xs">
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-1 text-left cursor-pointer"
                title="Open Profile"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="User Avatar"
                    className="w-5 h-5 rounded-full object-cover border border-teal-400"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
                <span className="text-[10px] font-bold text-gray-700 max-w-[65px] truncate">
                  {userProfile.authType === 'google' ? userProfile.name : (userProfile.name || 'Guest')}
                </span>
              </button>
              <button
                onClick={signOut}
                title="Sign out"
                className="text-gray-400 hover:text-red-600 ml-0.5"
              >
                <LogOut size={12} />
              </button>
            </div>
          )}

          <button
            onClick={() => setShowInfo(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-gray-50 border border-gray-200/80 text-xs font-semibold text-gray-700 shadow-2xs transition cursor-pointer"
          >
            <ShieldAlert size={14} className="text-[#F0294D]" />
            <span>National Helplines (112)</span>
          </button>

          <button
            id="info-modal-button"
            onClick={() => setShowInfo(true)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white flex items-center justify-center shadow-xs hover:shadow-md active:scale-95 text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
            aria-label="Emergency information and national helplines"
            title="Emergency Help Info"
          >
            <Info size={16} className="text-gray-400 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>
      </header>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-sm sm:max-w-md w-full p-6 sm:p-7 shadow-xl border border-gray-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2 text-gray-900 font-bold text-base sm:text-lg">
                  <ShieldAlert size={20} className="text-[#F0294D]" />
                  <span>Emergency Helplines</span>
                </div>
                <button
                  onClick={() => setShowInfo(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                  In case of direct emergency, you can also dial standard national emergency services across India:
                </p>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] sm:text-xs text-red-600 font-medium">National All-in-One</div>
                      <div className="text-base sm:text-lg font-bold text-red-900">112</div>
                    </div>
                    <PhoneCall size={18} className="text-red-500" />
                  </div>
                  <div className="p-3 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] sm:text-xs text-[#0F9D8F] font-medium">Police Control</div>
                      <div className="text-base sm:text-lg font-bold text-teal-900">100</div>
                    </div>
                    <PhoneCall size={18} className="text-[#0F9D8F]" />
                  </div>
                  <div className="p-3 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] sm:text-xs text-orange-600 font-medium">Fire & Rescue</div>
                      <div className="text-base sm:text-lg font-bold text-orange-900">101</div>
                    </div>
                    <PhoneCall size={18} className="text-orange-500" />
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] sm:text-xs text-blue-600 font-medium">Ambulance</div>
                      <div className="text-base sm:text-lg font-bold text-blue-900">108</div>
                    </div>
                    <PhoneCall size={18} className="text-blue-500" />
                  </div>
                </div>

                <p className="text-[11px] sm:text-xs text-gray-400 pt-2 text-center">
                  Trahi SOS transmits your live GPS coordinates & voice distress packet.
                </p>
              </div>

              <button
                onClick={() => setShowInfo(false)}
                className="mt-5 w-full py-3 bg-[#0F9D8F] hover:bg-[#0c8579] text-white font-semibold rounded-xl text-sm sm:text-base transition shadow-sm cursor-pointer"
              >
                Understood
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
