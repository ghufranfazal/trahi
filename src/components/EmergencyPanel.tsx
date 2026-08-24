import React from 'react';
import { PhoneCall, ShieldAlert, Radio, AlertTriangle, Activity, HeartHandshake } from 'lucide-react';

export const EmergencyPanel: React.FC = () => {
  const helplines = [
    { label: 'National All-in-One', number: '112', desc: 'Police, Fire, Medical, Disaster', color: 'red' },
    { label: 'Police Control', number: '100', desc: 'Direct Police Dispatch', color: 'teal' },
    { label: 'Ambulance & Medical', number: '108', desc: 'Emergency Medical Service', color: 'blue' },
    { label: 'Fire & Rescue', number: '101', desc: 'Fire Brigade Department', color: 'orange' },
    { label: 'NDRF Disaster Response', number: '1078', desc: 'Floods, Earthquakes, Cyclones', color: 'purple' },
    { label: 'Women Helpline', number: '1091', desc: '24x7 Safety & SOS', color: 'rose' },
  ];

  return (
    <div id="desktop-emergency-panel" className="flex flex-col gap-5 w-full">
      {/* 1. Live Readiness Status Card */}
      <div className="bg-white rounded-3xl p-5 lg:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-[#0F9D8F]">
              <Radio size={18} className="animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">Trahi Emergency Grid</h4>
              <p className="text-[11px] text-gray-400">Real-time distress beacon ready</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Connected
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
            <span className="text-[11px] text-gray-400 font-medium">GPS Precision</span>
            <p className="text-xs sm:text-sm font-bold text-gray-800 mt-0.5">High Accuracy (±4m)</p>
          </div>
          <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
            <span className="text-[11px] text-gray-400 font-medium">Nearby Responders</span>
            <p className="text-xs sm:text-sm font-bold text-gray-800 mt-0.5">14 Active in 3km</p>
          </div>
        </div>
      </div>

      {/* 2. Instant National Emergency Dialers */}
      <div className="bg-white rounded-3xl p-5 lg:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-[#F0294D]" />
            <h4 className="text-sm font-bold text-gray-900">Direct Authority Dialers</h4>
          </div>
          <span className="text-[11px] font-semibold text-gray-400">Toll-Free (India)</span>
        </div>

        <p className="text-xs text-gray-500 mb-3 leading-relaxed">
          Trahi SOS alerts nearby community responders, but you can also directly call state emergency services:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {helplines.map((item) => (
            <a
              key={item.number}
              href={`tel:${item.number}`}
              className="p-3 rounded-2xl bg-gray-50 hover:bg-gray-100/80 border border-gray-100 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <div className="text-[11px] font-semibold text-gray-500 group-hover:text-gray-900">
                  {item.label}
                </div>
                <div className="text-base font-extrabold text-gray-900 mt-0.5">
                  {item.number}
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white shadow-xs flex items-center justify-center text-gray-600 group-hover:bg-[#0F9D8F] group-hover:text-white transition-colors shrink-0">
                <PhoneCall size={14} />
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
