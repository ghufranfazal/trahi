import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Heart, 
  Map, 
  HeartHandshake, 
  Receipt, 
  User, 
  ShieldCheck, 
  AlertCircle,
  Radio
} from 'lucide-react';
import { DonorTabType } from '../../types.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { DonorBottomNav } from './DonorBottomNav.tsx';
import { DonorProfileTab } from './DonorProfileTab.tsx';
import { DonorCrisisMapTab } from './DonorCrisisMapTab.tsx';
import { DonorBrowseDonateTab } from './DonorBrowseDonateTab.tsx';
import { DonorMyDonationsTab } from './DonorMyDonationsTab.tsx';

interface DonorPageShellProps {
  onBackToTrahi: () => void;
  initialTab?: DonorTabType;
}

export const DonorPageShell: React.FC<DonorPageShellProps> = ({ 
  onBackToTrahi,
  initialTab = 'donate'
}) => {
  const { user, donorProfile } = useAuth();
  
  // Default active tab when entering the Donor Page
  const [donorActiveTab, setDonorActiveTab] = useState<DonorTabType>(initialTab);

  const avatarUrl = user?.uid 
    ? `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.uid}` 
    : 'https://api.dicebear.com/9.x/avataaars/svg?seed=donor';

  return (
    <div id="donor-portal-root" className="min-h-screen bg-[#F8FAFC] text-gray-900 flex flex-col font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* Dedicated Donor Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Left: Back button & Donor Branding */}
          <div className="flex items-center gap-3">
            <button
              id="donor-top-back-btn"
              onClick={onBackToTrahi}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back to Trahi SOS</span>
              <span className="sm:hidden">Trahi SOS</span>
            </button>

            <div className="h-5 w-px bg-gray-200 mx-1 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#0F9D8F] text-white flex items-center justify-center shadow-xs">
                <Heart size={16} className="fill-white/30 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base sm:text-lg font-black text-gray-900 leading-tight">Trahi Relief</h1>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-teal-100 text-[#0F9D8F]">
                    Donor Portal
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-gray-100/80 p-1 rounded-2xl border border-gray-200/60">
            <button
              onClick={() => setDonorActiveTab('map')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                donorActiveTab === 'map' ? 'bg-white text-[#0F9D8F] shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Map size={14} />
              <span>Crisis Map</span>
            </button>
            <button
              onClick={() => setDonorActiveTab('donate')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                donorActiveTab === 'donate' ? 'bg-white text-[#0F9D8F] shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <HeartHandshake size={14} />
              <span>Browse & Donate</span>
            </button>
            <button
              onClick={() => setDonorActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                donorActiveTab === 'history' ? 'bg-white text-[#0F9D8F] shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Receipt size={14} />
              <span>My Donations</span>
            </button>
            <button
              onClick={() => setDonorActiveTab('profile')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                donorActiveTab === 'profile' ? 'bg-white text-[#0F9D8F] shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User size={14} />
              <span>Profile</span>
            </button>
          </nav>

          {/* Right: Donor Account Quick Pill */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDonorActiveTab('profile')}
              className="flex items-center gap-2 pl-2 pr-3 py-1 bg-gray-50 hover:bg-gray-100 rounded-full border border-gray-200 transition cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full overflow-hidden border border-teal-500">
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <span className="text-xs font-bold text-gray-800 max-w-[90px] sm:max-w-[120px] truncate">
                {donorProfile?.name || 'Verified Donor'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 ${donorActiveTab === 'map' ? 'pb-16 md:pb-0 pt-0 flex flex-col' : 'pb-24 md:pb-12 pt-3 sm:pt-6'}`}>
        <AnimatePresence mode="wait">
          {donorActiveTab === 'map' && (
            <motion.div
              key="donor-map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col w-full h-full"
            >
              <DonorCrisisMapTab onNavigateToDonate={() => setDonorActiveTab('donate')} />
            </motion.div>
          )}

          {donorActiveTab === 'donate' && (
            <motion.div
              key="donor-donate"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <DonorBrowseDonateTab />
            </motion.div>
          )}

          {donorActiveTab === 'history' && (
            <motion.div
              key="donor-history"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <DonorMyDonationsTab onNavigateToBrowse={() => setDonorActiveTab('donate')} />
            </motion.div>
          )}

          {donorActiveTab === 'profile' && (
            <motion.div
              key="donor-profile"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <DonorProfileTab onBackToTrahi={onBackToTrahi} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Dedicated Donor Bottom Navigation Tray (5 items) */}
      <DonorBottomNav
        activeTab={donorActiveTab}
        onTabChange={(newTab) => {
          if (newTab === 'back') {
            onBackToTrahi();
          } else {
            setDonorActiveTab(newTab);
          }
        }}
        onBackToTrahi={onBackToTrahi}
      />
    </div>
  );
};
