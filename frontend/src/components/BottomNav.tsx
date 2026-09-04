import React from 'react';
import { Home, Sparkles, Siren, Heart, User, ShieldAlert } from 'lucide-react';
import { TabType } from '../types.ts';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab = 'sos',
  onTabChange,
}) => {
  return (
    <nav 
      id="bottom-navigation-tray" 
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden w-full bg-white/95 backdrop-blur-md h-20 sm:h-22 border-t border-gray-100 flex items-center justify-around px-2 sm:px-4 pb-4 sm:pb-3 select-none shadow-lg pb-safe"
    >
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg mx-auto flex items-center justify-around">
        {/* 1. Home Tab */}
        <button
          id="nav-tab-home"
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
            activeTab === 'home' ? 'opacity-100 text-[#0F9D8F]' : 'opacity-40 hover:opacity-75 text-[#1A1A1A]'
          }`}
          aria-label="Home Tab"
        >
          <Home size={20} className="stroke-[2]" />
          <span className="text-[9.5px] font-bold">Home</span>
        </button>

        {/* 2. TrahiGPT Tab */}
        <button
          id="nav-tab-trahigpt"
          onClick={() => onTabChange('trahigpt')}
          className={`flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
            activeTab === 'trahigpt' ? 'opacity-100 text-[#0F9D8F]' : 'opacity-40 hover:opacity-75 text-[#1A1A1A]'
          }`}
          aria-label="TrahiGPT Assistant"
        >
          <Sparkles size={20} className="stroke-[2]" />
          <span className="text-[9.5px] font-bold">TrahiGPT</span>
        </button>

        {/* 3. SOS Tab (Center Elevated Beacon) */}
        <div className="flex flex-col items-center -mt-8 sm:-mt-10">
          <button
            id="nav-tab-sos"
            onClick={() => onTabChange('sos')}
            className={`w-13 h-13 sm:w-15 sm:h-15 bg-[#0F9D8F] hover:bg-[#0c8579] rounded-2xl shadow-lg shadow-[#0F9D8F]/30 flex items-center justify-center mb-0.5 border-4 border-white active:scale-95 transition-all cursor-pointer ${
              activeTab === 'sos' ? 'scale-105 shadow-[#0F9D8F]/40' : 'opacity-90'
            }`}
            aria-label="SOS Emergency Mode"
          >
            <Siren size={24} className="text-white stroke-[2.2]" />
          </button>
          <span className="text-[9.5px] font-bold text-[#0F9D8F]">SOS</span>
        </div>

        {/* 4. Preparedness / Hazard & Kits Tab */}
        <button
          id="nav-tab-preparedness"
          onClick={() => onTabChange('preparedness')}
          className={`flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
            activeTab === 'preparedness' ? 'opacity-100 text-[#0F9D8F]' : 'opacity-40 hover:opacity-75 text-[#1A1A1A]'
          }`}
          aria-label="Hazard & Safety Kits"
        >
          <ShieldAlert size={20} className="stroke-[2]" />
          <span className="text-[9.5px] font-bold">Kits</span>
        </button>

        {/* 5. Donate Tab */}
        <button
          id="nav-tab-donate"
          onClick={() => onTabChange('donate')}
          className={`flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
            activeTab === 'donate' ? 'opacity-100 text-[#0F9D8F]' : 'opacity-40 hover:opacity-75 text-[#1A1A1A]'
          }`}
          aria-label="Community Donations"
        >
          <Heart size={20} className="stroke-[2]" />
          <span className="text-[9.5px] font-bold">Donate</span>
        </button>

        {/* 6. Profile Tab */}
        <button
          id="nav-tab-profile"
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
            activeTab === 'profile' ? 'opacity-100 text-[#0F9D8F]' : 'opacity-40 hover:opacity-75 text-[#1A1A1A]'
          }`}
          aria-label="User Profile"
        >
          <User size={20} className="stroke-[2]" />
          <span className="text-[9.5px] font-bold">Profile</span>
        </button>
      </div>
    </nav>
  );
};


