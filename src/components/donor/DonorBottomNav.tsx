import React from 'react';
import { ArrowLeft, Map, HeartHandshake, Receipt, User } from 'lucide-react';
import { motion } from 'motion/react';
import { DonorTabType } from '../../types.ts';

interface DonorBottomNavProps {
  activeTab: DonorTabType;
  onTabChange: (tab: DonorTabType) => void;
  onBackToTrahi: () => void;
}

export const DonorBottomNav: React.FC<DonorBottomNavProps> = ({
  activeTab,
  onTabChange,
  onBackToTrahi,
}) => {
  const navItems = [
    {
      id: 'back' as const,
      label: 'Back to Trahi',
      icon: ArrowLeft,
      isAction: true,
      onClick: onBackToTrahi,
    },
    {
      id: 'map' as const,
      label: 'Crisis Map',
      icon: Map,
    },
    {
      id: 'donate' as const,
      label: 'Browse & Donate',
      icon: HeartHandshake,
      isDefault: true,
    },
    {
      id: 'history' as const,
      label: 'My Donations',
      icon: Receipt,
    },
    {
      id: 'profile' as const,
      label: 'Profile',
      icon: User,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100/90 shadow-lg px-2 sm:px-4 py-1.5 pb-safe">
      <nav id="donor-bottom-navigation" className="max-w-xl mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = !item.isAction && activeTab === item.id;

          return (
            <button
              key={item.id}
              id={`donor-tab-${item.id}`}
              onClick={() => {
                if (item.isAction && item.onClick) {
                  item.onClick();
                } else {
                  onTabChange(item.id);
                }
              }}
              className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-200 cursor-pointer ${
                item.isAction 
                  ? 'text-gray-500 hover:text-gray-900 active:scale-95' 
                  : isActive
                    ? 'text-[#0F9D8F] font-bold'
                    : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {/* Active Pill Indicator for donor tabs */}
              {isActive && (
                <motion.div
                  layoutId="donor-active-nav-indicator"
                  className="absolute -top-1.5 w-6 h-1 bg-[#0F9D8F] rounded-full"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}

              <div className={`p-1 rounded-xl transition-all ${
                item.isAction 
                  ? 'bg-gray-100 text-gray-700' 
                  : isActive 
                    ? 'bg-teal-50 text-[#0F9D8F]' 
                    : ''
              }`}>
                <Icon size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-[2]'} />
              </div>

              <span className={`text-[10px] mt-0.5 whitespace-nowrap ${
                isActive ? 'font-bold text-[#0F9D8F]' : item.isAction ? 'font-semibold text-gray-600' : 'font-medium'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
