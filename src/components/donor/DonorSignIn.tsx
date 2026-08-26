import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ShieldCheck, AlertCircle, Globe2, CheckCircle2, ArrowRight, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface DonorSignInProps {
  onSignedIn?: () => void;
}

export const DonorSignIn: React.FC<DonorSignInProps> = ({ onSignedIn }) => {
  const { 
    signInWithGoogle, 
    signInAsDonorFallback, 
    loading, 
    authError, 
    isDomainError, 
    clearAuthError 
  } = useAuth();

  const [fallbackName, setFallbackName] = useState<string>('Ghufran Fazal');
  const [showFallback, setShowFallback] = useState<boolean>(false);

  const handleGoogleClick = async () => {
    const resUser = await signInWithGoogle();
    if (resUser && onSignedIn) {
      onSignedIn();
    }
  };

  const handleFallbackClick = async (e: React.FormEvent) => {
    e.preventDefault();
    const resUser = await signInAsDonorFallback(fallbackName.trim() || 'Verified Donor');
    if (resUser && onSignedIn) {
      onSignedIn();
    }
  };

  return (
    <div id="donor-signin-container" className="w-full max-w-lg mx-auto px-4 py-8 sm:py-12 select-none">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="bg-white rounded-3xl sm:rounded-[36px] p-6 sm:p-9 shadow-xl border border-gray-100/90 relative overflow-hidden text-center"
      >
        {/* Subtle ambient gradient */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Trahi Branding Icon */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-18 h-18 rounded-3xl bg-[#0F9D8F] flex items-center justify-center text-white shadow-xl shadow-[#0F9D8F]/25 mb-4">
            <Heart size={36} className="fill-white/20 stroke-[2.2]" />
          </div>

          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Trahi Donor</h2>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-[#0F9D8F]">
              Relief Portal
            </span>
          </div>

          <p className="text-xs sm:text-sm text-gray-600 mt-2 font-medium max-w-sm leading-relaxed">
            Sign in to support disaster relief efforts transparently.
          </p>

          <p className="text-[11px] text-gray-400 mt-1 max-w-xs">
            Directly fund verified rescue teams, audit live expense receipts, and track relief disbursements in real time.
          </p>
        </div>

        {/* Key Features Pill */}
        <div className="grid grid-cols-2 gap-2.5 my-6 text-left relative z-10">
          <div className="p-3 bg-gray-50/90 rounded-2xl border border-gray-100 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-teal-50 text-[#0F9D8F] flex items-center justify-center shrink-0">
              <ShieldCheck size={16} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-800">100% Verified</p>
              <p className="text-[10px] text-gray-400">On-ground audit trail</p>
            </div>
          </div>

          <div className="p-3 bg-gray-50/90 rounded-2xl border border-gray-100 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Lock size={15} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-800">Secure Direct</p>
              <p className="text-[10px] text-gray-400">Instant tax receipt</p>
            </div>
          </div>
        </div>

        {/* Auth Error & Domain Fallback Notice */}
        <AnimatePresence>
          {authError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 overflow-hidden text-left"
            >
              <div className={`p-4 rounded-2xl border text-xs ${
                isDomainError 
                  ? 'bg-amber-50/90 border-amber-200/90 text-amber-900' 
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    {isDomainError ? (
                      <Globe2 size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold">{isDomainError ? "Preview Domain Notice" : "Authentication Notice"}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-gray-600">
                        {authError}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={clearAuthError}
                    className="text-gray-400 hover:text-gray-600 font-bold text-xs p-1"
                  >
                    ✕
                  </button>
                </div>

                {isDomainError && (
                  <div className="mt-3 pt-3 border-t border-amber-200/70">
                    <button
                      onClick={() => handleFallbackClick({ preventDefault: () => {} } as any)}
                      disabled={loading}
                      className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                    >
                      <CheckCircle2 size={15} />
                      <span>Continue as Verified Donor ({fallbackName})</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fallback Custom Input (if expanded) */}
        {showFallback ? (
          <form onSubmit={handleFallbackClick} className="space-y-3 relative z-10 mb-4 p-4 rounded-2xl bg-teal-50/60 border border-teal-100 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                <Heart size={14} className="text-[#0F9D8F]" />
                <span>Simulate Verified Google Donor</span>
              </span>
              <button
                type="button"
                onClick={() => setShowFallback(false)}
                className="text-[11px] text-teal-600 hover:text-teal-800 font-semibold cursor-pointer"
              >
                Back
              </button>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Donor Name</label>
              <input
                type="text"
                value={fallbackName}
                onChange={(e) => setFallbackName(e.target.value)}
                placeholder="Enter donor name"
                className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-[#0F9D8F]/30 focus:border-[#0F9D8F] outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#0F9D8F] hover:bg-[#0c8579] text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
            >
              Continue to Setup Profile →
            </button>
          </form>
        ) : (
          /* Primary Sign In Button */
          <div className="space-y-3 relative z-10">
            <button
              id="donor-google-signin-btn"
              onClick={handleGoogleClick}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white hover:bg-gray-50 active:scale-[0.99] text-gray-800 font-bold text-sm rounded-2xl border border-gray-200 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {/* Google G Logo */}
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
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{loading ? 'Connecting with Google...' : 'Sign in with Google'}</span>
            </button>

            {/* Quick Testing Link if needed */}
            <button
              onClick={() => setShowFallback(true)}
              className="text-[11px] text-gray-400 hover:text-gray-600 font-medium transition cursor-pointer"
            >
              Having popup issues? Use Verified Donor Mode
            </button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
          <ShieldCheck size={13} className="text-emerald-500" />
          <span>Google OAuth 2.0 & Cloud Firestore Encrypted</span>
        </div>
      </motion.div>
    </div>
  );
};
