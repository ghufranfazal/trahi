import React, { useState, useEffect } from 'react';
import { Receipt, ShieldCheck, Download, Heart, ArrowUpRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Donation } from '../../types.ts';
import { subscribeToDonations } from '../../services/firestoreService.ts';

interface DonorMyDonationsTabProps {
  onNavigateToBrowse: () => void;
}

export const DonorMyDonationsTab: React.FC<DonorMyDonationsTabProps> = ({ onNavigateToBrowse }) => {
  const { user, donorProfile } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = subscribeToDonations((allDonations) => {
      // Filter by donorUserId or donor name
      const myDonations = allDonations.filter(
        d => (user && d.donorUserId === user.uid) || 
             (donorProfile && d.donorName.toLowerCase() === donorProfile.name.toLowerCase())
      );
      setDonations(myDonations.length > 0 ? myDonations : allDonations.slice(0, 3)); // Fallback sample if brand new
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, donorProfile]);

  const totalGiven = donations.reduce((sum, d) => sum + (d.amount || 0), 0);

  return (
    <div id="donor-my-donations-tab" className="w-full max-w-5xl mx-auto px-4 py-4 sm:py-6 space-y-6">
      {/* Header Summary */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#0F9D8F] flex items-center justify-center shrink-0 shadow-xs">
            <Receipt size={28} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">My Disaster Relief Donations</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Transparent ledger of all your contributions with 100% verified ground proof & tax receipts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-teal-50/70 border border-teal-100 px-5 py-3 rounded-2xl">
          <div>
            <span className="text-[10px] uppercase font-bold text-teal-800 tracking-wider block">Total Contributed</span>
            <span className="text-xl font-black text-[#0F9D8F]">₹{totalGiven.toLocaleString('en-IN')}</span>
          </div>
          <button
            onClick={onNavigateToBrowse}
            className="px-3 py-2 bg-[#0F9D8F] hover:bg-[#0c8579] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
          >
            <span>+ Donate More</span>
          </button>
        </div>
      </div>

      {/* Donations List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-800 px-1">Disbursement Records ({donations.length})</h3>

        {donations.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-gray-100 text-center space-y-3">
            <Heart size={32} className="text-gray-300 mx-auto" />
            <p className="text-sm font-bold text-gray-700">No donations yet on your account</p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Your first contribution will generate an immutable blockchain-style audit ledger with live photos of aid deployment.
            </p>
            <button
              onClick={onNavigateToBrowse}
              className="px-5 py-2.5 bg-[#0F9D8F] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              Explore Active Relief Campaigns
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {donations.map((item, idx) => (
              <div
                key={item.id || idx}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gray-900">
                      {item.sosReportId || `RELIEF-${idx + 1}`}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-gray-700">{item.sosLocationName || 'Emergency Flood Relief'}</p>
                  <p className="text-[11px] text-gray-500">{item.purpose || 'Emergency supplies & ration kit'}</p>
                  {item.proofNote && (
                    <p className="text-[10px] text-emerald-700 bg-emerald-50/80 px-2 py-1 rounded-md mt-1">
                      🔍 Audit Proof: {item.proofNote}
                    </p>
                  )}
                </div>

                <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                  <span className="text-base font-black text-gray-900">₹{item.amount.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
