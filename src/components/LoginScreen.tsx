import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Siren, Shield, Heart, Zap, UserCheck, AlertCircle, ArrowRight, CheckCircle2, User, Globe2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export const LoginScreen: React.FC = () => {
  const { signInWithGoogle, signInAsGuest, signInAsDonorFallback, loading, authError, isDomainError, clearAuthError } = useAuth();
  const [donorNameInput, setDonorNameInput] = useState<string>('Ghufran Fazal');
  const [showDonorInput, setShowDonorInput] = useState<boolean>(false);

  const handleCustomDonorSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    signInAsDonorFallback(donorNameInput.trim() || 'Verified Donor');
  };

  return (
    <div className="min-h-screen w-full bg-[#F7F7F8] flex items-center justify-center p-4 sm:p-6 md:p-10 select-none">
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md bg-white rounded-3xl sm:rounded-[36px] p-6 sm:p-9 shadow-2xl border border-gray-100/90 relative overflow-hidden"
      >
        {/* Decorative ambient top glow */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-[#0F9D8F]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -top-20 -left-20 w-44 h-44 bg-[#F0294D]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Brand Icon & Heading */}
        <div className="flex flex-col items-center text-center relative z-10">
          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-3xl bg-[#0F9D8F] flex items-center justify-center text-white shadow-xl shadow-[#0F9D8F]/25 mb-4">
            <Siren size={36} className="stroke-[2.2]" />
          </div>

          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Trahi</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-[#F0294D]">
              SOS
            </span>
          </div>

          <p className="text-xs sm:text-sm text-gray-500 mt-1.5 max-w-xs font-medium">
            Emergency Distress Network & Verified Disaster Relief Fund
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 gap-2.5 my-6 relative z-10">
          <div className="p-3 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-50 text-[#F0294D] flex items-center justify-center shrink-0">
              <Zap size={16} />
            </div>
            <div className="text-left">
              <p className="text-[11px] font-bold text-gray-900 leading-tight">Instant SOS</p>
              <p className="text-[10px] text-gray-400">Anonymous 1-Tap</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#0F9D8F] flex items-center justify-center shrink-0">
              <Heart size={16} />
            </div>
            <div className="text-left">
              <p className="text-[11px] font-bold text-gray-900 leading-tight">Donor Ledger</p>
              <p className="text-[10px] text-gray-400">Track Relief Proof</p>
            </div>
          </div>
        </div>

        {/* Error Alert with Smart Domain Fallback */}
        <AnimatePresence>
          {authError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 overflow-hidden"
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
                      <p className="font-bold">{isDomainError ? "Firebase Preview Domain Notice" : "Authentication Notice"}</p>
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
                      onClick={() => signInAsDonorFallback(donorNameInput || 'Ghufran Fazal')}
                      disabled={loading}
                      className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                    >
                      <CheckCircle2 size={15} />
                      <span>Continue as Verified Donor ({donorNameInput || 'Ghufran Fazal'})</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Custom Donor Name Expansion */}
        {showDonorInput ? (
          <form onSubmit={handleCustomDonorSignIn} className="space-y-3 relative z-10 mb-4 p-4 rounded-2xl bg-teal-50/60 border border-teal-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                <Heart size={14} className="text-[#0F9D8F]" />
                <span>Verified Donor Profile</span>
              </span>
              <button
                type="button"
                onClick={() => setShowDonorInput(false)}
                className="text-[11px] text-teal-600 hover:text-teal-800 font-semibold"
              >
                Back
              </button>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Donor Name</label>
              <input
                type="text"
                value={donorNameInput}
                onChange={(e) => setDonorNameInput(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-[#0F9D8F]/30 focus:border-[#0F9D8F] outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#0F9D8F] hover:bg-[#0c8579] text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
            >
              Enter as Verified Donor →
            </button>
          </form>
        ) : (
          /* Main Sign In Buttons */
          <div className="space-y-3 relative z-10">
            {/* 1. Google Sign-In (For Donors & Verified Users) */}
            <button
              id="google-signin-btn"
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white hover:bg-gray-50 text-gray-800 font-bold text-sm rounded-2xl border border-gray-200 shadow-sm active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
            >
              {/* Google G Logo SVG */}
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
              <span>Sign in with Google</span>
            </button>

            {/* Quick Donor Access button */}
            <button
              id="donor-quick-signin-btn"
              onClick={() => setShowDonorInput(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-teal-50/80 hover:bg-teal-100/80 text-[#0F9D8F] font-bold text-xs rounded-2xl border border-teal-200/80 transition-all cursor-pointer"
            >
              <Heart size={14} className="fill-[#0F9D8F]/20" />
              <span>Or Continue with Donor Profile ({donorNameInput})</span>
            </button>

            {/* Divider */}
            <div className="flex items-center my-3 text-xs text-gray-400">
              <div className="flex-1 border-t border-gray-200" />
              <span className="px-3 font-semibold uppercase tracking-wider text-[10px]">
                Or In Emergency
              </span>
              <div className="flex-1 border-t border-gray-200" />
            </div>

            {/* 2. Anonymous / Guest Access (No Signup Barrier for SOS victims) */}
            <button
              id="guest-signin-btn"
              onClick={signInAsGuest}
              disabled={loading}
              className="w-full flex items-center justify-between py-3.5 px-5 bg-[#0F9D8F] hover:bg-[#0c8579] text-white font-bold text-sm rounded-2xl shadow-lg shadow-[#0F9D8F]/25 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 group"
            >
              <div className="flex items-center gap-2.5">
                <UserCheck size={18} />
                <span>Continue as Guest (Instant SOS)</span>
              </div>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* Security & Privacy Notice */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
          <Shield size={12} className="text-emerald-500" />
          <span>Cloud Firestore & Firebase Auth Secured</span>
        </div>
      </motion.div>
    </div>
  );
};
