import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Check, AlertCircle, Wrench } from 'lucide-react';
import { AuthLogo } from '../../components/auth/AuthLogo';
import { AuthButton } from '../../components/auth/AuthButton';
import { WorkerOnboardingProgress } from '../../components/auth/WorkerOnboardingProgress';
import { SpeakerButton } from '../../components/common/SpeakerButton';
import { onboardingService } from '../../services/onboardingService';
import {
  SERVICES_CATALOG,
  getLocalizedCategoryName,
  getLocalizedServiceName,
  type ServiceItem,
} from '../../data/servicesCatalog';

export const WorkerCategories: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const activeLangCode = i18n.language || localStorage.getItem('workerLanguage') || 'en';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const headingText = t('categories.title', { lng: activeLangCode }) || 'What work do you do?';
  const subtitleText = t('categories.subtitle', { lng: activeLangCode }) || 'Select all the services you can provide.';
  const hintText = t('categories.hint', { lng: activeLangCode }) || 'You can choose more than one.';
  const searchPlaceholder = t('categories.searchPlaceholder', { lng: activeLangCode }) || 'Search for a service...';
  const noServicesText = t('categories.noServices', { lng: activeLangCode }) || 'No services found';
  const noServicesHint = t('categories.noServicesHint', { lng: activeLangCode }) || 'Try searching with a different keyword or browse the list';
  const selectErrorText = t('categories.selectAtLeastOne', { lng: activeLangCode }) || 'Please select at least one service.';
  const continueText = t('common.continue', { lng: activeLangCode }) || 'Continue';
  const selectedText = t('categories.selected', { lng: activeLangCode }) || 'selected';
  const fullText = `${headingText}. ${subtitleText}`;

  // Toggle selection
  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
    if (errorMessage) setErrorMessage(undefined);
  };

  // Filter categories and items based on search in both localized name and english
  const filteredCatalog = useMemo(() => {
    const trimmed = searchTerm.trim().toLowerCase();
    if (!trimmed) return SERVICES_CATALOG;

    return SERVICES_CATALOG.map((group) => {
      const filteredItems = group.items.filter((item: ServiceItem) => {
        const localized = getLocalizedServiceName(item, activeLangCode).toLowerCase();
        const english = (item.names['en'] || item.id).toLowerCase();
        return localized.includes(trimmed) || english.includes(trimmed);
      });
      return {
        ...group,
        items: filteredItems,
      };
    }).filter((group) => group.items.length > 0);
  }, [searchTerm, activeLangCode]);

  const totalFilteredCount = useMemo(() => {
    return filteredCatalog.reduce((acc, curr) => acc + curr.items.length, 0);
  }, [filteredCatalog]);

  const handleContinue = () => {
    if (selectedIds.length === 0) {
      setErrorMessage(selectErrorText);
      return;
    }

    // Persist selected categories in session
    sessionStorage.setItem('gigsevak_worker_categories', JSON.stringify(selectedIds));
    onboardingService.updateState({ isCategoriesCompleted: true });
    navigate('/worker/location');
  };

  return (
    <main className="min-h-[100dvh] w-full bg-slate-50/60 sm:bg-slate-50/50 flex flex-col items-center p-4 sm:p-6 py-4 sm:py-6 antialiased">
      <div className="w-full max-w-[760px] mx-auto flex flex-col items-center">
        {/* Brand Logo & Progress Strip */}
        <header className="mb-2 sm:mb-3 flex flex-col items-center gap-1 w-full">
          <AuthLogo />
          <div className="w-full -mt-2 sm:-mt-3">
            <WorkerOnboardingProgress
              currentStep={3}
              step1Progress={100}
              step2Progress={100}
              step3Progress={0}
            />
          </div>
        </header>

        {/* Categories Card Box */}
        <div className="w-full bg-white rounded-2xl border border-slate-200/80 sm:border-slate-100 shadow-card p-5 sm:p-8 space-y-5">
          {/* Header Section */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#17212B]">
                {headingText}
              </h1>
              <SpeakerButton
                text={fullText}
                langCode={activeLangCode}
                size="sm"
                label="Listen instructions"
              />
            </div>
            <p className="text-sm sm:text-base text-[#66737D]">
              {subtitleText}
            </p>
            <p className="text-xs text-[#1C516C] font-semibold pt-0.5">
              {hintText}
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full pt-1">
            <Search className="w-5 h-5 text-[#66737D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-12 pl-11 pr-4 rounded-xl border border-[#D9D9D9] bg-white text-sm text-[#17212B] placeholder:text-[#66737D]/60 focus:outline-none focus:border-[#1C516C] focus:ring-2 focus:ring-[#1C516C]/20 transition-all"
            />
          </div>

          {/* Services List / Groups */}
          <div className="space-y-6 pt-2 max-h-[60vh] overflow-y-auto pr-1">
            {totalFilteredCount === 0 ? (
              <div className="text-center py-10 space-y-2">
                <p className="text-base font-semibold text-[#17212B]">
                  {noServicesText}
                </p>
                <p className="text-xs text-[#66737D]">
                  {noServicesHint}
                </p>
              </div>
            ) : (
              filteredCatalog.map((group) => (
                <div key={group.id} className="space-y-2.5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#66737D] px-1">
                    {getLocalizedCategoryName(group, activeLangCode)}
                  </h2>

                  {/* 1 column on mobile, exactly 2 columns on tablet/desktop */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {group.items.map((service) => {
                      const isSelected = selectedIds.includes(service.id);
                      const isBroken = brokenImages[service.id];
                      const localizedName = getLocalizedServiceName(service, activeLangCode);

                      return (
                        <div
                          key={service.id}
                          onClick={() => handleToggle(service.id)}
                          role="checkbox"
                          aria-checked={isSelected}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === ' ' || e.key === 'Enter') {
                              e.preventDefault();
                              handleToggle(service.id);
                            }
                          }}
                          className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all duration-150 cursor-pointer select-none text-left active:scale-[0.99] ${
                            isSelected
                              ? 'border-[#1C516C] bg-[#F5F0DD]/60 shadow-sm ring-1 ring-[#1C516C]'
                              : 'border-[#D9D9D9] bg-white hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                        >
                          {/* Image on LEFT with error fallback */}
                          <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200 flex items-center justify-center">
                            {isBroken ? (
                              <div className="w-full h-full bg-[#1C516C]/10 flex items-center justify-center text-[#1C516C]">
                                <Wrench className="w-6 h-6" />
                              </div>
                            ) : (
                              <img
                                src={service.image}
                                alt={localizedName}
                                loading="lazy"
                                onError={() =>
                                  setBrokenImages((prev) => ({ ...prev, [service.id]: true }))
                                }
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>

                          {/* Service Name in CENTER */}
                          <span className="flex-1 mx-3 text-sm sm:text-[15px] font-semibold text-[#17212B] leading-tight">
                            {localizedName}
                          </span>

                          {/* Checkbox on RIGHT */}
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
                              isSelected
                                ? 'border-[#1C516C] bg-[#1C516C] text-white'
                                : 'border-[#D9D9D9] bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-[#953638] font-medium pt-1 animate-fadeIn">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Bottom Action Area */}
          <div className="pt-3 border-t border-slate-100">
            <AuthButton
              type="button"
              variant="outline"
              onClick={handleContinue}
            >
              {continueText} {selectedIds.length > 0 ? `(${selectedIds.length} ${selectedText})` : ''}
            </AuthButton>
          </div>
        </div>
      </div>
    </main>
  );
};
