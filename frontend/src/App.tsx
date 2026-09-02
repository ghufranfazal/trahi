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
import { HomeDashboard } from './components/home/HomeDashboard.tsx';
import { TrahiGPTView } from './components/trahigpt/TrahiGPTView.tsx';
import { PreparednessTab } from './components/preparedness/PreparednessTab.tsx';
import { TabType, DonorProfile, DonorTabType, SafetyCircleMember } from './types.ts';
import { useAuth, AuthProvider } from './context/AuthContext.tsx';
import { useLocation, LocationProvider } from './context/LocationContext.tsx';
import { NetworkProvider } from './context/NetworkContext.tsx';
import { SMSDispatchModal } from './components/network/SMSDispatchModal.tsx';
import { BLEMeshDemoModal } from './components/network/BLEMeshDemoModal.tsx';
import { FamilySafetyPingWidget } from './components/safety/FamilySafetyPingWidget.tsx';
import { createSOSReport, subscribeToMySafetyCircle } from './services/firestoreService.ts';
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
  const [donorInitialTab, setDonorInitialTab] = useState<DonorTabType>('donate');
  const [sosTriggeredMessage, setSosTriggeredMessage] = useState<string | null>(null);
  const [safetyMembers, setSafetyMembers] = useState<SafetyCircleMember[]>([]);

  // Subscribe to user safety circle members in real-time
  React.useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToMySafetyCircle(user.uid, (data) => setSafetyMembers(data));
    return () => unsub();
  }, [user]);

  // Handle SOS success callback
  const handleSOSSuccess = (result: any) => {
    setSosTriggeredMessage(`SOS Distress Beacon Logged [${result.category}]: ${result.reportId.slice(0, 10)}...`);
    setTimeout(() => setSosTriggeredMessage(null), 6000);
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
        initialTab={donorInitialTab}
        onBackToTrahi={() => {
          setIsInDonorMode(false);
          setDonorInitialTab('donate');
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
          <main id="main-content-dashboard" className="flex-1 w-full flex flex-col justify-between pb-24 md:pb-0">
            {/* Mobile View: Clean single-column layout */}
            <div className="md:hidden flex-1 flex flex-col items-center justify-center px-4 py-3 space-y-4">
              <SOSButton onSOSSuccess={handleSOSSuccess} />

              {/* Location Map Widget placed below circular SOS pulse button */}
              <div className="w-full flex justify-center pb-2">
                <LocationMapWidget />
              </div>

              {/* Mobile 1-Tap Safety Circle & Family Ping */}
              <div className="w-full max-w-sm">
                <FamilySafetyPingWidget
                  familyMembers={safetyMembers}
                  onOpenAddMember={() => setActiveTab('profile')}
                />
              </div>
            </div>

            {/* Tablet & PC View: 2-Column Responsive Emergency Command Station */}
            <div className="hidden md:grid md:grid-cols-12 gap-6 lg:gap-8 px-6 lg:px-10 py-4 flex-1 items-start max-w-7xl w-full mx-auto">
              {/* Left/Main Column: SOS Hero Console + Embedded Map Widget */}
              <div className="md:col-span-6 lg:col-span-7 flex flex-col items-center justify-center bg-white/70 backdrop-blur-xs rounded-3xl p-6 lg:p-8 border border-gray-200/60 shadow-[0_4px_25px_rgba(0,0,0,0.02)] space-y-6">
                <SOSButton onSOSSuccess={handleSOSSuccess} />

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
          <main className="flex-1 w-full overflow-y-auto py-4 pb-24 md:pb-6">
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
          <main className="flex-1 w-full overflow-y-auto pb-24 md:pb-6">
            <ProfileView onNavigateToSOS={() => setActiveTab('sos')} />
          </main>
        ) : activeTab === 'preparedness' ? (
          /* Regional Hazard Engine & Dynamic Preparedness Safety Kit */
          <main className="flex-1 w-full overflow-y-auto pb-24 md:pb-6">
            <PreparednessTab />
          </main>
        ) : activeTab === 'home' ? (
          /* Situational Awareness & Community Overview Dashboard */
          <main className="flex-1 w-full overflow-y-auto pb-24 md:pb-6">
            <HomeDashboard
              onNavigateToSOS={() => setActiveTab('sos')}
              onNavigateToTrahiGPT={() => setActiveTab('trahigpt')}
              onNavigateToDonate={() => handleTabSelect('donate')}
              onNavigateToCrisisMap={() => {
                setDonorInitialTab('map');
                if (isGoogleUser && donorProfile) {
                  setIsInDonorMode(true);
                } else {
                  handleTabSelect('donate');
                }
              }}
            />
          </main>
        ) : (
          /* Dedicated TrahiGPT Window View */
          <TrahiGPTView
            onBackToSOS={() => setActiveTab('sos')}
            onOpenProfile={() => setActiveTab('profile')}
          />
        )}

        {/* Mobile Bottom Navigation Tray (hidden on tablet/PC) */}
        <BottomNav 
          activeTab={activeTab} 
          onTabChange={handleTabSelect} 
        />

        {/* Global Network Dispatch Modals */}
        <SMSDispatchModal />
        <BLEMeshDemoModal />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <NetworkProvider>
          <MainApp />
        </NetworkProvider>
      </LocationProvider>
    </AuthProvider>
  );
}

