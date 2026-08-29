import React, { useState, useEffect } from 'react';
import { 
  User, 
  Heart, 
  MapPin, 
  ShieldCheck, 
  AlertCircle, 
  Save, 
  CheckCircle2, 
  RefreshCw, 
  Sparkles,
  Info,
  Calendar,
  Activity,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext.tsx';
import { useLocation } from '../context/LocationContext.tsx';
import { saveUserProfileToFirestore } from '../services/firestoreService.ts';
import { UserProfile, UserLocationDetails } from '../types.ts';

interface ProfileViewProps {
  onNavigateToSOS?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onNavigateToSOS }) => {
  const { user, userProfile, updateUserProfileState } = useAuth();
  const { location, refreshLocation, isLocating } = useLocation();

  // Form State
  const [name, setName] = useState<string>('');
  const [age, setAge] = useState<string | number>('');
  const [gender, setGender] = useState<string>('');
  const [bloodGroup, setBloodGroup] = useState<string>('');
  const [district, setDistrict] = useState<string>('');
  const [block, setBlock] = useState<string>('');
  const [pincode, setPincode] = useState<string>('');
  const [state, setState] = useState<string>('');

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Avatar URL based on auth UID (DiceBear 9.x)
  const avatarUrl = user?.uid 
    ? `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.uid}`
    : 'https://api.dicebear.com/9.x/avataaars/svg?seed=trahi_rescue';

  // Load and pre-fill form with existing profile data or auto-detected geolocation
  useEffect(() => {
    if (userProfile) {
      if (userProfile.name) setName(userProfile.name);
      if (userProfile.age !== undefined && userProfile.age !== 0) setAge(userProfile.age);
      if (userProfile.gender) setGender(userProfile.gender);
      if (userProfile.bloodGroup) setBloodGroup(userProfile.bloodGroup);

      // If user had existing saved location
      if (userProfile.location) {
        setDistrict(userProfile.location.district || '');
        setBlock(userProfile.location.block || '');
        setPincode(userProfile.location.pincode || '');
        setState(userProfile.location.state || '');
      }
    }
  }, [userProfile]);

  // Pre-fill location fields automatically from GPS/Nominatim reverse geocoding if not already populated
  useEffect(() => {
    if (location) {
      // Only auto-fill if fields are currently empty or matching default
      setDistrict((prev) => prev || location.district || location.city || '');
      setBlock((prev) => prev || location.block || location.city || '');
      setPincode((prev) => prev || location.postcode || '');
      setState((prev) => prev || location.state || '');
    }
  }, [location]);

  // Handle Save Profile
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) {
      setErrorMessage("No active session found. Please reload.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const locDetails: UserLocationDetails = {
        latitude: location?.latitude || (userProfile?.location?.latitude ?? 0),
        longitude: location?.longitude || (userProfile?.location?.longitude ?? 0),
        district: district.trim() || location?.district || location?.city || '',
        block: block.trim() || location?.block || location?.city || '',
        pincode: pincode.trim() || location?.postcode || '',
        state: state.trim() || location?.state || '',
      };

      const updatedPayload: Partial<UserProfile> & { userId: string } = {
        userId: user.uid,
        name: name.trim() || (userProfile?.name || `User #${user.uid.slice(0, 5)}`),
        age: age ? Number(age) : 0,
        gender: gender.trim(),
        bloodGroup: bloodGroup.trim(),
        profilePictureUrl: avatarUrl,
        location: locDetails,
        profileCompleted: true,
      };

      // 1. Save to Firestore
      await saveUserProfileToFirestore(updatedPayload);

      // 2. Update AuthContext state
      const newFullProfile: UserProfile = {
        userId: user.uid,
        uid: user.uid,
        name: updatedPayload.name!,
        age: updatedPayload.age,
        gender: updatedPayload.gender,
        bloodGroup: updatedPayload.bloodGroup,
        profilePictureUrl: avatarUrl,
        location: locDetails,
        profileCompleted: true,
        authType: userProfile?.authType || (user.isAnonymous ? 'anonymous' : 'google'),
        createdAt: userProfile?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
      updateUserProfileState(newFullProfile);

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 5000);
    } catch (err: any) {
      console.error("Save profile error:", err);
      setErrorMessage(err?.message || "Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const isProfileComplete = Boolean(userProfile?.profileCompleted);

  return (
    <div id="profile-view-container" className="w-full max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Avatar Display */}
        <div className="relative shrink-0">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-teal-50/70 border-2 border-[#0F9D8F] p-1 shadow-md shadow-[#0F9D8F]/10 overflow-hidden flex items-center justify-center">
            <img 
              src={avatarUrl} 
              alt="DiceBear Avatar" 
              className="w-full h-full object-cover rounded-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute -bottom-2 -right-1 bg-[#0F9D8F] text-white p-1.5 rounded-xl shadow-xs border-2 border-white">
            <ShieldCheck size={14} />
          </div>
        </div>

        {/* Identity & Status */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {name || userProfile?.name || 'Emergency Profile'}
            </h2>
            {isProfileComplete ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 size={12} className="text-emerald-600" />
                Profile Completed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                <AlertCircle size={12} className="text-amber-600" />
                Incomplete (Optional)
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-xl">
            Medical and triage details are optional. In an active emergency, responders use your blood group and verified location to dispatch aid faster.
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-gray-400">
            <span className="font-mono text-[11px] bg-gray-100 px-2 py-0.5 rounded-md text-gray-600">
              UID: {user?.uid.slice(0, 10)}...
            </span>
            <span className="text-[11px] font-medium text-emerald-600">
              {userProfile?.authType === 'google' ? '✓ Google Verified' : '⚡ Anonymous Session'}
            </span>
          </div>
        </div>
      </div>

      {/* Success / Error Banners */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs sm:text-sm font-bold">Profile Saved to Firestore Successfully!</p>
                <p className="text-[11px] text-emerald-700">Your medical and rescue details are now synced to your UID.</p>
              </div>
            </div>
            {onNavigateToSOS && (
              <button
                onClick={onNavigateToSOS}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>Go to SOS</span>
                <ArrowRight size={14} />
              </button>
            )}
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-50 border border-red-200 text-red-900 rounded-2xl flex items-center gap-2.5"
          >
            <AlertCircle size={20} className="text-red-600 shrink-0" />
            <p className="text-xs sm:text-sm font-medium">{errorMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Section 1: Personal & Medical Information */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 text-gray-900 font-bold text-sm sm:text-base">
              <User size={18} className="text-[#0F9D8F]" />
              <span>Personal & Medical Info</span>
            </div>
            <span className="text-[11px] font-medium text-gray-400">All fields optional</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label htmlFor="profile-name" className="block text-xs font-bold text-gray-700">
                Full Name
              </label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Fernandes / Priyanshu Sharma"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50/80 border border-gray-200 focus:bg-white focus:border-[#0F9D8F] focus:ring-2 focus:ring-[#0F9D8F]/20 text-sm text-gray-900 transition outline-none"
              />
            </div>

            {/* Age */}
            <div className="space-y-1.5">
              <label htmlFor="profile-age" className="block text-xs font-bold text-gray-700">
                Age
              </label>
              <input
                id="profile-age"
                type="number"
                min="1"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 26"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50/80 border border-gray-200 focus:bg-white focus:border-[#0F9D8F] focus:ring-2 focus:ring-[#0F9D8F]/20 text-sm text-gray-900 transition outline-none"
              />
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <label htmlFor="profile-gender" className="block text-xs font-bold text-gray-700">
                Gender
              </label>
              <select
                id="profile-gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50/80 border border-gray-200 focus:bg-white focus:border-[#0F9D8F] focus:ring-2 focus:ring-[#0F9D8F]/20 text-sm text-gray-900 transition outline-none cursor-pointer"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-Binary">Non-Binary</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            {/* Blood Group */}
            <div className="space-y-1.5">
              <label htmlFor="profile-blood-group" className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                <Heart size={14} className="text-[#F0294D] fill-[#F0294D]/20" />
                <span>Blood Group</span>
                <span className="text-[10px] text-red-500 font-semibold">(Emergency Triage)</span>
              </label>
              <select
                id="profile-blood-group"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50/80 border border-gray-200 focus:bg-white focus:border-[#0F9D8F] focus:ring-2 focus:ring-[#0F9D8F]/20 text-sm text-gray-900 font-semibold transition outline-none cursor-pointer"
              >
                <option value="">Select Blood Group</option>
                <option value="O+">O+ (Universal RBC Donor)</option>
                <option value="O-">O- (Universal Emergency)</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+ (Universal Plasma Donor)</option>
                <option value="AB-">AB-</option>
                <option value="Unknown">Don't Know / Not Tested</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Administrative Location & Geolocation */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 text-gray-900 font-bold text-sm sm:text-base">
              <MapPin size={18} className="text-[#0F9D8F]" />
              <span>Location & Administrative Region</span>
            </div>
            <button
              type="button"
              onClick={() => refreshLocation()}
              disabled={isLocating}
              className="flex items-center gap-1.5 text-xs font-bold text-[#0F9D8F] hover:text-[#0c8579] px-2.5 py-1 rounded-lg hover:bg-teal-50 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={12} className={isLocating ? 'animate-spin' : ''} />
              <span>{isLocating ? 'Detecting GPS...' : 'Auto-fill from GPS'}</span>
            </button>
          </div>

          <p className="text-xs text-gray-500">
            Pre-filled automatically from OpenStreetMap Nominatim reverse geocoding. You can edit any field if needed.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* District */}
            <div className="space-y-1.5">
              <label htmlFor="profile-district" className="block text-xs font-bold text-gray-700">
                District / County
              </label>
              <input
                id="profile-district"
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Mumbai Suburban / Kamrup Metro"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50/80 border border-gray-200 focus:bg-white focus:border-[#0F9D8F] focus:ring-2 focus:ring-[#0F9D8F]/20 text-sm text-gray-900 transition outline-none"
              />
            </div>

            {/* Block / Tehsil / Sub-district */}
            <div className="space-y-1.5">
              <label htmlFor="profile-block" className="block text-xs font-bold text-gray-700">
                Block / Tehsil / Sub-district
              </label>
              <input
                id="profile-block"
                type="text"
                value={block}
                onChange={(e) => setBlock(e.target.value)}
                placeholder="e.g. Kurla / Dispur"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50/80 border border-gray-200 focus:bg-white focus:border-[#0F9D8F] focus:ring-2 focus:ring-[#0F9D8F]/20 text-sm text-gray-900 transition outline-none"
              />
            </div>

            {/* Pincode / Postal Code */}
            <div className="space-y-1.5">
              <label htmlFor="profile-pincode" className="block text-xs font-bold text-gray-700">
                Pincode / Postal Code
              </label>
              <input
                id="profile-pincode"
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="e.g. 400070"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50/80 border border-gray-200 focus:bg-white focus:border-[#0F9D8F] focus:ring-2 focus:ring-[#0F9D8F]/20 text-sm text-gray-900 transition outline-none"
              />
            </div>

            {/* State */}
            <div className="space-y-1.5">
              <label htmlFor="profile-state" className="block text-xs font-bold text-gray-700">
                State / Province
              </label>
              <input
                id="profile-state"
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Maharashtra / Assam"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50/80 border border-gray-200 focus:bg-white focus:border-[#0F9D8F] focus:ring-2 focus:ring-[#0F9D8F]/20 text-sm text-gray-900 transition outline-none"
              />
            </div>
          </div>

          {/* Current GPS Coordinates readout */}
          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono">
                GPS Lat: {location?.latitude ? location.latitude.toFixed(5) : '0.00000'}, Lng: {location?.longitude ? location.longitude.toFixed(5) : '0.00000'}
              </span>
            </div>
            <span className="text-[11px] text-gray-400">
              {location?.formattedAddress || 'Location active'}
            </span>
          </div>
        </div>

        {/* Submit / Save Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Info size={16} className="text-[#0F9D8F] shrink-0" />
            <span>Clicking Save Profile stores this data to your UID in Cloud Firestore.</span>
          </div>

          <button
            id="save-profile-button"
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#0F9D8F] hover:bg-[#0c8579] active:scale-98 text-white rounded-2xl font-bold text-sm shadow-md shadow-[#0F9D8F]/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Saving to Firestore...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Profile</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
