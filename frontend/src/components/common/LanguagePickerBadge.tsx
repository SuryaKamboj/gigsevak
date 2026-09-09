import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { LANGUAGES } from '../../data/languages';
import { speakText } from '../../utils/textToSpeech';

export const LanguagePickerBadge: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const currentLangCode = i18n.language || localStorage.getItem('workerLanguage') || 'en';
  const currentLang = LANGUAGES.find((l) => l.id === currentLangCode) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (langId: string) => {
    i18n.changeLanguage(langId);
    try {
      localStorage.setItem('workerLanguage', langId);
      const selected = LANGUAGES.find((l) => l.id === langId);
      if (selected) {
        localStorage.setItem('user_selected_language', JSON.stringify(selected));
        speakText(selected.nativeName, { langCode: langId });
      }
    } catch (e) {
      console.warn('Language persist error:', e);
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative z-40">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#1C516C] bg-white border border-slate-200 hover:border-[#1C516C]/40 hover:bg-[#F5F0DD]/30 transition-all shadow-xs cursor-pointer select-none"
      >
        <Globe className="w-3.5 h-3.5 text-[#1C516C]" />
        <span>{currentLang.nativeName}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 max-h-64 overflow-y-auto divide-y divide-slate-100 z-50 animate-fadeIn">
          {LANGUAGES.map((lang) => {
            const isSelected = lang.id === currentLangCode;
            return (
              <button
                key={lang.id}
                type="button"
                onClick={() => handleSelect(lang.id)}
                className={`w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                  isSelected ? 'bg-slate-50 font-bold text-[#1C516C]' : 'text-[#17212B]'
                }`}
              >
                <div>
                  <span className="font-semibold text-sm">{lang.nativeName}</span>
                  <span className="text-[11px] text-slate-400 ml-1.5">({lang.englishName})</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#1C516C]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
