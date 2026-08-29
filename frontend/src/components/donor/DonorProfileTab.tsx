import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Heart, 
  Edit3, 
  Save, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  LogOut,
  Calendar,
  Waves,
  Mountain,
  Flame,
  LifeBuoy,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { DonorProfile } from '../../types.ts';

const CAUSE_OPTIONS = [
  { id: 'Flood', label: 'Flood Relief', icon: Waves, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'Earthquake', label: 'Earthquake', icon: Mountain, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { id: 'Fire', label: 'Wildfire / Fire', icon: Flame, color: 'text-red-600 bg-red-50 border-red-200' },
  { id: 'Other Emergencies', label: 'Other Emergencies', icon: LifeBuoy, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
];

interface DonorProfileTabProps {
  onBackToTrahi: () => void;
}

export const DonorProfileTab: React.FC<DonorProfileTabProps> = ({ onBackToTrahi }) => {
  const { donorProfile, saveDonor, signOut, user } = useAuth();

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [preferredCauses, setPreferredCauses] = useState<string[]>([]);
  
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state when donorProfile changes
  useEffect(() => {
    if (donorProfile) {
      setName(donorProfile.name || '');
      setPhone(donorProfile.phone || '');
      setCity(donorProfile.city || '');
      setState(donorProfile.state || '');
      setPreferredCauses(donorProfile.preferredCauses || []);
    }
  }, [donorProfile]);

  const toggleCause = (causeId: string) => {
    setPreferredCauses(prev => 
      prev.includes(causeId) ? prev.filter(c => c !== causeId) : [...prev, causeId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !donorProfile) return;

    if (!name.trim()) {
      setErrorMessage("Name cannot be empty.");
      return;
    }
    if (!phone.trim()) {
      setErrorMessage("Phone number is required.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const updated: DonorProfile = {
        ...donorProfile,
        name: name.trim(),
        phone: phone.trim(),
        city: city.trim(),
        state: state.trim(),
        preferredCauses: preferredCauses,
        updatedAt: Date.now(),
      };

      await saveDonor(updated);
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error("Update donor profile error:", err);
      setErrorMessage(err?.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const avatarUrl = user?.uid 
    ? `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.uid}` 
    : 'https://api.dicebear.com/9.x/avataaars/svg?seed=donor_profile';

  return (
    <div id="donor-profile-tab" className="w-full max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
        {/* Avatar Display */}
        <div className="relative shrink-0">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-teal-50/70 border-2 border-[#0F9D8F] p-1 shadow-md shadow-[#0F9D8F]/10 overflow-hidden flex items-center justify-center">
            <img 
              src={avatarUrl} 
              alt="Donor Avatar" 
              className="w-full h-full object-cover rounded-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute -bottom-2 -right-1 bg-[#0F9D8F] text-white p-1.5 rounded-xl shadow-xs border-2 border-white">
            <Heart size={14} className="fill-white" />
          </div>
        </div>

        {/* Identity & Badges */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {donorProfile?.name || 'Verified Relief Donor'}
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
              <ShieldCheck size={12} className="text-[#0F9D8F]" />
              Verified Donor Profile
            </span>
          </div>

          <p className="text-xs sm:text-sm text-gray-500 max-w-xl">
            Your verified donor credentials ensure 100% transparency, direct tax deductions (80G), and live tracking of disaster relief funds.
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-gray-400">
            <span className="font-mono text-[11px] bg-gray-100 px-2 py-0.5 rounded-md text-gray-600">
              UID: {user?.uid.slice(0, 10)}...
            </span>
            <span className="flex items-center gap-1 text-[11px] font-medium text-gray-500">
              <Calendar size={12} />
              Joined: {new Date(donorProfile?.createdAt || Date.now()).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Edit / Sign Out Top Actions */}
        <div className="flex items-center gap-2 self-center sm:self-start shrink-0">
          {!isEditing ? (
            <button
              id="donor-edit-profile-btn"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-[#0F9D8F] rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 size={14} />
              <span>Edit Profile</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <X size={14} />
              <span>Cancel</span>
            </button>
          )}

          <button
            onClick={signOut}
            title="Sign out of Donor Account"
            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>

      {/* Success Notification */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center gap-2.5 shadow-xs"
          >
            <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-bold">Donor Profile Updated Successfully!</p>
              <p className="text-[11px] text-emerald-700">Changes are synchronized to Cloud Firestore.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Details or Edit Form */}
      {isEditing ? (
        /* Edit Mode Form */
        <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 text-gray-900 font-bold text-sm sm:text-base">
              <Edit3 size={18} className="text-[#0F9D8F]" />
              <span>Edit Donor Information</span>
            </div>
            <span className="text-[11px] text-gray-400 font-medium">Update contact & preferences</span>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-left">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#0F9D8F] focus:ring-2 focus:ring-[#0F9D8F]/20 text-sm text-gray-900 outline-none"
                required
              />
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">
                Email <span className="text-gray-400 font-normal">(Read-only)</span>
              </label>
              <input
                type="email"
                value={donorProfile?.email || ''}
                readOnly
                className="w-full px-4 py-2.5 rounded-xl bg-gray-100 border border-gray-200 text-sm text-gray-500 outline-none cursor-not-allowed"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#0F9D8F] focus:ring-2 focus:ring-[#0F9D8F]/20 text-sm text-gray-900 outline-none"
                required
              />
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#0F9D8F] focus:ring-2 focus:ring-[#0F9D8F]/20 text-sm text-gray-900 outline-none"
              />
            </div>

            {/* State */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#0F9D8F] focus:ring-2 focus:ring-[#0F9D8F]/20 text-sm text-gray-900 outline-none"
              />
            </div>
          </div>

          {/* Preferred Causes */}
          <div className="space-y-2 text-left pt-2">
            <label className="block text-xs font-bold text-gray-700">
              Preferred Causes
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {CAUSE_OPTIONS.map((cause) => {
                const isSelected = preferredCauses.includes(cause.id);
                const IconComponent = cause.icon;
                return (
                  <button
                    key={cause.id}
                    type="button"
                    onClick={() => toggleCause(cause.id)}
                    className={`p-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50/90 border-[#0F9D8F] text-[#0F9D8F]'
                        : 'bg-gray-50/70 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <IconComponent size={14} />
                      <span className="text-xs font-bold">{cause.label}</span>
                    </div>
                    <span className="text-xs font-bold">{isSelected ? '✓' : '+'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#0F9D8F] hover:bg-[#0c8579] text-white rounded-xl text-xs font-bold shadow-md shadow-[#0F9D8F]/25 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Read-only View Card */
        <div className="space-y-6">
          {/* Contact & Location Details */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-900 font-bold text-sm sm:text-base">
                <User size={18} className="text-[#0F9D8F]" />
                <span>Donor Contact Information</span>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs font-bold text-[#0F9D8F] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit3 size={12} />
                <span>Edit</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 space-y-1 text-left">
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <User size={12} className="text-[#0F9D8F]" />
                  <span>Full Name</span>
                </p>
                <p className="text-sm font-bold text-gray-900">{donorProfile?.name || 'Not provided'}</p>
              </div>

              <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 space-y-1 text-left">
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Mail size={12} className="text-[#0F9D8F]" />
                  <span>Google Email</span>
                </p>
                <p className="text-sm font-bold text-gray-900 truncate">{donorProfile?.email || 'Not provided'}</p>
              </div>

              <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 space-y-1 text-left">
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Phone size={12} className="text-[#0F9D8F]" />
                  <span>Phone Number</span>
                </p>
                <p className="text-sm font-bold text-gray-900">{donorProfile?.phone || 'Not provided'}</p>
              </div>

              <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 space-y-1 text-left">
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin size={12} className="text-[#0F9D8F]" />
                  <span>City / State</span>
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {donorProfile?.city || donorProfile?.state 
                    ? `${donorProfile.city || ''}${donorProfile.city && donorProfile.state ? ', ' : ''}${donorProfile.state || ''}`
                    : 'Not specified'}
                </p>
              </div>
            </div>
          </div>

          {/* Preferred Relief Causes */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-900 font-bold text-sm sm:text-base">
                <Heart size={18} className="text-[#0F9D8F] fill-[#0F9D8F]/20" />
                <span>Preferred Emergency Causes</span>
              </div>
            </div>

            {donorProfile?.preferredCauses && donorProfile.preferredCauses.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {donorProfile.preferredCauses.map((causeName) => {
                  const match = CAUSE_OPTIONS.find(c => c.id === causeName);
                  const IconComp = match?.icon || Heart;
                  return (
                    <div
                      key={causeName}
                      className="px-3.5 py-2 rounded-xl bg-teal-50 border border-teal-200 text-[#0F9D8F] font-bold text-xs flex items-center gap-2"
                    >
                      <IconComp size={14} />
                      <span>{match?.label || causeName}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No specific causes selected (supporting all disaster relief).</p>
            )}
          </div>

          {/* Exit / Return Option */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-gray-500 text-center sm:text-left">
              <span className="font-bold text-gray-800">Return to Emergency SOS Radar?</span>
              <p className="text-[11px] text-gray-400">You can switch back to the main Trahi app anytime without signing out.</p>
            </div>
            <button
              onClick={onBackToTrahi}
              className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <ArrowLeft size={14} />
              <span>Back to Trahi App</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
