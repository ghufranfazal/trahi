import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase.ts';
import { Donation, DonationStatus } from '../types.ts';
import { seedDonationsIfEmpty, createDonation, updateDonationStatus } from '../services/firestoreService.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { RazorpayDonateModal } from './donor/RazorpayDonateModal.tsx';
import { downloadDonationPDFReport } from '../services/pdfReportService.ts';
import { 
  Heart, 
  CheckCircle2, 
  Clock, 
  Search, 
  ShieldCheck, 
  ExternalLink, 
  Plus, 
  Filter, 
  AlertCircle,
  FileCheck2,
  Building2,
  RefreshCw,
  Download,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Myntra-style timeline steps
const TIMELINE_STEPS: { key: DonationStatus; title: string; desc: string }[] = [
  { key: 'Received', title: 'Received', desc: 'Distress allocation logged & pledge locked' },
  { key: 'Verifying', title: 'Verifying', desc: 'NDRF / Red Cross local ground audit' },
  { key: 'Approved', title: 'Approved', desc: 'Disaster coordinator disbursement sign-off' },
  { key: 'Transferred', title: 'Transferred', desc: 'Instant bank transfer to relief operations' },
  { key: 'Utilization Proof', title: 'Utilization Proof', desc: 'Geotagged relief distribution proof uploaded' },
  { key: 'Closed', title: 'Closed', desc: 'Field mission completed and audited' }
];

export const DonationsTracker: React.FC = () => {
  const { userProfile } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadPDF = async (donation: Donation) => {
    const key = donation.id || donation.sosReportId || 'current';
    try {
      setDownloadingId(key);
      await downloadDonationPDFReport(donation);
    } catch (err) {
      console.error('Failed to generate donation PDF:', err);
      alert('Could not generate PDF report. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Form State for new demo donation
  const [donorName, setDonorName] = useState<string>(userProfile?.name || '');
  const [amount, setAmount] = useState<number>(2500);
  const [locationName, setLocationName] = useState<string>('Assam Flood Relief Camp, Silchar');
  const [purpose, setPurpose] = useState<string>('Water purification units & emergency baby food kits');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    // Seed initial demo data into Firestore if empty
    seedDonationsIfEmpty();

    // Live subscription to Firestore 'donations' collection
    const donationsRef = collection(db, 'donations');
    const q = query(donationsRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Donation[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as Donation);
      });
      setDonations(items);
      setLoading(false);
      // default select first donation
      if (items.length > 0 && !selectedDonation) {
        setSelectedDonation(items[0]);
      }
    }, (error) => {
      console.error("Firestore donations subscription error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;
    setSubmitting(true);
    try {
      const newId = await createDonation({
        sosReportId: `SOS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        donorName: donorName || userProfile?.name || 'Anonymous Donor',
        donorUserId: userProfile?.uid,
        amount: Number(amount),
        status: 'Received',
        timestamp: Date.now(),
        sosLocationName: locationName,
        purpose: purpose,
        paymentMethod: 'UPI (Live Gateway)',
        proofNote: 'Pledge initiated. Field verifiers alerted.'
      });
      setShowNewModal(false);
    } catch (err) {
      console.error("Failed to create donation:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdvanceStatus = async (donation: Donation) => {
    if (!donation.id) return;
    const currentIndex = TIMELINE_STEPS.findIndex((s) => s.key === donation.status);
    if (currentIndex < TIMELINE_STEPS.length - 1) {
      const nextStatus = TIMELINE_STEPS[currentIndex + 1].key;
      await updateDonationStatus(donation.id, nextStatus);
      setSelectedDonation({ ...donation, status: nextStatus });
    }
  };

  const filteredDonations = donations.filter((d) => {
    const matchesSearch = 
      d.donorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.sosReportId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.sosLocationName && d.sosLocationName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = filterStatus === 'all' || d.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStepIndex = (status: DonationStatus) => {
    return TIMELINE_STEPS.findIndex((s) => s.key === status);
  };

  return (
    <div id="donations-tracker-container" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#F0294D] flex items-center justify-center shadow-xs">
              <Heart size={22} className="fill-[#F0294D]/20" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Disaster Relief Donation Ledger
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">
                100% Transparent, Geotagged Proof Tracking from Pledge to Field Delivery
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0F9D8F] hover:bg-[#0c8579] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md shadow-[#0F9D8F]/25 transition cursor-pointer"
          >
            <Plus size={16} />
            <span>Pledge Emergency Relief</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 my-5">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by SOS ID, donor, or location..."
            className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-gray-200 text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0F9D8F]/30 focus:border-[#0F9D8F]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-gray-400 shrink-0 flex items-center gap-1">
            <Filter size={12} /> Status:
          </span>
          {['all', 'Received', 'Verifying', 'Approved', 'Transferred', 'Utilization Proof', 'Closed'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                filterStatus === st
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {st === 'all' ? 'All Donations' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Donation List, Right Myntra-style Order Timeline Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Donation Cards */}
        <div className="lg:col-span-5 space-y-3 max-h-[700px] overflow-y-auto pr-1">
          {loading ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-gray-100 text-gray-400 text-sm">
              <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-[#0F9D8F]" />
              Loading real-time donations from Firestore...
            </div>
          ) : filteredDonations.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-gray-100 text-gray-400 text-sm">
              No matching donations found.
            </div>
          ) : (
            filteredDonations.map((item) => {
              const isSelected = selectedDonation?.id === item.id;
              const stepIdx = getStepIndex(item.status);

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedDonation(item)}
                  className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#0F9D8F] shadow-lg shadow-[#0F9D8F]/10 ring-2 ring-[#0F9D8F]/20'
                      : 'bg-white/80 hover:bg-white border-gray-100 hover:border-gray-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-mono">
                        {item.sosReportId}
                      </span>
                      <h4 className="text-sm sm:text-base font-extrabold text-gray-900 mt-1.5">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </h4>
                      <p className="text-xs text-gray-500 font-medium">{item.donorName}</p>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        item.status === 'Utilization Proof' || item.status === 'Closed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'Transferred'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  {item.sosLocationName && (
                    <p className="text-xs text-gray-400 mt-2 line-clamp-1">
                      📍 {item.sosLocationName}
                    </p>
                  )}

                  {/* Micro Progress Bar & Quick Action */}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#0F9D8F] h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${((stepIdx + 1) / TIMELINE_STEPS.length) * 100}%` }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadPDF(item);
                      }}
                      disabled={downloadingId === (item.id || item.sosReportId)}
                      className="px-2 py-0.5 rounded-lg bg-gray-50 hover:bg-teal-50 text-gray-600 hover:text-[#0F9D8F] border border-gray-200 text-[10px] font-bold flex items-center gap-1 transition shrink-0"
                      title="Download PDF"
                    >
                      {downloadingId === (item.id || item.sosReportId) ? (
                        <Loader2 size={10} className="animate-spin text-[#0F9D8F]" />
                      ) : (
                        <Download size={10} className="text-[#0F9D8F]" />
                      )}
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Detailed Myntra-Style Status Tracker */}
        <div className="lg:col-span-7">
          {selectedDonation ? (
            <div className="bg-white rounded-3xl sm:rounded-[36px] p-6 sm:p-8 shadow-xl border border-gray-100">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-gray-100 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-gray-400">
                      Tracking SOS Aid:
                    </span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 bg-gray-100 text-gray-800 rounded-md">
                      {selectedDonation.sosReportId}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">
                    ₹{selectedDonation.amount.toLocaleString('en-IN')} Relief Disbursement
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Contributed by <strong className="text-gray-900">{selectedDonation.donorName}</strong> • {new Date(selectedDonation.timestamp).toLocaleString()}
                  </p>
                </div>

                <div className="flex flex-col sm:items-end gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-gray-400">Current Phase:</span>
                    <span className="text-sm font-black text-[#0F9D8F] bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
                      {selectedDonation.status}
                    </span>
                  </div>

                  {/* Primary Download PDF Report Button in Detail Header */}
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF(selectedDonation)}
                    disabled={downloadingId === (selectedDonation.id || selectedDonation.sosReportId)}
                    className="px-4 py-2 bg-[#0F9D8F] hover:bg-[#0c8579] text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    title="Download real-time PDF accountability report"
                  >
                    {downloadingId === (selectedDonation.id || selectedDonation.sosReportId) ? (
                      <>
                        <Loader2 size={14} className="animate-spin text-white" />
                        <span>Generating Live Report...</span>
                      </>
                    ) : (
                      <>
                        <Download size={14} />
                        <span>Download PDF Report</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Mission Location & Purpose Card */}
              <div className="my-5 p-4 rounded-2xl bg-gray-50 border border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-400 font-medium">Distress Location</span>
                  <p className="text-gray-900 font-bold mt-0.5">
                    {selectedDonation.sosLocationName || 'Disaster Relief Sector'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">Designated Purpose</span>
                  <p className="text-gray-900 font-bold mt-0.5">
                    {selectedDonation.purpose || 'Emergency First-Aid and Relief Kits'}
                  </p>
                </div>
              </div>

              {/* MYNTRA-STYLE STATUS TIMELINE TRACKER */}
              <div className="my-6 pl-2 sm:pl-4">
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-gray-400 mb-6">
                  Disaster Relief Live Audit Journey
                </h4>

                <div className="relative pl-6 sm:pl-8 space-y-7 border-l-2 border-dashed border-gray-200">
                  {TIMELINE_STEPS.map((step, idx) => {
                    const currentIdx = getStepIndex(selectedDonation.status);
                    const isCompleted = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;

                    return (
                      <div key={step.key} className="relative group">
                        {/* Step Marker Node */}
                        <div
                          className={`absolute -left-[31px] sm:-left-[39px] top-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all ${
                            isCompleted
                              ? 'bg-[#0F9D8F] text-white shadow-md shadow-[#0F9D8F]/30 ring-4 ring-white'
                              : 'bg-gray-100 text-gray-400 border border-gray-200 ring-4 ring-white'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 size={16} className="stroke-[2.5]" />
                          ) : (
                            <span className="text-[11px] font-bold">{idx + 1}</span>
                          )}
                        </div>

                        {/* Step Content */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div>
                            <p
                              className={`text-sm font-bold ${
                                isCompleted ? 'text-gray-900' : 'text-gray-400'
                              } ${isCurrent ? 'text-[#0F9D8F]' : ''}`}
                            >
                              {step.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
                          </div>

                          {isCurrent && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0F9D8F] bg-teal-50 px-2 py-0.5 rounded-md self-start sm:self-auto shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#0F9D8F] animate-ping" />
                              In Progress
                            </span>
                          )}
                        </div>

                        {/* Special Proof Details for Utilization Proof */}
                        {step.key === 'Utilization Proof' && isCompleted && selectedDonation.proofNote && (
                          <div className="mt-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-900">
                            <div className="flex items-center gap-1.5 font-bold mb-1">
                              <FileCheck2 size={14} className="text-emerald-700" />
                              <span>Verified Geotagged Audit Note:</span>
                            </div>
                            <p className="text-emerald-800 text-[11px]">{selectedDonation.proofNote}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Demo Action: Advance Status for Interactive Verification */}
              <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  <span>Verified via Trahi Automated Multi-Party Escrow</span>
                </div>

                {getStepIndex(selectedDonation.status) < TIMELINE_STEPS.length - 1 && (
                  <button
                    onClick={() => handleAdvanceStatus(selectedDonation)}
                    className="w-full sm:w-auto px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    Simulate Next Stage ({TIMELINE_STEPS[getStepIndex(selectedDonation.status) + 1].title} →)
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 text-gray-400">
              Select a donation from the ledger to view the live Myntra-style status timeline.
            </div>
          )}
        </div>
      </div>

      {/* Razorpay Payment Gateway & Auth Gate Modal */}
      <RazorpayDonateModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        targetCrisisTitle="Disaster Relief Emergency Fund"
        targetLocationName="National Disaster Relief Campaign, India"
      />
    </div>
  );
};
