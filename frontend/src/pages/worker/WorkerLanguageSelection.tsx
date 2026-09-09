import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthLogo } from '../../components/auth/AuthLogo';
import { AuthButton } from '../../components/auth/AuthButton';
import { LanguageCard } from '../../components/language/LanguageCard';
import { SpeakerButton } from '../../components/common/SpeakerButton';
import { LANGUAGES, type Language } from '../../data/languages';
import { speakText } from '../../utils/textToSpeech';
import { onboardingService } from '../../services/onboardingService';

export const WorkerLanguageSelection: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);

  // Clear previous session & form cache on start so every run is fresh
  useEffect(() => {
    try {
      localStorage.removeItem('user_mobile_number');
      localStorage.removeItem('user_assistance_mode');
      localStorage.removeItem('user_selected_language');
      localStorage.removeItem('gigsevak_onboarding_state');
      localStorage.removeItem('gigsevak_identity_status');
      sessionStorage.clear();
      onboardingService.reset();
    } catch {
      // Ignored
    }
  }, []);

  const handleLanguageSelect = (lang: Language) => {
    setSelectedLanguage(lang);

    // Switch i18next immediately
    i18n.changeLanguage(lang.id);

    // Speak native name aloud
    speakText(lang.nativeName, { langCode: lang.id });

    // Store in localStorage
    try {
      localStorage.setItem('workerLanguage', lang.id);
      localStorage.setItem('user_selected_language', JSON.stringify(lang));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  };

  const handleContinue = () => {
    if (!selectedLanguage) return;
    navigate('/worker/assistance');
  };

  const activeLangCode = selectedLanguage?.id || i18n.language || 'en';
  const headingText = t('onboarding.chooseLanguage', { lng: activeLangCode }) || 'Choose your language';
  const subHeadingText = t('onboarding.selectLanguage', { lng: activeLangCode }) || 'Select the language you are most comfortable with';
  const fullHeaderText = `${headingText}. ${subHeadingText}`;
  const continueLabel = t('common.continue', { lng: activeLangCode }) || 'Continue';

  return (
    <main className="min-h-[100dvh] w-full bg-slate-50/60 sm:bg-slate-50/50 flex flex-col items-center p-4 sm:p-6 py-4 sm:py-6 antialiased">
      <div className="w-full max-w-[680px] mx-auto flex flex-col items-center">
        {/* Brand Logo */}
        <header className="mb-2 sm:mb-3 flex flex-col items-center gap-1 w-full">
          <AuthLogo size="md" />
        </header>

        {/* Language Selection Card Box */}
        <div className="w-full bg-white rounded-2xl border border-slate-200/80 sm:border-slate-100 shadow-card p-5 sm:p-8 space-y-5">
          {/* Header Section */}
          <div className="text-center space-y-1.5">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#17212B]">
                {headingText}
              </h1>
              <SpeakerButton
                text={fullHeaderText}
                langCode={activeLangCode}
                size="md"
                label="Listen instruction"
              />
            </div>
            <p className="text-sm sm:text-base text-[#66737D] max-w-[420px] mx-auto">
              {subHeadingText}
            </p>
          </div>

          {/* Language Cards Grid */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 max-h-[52vh] sm:max-h-[58vh] overflow-y-auto pr-1"
            role="radiogroup"
            aria-label="Select Language"
          >
            {LANGUAGES.map((lang) => (
              <LanguageCard
                key={lang.id}
                language={lang}
                isSelected={selectedLanguage?.id === lang.id}
                onSelect={handleLanguageSelect}
              />
            ))}
          </div>

          {/* Bottom Action Area */}
          <div className="pt-3 border-t border-slate-100">
            <AuthButton
              type="button"
              variant="outline"
              disabled={!selectedLanguage}
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
