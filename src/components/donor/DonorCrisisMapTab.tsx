import React from 'react';
import { Map, AlertTriangle, Radio, Navigation, ShieldCheck, Flame, Waves, HeartHandshake } from 'lucide-react';
import { motion } from 'motion/react';

interface DonorCrisisMapTabProps {
  onNavigateToDonate: () => void;
}

export const DonorCrisisMapTab: React.FC<DonorCrisisMapTabProps> = ({ onNavigateToDonate }) => {
  const activeCrises = [
    {
      id: 'CRISIS-01',
      title: 'Mumbai Coastal Flash Flooding',
      type: 'Flood',
      district: 'Mumbai Suburban, MH',
      victimsCount: '1,420 affected',
      urgency: 'Critical',
      requiredFunding: '₹4,50,000',
      funded: '68%',
      icon: Waves,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      id: 'CRISIS-02',
      title: 'Yamuna Floodplain Submersion',
      type: 'Flood',
      district: 'East Delhi & Noida',
      victimsCount: '860 families',
      urgency: 'High',
      requiredFunding: '₹3,00,000',
      funded: '82%',
      icon: Waves,
      color: 'bg-teal-50 text-[#0F9D8F] border-teal-200',
    },
    {
      id: 'CRISIS-03',
      title: 'Wayanad Landslip Zone Evacuation',
      type: 'Landslide',
      district: 'Meppadi, Wayanad, KL',
      victimsCount: '340 rescued',
      urgency: 'Critical',
      requiredFunding: '₹6,00,000',
      funded: '45%',
      icon: AlertTriangle,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
  ];

  return (
    <div id="donor-crisis-map-tab" className="w-full max-w-5xl mx-auto px-4 py-4 sm:py-6 space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#0F9D8F] flex items-center justify-center shrink-0 shadow-xs">
            <Map size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Crisis Disaster Map</h2>
              <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                Live Radar
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Geolocated emergency distress beacons, relief camps, and supply distribution hubs across India.
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToDonate}
          className="px-4 py-2.5 bg-[#0F9D8F] hover:bg-[#0c8579] text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer shrink-0"
        >
          <HeartHandshake size={15} />
          <span>Donate to High-Urgency Zones</span>
        </button>
      </div>

      {/* Simulated Map Canvas Container */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-lg p-6 sm:p-8 relative overflow-hidden min-h-[340px] flex flex-col justify-between text-white">
        {/* Subtle grid background */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#0F9D8F_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        {/* Live Status Top Bar */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 bg-slate-800/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700">
            <Radio size={14} className="text-red-400 animate-pulse" />
            <span className="font-mono text-slate-300">Live Satellite Feeds Active</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700 text-slate-400">
            <Navigation size={12} className="text-teal-400" />
            <span>Map full features loading in next step</span>
          </div>
        </div>

        {/* Map Center Pins Graphic */}
        <div className="relative z-10 my-8 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-teal-500/20 border border-teal-400/40 flex items-center justify-center animate-pulse">
            <div className="w-8 h-8 rounded-full bg-[#0F9D8F] flex items-center justify-center shadow-lg shadow-teal-500/50">
              <Map size={16} className="text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Interactive GIS Crisis Map</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Full interactive Leaflet / Google Maps integration with live polygon disaster overlays, relief nodes, and victim clusters is configured for the upcoming prompt.
            </p>
          </div>
        </div>

        {/* Quick Stats Footer */}
        <div className="relative z-10 grid grid-cols-3 gap-3 text-center border-t border-slate-800 pt-4 text-xs">
          <div>
            <span className="text-slate-400 text-[10px] block">Active Disasters</span>
            <span className="font-bold text-white text-sm">3 Regions</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block">Emergency Beacons</span>
            <span className="font-bold text-emerald-400 text-sm">24 Active</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block">NDRF Battalions</span>
            <span className="font-bold text-teal-300 text-sm">7 Dispatched</span>
          </div>
        </div>
      </div>

      {/* High-Priority Relief Zones List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-800 px-1">Active Crisis Zones Requiring Donor Support</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activeCrises.map((crisis) => {
            const Icon = crisis.icon;
            return (
              <div key={crisis.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${crisis.color}`}>
                    {crisis.type}
                  </span>
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                    {crisis.urgency}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-gray-900 leading-snug">{crisis.title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{crisis.district}</p>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 block">Target Fund</span>
                    <span className="font-bold text-gray-800">{crisis.requiredFunding}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-teal-600 font-bold block">{crisis.funded} Funded</span>
                    <span className="text-[10px] text-gray-400">{crisis.victimsCount}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
