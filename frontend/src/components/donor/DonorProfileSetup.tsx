import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Heart, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Check, 
  ArrowRight, 
  Sparkles,
  AlertCircle,
  Flame,
  Waves,
  Mountain,
  LifeBuoy
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { DonorProfile } from '../../types.ts';

const CAUSE_OPTIONS = [
  { id: 'Flood', label: 'Flood Relief', icon: Waves, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'Earthquake', label: 'Earthquake', icon: Mountain, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { id: 'Fire', label: 'Wildfire / Fire', icon: Flame, color: 'text-red-600 bg-red-50 border-red-200' },
  { id: 'Other Emergencies', label: 'Other Emergencies', icon: LifeBuoy, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
];

interface DonorProfileSetupProps {
  onProfileCreated: (profile: DonorProfile) => void;
}

export const DonorProfileSetup: React.FC<DonorProfileSetupProps> = ({ onProfileCreated }) => {
  const { user, userProfile, saveDonor } = useAuth();

  // Form State
  const initialName = user?.displayName || userProfile?.name || 'Verified Donor';
  const initialEmail = user?.email || (userProfile?.email && userProfile.email.includes('@') ? userProfile.email : 'donor@relief.org');

  const [name, setName] = useState<string>(initialName);
  const [email] = useState<string>(initialEmail);
  const [phone, setPhone] = useState<string>(user?.phoneNumber || userProfile?.phone || '');
  const [city, setCity] = useState<string>(userProfile?.location?.district || userProfile?.location?.block || '');
  const [state, setState] = useState<string>(userProfile?.location?.state || '');
  const [selectedCauses, setSelectedCauses] = useState<string[]>(['Flood', 'Earthquake']);
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleCause = (causeId: string) => {
    setSelectedCauses(prev => 
      prev.includes(causeId)
        ? prev.filter(c => c !== causeId)
        : [...prev, causeId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMessage("No active Google session found. Please sign in again.");
      return;
    }

    if (!name.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }

    if (!phone.trim()) {
      setErrorMessage("Phone number is required for donation audit receipts & OTP verification.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const donorData: DonorProfile = {
        userId: user.uid,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        city: city.trim(),
        state: state.trim(),
        preferredCauses: selectedCauses,
        createdAt: Date.now(),
      };

      // Save to "donors" collection
      await saveDonor(donorData);
      onProfileCreated(donorData);
    } catch (err: any) {
      console.error("Save donor profile error:", err);
      setErrorMessage(err?.message || "Failed to save donor profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="donor-profile-setup-container" className="w-full max-w-xl mx-auto px-4 py-6 sm:py-10">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl sm:rounded-[36px] p-6 sm:p-9 shadow-xl border border-gray-100/90 relative overflow-hidden"
      >
        {/* Header Badge */}
        <div className="flex items-center gap-3 pb-5 border-b border-gray-100">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0F9D8F] flex items-center justify-center shrink-0 shadow-xs">
            <Heart size={24} className="fill-[#0F9D8F]/20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Donor Profile Setup</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-[#0F9D8F]">
                Step 1 of 1
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Complete your transparent donor identity to access relief campaigns & audit ledgers.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Setup Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 sm:space-y-5">
          {/* Full Name */}
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-bold text-gray-700">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <User size={16} />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Fernandes"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50/80 border border-gray-200 focus:bg-white focus:border-[#0F9D8F] focus:ring-2 focus:ring-[#0F9D8F]/20 text-sm font-medium text-gray-900 outline-none transition"
                required
              />
            </div>
          </div>

          {/* Email (Read-only from Google) */}
          <div className="space-y-1.5 text-left">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-700">
                Email Address <span className="text-gray-400 font-normal">(Verified via Google)</span>
              </label>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <ShieldCheck size={12} />
                Verified
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Mail size={16} />
              </div>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100/90 border border-gray-200 text-sm font-medium text-gray-600 outline-none cursor-not-allowed"
              />
            </div>
          </div>

          {/* Phone Number (Required) */}
          <div className="space-y-1.5 text-left">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-700">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-gray-400">For donation receipt & 80G tax certificate</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Phone size={16} />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50/80 border border-gray-200 focus:bg-white focus:border-[#0F9D8F] focus:ring-2 focus:ring-[#0F9D8F]/20 text-sm font-medium text-gray-900 outline-none transition"
                required
              />
            </div>
          </div>

          {/* City / State (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-left">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">
                City <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <MapPin size={16} />
                </div>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Mumbai"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50/80 border border-gray-200 focus:bg-white focus:border-[#0F9D8F] focus:ring-2 focus:ring-[#0F9D8F]/20 text-sm font-medium text-gray-900 outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">
                State <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Maharashtra"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50/80 border border-gray-200 focus:bg-white focus:border-[#0F9D8F] focus:ring-2 focus:ring-[#0F9D8F]/20 text-sm font-medium text-gray-900 outline-none transition"
              />
            </div>
          </div>

          {/* Preferred Causes (Multi-Select) */}
          <div className="space-y-2 text-left pt-2">
            <label className="block text-xs font-bold text-gray-700">
              Preferred Relief Causes <span className="text-gray-400 font-normal">(Optional multi-select)</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {CAUSE_OPTIONS.map((cause) => {
                const isSelected = selectedCauses.includes(cause.id);
                const IconComponent = cause.icon;
                return (
                  <button
                    key={cause.id}
                    type="button"
                    onClick={() => toggleCause(cause.id)}
                    className={`p-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50/90 border-[#0F9D8F] text-[#0F9D8F] shadow-xs'
                        : 'bg-gray-50/70 border-gray-200 text-gray-700 hover:bg-gray-100/70'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${cause.color}`}>
                        <IconComponent size={14} />
                      </div>
                      <span className="text-xs font-bold">{cause.label}</span>
                    </div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${
                      isSelected ? 'bg-[#0F9D8F] border-[#0F9D8F] text-white' : 'border-gray-300'
                    }`}>
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              id="donor-save-profile-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 bg-[#0F9D8F] hover:bg-[#0c8579] active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-lg shadow-[#0F9D8F]/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Saving to Cloud Firestore...</span>
              ) : (
                <>
                  <span>Save & Enter Donor Portal</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
