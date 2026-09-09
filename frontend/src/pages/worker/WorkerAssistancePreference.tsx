import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Edit3, Mic } from 'lucide-react';
import { AuthLogo } from '../../components/auth/AuthLogo';
import { AuthButton } from '../../components/auth/AuthButton';
import { AssistanceOptionCard } from '../../components/language/AssistanceOptionCard';
import { SpeakerButton } from '../../components/common/SpeakerButton';
import { speakText } from '../../utils/textToSpeech';

export const WorkerAssistancePreference: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const activeLangCode = i18n.language || localStorage.getItem('workerLanguage') || 'en';

  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const headingText = t('onboarding.assistanceTitle', { lng: activeLangCode }) || 'How would you like to continue?';
  const continueLabel = t('common.continue', { lng: activeLangCode }) || 'Continue';

  const selfTitle = t('onboarding.readBySelf', { lng: activeLangCode }) || 'I will read and fill the form myself';
  const voiceTitle = t('onboarding.voiceAssistance', { lng: activeLangCode }) || 'Use voice assistance & audio guidance';

  const handleSelect = (id: string) => {
    setSelectedOption(id);
    const spoken = id === 'self' ? selfTitle : voiceTitle;
    speakText(spoken, { langCode: activeLangCode });

    try {
      localStorage.setItem('user_assistance_mode', id);
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  };

  const handleContinue = () => {
    if (!selectedOption) return;
    navigate('/worker/signup');
  };

  return (
    <main className="min-h-[100dvh] w-full bg-slate-50/60 sm:bg-slate-50/50 flex flex-col items-center p-4 sm:p-6 py-4 sm:py-6 antialiased">
      <div className="w-full max-w-[560px] mx-auto flex flex-col items-center">
        {/* Brand Logo */}
        <header className="mb-2 sm:mb-3 flex flex-col items-center gap-1 w-full">
          <AuthLogo size="md" />
        </header>

        {/* Assistance Preference Card Box */}
        <div className="w-full bg-white rounded-2xl border border-slate-200/80 sm:border-slate-100 shadow-card p-5 sm:p-8 space-y-5">
          {/* Back Navigation */}
          <div className="-mt-1">
            <Link
              to="/worker/language"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#66737D] hover:text-[#1C516C] transition-colors rounded p-0.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change language</span>
            </Link>
          </div>

          {/* Header Section */}
          <div className="text-center space-y-1.5">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#17212B]">
                {headingText}
              </h1>
              <SpeakerButton
                text={headingText}
                langCode={activeLangCode}
                size="md"
                label="Listen instruction"
              />
            </div>
            <p className="text-sm text-[#66737D] max-w-[360px] mx-auto">
              Choose your preferred assistance method for onboarding
            </p>
          </div>

          {/* Options List */}
          <div className="space-y-3 pt-1" role="radiogroup" aria-label="Assistance Preference">
            <AssistanceOptionCard
              id="self"
              title={selfTitle}
              description="Standard text input with manual review"
              icon={<Edit3 className="w-6 h-6" />}
              isSelected={selectedOption === 'self'}
              onSelect={handleSelect}
              langCode={activeLangCode}
            />

            <AssistanceOptionCard
              id="voice"
              title={voiceTitle}
              description="Audio instructions and spoken assistance throughout"
              icon={<Mic className="w-6 h-6" />}
              isSelected={selectedOption === 'voice'}
              onSelect={handleSelect}
              langCode={activeLangCode}
            />
          </div>

          {/* Bottom Action Area */}
          <div className="pt-3 border-t border-slate-100">
            <AuthButton
              type="button"
              variant="outline"
              disabled={!selectedOption}
              onClick={handleContinue}
            >
              {continueLabel}
            </AuthButton>
          </div>
        </div>
      </div>
    </main>
  );
};
