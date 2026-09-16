import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  CheckCircle2,
  Hourglass,
  RefreshCw,
  ShieldCheck,
  User,
  Briefcase,
  MapPin,
  Calendar,
  Phone,
  HelpCircle,
  Info,
  Sparkles,
  ArrowRight,
  CheckCircle,
  LayoutDashboard,
  XCircle,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { AuthLogo } from '../../components/auth/AuthLogo';
import { SpeakerButton } from '../../components/common/SpeakerButton';
import { LanguagePickerBadge } from '../../components/common/LanguagePickerBadge';
import { getStoredIdentityStatus } from '../../services/identityService';
import { authService } from '../../services/authService';
import { workerBackendService } from '../../services/workerBackendService';
import { onboardingService } from '../../services/onboardingService';
import { LANGUAGES } from '../../data/languages';

export const WorkerPendingRequest: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const activeLangCode = i18n.language || localStorage.getItem('workerLanguage') || 'en';

  // Status can be 'pending', 'approved', or 'rejected'
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>(() => {
    const saved = localStorage.getItem('worker_application_status');
    return saved === 'approved' ? 'approved' : saved === 'rejected' ? 'rejected' : 'pending';
  });

  const [rejectionReason, setRejectionReason] = useState<string | null>(() => {
    return localStorage.getItem('worker_rejection_reason') || null;
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefreshToast, setShowRefreshToast] = useState(false);
  const [identityData] = useState(() => getStoredIdentityStatus());

  // Check backend approval status in real-time
  const checkBackendStatus = React.useCallback(async () => {
    try {
      const res = await workerBackendService.getProfile();
      const worker = res?.data || res;
      if (worker?.kycVerificationStatus === 'VERIFIED') {
        setStatus('approved');
        setRejectionReason(null);
        localStorage.setItem('worker_application_status', 'approved');
        localStorage.removeItem('worker_rejection_reason');
      } else if (worker?.kycVerificationStatus === 'REJECTED') {
        setStatus('rejected');
        const reason =
          worker.rejectionReason ||
          worker.privateData?.verificationAudit?.rejectionReason ||
          'Application details could not be verified by the administrator. Please update and re-submit.';
        setRejectionReason(reason);
        localStorage.setItem('worker_application_status', 'rejected');
        localStorage.setItem('worker_rejection_reason', reason);
      } else {
        setStatus('pending');
        setRejectionReason(null);
        localStorage.setItem('worker_application_status', 'pending');
        localStorage.removeItem('worker_rejection_reason');
      }
    } catch (err) {
      console.warn('Backend status check notice:', err);
    }
  }, []);

  const phoneNumber = (() => {
    const saved = localStorage.getItem('user_mobile_number');
    if (saved) return saved;
    const session = authService.getCurrentUser();
    return session?.phoneNumber ? `+91 ${session.phoneNumber}` : '+91 9876543210';
  })();

  const selectedCategories = (() => {
    try {
      const raw = sessionStorage.getItem('gigsevak_worker_categories');
      return raw ? JSON.parse(raw) : ['electrical-repair', 'plumbing-sanitary'];
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

  React.useEffect(() => {
    const syncApplicationOnMount = async () => {
      try {
        const savedPhone = localStorage.getItem('user_mobile_number') || '+917906072410';
        const formattedPhone = savedPhone.startsWith('+91') ? savedPhone : `+91${savedPhone.replace(/\D/g, '').slice(-10)}`;
        if (!localStorage.getItem('gigsevak_token')) {
          await workerBackendService.loginWorker(formattedPhone, 'Worker Partner');
        }

        const profileRes = await workerBackendService.getProfile();
        const currentWorker = profileRes?.data || profileRes;
        
        // Only submit initial onboarding application if worker has no KYC status yet
        if (!currentWorker?.kycVerificationStatus) {
          const storedIdentity: any = getStoredIdentityStatus();
          const aadhaarNum = sessionStorage.getItem('gigsevak_worker_aadhaar') || storedIdentity?.maskedAadhaar || '548291038492';
          await workerBackendService.submitOnboardingApplication({
            fullName: currentWorker?.fullName || 'Worker Partner',
            aadhaarNumber: aadhaarNum,
            aadhaarVerified: true,
            selfieUrl: storedIdentity?.selfieReference || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
            skills: selectedCategories && selectedCategories.length > 0 ? selectedCategories : ['ELECTRICAL', 'PLUMBING'],
            primaryServiceCategory: selectedCategories?.[0] || 'ELECTRICAL',
            serviceArea: locationData?.name || 'BH6 A Block, Gurudwara Rd, Punjab 144411, India',
            addressLine: locationData?.name || 'BH6 A Block, Gurudwara Rd, Punjab 144411, India'
          });
        }
      } catch (err) {
        console.warn('Sync application on mount notice:', err);
      }
      checkBackendStatus();
    };

    syncApplicationOnMount();
    const interval = setInterval(checkBackendStatus, 3000);
    return () => clearInterval(interval);
  }, [checkBackendStatus, selectedCategories, locationData]);

  const selectedLangObj = LANGUAGES.find((l) => l.id === activeLangCode) || LANGUAGES[0];

  const applicationId = (() => {
    const digits = phoneNumber.replace(/\D/g, '').slice(-5) || '84920';
    return `GS-${new Date().getFullYear()}-${digits}`;
  })();

  const formattedDate = new Intl.DateTimeFormat(activeLangCode === 'en' ? 'en-IN' : activeLangCode, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await checkBackendStatus();
    setIsRefreshing(false);
    setShowRefreshToast(true);
    setTimeout(() => setShowRefreshToast(false), 3000);
  };

  const toggleApprovalForDemo = (newStatus: 'pending' | 'approved' | 'rejected') => {
    setStatus(newStatus);
    localStorage.setItem('worker_application_status', newStatus);
    if (newStatus === 'rejected') {
      const reason = 'UIDAI verification unconfirmed: Aadhaar image photo did not clearly match the live capture selfie.';
      setRejectionReason(reason);
      localStorage.setItem('worker_rejection_reason', reason);
    } else if (newStatus === 'approved') {
      setRejectionReason(null);
      localStorage.removeItem('worker_rejection_reason');
    }
  };

  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';

  // Translation text fallbacks
  const titleText = isApproved
    ? t('pendingRequest.approvedTitle', { lng: activeLangCode }) || 'Application Approved!'
    : isRejected
    ? 'Application Not Approved'
    : t('pendingRequest.title', { lng: activeLangCode }) || 'Application Under Review';

  const subtitleText = isApproved
    ? t('pendingRequest.approvedSubtitle', { lng: activeLangCode }) || 'Congratulations! Your partner credentials and KYC have been verified. You can now access your dashboard and start accepting jobs.'
    : isRejected
    ? 'Your worker onboarding application was reviewed by the cooperative administrator and rejected.'
    : t('pendingRequest.subtitle', { lng: activeLangCode }) || 'Your application has been received and is currently under verification.';

  const statusText = isApproved
    ? t('pendingRequest.approvedStatus', { lng: activeLangCode }) || 'Approved & Active'
    : isRejected
    ? 'Application Rejected'
    : t('pendingRequest.status', { lng: activeLangCode }) || 'Pending Verification';

  const applicationIdText = t('pendingRequest.applicationId', { lng: activeLangCode }) || 'Application ID';
  const submittedOnText = t('pendingRequest.submittedOn', { lng: activeLangCode }) || 'Submitted On';
  const stepSubmittedText = t('pendingRequest.stepSubmitted', { lng: activeLangCode }) || 'Application Submitted';
  const stepUnderReviewText = t('pendingRequest.stepUnderReview', { lng: activeLangCode }) || 'Document & KYC Verification';
  const stepApprovalText = t('pendingRequest.stepApproval', { lng: activeLangCode }) || 'Final Approval & Activation';
  const completedText = t('pendingRequest.completed', { lng: activeLangCode }) || 'Completed';
  const inProgressText = t('pendingRequest.inProgress', { lng: activeLangCode }) || 'In Progress';
  const pendingText = t('pendingRequest.pending', { lng: activeLangCode }) || 'Pending';
  const refreshStatusText = t('pendingRequest.refreshStatus', { lng: activeLangCode }) || 'Refresh Status';
  const statusUpdatedText = t('pendingRequest.statusUpdated', { lng: activeLangCode }) || 'Status is up to date';
  const needHelpText = t('pendingRequest.needHelp', { lng: activeLangCode }) || 'Need help with your application?';
  const goToWorkerDashboardText = t('pendingRequest.goToWorkerDashboard', { lng: activeLangCode }) || 'Go to Worker Dashboard';
  const simulateApprovalText = t('pendingRequest.simulateApproval', { lng: activeLangCode }) || 'Simulate Instant Approval (Test)';

  const fullAudioText = `${titleText}. ${subtitleText}. ${statusText}.`;

  return (
    <main className="min-h-[100dvh] w-full bg-slate-50/60 sm:bg-slate-50/50 flex flex-col justify-center items-center p-4 sm:p-6 py-6 antialiased">
      <div className="w-full max-w-[540px] mx-auto bg-white rounded-2xl border border-slate-200/80 sm:border-slate-100 shadow-card p-6 sm:p-8 space-y-6">
        {/* Header Strip */}
        <header className="flex justify-between items-center border-b border-slate-100 pb-4">
          <AuthLogo size="sm" />
          <div className="flex items-center gap-2">
            <LanguagePickerBadge />
            <SpeakerButton
              text={fullAudioText}
              langCode={activeLangCode}
              size="sm"
              label="Listen application status"
            />
          </div>
        </header>

        {/* Hero Section: Status Indicator */}
        <div className="text-center space-y-2 py-1">
          {isApproved ? (
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-soft">
              <ShieldCheck className="w-9 h-9 stroke-[2.2] animate-bounce" />
            </div>
          ) : isRejected ? (
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-soft">
              <XCircle className="w-9 h-9 stroke-[2.2]" />
            </div>
          ) : (
            <div className="relative w-16 h-16 mx-auto rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-soft">
              <Hourglass className="w-8 h-8 animate-pulse text-amber-600" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
              </span>
            </div>
          )}

          <div className="space-y-1">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                isApproved
                  ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                  : isRejected
                  ? 'text-rose-800 bg-rose-50 border-rose-200'
                  : 'text-amber-800 bg-amber-50 border-amber-200'
              }`}
            >
              {isApproved ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{statusText}</span>
                </>
              ) : isRejected ? (
                <>
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>{statusText}</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>{statusText}</span>
                </>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#17212B]">
              {titleText}
            </h1>
            <p className="text-xs sm:text-sm text-[#66737D] max-w-[420px] mx-auto leading-relaxed">
              {subtitleText}
            </p>
          </div>
        </div>

        {/* Rejection Alert Banner with Explicit Reason from Admin */}
        {isRejected && (
          <div className="p-4 rounded-2xl bg-rose-50/95 border border-rose-200 text-xs text-rose-950 flex flex-col gap-2.5 shadow-xs text-left animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-full bg-rose-100 text-rose-700">
                <AlertTriangle className="w-4 h-4 text-rose-700 flex-shrink-0" />
              </div>
              <span className="font-bold text-rose-900 text-sm">
                Official Rejection Reason from Administrator:
              </span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-rose-200 text-xs font-medium text-rose-950 leading-relaxed shadow-xs">
              "{rejectionReason || 'Application details could not be verified by the cooperative administrator.'}"
            </div>
            <p className="text-[11px] text-rose-700 leading-relaxed">
              Please review the reason above, update your onboarding details (such as your Aadhaar card number, live selfie, or selected service categories), and re-apply.
            </p>
          </div>
        )}

        {/* Demo Status Switcher Pill */}
        <div className="p-2 rounded-xl bg-slate-100/80 border border-slate-200 flex items-center justify-between text-xs">
          <span className="text-[11px] font-semibold text-slate-600 pl-1">
            Test Status Simulation:
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => toggleApprovalForDemo('pending')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                status === 'pending'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200'
              }`}
            >
              Pending
            </button>
            <button
              type="button"
              onClick={() => toggleApprovalForDemo('approved')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                status === 'approved'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200'
              }`}
            >
              Approved
            </button>
            <button
              type="button"
              onClick={() => toggleApprovalForDemo('rejected')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                status === 'rejected'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200'
              }`}
            >
              Rejected
            </button>
          </div>
        </div>

        {/* Application Details Summary Card */}
        <div className="bg-[#F5F0DD]/40 border border-[#E9E2C6] rounded-2xl p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center justify-between text-xs text-[#66737D] font-medium border-b border-[#E9E2C6]/80 pb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[#17212B]">{applicationIdText}:</span>
              <span className="font-mono font-bold text-[#1C516C] bg-white px-2 py-0.5 rounded border border-[#E9E2C6]">
                {applicationId}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#66737D]">
              <Calendar className="w-3.5 h-3.5 text-[#1C516C]" />
              <span>{submittedOnText}: {formattedDate}</span>
            </div>
          </div>

          {/* User Info Row */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#1C516C] text-[#FDA649] flex items-center justify-center shadow-xs shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base font-bold text-[#17212B] truncate">
                {t('dashboard.verifiedWorker', { lng: activeLangCode }) || 'Worker Partner'}
              </p>
              <div className="flex items-center gap-2 text-xs text-[#66737D]">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#1C516C]" />
                  {phoneNumber}
                </span>
                <span>•</span>
                <span className="font-medium text-[#1C516C]">
                  {selectedLangObj.nativeName}
                </span>
                {identityData?.maskedAadhaar && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-[11px]">
                      {identityData.maskedAadhaar}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Details Row: Categories & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
            {selectedCategories.length > 0 && (
              <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 flex flex-col gap-0.5">
                <div className="flex items-center gap-1 text-[#66737D] text-[11px]">
                  <Briefcase className="w-3 h-3 text-[#1C516C]" />
                  <span>{t('dashboard.selectedServices', { lng: activeLangCode }) || 'Services'}</span>
                </div>
                <span className="font-semibold text-[#17212B] truncate capitalize">
                  {selectedCategories.join(', ').replace(/-/g, ' ')}
                </span>
              </div>
            )}

            {locationData?.name && (
              <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 flex flex-col gap-0.5">
                <div className="flex items-center gap-1 text-[#66737D] text-[11px]">
                  <MapPin className="w-3 h-3 text-[#1C516C]" />
                  <span>{t('dashboard.serviceArea', { lng: activeLangCode }) || 'Service Area'}</span>
                </div>
                <span className="font-semibold text-[#17212B] truncate">
                  {locationData.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Verification Progress Stepper */}
        <div className="space-y-3 pt-1">
          <p className="text-xs font-bold uppercase tracking-wider text-[#66737D]">
            {t('dashboard.authKycStatus', { lng: activeLangCode }) || 'Application Progress'}
          </p>

          <div className="space-y-3 pl-1">
            {/* Step 1: Application Submitted */}
            <div className="flex items-start gap-3">
              <div className="relative flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center ring-4 ring-emerald-50 shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                </div>
                <div className={`w-0.5 h-7 mt-1 ${isApproved ? 'bg-emerald-300' : 'bg-slate-200'}`} />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs sm:text-sm font-bold text-[#17212B]">
                    {stepSubmittedText}
                  </p>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {completedText}
                  </span>
                </div>
                <p className="text-[11px] text-[#66737D] mt-0.5">
                  {t('dashboard.kycVerified', { lng: activeLangCode }) || 'Aadhaar & Selfie KYC Submitted'}
                </p>
              </div>
            </div>

            {/* Step 2: Document & KYC Verification */}
            <div className="flex items-start gap-3">
              <div className="relative flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center ring-4 shrink-0 ${
                    isApproved
                      ? 'bg-emerald-100 text-emerald-700 ring-emerald-50'
                      : isRejected
                      ? 'bg-rose-100 text-rose-700 ring-rose-50'
                      : 'bg-amber-100 text-amber-700 ring-amber-50'
                  }`}
                >
                  {isApproved ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  ) : isRejected ? (
                    <XCircle className="w-4 h-4 text-rose-700" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-700 animate-spin" style={{ animationDuration: '4s' }} />
                  )}
                </div>
                <div className={`w-0.5 h-7 mt-1 ${isApproved ? 'bg-emerald-300' : isRejected ? 'bg-rose-300' : 'bg-slate-200'}`} />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs sm:text-sm font-bold text-[#17212B]">
                    {stepUnderReviewText}
                  </p>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isApproved
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : isRejected
                        ? 'text-rose-700 bg-rose-50 border-rose-200'
                        : 'text-amber-700 bg-amber-50 border-amber-200 animate-pulse'
                    }`}
                  >
                    {isApproved ? completedText : isRejected ? 'Rejected' : inProgressText}
                  </span>
                </div>
                <p className="text-[11px] text-[#66737D] mt-0.5">
                  {isApproved
                    ? 'UIDAI Aadhaar & Biometric checks successfully verified'
                    : isRejected
                    ? 'Verification declined by cooperative administration'
                    : 'Estimated Review Time: 24 - 48 Hours'}
                </p>
              </div>
            </div>

            {/* Step 3: Final Approval & Account Activation */}
            <div className="flex items-start gap-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center ring-4 shrink-0 ${
                  isApproved
                    ? 'bg-emerald-100 text-emerald-700 ring-emerald-50'
                    : isRejected
                    ? 'bg-slate-100 text-slate-400 ring-slate-50'
                    : 'bg-slate-100 text-slate-400 ring-slate-50'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between">
                  <p className={`text-xs sm:text-sm font-semibold ${isApproved ? 'font-bold text-[#17212B]' : 'text-[#66737D]'}`}>
                    {stepApprovalText}
                  </p>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isApproved
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : isRejected
                        ? 'text-slate-600 bg-slate-100 border-slate-200'
                        : 'text-[#66737D] bg-slate-100 border-slate-200'
                    }`}
                  >
                    {isApproved ? 'Active' : isRejected ? 'Blocked' : pendingText}
                  </span>
                </div>
                <p className="text-[11px] text-[#66737D] mt-0.5">
                  {isApproved
                    ? 'Partner account is active. Ready to accept live service orders!'
                    : isRejected
                    ? 'Dashboard locked. Re-submission required for activation.'
                    : 'You will receive an SMS update on your registered phone number.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info or Celebration Banner */}
        {isApproved ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-xs text-emerald-950">
            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-emerald-900">Your account is fully activated!</p>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                You can now browse today's scheduled jobs, toggle your live availability, and manage client orders.
              </p>
            </div>
          </div>
        ) : !isRejected ? (
          <div className="p-3.5 rounded-xl bg-[#F5F0DD]/60 border border-[#E9E2C6] flex items-start gap-2.5 text-xs text-[#17212B]">
            <Info className="w-4 h-4 text-[#1C516C] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-[#1C516C]">Estimated Review Time: 24 - 48 Hours</p>
              <p className="text-[11px] text-[#66737D] leading-relaxed">
                You will receive an SMS update on your registered phone number once your application is approved.
              </p>
            </div>
          </div>
        ) : null}

        {/* Refresh feedback toast */}
        {showRefreshToast && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-800 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{statusUpdatedText}</span>
          </div>
        )}

        {/* Help section */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-[#66737D]">
          <HelpCircle className="w-3.5 h-3.5 text-[#1C516C]" />
          <span>{needHelpText}</span>
          <a href="tel:1800123456" className="font-semibold text-[#1C516C] hover:underline">
            1800-123-456
          </a>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          {isApproved ? (
            <button
              type="button"
              onClick={() => navigate('/worker/dashboard')}
              className="w-full h-13 rounded-xl text-sm sm:text-base font-bold text-white bg-[#01471f] hover:bg-[#013819] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/15"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>{goToWorkerDashboardText}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          ) : isRejected ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onboardingService.reset();
                  localStorage.removeItem('worker_application_status');
                  localStorage.removeItem('worker_rejection_reason');
                  navigate('/worker/verification');
                }}
                className="w-full h-13 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#12355B] hover:bg-[#0B223B] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#12355B]/15"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Update Details & Re-apply</span>
                <ArrowRight className="w-4 h-4 stroke-[2]" />
              </button>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full h-11 rounded-xl text-xs sm:text-sm font-semibold text-[#1C516C] bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{refreshStatusText}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full h-12 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#1C516C] hover:bg-[#133B50] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#1C516C]/10 disabled:opacity-75"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{refreshStatusText}</span>
              </button>

              <button
                type="button"
                onClick={() => toggleApprovalForDemo('approved')}
                className="w-full h-11 rounded-xl text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>{simulateApprovalText}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
};
