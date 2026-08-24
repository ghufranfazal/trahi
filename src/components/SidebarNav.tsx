import React from 'react';
import { Home, Sparkles, Siren, Heart, User, ShieldAlert, Radio } from 'lucide-react';
import { TabType } from '../types.ts';

interface SidebarNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab = 'sos',
  onTabChange,
}) => {
  const navItems: { id: TabType; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'home', label: 'Home', icon: <Home size={20} /> },
    { id: 'trahigpt', label: 'TrahiGPT', icon: <Sparkles size={20} />, badge: 'AI' },
    { id: 'sos', label: 'SOS Alert', icon: <Siren size={20} />, badge: 'Active' },
    { id: 'donate', label: 'Donate', icon: <Heart size={20} /> },
    { id: 'profile', label: 'Profile', icon: <User size={20} /> },
  ];

  return (
    <aside 
      id="desktop-sidebar-nav" 
      className="hidden md:flex flex-col justify-between w-64 lg:w-72 bg-white border-r border-gray-200/80 p-5 lg:p-6 shrink-0 h-screen sticky top-0"
    >
      {/* Brand Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-[#0F9D8F] flex items-center justify-center text-white shadow-md shadow-[#0F9D8F]/25">
            <Siren size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black text-gray-900 tracking-tight">Trahi</span>
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-[#F0294D]">
                SOS
              </span>
            </div>
            <p className="text-[11px] font-medium text-gray-400">त्राहि मां • Emergency App</p>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs text-gray-500">
          <p className="font-semibold text-gray-800 text-[11.5px] leading-tight">
            "When just calling out is enough."
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#0F9D8F] font-semibold">
            <Radio size={12} className="animate-pulse" />
            <span>Emergency Grid Active</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="mt-6 space-y-1.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const isSos = item.id === 'sos';

            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-sm transition-all cursor-pointer ${
                  isActive
                    ? isSos
                      ? 'bg-[#0F9D8F] text-white shadow-lg shadow-[#0F9D8F]/30'
                      : 'bg-gray-100 text-gray-900'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? (isSos ? 'text-white' : 'text-[#0F9D8F]') : 'text-gray-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      isActive && isSos
                        ? 'bg-white/20 text-white'
                        : item.badge === 'Active'
                        ? 'bg-red-100 text-[#F0294D]'
                        : 'bg-teal-100 text-[#0F9D8F]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom User / Helplines quick card */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center gap-3 p-2 rounded-2xl hover:bg-gray-50 transition cursor-pointer">
          <div className="w-10 h-10 rounded-full border-2 border-[#0F9D8F] overflow-hidden bg-white shadow-xs shrink-0">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
              alt="User profile"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">Demo Responder</p>
            <p className="text-[11px] text-gray-400 truncate">GPS Active • 112 Ready</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
        </div>
      </div>
    </aside>
  );
};
