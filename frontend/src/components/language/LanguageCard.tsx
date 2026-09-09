import React from 'react';
import { Check } from 'lucide-react';
import type { Language } from '../../data/languages';
import { SpeakerButton } from '../common/SpeakerButton';

interface LanguageCardProps {
  language: Language;
  isSelected: boolean;
  onSelect: (lang: Language) => void;
}

export const LanguageCard: React.FC<LanguageCardProps> = ({
  language,
  isSelected,
  onSelect
}) => {
  const { id, nativeName, englishName, direction } = language;

  return (
    <div
      role="radio"
      tabIndex={0}
      aria-checked={isSelected}
      aria-label={`${nativeName} (${englishName})`}
      onClick={() => onSelect(language)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(language);
        }
      }}
      className={`group relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none text-left active:scale-[0.98] ${
        isSelected
          ? 'border-[#1C516C] bg-[#F5F0DD]/70 shadow-sm ring-1 ring-[#1C516C]'
          : 'border-[#D9D9D9] bg-white hover:border-[#1C516C]/40 hover:bg-slate-50/70 hover:shadow-soft'
      }`}
      style={{ direction }}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Selection Indicator Check circle */}
        <div
          className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
            isSelected
              ? 'border-[#1C516C] bg-[#1C516C] text-white'
              : 'border-[#D9D9D9] bg-white group-hover:border-[#1C516C]/50'
          }`}
        >
          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </div>

        {/* Language Names */}
        <div className="flex flex-col min-w-0">
          <span className="text-base sm:text-[17px] font-bold text-[#17212B] tracking-tight group-hover:text-[#1C516C] transition-colors truncate">
            {nativeName}
          </span>
          <span className="text-xs sm:text-[13px] font-medium text-[#66737D]">
            {englishName}
          </span>
        </div>
      </div>

      {/* Speaker Button on the right side */}
      <div className="flex-shrink-0 ml-2">
        <SpeakerButton
          text={nativeName}
          langCode={id}
          size="sm"
          label={`Listen ${nativeName}`}
          className="hover:scale-110 shadow-xs"
        />
      </div>
    </div>
  );
};
