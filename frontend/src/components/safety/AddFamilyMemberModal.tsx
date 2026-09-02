import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  UserPlus, 
  Loader2, 
  CheckCircle2, 
  ShieldCheck, 
  Mail, 
  Phone, 
  MapPin, 
  Heart, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { addSafetyCircleMember } from '../../services/firestoreService.ts';
import { SafetyCircleMember } from '../../types.ts';

interface AddFamilyMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberAdded?: (member: SafetyCircleMember) => void;
}

export const AddFamilyMemberModal: React.FC<AddFamilyMemberModalProps> = ({
  isOpen,
  onClose,
  onMemberAdded,
}) => {
  const { user, userProfile } = useAuth();

  // Workflow steps: 'email_input' | 'verifying' | 'details_form' | 'saving' | 'success'
  const [step, setStep] = useState<'email_input' | 'verifying' | 'details_form' | 'saving' | 'success'>('email_input');
  
  // Form fields
  const [email, setEmail] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [gender, setGender] = useState<string>('Male');
  const [age, setAge] = useState<string | number>('24');
  const [phone, setPhone] = useState<string>('+91 98765 43210');
  const [city, setCity] = useState<string>('Delhi');
  const [state, setState] = useState<string>('Delhi');
  const [pincode, setPincode] = useState<string>('110001');
  const [relation, setRelation] = useState<string>('Brother');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Step 1 -> Step 2 (1.5-second verification simulation) -> Step 3
  const handleVerifyEmail = () => {
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid family member email address.');
      return;
    }

    setErrorMessage(null);
    setStep('verifying');

    // 1.5-second simulation timer as specified
    setTimeout(() => {
      setStep('details_form');
      // Auto-suggest name based on email prefix if empty
      if (!fullName) {
        const prefix = email.split('@')[0];
        setFullName(prefix.charAt(0).toUpperCase() + prefix.slice(1));
      }
    }, 1500);
  };

  // Step 3 -> Firestore Save -> Success
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!fullName.trim() || !phone.trim()) {
      setErrorMessage('Full name and phone number are required.');
      return;
    }

    setStep('saving');
    setErrorMessage(null);

    try {
      const newMemberData: Omit<SafetyCircleMember, 'id'> = {
        addedByUid: user.uid,
        addedByEmail: user.email || userProfile?.email || 'user@trahi.org',
        addedByName: userProfile?.name || user.displayName || 'Family Contributor',
        familyMemberEmail: email.toLowerCase().trim(),
        familyMemberUid: `user_sim_${Date.now().toString().slice(-4)}`,
        status: 'VERIFIED',
        fullName: fullName.trim(),
        gender: gender || 'Other',
        age: age ? Number(age) : 24,
        phone: phone.trim(),
        city: city.trim() || 'New Delhi',
        state: state.trim() || 'Delhi',
        pincode: pincode.trim() || '110001',
        relation: relation || 'Family Member',
        createdAt: new Date().toISOString(),
      };

      const docId = await addSafetyCircleMember(newMemberData);
      
      if (onMemberAdded) {
        onMemberAdded({ id: docId, ...newMemberData });
      }

      setStep('success');
      setTimeout(() => {
        onClose();
        // Reset state for next open
        setStep('email_input');
        setEmail('');
      }, 1800);

    } catch (err: any) {
      console.error('Failed to add family member:', err);
      setErrorMessage(err?.message || 'Failed to save family member to Firestore.');
      setStep('details_form');
    }
  };

  return (
    <AnimatePresence>
      <div 
        id="add-family-member-backdrop"
        className="fixed inset-0 z-[1250] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          id="add-family-member-modal-box"
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="bg-white w-full max-w-sm sm:max-w-md rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-auto text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-[#0F9D8F] to-teal-700 text-white relative">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 text-white flex items-center justify-center backdrop-blur-xs shadow-inner">
                <UserPlus size={22} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-white/20 text-white tracking-wider">
                  Offline Safety Circle
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  Add Family Member
                </h3>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {errorMessage && (
              <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 1: EMAIL INPUT                                                       */}
            {/* ========================================================================= */}
            {step === 'email_input' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">
                    Add Family Member by Email
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Enter the email address of your family member, parent, child, or close emergency contact.
                  </p>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. brother@example.com"
                      className="w-full pl-10 pr-3.5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#0F9D8F]/30 focus:border-[#0F9D8F] outline-none"
                    />
                  </div>
                </div>

                {/* Quick Presets for Demo */}
                <div className="p-3 rounded-2xl bg-teal-50/70 border border-teal-100 text-xs space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-teal-800 tracking-wider block">
                    ⚡ Quick Demo Presets
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {['brother@example.com', 'mother@example.com', 'spouse@example.com'].map((demo) => (
                      <button
                        type="button"
                        key={demo}
                        onClick={() => setEmail(demo)}
                        className="px-2 py-1 rounded-lg bg-white text-teal-800 border border-teal-200 text-[11px] font-bold hover:bg-teal-100/50 transition cursor-pointer"
                      >
                        {demo}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleVerifyEmail}
                  className="w-full py-3.5 bg-[#0F9D8F] hover:bg-[#0c8579] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-[#0F9D8F]/25 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <ShieldCheck size={16} />
                  <span>Verify & Add Member</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 2: 1.5-SECOND VERIFICATION SIMULATION                                 */}
            {/* ========================================================================= */}
            {step === 'verifying' && (
              <div className="p-8 text-center space-y-4">
                <Loader2 size={36} className="animate-spin text-[#0F9D8F] mx-auto" />
                <h4 className="text-sm font-black text-gray-900">
                  Verifying account & sending safety invitation...
                </h4>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  Connecting to Trahi Safety Circle Grid & configuring bidirectional emergency sync.
                </p>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 3: DETAILS MODAL / FORM                                              */}
            {/* ========================================================================= */}
            {(step === 'details_form' || step === 'saving') && (
              <form onSubmit={handleSaveMember} className="space-y-3.5">
                {/* Verified Badge */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span className="font-bold truncate max-w-[200px]">{email}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 text-[10px] font-black uppercase">
                    Verified & Linked!
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Full Name */}
                  <div className="space-y-1 col-span-2">
                    <label className="text-[11px] font-bold text-gray-700">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Bhaiya / Ananya Sharma"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-[#0F9D8F]/30 focus:border-[#0F9D8F] outline-none"
                    />
                  </div>

                  {/* Relation */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700">Relation *</label>
                    <select
                      value={relation}
                      onChange={(e) => setRelation(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-[#0F9D8F]/30 focus:border-[#0F9D8F] outline-none"
                    >
                      <option value="Brother">Brother</option>
                      <option value="Sister">Sister</option>
                      <option value="Mother">Mother</option>
                      <option value="Father">Father</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Child">Child / Son / Daughter</option>
                      <option value="Friend">Friend</option>
                      <option value="Relative">Relative</option>
                      <option value="Emergency Contact">Emergency Contact</option>
                    </select>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700">Phone (SMS/WhatsApp) *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+919876543210"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-[#0F9D8F]/30 focus:border-[#0F9D8F] outline-none"
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-[#0F9D8F]/30 focus:border-[#0F9D8F] outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Age */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700">Age</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="24"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-[#0F9D8F]/30 focus:border-[#0F9D8F] outline-none"
                    />
                  </div>

                  {/* City */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Riyadh / Mumbai"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-[#0F9D8F]/30 focus:border-[#0F9D8F] outline-none"
                    />
                  </div>

                  {/* State / Country */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700">State / Country</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="e.g. Maharashtra"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-[#0F9D8F]/30 focus:border-[#0F9D8F] outline-none"
                    />
                  </div>

                  {/* Pincode */}
                  <div className="space-y-1 col-span-2">
                    <label className="text-[11px] font-bold text-gray-700">Pincode / Postal Code</label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="e.g. 11564"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-[#0F9D8F]/30 focus:border-[#0F9D8F] outline-none"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={step === 'saving'}
                  className="w-full py-3.5 bg-[#0F9D8F] hover:bg-[#0c8579] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-[#0F9D8F]/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {step === 'saving' ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-white" />
                      <span>Saving to Safety Circle...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      <span>Save to Safety Circle</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ========================================================================= */}
            {/* STEP 4: SUCCESS CONFIRMATION                                              */}
            {/* ========================================================================= */}
            {step === 'success' && (
              <div className="p-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} className="stroke-[2.5]" />
                </div>
                <h4 className="text-base font-black text-gray-900">Family Member Added!</h4>
                <p className="text-xs text-gray-500">
                  {fullName} ({relation}) has been linked to your Safety Circle. They will receive your "I'm Safe" and distress alerts.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
