import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Heart, 
  ShieldCheck, 
  CreditCard, 
  QrCode, 
  Building, 
  CheckCircle2, 
  Loader2, 
  Lock, 
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { createDonation } from '../../services/firestoreService.ts';

interface PaymentSimModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCrisisTitle?: string;
  targetSosReportId?: string;
  onSuccess?: (donationId: string) => void;
}

export const PaymentSimModal: React.FC<PaymentSimModalProps> = ({
  isOpen,
  onClose,
  targetCrisisTitle = 'Emergency Disaster Relief Fund',
  targetSosReportId,
  onSuccess,
}) => {
  const { user, userProfile, donorProfile } = useAuth();

  const [amount, setAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('1000');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState<string>(user?.email ? `${user.email.split('@')[0]}@okaxis` : 'user@okhdfcbank');
  const [donorName, setDonorName] = useState<string>(donorProfile?.name || userProfile?.name || user?.displayName || 'Relief Supporter');

  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [transactionId, setTransactionId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAmountSelect = (val: number) => {
    setAmount(val);
    setCustomAmount(val.toString());
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAmount(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      setAmount(num);
    }
  };

  const handleSimulatePayment = async () => {
    if (amount <= 0) {
      setErrorMessage('Please enter a valid donation amount.');
      return;
    }

    setErrorMessage(null);
    setStep('processing');

    const generatedTxnId = `PAY_TRAHI_${Date.now().toString(36).toUpperCase()}_${Math.floor(1000 + Math.random() * 9000)}`;
    setTransactionId(generatedTxnId);

    // Simulate 1.8s payment processing gateway latency
    setTimeout(async () => {
      try {
        const docId = await createDonation({
          sosReportId: targetSosReportId || `SOS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          donorName: donorName || 'Verified Trahi Donor',
          donorUserId: user?.uid,
          amount: amount,
          status: 'Received',
          timestamp: Date.now(),
          sosLocationName: targetCrisisTitle,
          purpose: `Rapid response assistance for ${targetCrisisTitle}`,
          paymentMethod: paymentMethod === 'upi' ? `UPI (${upiId})` : paymentMethod === 'card' ? 'Credit/Debit Card (Simulated)' : 'NetBanking (Simulated)',
          proofNote: `Payment verified via Simulated Gateway. Txn Ref: ${generatedTxnId}`,
        });

        setStep('success');
        if (onSuccess) {
          onSuccess(docId);
        }
      } catch (err: any) {
        console.error('Donation record creation error:', err);
        setErrorMessage('Payment simulation finished, but failed to log to database.');
        setStep('form');
      }
    }, 1800);
  };

  const handleResetAndClose = () => {
    setStep('form');
    setErrorMessage(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div 
        id="payment-sim-modal-backdrop"
        className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        onClick={handleResetAndClose}
      >
        <motion.div
          id="payment-sim-modal-box"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-auto text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 sm:p-6 bg-gradient-to-br from-[#0F9D8F] to-[#0c7c71] text-white relative shadow-inner">
            <button
              onClick={handleResetAndClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-extrabold uppercase tracking-wide">
                <Heart size={12} className="fill-white/40" />
                Emergency Aid Contribution
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/90 text-gray-900 text-[10px] font-black uppercase">
                <Lock size={10} /> Test Gateway
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
              {targetCrisisTitle}
            </h3>

            <p className="text-xs text-white/80 mt-1 flex items-center gap-1">
              <ShieldCheck size={13} />
              100% Direct Emergency Relief Disbursement
            </p>
          </div>

          {/* Body Content by Step */}
          <div className="p-5 sm:p-6 space-y-5">
            {step === 'form' && (
              <>
                {errorMessage && (
                  <div className="p-3 rounded-2xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
                    {errorMessage}
                  </div>
                )}

                {/* Donor Details */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Donor Name</label>
                  <input
                    type="text"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="Your Full Name"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-[#0F9D8F]/30 focus:border-[#0F9D8F] outline-none"
                  />
                </div>

                {/* Amount Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-gray-700">Donation Amount (INR)</label>
                    <span className="text-[11px] font-extrabold text-[#0F9D8F]">Tax Exempt 80G Eligible</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-2.5">
                    {[500, 1000, 2500, 5000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleAmountSelect(val)}
                        className={`py-2 rounded-xl text-xs font-black transition cursor-pointer border ${
                          amount === val
                            ? 'bg-[#0F9D8F] text-white border-[#0F9D8F] shadow-sm'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        ₹{val.toLocaleString('en-IN')}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-gray-500">₹</span>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={handleCustomAmountChange}
                      min={50}
                      placeholder="Custom Amount"
                      className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-black text-gray-900 focus:ring-2 focus:ring-[#0F9D8F]/30 focus:border-[#0F9D8F] outline-none"
                    />
                  </div>
                </div>

                {/* Payment Method Tabs */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Select Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                        paymentMethod === 'upi'
                          ? 'border-[#0F9D8F] bg-teal-50/70 text-[#0F9D8F] ring-2 ring-[#0F9D8F]/20'
                          : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <QrCode size={20} />
                      <span className="text-[11px] font-black">UPI / QR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                        paymentMethod === 'card'
                          ? 'border-[#0F9D8F] bg-teal-50/70 text-[#0F9D8F] ring-2 ring-[#0F9D8F]/20'
                          : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <CreditCard size={20} />
                      <span className="text-[11px] font-black">Cards</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('netbanking')}
                      className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                        paymentMethod === 'netbanking'
                          ? 'border-[#0F9D8F] bg-teal-50/70 text-[#0F9D8F] ring-2 ring-[#0F9D8F]/20'
                          : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <Building size={20} />
                      <span className="text-[11px] font-black">NetBanking</span>
                    </button>
                  </div>

                  {paymentMethod === 'upi' && (
                    <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5">
                      <span className="text-[11px] font-bold text-gray-500">Simulated VPA Address</span>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono text-gray-800 outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Submit Action CTA */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSimulatePayment}
                    className="w-full py-3.5 bg-[#0F9D8F] hover:bg-[#0c8579] active:scale-[0.99] text-white font-black text-sm rounded-2xl shadow-lg shadow-[#0F9D8F]/25 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Proceed to Pay ₹{amount.toLocaleString('en-IN')} (Simulated)</span>
                    <ArrowRight size={16} />
                  </button>
                  <p className="text-[10px] text-center text-gray-400 mt-2 flex items-center justify-center gap-1">
                    <ShieldCheck size={12} className="text-emerald-500" />
                    Simulated Razorpay Sandbox • No actual money debited
                  </p>
                </div>
              </>
            )}

            {step === 'processing' && (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-teal-50 border-4 border-teal-100 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#0F9D8F]" />
                </div>
                <div>
                  <h4 className="text-base font-black text-gray-900">Simulating Bank Authentication...</h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                    Connecting to Trahi Multi-Party Escrow Ledger & Verifying UPI Response...
                  </p>
                </div>
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-[11px] font-mono font-bold">
                  Amount: ₹{amount.toLocaleString('en-IN')}
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15 }}
                  className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 size={36} className="stroke-[2.5]" />
                </motion.div>

                <div>
                  <h4 className="text-xl font-black text-gray-900">Donation Successful!</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Your contribution of <strong className="text-gray-900">₹{amount.toLocaleString('en-IN')}</strong> has been securely logged to the disaster relief ledger.
                  </p>
                </div>

                <div className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 text-left space-y-2 text-xs">
                  <div className="flex justify-between items-center text-gray-500">
                    <span>Transaction ID:</span>
                    <span className="font-mono font-bold text-gray-800">{transactionId}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500">
                    <span>Purpose:</span>
                    <span className="font-bold text-gray-800 truncate max-w-[200px]">{targetCrisisTitle}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500">
                    <span>Audit Status:</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                      Received & Pledged
                    </span>
                  </div>
                </div>

                <div className="w-full pt-2 flex flex-col gap-2">
                  <button
                    onClick={handleResetAndClose}
                    className="w-full py-3 bg-[#0F9D8F] hover:bg-[#0c8579] text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                  >
                    Done & Return to Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
