import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  X, 
  ShieldCheck, 
  AlertCircle, 
  MapPin, 
  Droplet, 
  Calendar, 
  Loader2, 
  ShieldAlert
} from 'lucide-react';
import { UserProfile } from '../../types.ts';
import { fetchUserProfile } from '../../services/firestoreService.ts';

interface ProfileViewButtonProps {
  userId: string;
  variant?: 'default' | 'outline' | 'compact' | 'badge' | 'icon' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  customLabel?: string;
  iconOnly?: boolean;
}

export const ProfileViewButton: React.FC<ProfileViewButtonProps> = ({
  userId,
  variant = 'default',
  size = 'md',
  className = '',
  customLabel,
  iconOnly = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hasFetched, setHasFetched] = useState<boolean>(false);

  const handleOpen = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setIsOpen(true);
    if (!hasFetched) {
      setLoading(true);
      try {
        const data = await fetchUserProfile(userId);
        setProfile(data);
      } catch (err) {
        console.error("Error fetching victim profile:", err);
      } finally {
        setLoading(false);
        setHasFetched(true);
      }
    }
  };

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setIsOpen(false);
  };

  // Helper to construct anonymous label (e.g., "Anonymous User #4F2A")
  const getAnonymousLabel = (uid: string) => {
    const cleanId = (uid || 'USER').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const shortCode = cleanId.slice(0, 6) || '4F2A';
    return `Anonymous User #${shortCode}`;
  };

  // Button style variants
  const getButtonStyles = () => {
    if (variant === 'icon') {
      return 'p-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#0F9D8F] transition cursor-pointer flex items-center justify-center';
    }
    if (variant === 'compact') {
      return 'px-2.5 py-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer';
    }
    if (variant === 'badge') {
      return 'px-2 py-0.5 rounded-full bg-teal-50 hover:bg-teal-100 text-[#0F9D8F] text-[10px] font-extrabold transition flex items-center gap-1 cursor-pointer border border-teal-200/60';
    }
    if (variant === 'outline') {
      return 'px-3 py-1.5 rounded-xl border border-gray-200 hover:border-[#0F9D8F] bg-white text-gray-700 hover:text-[#0F9D8F] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs';
    }
    if (variant === 'primary') {
      return 'px-3.5 py-2 rounded-xl bg-[#0F9D8F] hover:bg-[#0c8579] text-white text-xs font-black shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer';
    }
    // Default style
    return 'px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#0F9D8F] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-teal-100';
  };

  const isProfileComplete = Boolean(profile?.profileCompleted);
  const displayName = isProfileComplete && profile?.name ? profile.name : getAnonymousLabel(userId);
  const avatarUrl = profile?.profilePictureUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${userId}`;

  // Formatted location string from user profile
  const profileLocationStr = profile?.location?.district || profile?.location?.state
    ? [profile.location.district, profile.location.state].filter(Boolean).join(', ')
    : 'Not provided';

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleOpen}
        className={`${getButtonStyles()} ${className}`}
        title="View victim profile information"
      >
        <User size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14} className="shrink-0" />
        {!iconOnly && (
          <span>{customLabel || 'View Profile'}</span>
        )}
      </button>

      {/* Profile Inspection Modal / Bottom Sheet */}
      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
            onClick={handleClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 overflow-hidden text-left my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#0F9D8F] to-teal-800 p-5 text-white relative">
                <button
                  type="button"
                  onClick={handleClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X size={18} />
                </button>

                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-white/20 text-white tracking-wider">
                    Victim Profile Details
                  </span>
                </div>
                <h3 className="text-lg font-black text-white">
                  SOS Reporter Telemetry
                </h3>
                <p className="text-xs text-white/80 mt-0.5 font-mono">
                  ID: {userId.slice(0, 16)}...
                </p>
              </div>

              {/* Modal Content Body */}
              <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {loading ? (
                  <div className="py-12 text-center space-y-3">
                    <Loader2 size={28} className="animate-spin text-[#0F9D8F] mx-auto" />
                    <p className="text-xs font-bold text-gray-500">Fetching profile from Firestore...</p>
                  </div>
                ) : !profile ? (
                  /* Edge Case: User Profile document does not exist at all */
                  <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                      <AlertCircle size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-amber-900">
                        No User Profile Created
                      </h4>
                      <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                        This user has not created a profile.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-amber-200/60 font-mono text-xs font-bold text-amber-900">
                      Anonymous SOS ID: <span className="bg-amber-100 px-2 py-0.5 rounded">{userId}</span>
                    </div>
                  </div>
                ) : (
                  /* Normal Profile Card Display */
                  <>
                    {/* User Header Info */}
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                      <div className="w-16 h-16 rounded-2xl border-2 border-[#0F9D8F] overflow-hidden bg-white shadow-sm shrink-0">
                        <img
                          src={avatarUrl}
                          alt="Victim Avatar"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-black text-gray-900 truncate">
                          {displayName}
                        </h4>

                        {/* Status Note Badge */}
                        <div className="mt-1">
                          {isProfileComplete ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <ShieldCheck size={11} className="text-emerald-600" />
                              Profile completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200">
                              <AlertCircle size={11} className="text-amber-600" />
                              Anonymous — limited information available
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Vitals Grid: Age, Gender, Blood Group */}
                    <div className="grid grid-cols-3 gap-2.5">
                      {/* Age */}
                      <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                        <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider flex items-center justify-center gap-1">
                          <Calendar size={11} /> Age
                        </span>
                        <span className={`text-sm font-black mt-0.5 block ${profile.age ? 'text-gray-900' : 'text-gray-400 italic font-normal text-xs'}`}>
                          {profile.age || 'Not provided'}
                        </span>
                      </div>

                      {/* Gender */}
                      <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                        <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider flex items-center justify-center gap-1">
                          <User size={11} /> Gender
                        </span>
                        <span className={`text-sm font-black mt-0.5 block ${profile.gender ? 'text-gray-900' : 'text-gray-400 italic font-normal text-xs'}`}>
                          {profile.gender || 'Not provided'}
                        </span>
                      </div>

                      {/* Blood Group */}
                      <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-100 text-center">
                        <span className="text-[10px] font-bold text-rose-600 block uppercase tracking-wider flex items-center justify-center gap-1">
                          <Droplet size={11} /> Blood
                        </span>
                        <span className={`text-sm font-black mt-0.5 block ${profile.bloodGroup ? 'text-rose-700' : 'text-gray-400 italic font-normal text-xs'}`}>
                          {profile.bloodGroup || 'Not provided'}
                        </span>
                      </div>
                    </div>

                    {/* Registered Profile Location */}
                    <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <MapPin size={12} className="text-[#0F9D8F]" /> Profile Registered Location
                      </span>
                      <p className="text-xs font-bold text-gray-800">
                        {profileLocationStr}
                      </p>
                      <span className="text-[10px] text-gray-400 block font-normal italic">
                        Note: Home region from profile (live SOS GPS location is recorded separately on the beacon).
                      </span>
                    </div>

                    {/* Note Box */}
                    <div className="p-3 rounded-2xl bg-teal-50/60 border border-teal-100 flex items-start gap-2 text-xs text-teal-950">
                      <ShieldAlert size={15} className="text-[#0F9D8F] shrink-0 mt-0.5" />
                      <p className="leading-tight text-[11px]">
                        Emergency responders can reference these profile attributes for medical triage and family notification.
                      </p>
                    </div>
                  </>
                )}

                {/* Dismiss Button */}
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-xs rounded-xl transition cursor-pointer mt-2"
                >
                  Close Profile View
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
