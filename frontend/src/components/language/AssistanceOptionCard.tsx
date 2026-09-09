import React from 'react';
import { Check } from 'lucide-react';
import { SpeakerButton } from '../common/SpeakerButton';

interface AssistanceOptionCardProps {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onSelect: (id: string) => void;
  langCode: string;
}

export const AssistanceOptionCard: React.FC<AssistanceOptionCardProps> = ({
  id,
  title,
  description,
  icon,
  isSelected,
  onSelect,
  langCode
}) => {
  return (
    <div
      role="radio"
      tabIndex={0}
      aria-checked={isSelected}
      onClick={() => onSelect(id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(id);
        }
      }}
      className={`group relative flex items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer select-none text-left active:scale-[0.99] ${
        isSelected
          ? 'border-[#1C516C] bg-[#F5F0DD]/70 shadow-sm ring-1 ring-[#1C516C]'
          : 'border-[#D9D9D9] bg-white hover:border-[#1C516C]/40 hover:bg-slate-50/70 hover:shadow-soft'
      }`}
    >
      <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
        {/* Icon in branded rounded background */}
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
            isSelected
              ? 'bg-[#1C516C] text-[#FDA649]'
              : 'bg-[#F5F0DD] text-[#1C516C] group-hover:bg-[#E9E2C6]'
          }`}
        >
          {icon}
        </div>

        {/* Text */}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-base sm:text-lg font-bold text-[#17212B] group-hover:text-[#1C516C] transition-colors">
            {title}
          </span>
          {description && (
            <span className="text-xs sm:text-sm text-[#66737D] mt-0.5">
              {description}
            </span>
          )}
        </div>
      </div>

      {/* Action / Check & Speaker */}
      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
        <SpeakerButton
          text={title}
          langCode={langCode}
          size="sm"
          label={`Listen ${title}`}
          className="hover:scale-110"
        />

        <div
          className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
            isSelected
              ? 'border-[#1C516C] bg-[#1C516C] text-white'
              : 'border-[#D9D9D9] bg-white group-hover:border-[#1C516C]/50'
          }`}
        >
          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </div>
      </div>
    </div>
  );
};
