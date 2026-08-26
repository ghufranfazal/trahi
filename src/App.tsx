import React, { useState } from 'react';
import { Header } from './components/Header.tsx';
import { SOSButton } from './components/SOSButton.tsx';
import { LocationMapWidget } from './components/LocationMapWidget.tsx';
import { LocationPermissionGate } from './components/LocationPermissionGate.tsx';
import { BottomNav } from './components/BottomNav.tsx';
import { SidebarNav } from './components/SidebarNav.tsx';
import { EmergencyPanel } from './components/EmergencyPanel.tsx';
import { ProfileView } from './components/ProfileView.tsx';
import { ProfileCompletionBanner } from './components/ProfileCompletionBanner.tsx';
import { DonorSignIn } from './components/donor/DonorSignIn.tsx';
import { DonorProfileSetup } from './components/donor/DonorProfileSetup.tsx';
import { DonorPageShell } from './components/donor/DonorPageShell.tsx';
import { TabType, DonorProfile } from './types.ts';
import { useAuth, AuthProvider } from './context/AuthContext.tsx';
import { useLocation, LocationProvider } from './context/LocationContext.tsx';
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
  const { 
    user, 
    userProfile, 
    donorProfile, 
    isGoogleUser, 
    donorLoading, 
    loading: authLoading,
    updateDonorProfileState 
  } = useAuth();
  
  const { location, permissionState } = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>('sos');
  const [isInDonorMode, setIsInDonorMode] = useState<boolean>(false);
  const [sosTriggeredMessage, setSosTriggeredMessage] = useState<string | null>(null);

  // Trigger Firestore SOS Report with real GPS telemetry
  const handleTriggerSOS = async () => {
    if (!user) return;
    try {
      const lat = location?.latitude ?? 19.0760;
      const lng = location?.longitude ?? 72.8777;
      const userAddr = location?.formattedAddress || "Current GPS Location";

      const reportId = await createSOSReport({
        userId: user.uid,
        voiceUrl: null,
        transcript: "Emergency voice transcript: Distress signal activated by user.",
        latitude: lat,
        longitude: lng,
        timestamp: Date.now(),
        status: 'active',
        userAddress: userAddr,
      });

      setSosTriggeredMessage(`SOS distress beacon logged (${reportId})`);
      setTimeout(() => setSosTriggeredMessage(null), 4000);
    } catch (err) {
      console.error("Failed to post SOS to Firestore:", err);
    }
  };

  // 1. If checking auth state, show a clean loader
  if (authLoading) {
    return (
      <div className="min-h-screen w-full bg-[#F7F7F8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0F9D8F]" />
          <p className="text-xs font-semibold text-gray-500">Connecting to Trahi Emergency Network...</p>
        </div>
      </div>
    );
  }

  // 2. Mandatory Location Permission Enforcement:
  // If location permission is NOT granted, block access and show full-screen location gate
  if (permissionState !== 'granted') {
    return <LocationPermissionGate />;
  }

  // 3. Check if user is in full Donor Experience Mode
  // If signed in with Google, has a donor profile, and entered the donor experience:
  if (isInDonorMode && isGoogleUser && donorProfile) {
    return (
      <DonorPageShell
        onBackToTrahi={() => {
          setIsInDonorMode(false);
          setActiveTab('sos');
        }}
      />
    );
  }

  const handleTabSelect = (tab: TabType) => {
    if (tab === 'donate') {
      if (isGoogleUser && donorProfile) {
        setIsInDonorMode(true);
        return;
      }
    }
    setActiveTab(tab);
  };

  const handleDonorProfileCreated = (newDonor: DonorProfile) => {
    updateDonorProfileState(newDonor);
    setIsInDonorMode(true);
  };

  // 4. Main App Shell (Anonymous / SOS Emergency Mode)
  return (
    <div 
      id="app-root-container" 
      className="min-h-screen w-full bg-[#F7F7F8] flex flex-col md:flex-row font-sans antialiased text-gray-900 select-none overflow-x-hidden"
    >
      {/* Tablet & Desktop Left Sidebar Navigation */}
      <SidebarNav activeTab={activeTab} onTabChange={handleTabSelect} />

      {/* Main Responsive Viewport Area */}
      <div className="flex-1 flex flex-col min-h-screen relative overflow-y-auto">
        {/* Top Header */}
        <Header onOpenProfile={() => setActiveTab('profile')} />

        {/* Dismissible Profile Incomplete Reminder Banner on Home / SOS screens */}
        {(activeTab === 'sos' || activeTab === 'home') && (
          <ProfileCompletionBanner onNavigateToProfile={() => setActiveTab('profile')} />
        )}

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
                Firestore Synced
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Tab Body */}
        {activeTab === 'sos' ? (
          <main id="main-content-dashboard" className="flex-1 w-full flex flex-col justify-between">
            {/* Mobile View: Clean single-column layout */}
            <div className="md:hidden flex-1 flex flex-col items-center justify-center px-4 py-3 space-y-4">
              <SOSButton onTriggerSOS={handleTriggerSOS} />

              {/* Location Map Widget placed below circular SOS pulse button */}
              <div className="w-full flex justify-center pb-2">
                <LocationMapWidget />
              </div>
            </div>

            {/* Tablet & PC View: 2-Column Responsive Emergency Command Station */}
            <div className="hidden md:grid md:grid-cols-12 gap-6 lg:gap-8 px-6 lg:px-10 py-4 flex-1 items-start max-w-7xl w-full mx-auto">
              {/* Left/Main Column: SOS Hero Console + Embedded Map Widget */}
              <div className="md:col-span-6 lg:col-span-7 flex flex-col items-center justify-center bg-white/70 backdrop-blur-xs rounded-3xl p-6 lg:p-8 border border-gray-200/60 shadow-[0_4px_25px_rgba(0,0,0,0.02)] space-y-6">
                <SOSButton onTriggerSOS={handleTriggerSOS} />

                {/* Location Map Widget directly below the SOS Button */}
                <div className="w-full max-w-md">
                  <LocationMapWidget />
                </div>
              </div>

              {/* Right Column: Direct Helplines & Emergency Telemetry */}
              <div className="md:col-span-6 lg:col-span-5 flex flex-col gap-5">
                <EmergencyPanel />
              </div>
            </div>
          </main>
        ) : activeTab === 'donate' ? (
          /* Donate Flow: Check if signed in with Google & Donor Profile status */
          <main className="flex-1 w-full overflow-y-auto py-4">
            {!isGoogleUser ? (
              <DonorSignIn 
                onSignedIn={() => {
                  if (donorProfile) {
                    setIsInDonorMode(true);
                  }
                }} 
              />
            ) : donorLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[350px] gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-[#0F9D8F]" />
                <p className="text-xs font-semibold text-gray-500">Checking verified donor profile...</p>
              </div>
            ) : !donorProfile ? (
              <DonorProfileSetup onProfileCreated={handleDonorProfileCreated} />
            ) : (
              <div className="max-w-md mx-auto p-6 bg-white rounded-3xl text-center space-y-4 border border-gray-100 shadow-sm mt-8">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#0F9D8F] flex items-center justify-center mx-auto">
                  <Heart size={28} className="fill-[#0F9D8F]/20" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Welcome, {donorProfile.name}!</h3>
                <p className="text-xs text-gray-500">Your verified donor account is active.</p>
                <button
                  onClick={() => setIsInDonorMode(true)}
                  className="w-full py-3 bg-[#0F9D8F] hover:bg-[#0c8579] text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  Enter Donor Portal →
                </button>
              </div>
            )}
          </main>
        ) : activeTab === 'profile' ? (
          /* User Profile Screen with Firestore Data Sync */
          <main className="flex-1 w-full overflow-y-auto">
            <ProfileView onNavigateToSOS={() => setActiveTab('sos')} />
          </main>
        ) : (
          /* Secondary Tab Views (Home, TrahiGPT) */
          <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
            {activeTab === 'home' && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 w-full space-y-4">
                <div className="w-14 h-14 bg-teal-50 text-[#0F9D8F] rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <HomeIcon size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Trahi Safety Network</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Real-time disaster relief broadcasts, emergency medical routing, and transparent donor disbursement tracking.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2 text-left">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="p-3.5 rounded-2xl bg-teal-50/70 hover:bg-teal-100/60 border border-teal-100 transition text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F9D8F]">
                      <User size={14} />
                      <span>Medical Profile</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {userProfile?.profileCompleted ? '✓ Profile Synced' : '⚠️ Action Recommended'}
                    </p>
                  </button>

                  <button
                    onClick={() => handleTabSelect('donate')}
                    className="p-3.5 rounded-2xl bg-amber-50/70 hover:bg-amber-100/60 border border-amber-100 transition text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                      <Heart size={14} />
                      <span>Relief Ledger</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">Live 6-stage audits</p>
                  </button>
                </div>

                <div className="pt-3">
                  <button
                    onClick={() => setActiveTab('sos')}
                    className="w-full py-3 bg-[#0F9D8F] hover:bg-[#0c8579] text-white rounded-2xl text-xs font-bold shadow-md shadow-[#0F9D8F]/25 transition cursor-pointer"
                  >
                    Open Emergency SOS Console →
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'trahigpt' && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 w-full space-y-4">
                <div className="w-14 h-14 bg-teal-50 text-[#0F9D8F] rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Sparkles size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">TrahiGPT First-Aid AI</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Instant guidance for CPR, burn treatment, trauma triage, snake bites, and disaster preparedness in over 12 Indian regional languages.
                </p>
                <button
                  onClick={() => setActiveTab('sos')}
                  className="w-full py-3 bg-[#0F9D8F] text-white rounded-2xl text-xs font-bold shadow-md hover:bg-[#0c8579] transition cursor-pointer"
                >
                  Open Emergency SOS
                </button>
              </div>
            )}
          </main>
        )}

        {/* Mobile Bottom Navigation Tray (hidden on tablet/PC) */}
        <BottomNav 
          activeTab={activeTab} 
          onTabChange={handleTabSelect} 
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <MainApp />
      </LocationProvider>
    </AuthProvider>
  );
}

