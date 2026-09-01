import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Siren, 
  Sparkles, 
  AlertTriangle, 
  Activity, 
  Flame, 
  Clock, 
  MapPin, 
  Search, 
  Filter, 
  HeartHandshake, 
  Radio, 
  ShieldAlert, 
  Volume2, 
  X, 
  ChevronRight, 
  SlidersHorizontal,
  Compass,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  Layers,
  ArrowRight
} from 'lucide-react';
import { SOSReport, EmergencyCategory } from '../../types.ts';
import { FormattedEarthquake, fetchLiveEarthquakes, formatTimeAgo } from '../../services/earthquakeService.ts';
import { subscribeToSOSReports } from '../../services/firestoreService.ts';
import { calculateDistanceMeters } from '../../services/locationService.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLocation } from '../../context/LocationContext.tsx';
import { getCategoryConfig, CATEGORY_CONFIGS } from '../donor/DonorCrisisMapTab.tsx';
import { CrisisDetailsModal, SelectedCrisisItem } from '../donor/CrisisDetailsModal.tsx';
import { HomeMiniCrisisMap } from './HomeMiniCrisisMap.tsx';
import { RazorpayDonateModal } from '../donor/RazorpayDonateModal.tsx';

interface HomeDashboardProps {
  onNavigateToSOS: () => void;
  onNavigateToTrahiGPT: () => void;
  onNavigateToDonate: () => void;
  onNavigateToCrisisMap: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onNavigateToSOS,
  onNavigateToTrahiGPT,
  onNavigateToDonate,
  onNavigateToCrisisMap,
}) => {
  const { user, isGoogleUser } = useAuth();
  const { location } = useLocation();

  // Primary Data States
  const [sosReports, setSosReports] = useState<SOSReport[]>([]);
  const [earthquakes, setEarthquakes] = useState<FormattedEarthquake[]>([]);
  const [loadingReports, setLoadingReports] = useState<boolean>(true);
  const [alertDismissed, setAlertDismissed] = useState<boolean>(false);

  // Filter and Search States
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [radiusKm, setRadiusKm] = useState<number>(0); // 0 = All India
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [selectedCrisisItem, setSelectedCrisisItem] = useState<SelectedCrisisItem | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [paymentTargetTitle, setPaymentTargetTitle] = useState<string>('Disaster Relief Assistance Fund');
  const [paymentTargetSosId, setPaymentTargetSosId] = useState<string | undefined>(undefined);
  const [isGoogleLoginModalOpen, setIsGoogleLoginModalOpen] = useState<boolean>(false);

  // 1. Subscribe to Firestore "sos_reports" collection in real time
  useEffect(() => {
    setLoadingReports(true);
    const unsubscribe = subscribeToSOSReports((reports) => {
      setSosReports(reports);
      setLoadingReports(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch live USGS earthquakes
  const loadEarthquakeData = useCallback(async () => {
    try {
      const data = await fetchLiveEarthquakes();
      setEarthquakes(data);
    } catch (err) {
      console.warn("USGS earthquake feed fetch error in Home:", err);
    }
  }, []);

  useEffect(() => {
    loadEarthquakeData();
  }, [loadEarthquakeData]);

  // Compute Active Critical Alert (USGS Quake >= 4.0 or recent critical report)
  const criticalAlert = useMemo(() => {
    if (alertDismissed) return null;

    // Check recent significant earthquakes
    const significantQuake = earthquakes.find(
      (eq) => eq.magnitude >= 4.5 || (Date.now() - eq.time < 3600 * 1000 * 24 && eq.magnitude >= 4.0)
    );
    if (significantQuake) {
      return {
        id: significantQuake.id,
        type: 'earthquake',
        title: `USGS Alert: M${significantQuake.magnitude.toFixed(1)} Earthquake — ${significantQuake.place}`,
        subtitle: `Hypocenter depth ${significantQuake.depthKm} km • ${significantQuake.timeAgo}`,
        actionLabel: 'View Seismic Event',
        data: significantQuake,
      };
    }

    // Check if there is an active high-urgency SOS report
    const criticalSOS = sosReports.find((r) => r.status === 'active' && (r.category === 'Flood' || r.category === 'Building Collapse'));
    if (criticalSOS) {
      return {
        id: criticalSOS.id || 'sos-alert',
        type: 'sos',
        title: `Critical SOS Broadcast: ${criticalSOS.category} Incident`,
        subtitle: criticalSOS.userAddress || 'Urgent responder assistance requested',
        actionLabel: 'View Incident',
        data: criticalSOS,
      };
    }

    return null;
  }, [earthquakes, sosReports, alertDismissed]);

  // Compute user's pinned active cases
  const userPinnedCases = useMemo(() => {
    if (!user?.uid) return [];
    return sosReports.filter(
      (r) => (r.userId === user.uid || (user.email && r.userId === user.email))
    );
  }, [sosReports, user]);

  // Calculate distance for SOS reports if user location is available
  const reportsWithDistance = useMemo(() => {
    return sosReports.map((report) => {
      let distKm: number | null = null;
      if (location?.latitude && location?.longitude && report.latitude && report.longitude) {
        const meters = calculateDistanceMeters(
          location.latitude,
          location.longitude,
          report.latitude,
          report.longitude
        );
        distKm = Math.round((meters / 1000) * 10) / 10;
      }
      return {
        ...report,
        distanceKm: distKm,
      };
    });
  }, [sosReports, location]);

  // Quick Stats Calculations
  const quickStats = useMemo(() => {
    const activeCount = sosReports.filter((r) => !r.status || r.status === 'active').length;
    
    // Nearby count within 100 km (or all active if location not available)
    const nearbyCount = reportsWithDistance.filter(
      (r) => (!r.status || r.status === 'active') && (r.distanceKm === null || r.distanceKm <= 100)
    ).length;

    // Distinct disaster categories today
    const categoriesToday = new Set(
      sosReports
        .filter((r) => Date.now() - r.timestamp < 3600 * 1000 * 24)
        .map((r) => r.category || 'Other')
    );
    if (earthquakes.length > 0) {
      categoriesToday.add('Earthquake');
    }

    return {
      activeNearby: nearbyCount || activeCount,
      activeDisastersToday: Math.max(categoriesToday.size, 1),
      totalBroadcasts: sosReports.length,
    };
  }, [sosReports, reportsWithDistance, earthquakes]);

  // Filtered Live Feed List
  const filteredFeed = useMemo(() => {
    return reportsWithDistance.filter((item) => {
      // 1. Category Filter
      if (selectedCategory !== 'all') {
        const config = getCategoryConfig(item.category);
        if (config.key.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // 2. Distance Radius Filter
      if (radiusKm > 0) {
        if (item.distanceKm !== null && item.distanceKm > radiusKm) {
          return false;
        }
      }

      // 3. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTranscript = item.transcript?.toLowerCase().includes(q);
        const matchesAddress = item.userAddress?.toLowerCase().includes(q);
        const matchesCategory = item.category?.toLowerCase().includes(q);
        if (!matchesTranscript && !matchesAddress && !matchesCategory) {
          return false;
        }
      }

      return true;
    });
  }, [reportsWithDistance, selectedCategory, radiusKm, searchQuery]);

  // Donate flow trigger: open Razorpay Donate Modal (Auth Gate & Checkout handled inside modal)
  const handleTriggerDonate = (crisisTitle?: string, reportId?: string) => {
    setPaymentTargetTitle(crisisTitle || 'Emergency Disaster Relief Fund');
    setPaymentTargetSosId(reportId);
    setIsPaymentModalOpen(true);
  };

  return (
    <div id="home-situational-dashboard" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 select-none">
      {/* ========================================================================= */}
      {/* 1. QUICK STATS BAR (Top Overview)                                         */}
      {/* ========================================================================= */}
      <section id="home-quick-stats-bar" aria-label="Overview Statistics">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {/* Card 1: Active SOS Nearby */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex items-center gap-3.5 transition hover:shadow-md">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <Siren size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-gray-900 leading-none">
                  {quickStats.activeNearby}
                </span>
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping shrink-0" />
              </div>
              <p className="text-xs sm:text-sm font-extrabold text-gray-700 mt-1">
                Active SOS Nearby
              </p>
              <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">
                Live ground broadcasts
              </span>
            </div>
          </div>

          {/* Card 2: Active Disasters Today */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex items-center gap-3.5 transition hover:shadow-md">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
              <Flame size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-gray-900 leading-none">
                  {quickStats.activeDisastersToday}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-extrabold text-gray-700 mt-1">
                Active Disasters Today
              </p>
              <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">
                USGS + Verified Floods/Fires
              </span>
            </div>
          </div>

          {/* Card 3: Live Grid / Total Responses */}
          <div className="col-span-2 md:col-span-1 p-4 sm:p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex items-center gap-3.5 transition hover:shadow-md">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-teal-50 text-[#0F9D8F] flex items-center justify-center shrink-0">
              <Radio size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-gray-900 leading-none">
                  {quickStats.totalBroadcasts}
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-100 text-[#0F9D8F] uppercase">
                  Online
                </span>
              </div>
              <p className="text-xs sm:text-sm font-extrabold text-gray-700 mt-1">
                Total Distress Signals
              </p>
              <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">
                Synced in real-time
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. LIVE DISASTER ALERT BANNER (Conditional & Dismissible)                 */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {criticalAlert && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="p-4 sm:p-4.5 rounded-3xl bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative overflow-hidden"
          >
            {/* Left Info */}
            <div className="flex items-start gap-3 min-w-0 pr-8 sm:pr-0">
              <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0 backdrop-blur-xs">
                <AlertTriangle size={20} className="animate-bounce" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-black/25 text-white tracking-wider">
                    Emergency Advisory
                  </span>
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                </div>
                <h4 className="text-sm sm:text-base font-black text-white leading-tight mt-0.5 truncate">
                  {criticalAlert.title}
                </h4>
                <p className="text-xs text-white/90 font-medium mt-0.5">
                  {criticalAlert.subtitle}
                </p>
              </div>
            </div>

            {/* Right Action & Dismiss */}
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (criticalAlert.type === 'earthquake') {
                    setSelectedCrisisItem({ type: 'earthquake', data: criticalAlert.data as FormattedEarthquake });
                  } else {
                    setSelectedCrisisItem({ type: 'sos', data: criticalAlert.data as SOSReport });
                  }
                }}
                className="px-3.5 py-2 bg-white text-gray-900 hover:bg-white/90 font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>{criticalAlert.actionLabel}</span>
                <ChevronRight size={14} />
              </button>

              <button
                type="button"
                onClick={() => setAlertDismissed(true)}
                className="w-8 h-8 rounded-xl bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition cursor-pointer"
                title="Dismiss Alert"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 3. QUICK ACCESS ACTIONS (Primary CTAs)                                   */}
      {/* ========================================================================= */}
      <section id="home-quick-actions" aria-label="Primary Quick Actions">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* CTA 1: Raise SOS (Emergency Red #DC2626) */}
          <button
            type="button"
            id="home-cta-raise-sos"
            onClick={onNavigateToSOS}
            className="group relative p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg shadow-red-600/25 active:scale-[0.99] transition-all flex items-center justify-between text-left cursor-pointer overflow-hidden border border-red-500"
          >
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0 backdrop-blur-xs border border-white/25 shadow-inner">
                <Siren size={26} className="stroke-[2.5] group-hover:rotate-12 transition-transform" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/20 text-white tracking-wide inline-block mb-1">
                  1-Tap Distress Beacon
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                  Raise SOS Distress
                </h3>
                <p className="text-xs text-white/80 font-medium mt-0.5">
                  Voice dispatch & immediate GPS emergency routing
                </p>
              </div>
            </div>

            <div className="relative z-10 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white group-hover:translate-x-1 transition-transform shrink-0 ml-2">
              <ArrowRight size={18} />
            </div>

            {/* Pulsing Background Radar Halo */}
            <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
          </button>

          {/* CTA 2: Ask TrahiGPT (Trust Teal #0F9D8F) */}
          <button
            type="button"
            id="home-cta-trahigpt"
            onClick={onNavigateToTrahiGPT}
            className="group relative p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#0F9D8F] to-teal-700 hover:from-[#0c8579] hover:to-teal-800 text-white shadow-lg shadow-[#0F9D8F]/25 active:scale-[0.99] transition-all flex items-center justify-between text-left cursor-pointer overflow-hidden border border-teal-500"
          >
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0 backdrop-blur-xs border border-white/25 shadow-inner">
                <Sparkles size={26} className="stroke-[2.2] group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/20 text-white tracking-wide inline-block mb-1">
                  AI First-Aid Guidance
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                  Ask TrahiGPT
                </h3>
                <p className="text-xs text-white/80 font-medium mt-0.5">
                  Triage, CPR, burn care, and multi-language support
                </p>
              </div>
            </div>

            <div className="relative z-10 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white group-hover:translate-x-1 transition-transform shrink-0 ml-2">
              <ArrowRight size={18} />
            </div>

            {/* Subtle glow */}
            <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. EMBEDDED CRISIS MAP (Mini-View)                                        */}
      {/* ========================================================================= */}
      <section id="home-mini-map-section" aria-label="Crisis Mini Map">
        <HomeMiniCrisisMap
          sosReports={sosReports}
          earthquakes={earthquakes}
          userLat={location?.latitude}
          userLng={location?.longitude}
          onExpandMap={onNavigateToCrisisMap}
          onOpenDonate={handleTriggerDonate}
          onSelectCrisis={(report) => setSelectedCrisisItem({ type: 'sos', data: report })}
        />
      </section>

      {/* ========================================================================= */}
      {/* 5. "YOUR RECENT ACTIVITY" (User Pinned Cases)                            */}
      {/* ========================================================================= */}
      {userPinnedCases.length > 0 && (
        <section id="home-user-pinned-cases" aria-label="Your Recent Distress Activity">
          <div className="p-5 sm:p-6 rounded-3xl bg-amber-50/70 border border-amber-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-gray-900 leading-none">
                    Your Active SOS Submissions ({userPinnedCases.length})
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Pinned case telemetry tracked in real-time
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-amber-200/80 text-amber-900">
                Live Status Tracker
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {userPinnedCases.map((userCase) => {
                const config = getCategoryConfig(userCase.category);
                const isResolved = userCase.status === 'resolved';

                return (
                  <div
                    key={`pinned-${userCase.id || userCase.timestamp}`}
                    onClick={() => setSelectedCrisisItem({ type: 'sos', data: userCase })}
                    className="p-4 rounded-2xl bg-white border border-amber-200 hover:border-amber-300 shadow-xs transition cursor-pointer space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span 
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${config.bgBadgeClass}`}
                      >
                        {config.label}
                      </span>
                      <span 
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          isResolved 
                            ? 'bg-gray-100 text-gray-700' 
                            : userCase.status === 'responding' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {userCase.status === 'responding' ? 'Responders En Route' : userCase.status || 'Active Dispatch'}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-gray-900 italic line-clamp-2">
                      "{userCase.transcript || 'Emergency distress call.'}"
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-100">
                      <span className="flex items-center gap-1 truncate max-w-[180px]">
                        <MapPin size={12} className="text-gray-400 shrink-0" />
                        {userCase.userAddress || 'Ground Location'}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">
                        {formatTimeAgo(userCase.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 6. FILTER & SEARCH BAR                                                   */}
      {/* ========================================================================= */}
      <section id="home-feed-filters" aria-label="Feed Search and Filters" className="space-y-3">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-3.5">
          {/* Header Row: Title & Search Input */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-gray-900 leading-tight">
                All Raised SOS Distresses
              </h3>
              <p className="text-xs text-gray-500">
                Live ground incident stream from responders and affected citizens
              </p>
            </div>

            {/* Keyword Search */}
            <div className="relative w-full sm:w-72">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search location or keyword..."
                className="w-full pl-9 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0F9D8F]/30 focus:border-[#0F9D8F]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Filter Controls Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1 items-center border-t border-gray-100">
            {/* Category Dropdown Filter */}
            <div className="sm:col-span-6 flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 shrink-0 flex items-center gap-1">
                <Filter size={13} /> Category:
              </span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full py-2 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0F9D8F]/30 focus:border-[#0F9D8F] cursor-pointer"
              >
                <option value="all">All Emergency Categories</option>
                <option value="Flood">🌊 Flood</option>
                <option value="Fire">🔥 Fire</option>
                <option value="Earthquake">🟤 Earthquake</option>
                <option value="Medical">🩺 Medical Emergency</option>
                <option value="Crime/Violence">🛡️ Crime / Violence</option>
                <option value="Building Collapse">🏢 Building Collapse</option>
                <option value="Accident">⚠️ Accident</option>
                <option value="Other">🌐 Other Incident</option>
              </select>
            </div>

            {/* Distance Radius Filter Slider / Selector */}
            <div className="sm:col-span-6 flex items-center gap-2 justify-between sm:justify-end">
              <span className="text-xs font-bold text-gray-500 shrink-0 flex items-center gap-1">
                <Compass size={13} /> Radius:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                {[
                  { label: 'All India', val: 0 },
                  { label: '10 km', val: 10 },
                  { label: '25 km', val: 25 },
                  { label: '50 km', val: 50 },
                  { label: '100 km', val: 100 },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setRadiusKm(opt.val)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                      radiusKm === opt.val
                        ? 'bg-[#0F9D8F] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. ALL RAISED SOS (Live Feed List)                                       */}
      {/* ========================================================================= */}
      <section id="home-live-sos-feed" aria-label="Realtime SOS Incident Feed" className="space-y-3">
        {loadingReports ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 text-gray-400 space-y-2">
            <RefreshCw size={24} className="animate-spin text-[#0F9D8F] mx-auto" />
            <p className="text-xs font-semibold">Connecting to Firestore SOS Stream...</p>
          </div>
        ) : filteredFeed.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 text-gray-400 space-y-2">
            <AlertCircle size={28} className="text-gray-300 mx-auto" />
            <h4 className="text-sm font-bold text-gray-700">No distress signals match your filter</h4>
            <p className="text-xs text-gray-400">Try widening your distance radius or clearing the search query.</p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setRadiusKm(0);
                setSearchQuery('');
              }}
              className="mt-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredFeed.map((item) => {
              const config = getCategoryConfig(item.category);
              const isResolved = item.status === 'resolved';

              return (
                <div
                  key={item.id || item.timestamp}
                  onClick={() => setSelectedCrisisItem({ type: 'sos', data: item })}
                  className="p-4 sm:p-5 rounded-3xl bg-white hover:bg-gray-50/80 border border-gray-200/80 hover:border-gray-300 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3 text-left"
                >
                  {/* Card Header: Category & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span 
                      className={`text-xs font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1.5 ${config.bgBadgeClass}`}
                    >
                      <span 
                        className="w-2 h-2 rounded-full shrink-0" 
                        style={{ backgroundColor: config.color }} 
                      />
                      <span>{config.label}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {item.voiceUrl && (
                        <span className="p-1 rounded-lg bg-red-50 text-red-600 text-[10px] font-bold flex items-center gap-1" title="Audio recording available">
                          <Volume2 size={12} />
                        </span>
                      )}

                      <span 
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          isResolved 
                            ? 'bg-gray-100 text-gray-600' 
                            : item.status === 'responding' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.status || 'Active'}
                      </span>
                    </div>
                  </div>

                  {/* Distress Transcript Quote */}
                  <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-100">
                    <p className="text-xs font-semibold text-gray-900 leading-relaxed italic line-clamp-2">
                      "{item.transcript || 'Voice emergency distress signal recorded.'}"
                    </p>
                  </div>

                  {/* Card Footer: Location, Distance, and Timestamp */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100 flex-wrap gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin size={13} className="text-gray-400 shrink-0" />
                      <span className="font-bold text-gray-800 truncate max-w-[180px] sm:max-w-[220px]">
                        {item.userAddress || 'Ground beacon location'}
                      </span>
                      {item.distanceKm !== null && (
                        <span className="text-[10px] font-extrabold text-[#0F9D8F] bg-teal-50 px-1.5 py-0.5 rounded-md shrink-0">
                          {item.distanceKm} km away
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                      <Clock size={12} />
                      <span>{formatTimeAgo(item.timestamp)}</span>
                    </div>
                  </div>

                  {/* Fast Action Buttons in Card */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCrisisItem({ type: 'sos', data: item });
                      }}
                      className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1"
                    >
                      <Eye size={13} />
                      <span>View Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTriggerDonate(`Aid Fund: ${item.userAddress || config.label}`, item.id);
                      }}
                      className="w-full py-2 bg-[#0F9D8F] hover:bg-[#0c8579] text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1"
                    >
                      <HeartHandshake size={13} />
                      <span>Donate</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* MODALS & OVERLAYS                                                         */}
      {/* ========================================================================= */}

      {/* 1. Full Crisis Details Modal (with Audio Playback & Coordinates) */}
      <CrisisDetailsModal
        selectedItem={selectedCrisisItem}
        onClose={() => setSelectedCrisisItem(null)}
        onDonateToCrisis={(title, reportId) => handleTriggerDonate(title, reportId)}
      />

      {/* 2. Reusable Razorpay Payment Gateway & Auth Gate Modal */}
      <RazorpayDonateModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        targetCrisisTitle={paymentTargetTitle}
        targetSosReportId={paymentTargetSosId}
      />
    </div>
  );
};
