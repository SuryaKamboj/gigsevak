import React from 'react';
import { Home, ClipboardList, Mic, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { NavTab } from '../../types/dashboard';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const { t } = useTranslation();

  const navItems = [
    { id: 'home' as NavTab, label: t('dashboard.todayWork', 'Home'), icon: Home },
    { id: 'orders' as NavTab, label: t('dashboard.allBookings', 'All Bookings'), icon: ClipboardList },
    { id: 'voice' as NavTab, label: t('dashboard.voiceAssistance', 'Voice Assistance'), icon: Mic },
    { id: 'account' as NavTab, label: t('dashboard.myAccount', 'My Account'), icon: User },
  ];

  return (
    <aside className="hidden md:flex flex-col items-center w-20 bg-white border-r border-[#E5E7EB] py-5 fixed left-0 top-16 bottom-0 z-30 shadow-soft">
      {/* Navigation Icons List (No text labels) */}
      <nav className="flex-1 flex flex-col items-center gap-4 w-full px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              title={item.label}
              aria-label={item.label}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-95 ${
                isActive
                  ? 'bg-[#A66666]/10 text-[#A66666] shadow-xs'
                  : 'text-[#6B6B6B] hover:text-[#222222] hover:bg-slate-100/80'
              }`}
            >
              <Icon className="w-6 h-6 stroke-[2.2]" />
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
