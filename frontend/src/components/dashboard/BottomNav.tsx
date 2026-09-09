import React from 'react';
import { Home, ClipboardList, Mic, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { NavTab } from '../../types/dashboard';

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const { t } = useTranslation();

  const navItems = [
    { id: 'home' as NavTab, label: t('dashboard.todayWork', 'Home'), icon: Home },
    { id: 'orders' as NavTab, label: t('dashboard.allBookings', 'All Bookings'), icon: ClipboardList },
    { id: 'voice' as NavTab, label: t('dashboard.voiceAssistance', 'Voice Assistance'), icon: Mic },
    { id: 'account' as NavTab, label: t('dashboard.myAccount', 'My Account'), icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] shadow-[0_-2px_10px_rgba(0,0,0,0.04)] px-4 py-2 pb-safe">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-label={item.label}
              title={item.label}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer ${
                isActive
                  ? 'bg-[#A66666]/10 text-[#A66666]'
                  : 'text-[#6B6B6B] hover:text-[#222222]'
              }`}
            >
              <Icon className="w-6 h-6 stroke-[2.2]" />
            </button>
          );
        })}
      </div>
    </nav>
  );
};
