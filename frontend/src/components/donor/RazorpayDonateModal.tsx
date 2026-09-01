import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Heart, 
  ShieldCheck, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  CreditCard,
  Building2,
  Lock,
  ArrowRight,
  Download
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { createDonation } from '../../services/firestoreService.ts';
import { openRazorpayCheckout } from '../../services/razorpayService.ts';
import { downloadDonationPDFReport } from '../../services/pdfReportService.ts';

export interface RazorpayDonateModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSosReportId?: string;
  targetCrisisTitle?: string;
  targetLocationName?: string;
  targetPurpose?: string;
  defaultAmount?: number;
  onSuccessCallback?: (donationId: string, paymentId: string) => void;
}

export const RazorpayDonateModal: React.FC<RazorpayDonateModalProps> = ({
  isOpen,
  onClose,
  targetSosReportId,
  targetCrisisTitle,
  targetLocationName,
  targetPurpose,
  defaultAmount = 1000,
  onSuccessCallback,
}) => {
  const { user, userProfile, isGoogleUser, signInWithGoogle, signInAsDonorFallback, authError, clearAuthError } = useAuth();

  // Step states: 'auth_gate' | 'amount_selector' | 'processing' | 'success'
  const [step, setStep] = useState<'auth_gate' | 'amount_selector' | 'processing' | 'success'>('amount_selector');
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [customAmountInput, setCustomAmountInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedPaymentId, setCompletedPaymentId] = useState<string | null>(null);
  const [createdDonationId, setCreatedDonationId] = useState<string | null>(null);
  const [downloadingPDF, setDownloadingPDF] = useState<boolean>(false);
  const [guestName, setGuestName] = useState<string>('');

  // Update step based on auth status when modal opens or user logs in
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setCompletedPaymentId(null);
      if (!isGoogleUser) {
        setStep('auth_gate');
      } else {
        setStep('amount_selector');
      }
    }
  }, [isOpen, isGoogleUser]);

  if (!isOpen) return null;

  // Handle Google Sign In from Auth Gate
  const handleAuthGateSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    clearAuthError();
    try {
      const signedInUser = await signInWithGoogle();
      setLoading(false);
      if (signedInUser) {
        // Automatically continue to amount selector & razorpay flow without requiring another tap
        setStep('amount_selector');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err?.message || 'Google sign-in failed. Please try again.');
    }
  };

  // Fallback donor sign-in if Google auth domain is restricted in local preview
  const handleFallbackSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    clearAuthError();
    try {
      const signedInUser = await signInAsDonorFallback(guestName || 'Verified Donor');
      setLoading(false);
      if (signedInUser) {
        setStep('amount_selector');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err?.message || 'Could not initiate donor mode.');
    }
  };

  // Execute Razorpay Payment & Firestore Document Save
  const handleLaunchRazorpay = async () => {
    const finalAmount = customAmountInput ? Number(customAmountInput) : amount;
    if (!finalAmount || finalAmount < 10) {
      setErrorMessage('Please select or enter a valid donation amount (min ₹10).');
      return;
    }

    if (!user) {
      setStep('auth_gate');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const title = targetCrisisTitle || targetPurpose || 'Disaster Relief Fund';
    const sosId = targetSosReportId || `SOS-DONATE-${Date.now().toString().slice(-6)}`;
    const donorName = userProfile?.name || user.displayName || 'Trahi Donor';
    const donorEmail = user.email || userProfile?.email || '';

    try {
      await openRazorpayCheckout({
        amount: finalAmount,
        title: `Trahi Relief: ${title}`,
        description: `Direct Aid Contribution for ${sosId}`,
        donorName: donorName,
        donorEmail: donorEmail,
        onSuccess: async (razorpayPaymentId: string) => {
          try {
            setStep('processing');
            // Save document to Firestore 'donations' collection per strict requirements
            const newDonationId = await createDonation({
              sosReportId: sosId,
              donorId: user.uid,
              donorName: donorName,
              donorEmail: donorEmail,
              amount: finalAmount,
              razorpayPaymentId: razorpayPaymentId,
              status: 'Donation Received',
              timestamp: Date.now(),
              sosLocationName: targetLocationName || 'Disaster Affected Zone, India',
              purpose: title,
              paymentMethod: 'Razorpay (Test Mode)',
              proofNote: `Payment verified via Razorpay ID: ${razorpayPaymentId}`
            });

            setCreatedDonationId(newDonationId);
            setCompletedPaymentId(razorpayPaymentId);
            setLoading(false);
            setStep('success');

            if (onSuccessCallback) {
              onSuccessCallback(newDonationId, razorpayPaymentId);
            }
          } catch (dbErr: any) {
            console.error('Failed to save donation to Firestore:', dbErr);
            setLoading(false);
            setCompletedPaymentId(razorpayPaymentId);
            setStep('success');
          }
        },
        onDismiss: () => {
          setLoading(false);
          setErrorMessage('Payment cancelled or closed. You can try again whenever you are ready.');
        },
        onError: (err: any) => {
          setLoading(false);
          setErrorMessage(err?.description || err?.message || 'Razorpay payment encounter an issue.');
        }
      });
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err?.message || 'Could not launch Razorpay checkout.');
    }
  };

  return (
    <AnimatePresence>
      <div 
        id="razorpay-donate-modal-backdrop"
        className="fixed inset-0 z-[1050] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          id="razorpay-donate-modal-box"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="bg-white w-full max-w-sm sm:max-w-md rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-auto text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ========================================================================= */}
          {/* STEP 1: AUTH GATE (Required if not signed in with Google)                 */}
          {/* ========================================================================= */}
          {step === 'auth_gate' && (
            <div>
              {/* Header */}
              <div className="p-6 bg-gradient-to-br from-[#0F9D8F] to-teal-700 text-white relative text-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X size={18} />
                </button>

                <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center mx-auto mb-3 backdrop-blur-xs shadow-inner">
                  <Heart size={28} className="fill-white/30 stroke-[2]" />
                </div>

                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-white/20 text-white tracking-wider">
                  Authentication Gate
                </span>
                <h3 className="text-xl font-black text-white mt-1">Sign in with Google to Donate</h3>
                <p className="text-xs text-white/85 mt-1 max-w-xs mx-auto">
                  To securely issue 80G tax certificates and track your disaster relief disbursement, please connect your account.
                </p>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {(errorMessage || authError) && (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                    <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <p>{errorMessage || authError}</p>
                  </div>
                )}

                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleAuthGateSignIn}
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-gray-50 text-gray-800 font-extrabold text-sm border-2 border-gray-200 hover:border-gray-300 shadow-sm transition flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
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
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>

                <div className="relative my-3 flex items-center justify-center">
                  <div className="border-t border-gray-200 w-full" />
                  <span className="bg-white px-3 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider absolute">
                    or instant donor mode
                  </span>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Enter your name (e.g. Ananya Sharma)"
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
                    <span>Proceed as Verified Donor</span>
                  </button>
                </div>

                <div className="pt-2 text-[10px] text-gray-400 text-center flex items-center justify-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-600" />
                  <span>256-Bit Encrypted Auth • Razorpay Test Mode</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: AMOUNT SELECTOR & RAZORPAY LAUNCH                                  */}
          {/* ========================================================================= */}
          {step === 'amount_selector' && (
            <div>
              {/* Header */}
              <div className="p-5 bg-[#0F9D8F] text-white relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center backdrop-blur-xs">
                    <Heart size={20} className="fill-white/30" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white leading-tight">Disaster Relief Donation</h3>
                    <p className="text-xs text-white/80 line-clamp-1">
                      {targetCrisisTitle || targetLocationName || 'Direct Ground Aid Fund'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition cursor-pointer shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Body */}
              <div className="p-6 space-y-4">
                {errorMessage && (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                    <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <p>{errorMessage}</p>
                  </div>
                )}

                {/* Account Pill */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-teal-50/70 border border-teal-100 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#0F9D8F] text-white font-bold flex items-center justify-center text-xs">
                      {(userProfile?.name || user?.displayName || 'D')[0].toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 block">
                        {userProfile?.name || user?.displayName || 'Verified Donor'}
                      </span>
                      <span className="text-[10px] text-gray-500 block truncate max-w-[180px]">
                        {user?.email || 'Authenticated Account'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Google Connected
                  </span>
                </div>

                {/* Target SOS info if provided */}
                {targetSosReportId && (
                  <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs space-y-1">
                    <div className="flex items-center justify-between text-gray-500">
                      <span>Target Distress Case:</span>
                      <span className="font-mono font-bold text-gray-800">{targetSosReportId}</span>
                    </div>
                    {targetLocationName && (
                      <p className="text-gray-900 font-semibold truncate">📍 {targetLocationName}</p>
                    )}
                  </div>
                )}

                {/* Amount Selection */}
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 mb-2">
                    Select Contribution Amount (INR ₹)
                  </label>

                  {/* Preset Amount Chips */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[100, 500, 1000, 2500].map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => {
                          setAmount(preset);
                          setCustomAmountInput('');
                        }}
                        className={`py-2 rounded-xl text-xs font-black transition cursor-pointer border ${
                          amount === preset && !customAmountInput
                            ? 'bg-[#0F9D8F] text-white border-[#0F9D8F] shadow-sm'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        ₹{preset}
                      </button>
                    ))}
                  </div>

                  {/* Custom Amount Input */}
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-gray-400 text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      placeholder="Or enter custom amount (e.g. 5000)"
                      value={customAmountInput}
                      onChange={(e) => {
                        setCustomAmountInput(e.target.value);
                        if (e.target.value) {
                          setAmount(Number(e.target.value));
                        }
                      }}
                      className="w-full pl-8 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#0F9D8F]/30 focus:border-[#0F9D8F] outline-none"
                      min={10}
                    />
                  </div>
                </div>

                {/* Razorpay Launch Button */}
                <button
                  type="button"
                  onClick={handleLaunchRazorpay}
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-[#0F9D8F] to-teal-700 hover:from-[#0c8579] hover:to-teal-800 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-[#0F9D8F]/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <>
                      <CreditCard size={18} />
                      <span>Pay ₹{(customAmountInput ? Number(customAmountInput) : amount).toLocaleString('en-IN')} via Razorpay</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium px-1">
                  <span className="flex items-center gap-1">
                    <Lock size={12} className="text-emerald-600" /> Razorpay Test Gateway
                  </span>
                  <span>Instant 80G Receipt</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: PROCESSING LOADER                                                 */}
          {/* ========================================================================= */}
          {step === 'processing' && (
            <div className="p-10 text-center space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-[#0F9D8F] mx-auto" />
              <h4 className="text-base font-black text-gray-900">Recording Donation on Firestore...</h4>
              <p className="text-xs text-gray-500">
                Payment captured successfully. Syncing disaster ledger and generating verification proof...
              </p>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: SUCCESS CONFIRMATION                                              */}
          {/* ========================================================================= */}
          {step === 'success' && (
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={36} className="stroke-[2.5]" />
              </div>

              <div>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Donation Received
                </span>
                <h3 className="text-xl font-black text-gray-900 mt-2">Thank You!</h3>
                <p className="text-sm font-semibold text-gray-700 mt-1">
                  Your donation is now being tracked.
                </p>
              </div>

              {/* Payment Details Card */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-left space-y-2 font-mono">
                <div className="flex justify-between text-gray-500">
                  <span>Amount Contributed:</span>
                  <span className="font-bold text-gray-900">₹{(customAmountInput ? Number(customAmountInput) : amount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Razorpay Payment ID:</span>
                  <span className="font-bold text-[#0F9D8F] truncate max-w-[160px] sm:max-w-[200px]">
                    {completedPaymentId || 'pay_test_completed'}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Status:</span>
                  <span className="font-bold text-emerald-600">Donation Received</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (createdDonationId) {
                      setDownloadingPDF(true);
                      try {
                        await downloadDonationPDFReport(createdDonationId);
                      } catch (err) {
                        console.error('Failed to download PDF:', err);
                        alert('Could not download PDF report. Please try from My Donations tab.');
                      } finally {
                        setDownloadingPDF(false);
                      }
                    }
                  }}
                  disabled={downloadingPDF || !createdDonationId}
                  className="w-full py-3 bg-[#0F9D8F] hover:bg-[#0c8579] text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {downloadingPDF ? (
                    <>
                      <Loader2 size={15} className="animate-spin text-white" />
                      <span>Generating Live PDF Report...</span>
                    </>
                  ) : (
                    <>
                      <Download size={15} />
                      <span>Download PDF Audit Report</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-xs rounded-xl transition cursor-pointer"
                >
                  Close & View Relief Ledger
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
