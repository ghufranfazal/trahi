import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface GoogleDonorLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const GoogleDonorLoginModal: React.FC<GoogleDonorLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { signInWithGoogle, signInAsDonorFallback, authError, clearAuthError } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [guestName, setGuestName] = useState<string>('');

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    clearAuthError();
    const user = await signInWithGoogle();
    setLoading(false);
    if (user) {
      onSuccess();
      onClose();
    }
  };

  const handleFallbackSignIn = async () => {
    setLoading(true);
    clearAuthError();
    const user = await signInAsDonorFallback(guestName || 'Verified Donor');
    setLoading(false);
    if (user) {
      onSuccess();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div 
        id="google-donor-login-modal-backdrop"
        className="fixed inset-0 z-[1050] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          id="google-donor-login-modal-box"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="bg-white w-full max-w-sm sm:max-w-md rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-auto text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-br from-teal-500 to-[#0F9D8F] text-white relative text-center">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center mx-auto mb-3 backdrop-blur-xs">
              <Heart size={28} className="fill-white/30" />
            </div>

            <h3 className="text-xl font-black text-white">Donor Verification</h3>
            <p className="text-xs text-white/80 mt-1 max-w-xs mx-auto">
              Please connect your account to track your donation with real-time geotagged field utilization audits.
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {authError && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p>{authError}</p>
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-gray-50 text-gray-800 font-extrabold text-sm border-2 border-gray-200 hover:border-gray-300 shadow-sm transition flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-[#0F9D8F]" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>

            <div className="relative my-3 flex items-center justify-center">
              <div className="border-t border-gray-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider absolute">
                or instant donor mode
              </span>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                placeholder="Enter your name (e.g. Rahul Sharma)"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-[#0F9D8F]/30 focus:border-[#0F9D8F] outline-none"
              />

              <button
                type="button"
                onClick={handleFallbackSignIn}
                disabled={loading}
                className="w-full py-2.5 bg-[#0F9D8F] hover:bg-[#0c8579] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>Continue as Verified Donor</span>
              </button>
            </div>

            <div className="pt-2 text-[10px] text-gray-400 text-center flex items-center justify-center gap-1.5">
              <ShieldCheck size={13} className="text-emerald-600" />
              <span>Encrypted Firebase Authentication</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
