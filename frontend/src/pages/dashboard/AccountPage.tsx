import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Star, MapPin, Wallet, Settings, ChevronRight, LogOut, Phone, Globe, Briefcase } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authService } from '../../services/authService';
import { getStoredIdentityStatus } from '../../services/identityService';
import { LANGUAGES } from '../../data/languages';
import { LanguagePickerBadge } from '../../components/common/LanguagePickerBadge';

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const activeLangCode = i18n.language || localStorage.getItem('workerLanguage') || 'en';

  const [identityData] = useState(() => getStoredIdentityStatus());

  const phoneNumber = (() => {
    const saved = localStorage.getItem('user_mobile_number');
    if (saved) return saved;
    const session = authService.getCurrentUser();
    return session?.phoneNumber ? `+91 ${session.phoneNumber}` : '+91 98765 43210';
  })();

  const workerName = (() => {
    const session = authService.getCurrentUser();
    if (session?.name) return session.name;
    return 'Rajesh Kumar Sharma';
  })();

  const selectedCategories = (() => {
    try {
      const raw = sessionStorage.getItem('gigsevak_worker_categories');
      return raw ? JSON.parse(raw) : ['electrical-repair', 'plumbing-sanitary', 'ac-appliance'];
    } catch {
      return ['electrical-repair', 'plumbing-sanitary'];
    }
  })();

  const locationData = (() => {
    try {
      const raw = sessionStorage.getItem('gigsevak_worker_location');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const selectedLangObj = LANGUAGES.find((l) => l.id === activeLangCode) || LANGUAGES[0];

  const handleLogout = () => {
    authService.logout();
    navigate('/worker/login');
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-6">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-6 border border-neutral-100 shadow-xs flex flex-col sm:flex-row items-center gap-5">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-neutral-100 border-4 border-brand-primary/20 overflow-hidden flex items-center justify-center">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
              alt={workerName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute bottom-0 right-0 bg-emerald-500 text-white p-1 rounded-full border-2 border-white shadow-xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="text-center sm:text-left flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <h2 className="text-xl font-bold text-neutral-dark">{workerName}</h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/60 self-center sm:self-auto">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> {t('dashboard.aadhaarVerified', 'Aadhaar Verified')}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-neutral-muted mt-1 flex items-center justify-center sm:justify-start gap-1">
            <MapPin className="w-3.5 h-3.5 text-brand-primary" />
            <span>{locationData?.name || 'Model Town, Jalandhar, Punjab'}</span>
          </p>

          <p className="text-xs text-neutral-500 mt-0.5 flex items-center justify-center sm:justify-start gap-1">
            <Phone className="w-3 h-3 text-brand-navy" />
            <span>{phoneNumber}</span>
          </p>

          <div className="flex items-center justify-center sm:justify-start gap-4 mt-3 text-xs font-semibold">
            <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> 4.9 (128 Reviews)
            </span>
            <span className="text-neutral-500">{t('dashboard.verifiedPartner', 'GigSevak Verified Partner')}</span>
          </div>
        </div>
      </div>

      {/* Skills / Categories */}
      <div className="bg-white rounded-3xl p-6 border border-neutral-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-dark uppercase tracking-wider flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-brand-primary" />
            <span>{t('dashboard.registeredSkills', 'Registered Service Skills')}</span>
          </h3>
          <span className="text-xs font-semibold text-neutral-400">{selectedCategories.length} {t('dashboard.active', 'Active')}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedCategories.map((skill: string, i: number) => (
            <span
              key={i}
              className="px-3 py-1.5 rounded-xl bg-neutral-100 text-neutral-700 text-xs font-semibold border border-neutral-200/50 capitalize"
            >
              {skill.replace(/-/g, ' ')}
            </span>
          ))}
        </div>
      </div>

      {/* KYC & Identity Info */}
      <div className="bg-white rounded-3xl p-6 border border-neutral-100 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-neutral-dark uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{t('dashboard.kycStatus', 'KYC & Verification Status')}</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-0.5">
            <span className="text-neutral-400 font-medium">{t('dashboard.aadhaarNumber', 'Aadhaar Number')}</span>
            <div className="font-bold text-neutral-dark font-mono">
              {identityData?.maskedAadhaar || 'XXXX XXXX 8492'}
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold">✓ {t('dashboard.uidaiVerified', 'UIDAI Verified')}</span>
          </div>
          <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-0.5">
            <span className="text-neutral-400 font-medium">{t('dashboard.liveSelfie', 'Live Selfie Check')}</span>
            <div className="font-bold text-emerald-700">100% {t('dashboard.livenessMatch', 'Match')}</div>
            <span className="text-[10px] text-emerald-600 font-semibold">✓ {t('dashboard.biometricPassed', 'Biometric Passed')}</span>
          </div>
        </div>
      </div>

      {/* Quick Settings & Navigation */}
      <div className="bg-white rounded-3xl border border-neutral-100 shadow-xs divide-y divide-neutral-100 overflow-hidden">
        {/* Language Selection Row */}
        <div className="w-full px-6 py-4 flex items-center justify-between hover:bg-neutral-50 transition">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 text-neutral-600 flex items-center justify-center">
              <Globe className="w-4 h-4 text-brand-navy" />
            </div>
            <div>
              <div className="text-sm font-bold text-neutral-dark">{t('dashboard.languageMode', 'Language Preference')}</div>
              <div className="text-xs text-neutral-muted">{selectedLangObj.nativeName} ({selectedLangObj.englishName})</div>
            </div>
          </div>
          <LanguagePickerBadge />
        </div>

        <button
          type="button"
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-neutral-50 transition text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-light text-brand-primary flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-neutral-dark">{t('dashboard.payoutsBank', 'Payouts & Bank Account')}</div>
              <div className="text-xs text-neutral-muted">{t('dashboard.payoutsSub', 'Manage UPI ID & direct bank transfers')}</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400" />
        </button>

        <button
          type="button"
          onClick={() => navigate('/worker/pending-request')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-neutral-50 transition text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 text-neutral-600 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-neutral-dark">{t('dashboard.appStatus', 'Application Status & History')}</div>
              <div className="text-xs text-neutral-muted">{t('dashboard.appStatusSub', 'Check onboarding and KYC review details')}</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400" />
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-red-50/50 transition text-left group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-100">
              <LogOut className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-red-600">{t('dashboard.logout', 'Log Out')}</div>
              <div className="text-xs text-red-400">Exit worker session</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-red-400" />
        </button>
      </div>
    </div>
  );
};
