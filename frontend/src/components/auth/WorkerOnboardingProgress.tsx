import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

export interface WorkerOnboardingProgressProps {
  currentStep: 1 | 2 | 3;
  step1Progress?: number; // 0 or 100
  step2Progress?: number; // 0, 50, or 100
  step3Progress?: number; // 0, 50, or 100
  className?: string;
}

export const WorkerOnboardingProgress: React.FC<WorkerOnboardingProgressProps> = ({
  currentStep,
  step1Progress = currentStep > 1 ? 100 : 0,
  step2Progress = currentStep > 2 ? 100 : currentStep === 2 ? 0 : 0,
  step3Progress = currentStep === 3 ? 0 : 0,
  className = '',
}) => {
  const { t, i18n } = useTranslation();
  const activeLangCode = i18n.language || localStorage.getItem('workerLanguage') || 'en';

  // Step 1 states
  const isStep1Complete = step1Progress === 100;
  const isStep1Active = currentStep === 1;

  // Step 2 states
  const isStep2Complete = step2Progress === 100;
  const isStep2Half = step2Progress === 50;
  const isStep2Active = currentStep === 2;

  // Step 3 states
  const isStep3Complete = step3Progress === 100;
  const isStep3Half = step3Progress === 50;
  const isStep3Active = currentStep === 3;

  // Connecting line fills (0 to 100%)
  const line1Fill = isStep1Complete ? 100 : 0;
  const line2Fill = isStep2Complete ? 100 : isStep2Half ? 50 : 0;

  const step1Text = t('onboarding.step1', { lng: activeLangCode }) || 'Mobile Number';
  const step1ShortText = t('onboarding.step1Short', { lng: activeLangCode }) || 'Mobile';
  const step2Text = t('onboarding.step2', { lng: activeLangCode }) || 'Verification';
  const step3Text = t('onboarding.step3', { lng: activeLangCode }) || 'Work & Location';
  const step3ShortText = t('onboarding.step3Short', { lng: activeLangCode }) || 'Work & Area';

  return (
    <nav
      aria-label="Onboarding Progress"
      className={`w-full max-w-[440px] sm:max-w-[480px] mx-auto px-2 sm:px-4 py-2 select-none ${className}`}
    >
      <div className="relative flex items-center justify-between">
        {/* Background Connecting Lines */}
        <div className="absolute left-6 right-6 top-3.5 -translate-y-1/2 h-[2.5px] bg-[#E2E2E2] z-0">
          <div
            className="absolute left-0 top-0 bottom-0 bg-[#1C516C] transition-all duration-300 ease-out"
            style={{ width: `${line1Fill * 0.5}%` }}
          />
          <div
            className="absolute top-0 bottom-0 bg-[#1C516C] transition-all duration-300 ease-out"
            style={{
              left: '50%',
              width: `${(line2Fill / 100) * 50}%`,
            }}
          />
        </div>

        {/* STEP 1: MOBILE NUMBER */}
        <div className="relative z-10 flex flex-col items-center group">
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
              isStep1Complete
                ? 'bg-[#1C516C] text-white shadow-xs'
                : isStep1Active
                ? 'bg-white border-2 border-[#1C516C] text-[#1C516C] ring-3 ring-[#1C516C]/15'
                : 'bg-white border-2 border-[#D9D9D9] text-[#888888]'
            }`}
          >
            {isStep1Complete ? (
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
            ) : (
              '1'
            )}
          </div>
          <span
            className={`mt-1.5 text-[11px] sm:text-xs tracking-tight transition-colors text-center ${
              isStep1Active || isStep1Complete
                ? 'font-bold text-[#1C516C]'
                : 'font-medium text-[#888888]'
            }`}
          >
            <span className="hidden sm:inline">{step1Text}</span>
            <span className="sm:hidden">{step1ShortText}</span>
          </span>
        </div>

        {/* STEP 2: VERIFICATION */}
        <div className="relative z-10 flex flex-col items-center group">
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
              isStep2Complete
                ? 'bg-[#1C516C] text-white shadow-xs'
                : isStep2Half
                ? 'bg-white border-2 border-[#1C516C] text-[#1C516C] ring-3 ring-[#1C516C]/15 relative overflow-hidden'
                : isStep2Active
                ? 'bg-white border-2 border-[#1C516C] text-[#1C516C] ring-3 ring-[#1C516C]/15'
                : 'bg-white border-2 border-[#D9D9D9] text-[#888888]'
            }`}
          >
            {isStep2Half && (
              <div className="absolute inset-0 bg-[#1C516C]/20 clip-half" />
            )}

            {isStep2Complete ? (
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
            ) : isStep2Half ? (
              <span className="relative z-10 text-[10px] font-extrabold text-[#1C516C]">½</span>
            ) : (
              '2'
            )}
          </div>
          <span
            className={`mt-1.5 text-[11px] sm:text-xs tracking-tight transition-colors text-center ${
              isStep2Active || isStep2Complete || isStep2Half
                ? 'font-bold text-[#1C516C]'
                : 'font-medium text-[#888888]'
            }`}
          >
            {step2Text}
          </span>
        </div>

        {/* STEP 3: WORK & LOCATION */}
        <div className="relative z-10 flex flex-col items-center group">
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
              isStep3Complete
                ? 'bg-[#1C516C] text-white shadow-xs'
                : isStep3Half
                ? 'bg-white border-2 border-[#1C516C] text-[#1C516C] ring-3 ring-[#1C516C]/15 relative overflow-hidden'
                : isStep3Active
                ? 'bg-white border-2 border-[#1C516C] text-[#1C516C] ring-3 ring-[#1C516C]/15'
                : 'bg-white border-2 border-[#D9D9D9] text-[#888888]'
            }`}
          >
            {isStep3Half && (
              <div className="absolute inset-0 bg-[#1C516C]/20 clip-half" />
            )}

            {isStep3Complete ? (
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
            ) : (
              '3'
            )}
          </div>
          <span
            className={`mt-1.5 text-[11px] sm:text-xs tracking-tight transition-colors text-center ${
              isStep3Active || isStep3Complete || isStep3Half
                ? 'font-bold text-[#1C516C]'
                : 'font-medium text-[#888888]'
            }`}
          >
            <span className="hidden sm:inline">{step3Text}</span>
            <span className="sm:hidden">{step3ShortText}</span>
          </span>
        </div>
      </div>
    </nav>
  );
};
