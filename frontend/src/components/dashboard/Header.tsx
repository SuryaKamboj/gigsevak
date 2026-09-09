import React from 'react';
import { useTranslation } from 'react-i18next';
import { LanguagePickerBadge } from '../common/LanguagePickerBadge';

interface HeaderProps {
  isAvailable: boolean;
  onToggleAvailability: () => void;
  onLogoClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isAvailable, onToggleAvailability, onLogoClick }) => {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 h-16 w-full bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] px-4 sm:px-6 lg:px-8 flex items-center transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 w-full">
        {/* LEFT: GigSevak Brand Wordmark */}
        <div
          className={`flex items-center shrink-0 ${onLogoClick ? 'cursor-pointer select-none active:opacity-80 transition-opacity' : 'select-none'}`}
          onClick={onLogoClick}
          role={onLogoClick ? 'button' : undefined}
          tabIndex={onLogoClick ? 0 : undefined}
        >
          <span className="font-sans text-[22px] sm:text-[25px] font-bold tracking-tight select-none leading-none whitespace-nowrap">
            <span className="text-[#A66666]">Gig</span>
            <span className="text-[#292323]">Sevak</span>
          </span>
        </div>

        {/* RIGHT: Language Selector Badge + Availability Slider */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <LanguagePickerBadge />

          <button
            type="button"
            role="switch"
            aria-checked={isAvailable}
            onClick={onToggleAvailability}
            title={isAvailable ? t('dashboard.online', 'Online') : t('dashboard.offline', 'Offline')}
            className={`inline-flex items-center gap-1.5 sm:gap-2.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer select-none active:scale-[0.98] shrink-0 ${
              isAvailable
                ? 'border-emerald-200 bg-emerald-50/50 text-emerald-800 hover:bg-emerald-50/80 shadow-xs'
                : 'border-slate-200 bg-slate-50/80 text-slate-600 hover:bg-slate-100/80 shadow-xs'
            }`}
          >
            {/* Status Label with Indicator */}
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                  isAvailable ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]' : 'bg-slate-400'
                }`}
              />
              <span className="font-medium whitespace-nowrap">
                {isAvailable ? t('dashboard.online', 'Online') : t('dashboard.offline', 'Offline')}
              </span>
            </span>

            {/* Slider Switch Track & Thumb */}
            <div
              className={`relative inline-flex h-5 w-9 sm:h-5.5 sm:w-10 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                isAvailable ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 sm:h-4.5 sm:w-4.5 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out ${
                  isAvailable ? 'translate-x-4 sm:translate-x-4.5' : 'translate-x-0'
                }`}
              />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
