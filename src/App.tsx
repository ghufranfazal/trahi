import React, { useState } from 'react';
import { Header } from './components/Header.tsx';
import { SOSButton } from './components/SOSButton.tsx';
import { LocationMarker } from './components/LocationMarker.tsx';
import { AddressCard } from './components/AddressCard.tsx';
import { BottomNav } from './components/BottomNav.tsx';
import { SidebarNav } from './components/SidebarNav.tsx';
import { EmergencyPanel } from './components/EmergencyPanel.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';
import { DonationsTracker } from './components/DonationsTracker.tsx';
import { TabType } from './types.ts';
import { useAuth, AuthProvider } from './context/AuthContext.tsx';
import { createSOSReport } from './services/firestoreService.ts';
import { 
  Sparkles, 
  Heart, 
  User, 
  Home as HomeIcon, 
  ShieldCheck, 
  Radio, 
  CheckCircle2,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function MainApp() {
  const { user, userProfile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('sos');
  const [address, setAddress] = useState<string>(
    "12 Anywhere Street, Off Bulaba Estate, Ikeja, Lagos State, Nigeria."
  );
  const [sosTriggeredMessage, setSosTriggeredMessage] = useState<string | null>(null);

  // Trigger Firestore SOS Report
  const handleTriggerSOS = async () => {
    if (!user) return;
    try {
      // Create SOS record in Firestore with voiceUrl as null
      const reportId = await createSOSReport({
        userId: user.uid,
        voiceUrl: null, // As requested: leave voiceUrl as null for now
        transcript: "Emergency voice transcript: Distress signal activated by user.",
        latitude: 19.0760, // Sample default coordinates
        longitude: 72.8777,
        timestamp: Date.now(),
        status: 'active',
        userAddress: address,
      });

      setSosTriggeredMessage(`SOS distress packet saved to Firestore (${reportId})`);
      setTimeout(() => setSosTriggeredMessage(null), 4000);
    } catch (err) {
      console.error("Failed to post SOS to Firestore:", err);
    }
  };

  // 1. If checking auth state, show a clean loader
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#F7F7F8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0F9D8F]" />
          <p className="text-xs font-semibold text-gray-500">Connecting to Trahi Firebase Security Network...</p>
        </div>
      </div>
    );
  }

  // 2. If not authenticated, display Login Screen (Google Sign-In + Guest Anonymous Auth)
  if (!user) {
    return <LoginScreen />;
  }

  // 3. Authenticated App Layout (Responsive for Mobile, Tablet, and PC)
  return (
    <div 
      id="app-root-container" 
      className="min-h-screen w-full bg-[#F7F7F8] flex flex-col md:flex-row font-sans antialiased text-gray-900 select-none overflow-x-hidden"
    >
      {/* Tablet & Desktop Left Sidebar Navigation */}
      <SidebarNav activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />

      {/* Main Responsive Viewport Area */}
      <div className="flex-1 flex flex-col min-h-screen relative overflow-y-auto">
        {/* Top Header */}
        <Header />

        {/* Floating SOS broadcast notification banner if triggered */}
        <AnimatePresence>
          {sosTriggeredMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mx-4 sm:mx-8 my-2 p-3 bg-red-600 text-white rounded-2xl shadow-lg flex items-center justify-between text-xs sm:text-sm font-bold z-30"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="animate-bounce" />
                <span>{sosTriggeredMessage}</span>
              </div>
              <span className="text-[11px] bg-red-800 px-2 py-0.5 rounded-full font-mono">
                Firestore Connected
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Tab Body */}
        {activeTab === 'sos' ? (
          <main id="main-content-dashboard" className="flex-1 w-full flex flex-col justify-between">
            {/* Mobile View: Clean single-column layout */}
            <div className="md:hidden flex-1 flex flex-col items-center justify-center px-4 py-3">
              <SOSButton onTriggerSOS={handleTriggerSOS} />

              {/* Location Marker & Address Card on Mobile */}
              <div className="w-full flex flex-col items-center mt-3 mb-2">
                <LocationMarker 
                  avatarUrl="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                  name="User Location"
                />
                <AddressCard 
                  initialAddress={address} 
                  onAddressChange={(newAddr) => setAddress(newAddr)} 
                />
              </div>
            </div>

            {/* Tablet & PC View: 2-Column Responsive Emergency Command Station */}
            <div className="hidden md:grid md:grid-cols-12 gap-6 lg:gap-8 px-6 lg:px-10 py-4 flex-1 items-start max-w-7xl w-full mx-auto">
              {/* Left/Main Column: SOS Hero Console */}
              <div className="md:col-span-6 lg:col-span-7 flex flex-col items-center justify-center bg-white/70 backdrop-blur-xs rounded-3xl p-6 lg:p-10 border border-gray-200/60 shadow-[0_4px_25px_rgba(0,0,0,0.02)] min-h-[520px]">
                <SOSButton onTriggerSOS={handleTriggerSOS} />

                <div className="mt-4 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>Encrypted Distress Beacon Ready • Cloud Firestore Synced</span>
                </div>
              </div>

              {/* Right Column: Location Card & Direct Helplines */}
              <div className="md:col-span-6 lg:col-span-5 flex flex-col gap-5">
                {/* Location Marker & Address Card Container */}
                <div className="w-full flex flex-col items-center">
                  <LocationMarker 
                    avatarUrl="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                    name="User Location"
                  />
                  <AddressCard 
                    initialAddress={address} 
                    onAddressChange={(newAddr) => setAddress(newAddr)} 
                  />
                </div>

                {/* Emergency Dialers & Grid Telemetry */}
                <EmergencyPanel />
              </div>
            </div>
          </main>
        ) : activeTab === 'donate' ? (
          /* Donation Tracking Screen with Myntra-Style Timeline */
          <main className="flex-1 w-full overflow-y-auto">
            <DonationsTracker />
          </main>
        ) : (
          /* Secondary Tab Views (Home, TrahiGPT, Profile) */
          <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
            {activeTab === 'home' && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 w-full">
                <div className="w-14 h-14 bg-teal-50 text-[#0F9D8F] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <HomeIcon size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Trahi Safety Feed</h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Community safety alerts, verified disaster advisories, and volunteer emergency networks in your area.
                </p>
                <div className="mt-6 flex flex-col gap-2">
                  <button
                    onClick={() => setActiveTab('donate')}
                    className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition cursor-pointer"
                  >
                    View Donation Tracking Ledger →
                  </button>
                  <button
                    onClick={() => setActiveTab('sos')}
                    className="px-6 py-2.5 bg-[#0F9D8F] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#0c8579] transition cursor-pointer"
                  >
                    Return to SOS Radar
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'trahigpt' && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 w-full">
                <div className="w-14 h-14 bg-teal-50 text-[#0F9D8F] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">TrahiGPT First-Aid AI</h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Instant guidance for CPR, burn treatment, trauma triage, snake bites, and disaster preparedness in over 12 Indian regional languages.
                </p>
                <button
                  onClick={() => setActiveTab('sos')}
                  className="mt-6 px-6 py-2.5 bg-[#0F9D8F] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#0c8579] transition cursor-pointer"
                >
                  Open Emergency SOS
                </button>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 w-full">
                <div className="w-16 h-16 rounded-full border-2 border-[#0F9D8F] p-0.5 overflow-hidden mx-auto mb-3">
                  <img
                    src={
                      userProfile?.authType === 'google'
                        ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile?.name || 'Google'}`
                        : 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
                    }
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{userProfile?.name}</h3>
                <p className="text-xs text-[#0F9D8F] mt-1 font-bold">
                  {userProfile?.authType === 'google' ? 'Verified Google Donor' : 'Anonymous Emergency Victim'}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  User ID: <code className="font-mono text-[11px]">{userProfile?.uid}</code>
                </p>
                <button
                  onClick={() => setActiveTab('sos')}
                  className="mt-6 px-6 py-2.5 bg-[#0F9D8F] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#0c8579] transition cursor-pointer"
                >
                  Return to SOS Radar
                </button>
              </div>
            )}
          </main>
        )}

        {/* Mobile Bottom Navigation Tray (hidden on tablet/PC) */}
        <BottomNav 
          activeTab={activeTab} 
          onTabChange={(tab) => setActiveTab(tab)} 
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
