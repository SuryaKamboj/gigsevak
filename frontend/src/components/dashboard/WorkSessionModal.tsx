import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Clock,
  MapPin,
  User,
  ShieldAlert,
  CheckSquare,
  Briefcase,
  Timer,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { JobItem } from '../../types/dashboard';
import { SosModal } from './SosModal';

interface WorkSessionModalProps {
  isOpen: boolean;
  job: JobItem | null;
  onClose: () => void;
  onCompleteClick: () => void;
}

export const WorkSessionModal: React.FC<WorkSessionModalProps> = ({
  isOpen,
  job,
  onClose,
  onCompleteClick,
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [showSosModal, setShowSosModal] = useState<boolean>(false);

  // Keep a live 1-second interval to tick the stopwatch continuously
  useEffect(() => {
    if (!isOpen || !job || !job.workStartTime) return;

    // Immediately sync current time
    setCurrentTime(Date.now());

    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, job?.workStartTime]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      window.getSelection()?.removeAllRanges();

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Helper formatting function: converts seconds into HH:MM:SS
  const formatTimeHHMMSS = (totalSeconds: number) => {
    const s = Math.max(0, Math.floor(totalSeconds));
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatClockTime = useCallback((timestamp?: number) => {
    if (!timestamp) return '10:30 AM';
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  const formatEstimatedText = (minutes?: number, fallback?: string) => {
    if (!minutes) return fallback || '2 hours';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0 && mins > 0) {
      return `${hrs} hour${hrs > 1 ? 's' : ''} ${mins} minute${mins > 1 ? 's' : ''}`;
    }
    if (hrs > 0) {
      return `${hrs} hour${hrs > 1 ? 's' : ''}`;
    }
    return `${mins} minutes`;
  };

  if (!isOpen || !job || typeof document === 'undefined') return null;

  // Stopwatch starts ONLY from workStartTime and counts UP continuously
  const startTime = job.workStartTime || Date.now();
  const elapsedSeconds = Math.max(0, Math.floor((currentTime - startTime) / 1000));
  const stopwatchDisplay = formatTimeHHMMSS(elapsedSeconds);

  const jobIdFormatted = job.id.toUpperCase().startsWith('JOB-')
    ? job.id.toUpperCase()
    : `JOB-${job.id.replace(/\D/g, '') || '1001'}`;

  const startedTimeFormatted = formatClockTime(job.workStartTime);
  const estimatedWorkTimeText = formatEstimatedText(job.estimatedDuration, job.duration);

  const translatedServiceName = (currentLang !== 'en' && job.translations?.[currentLang]?.serviceName)
    ? job.translations[currentLang].serviceName
    : job.serviceName;

  const translatedAddress = (currentLang !== 'en' && job.translations?.[currentLang]?.clientAddress)
    ? job.translations[currentLang].clientAddress
    : job.clientAddress;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9900] flex items-center justify-center p-3 sm:p-5 overflow-y-auto select-none"
      style={{ isolation: 'isolate' }}
    >
      {/* Background Overlay */}
      <div
        className="fixed inset-0 z-[9900] bg-black/80 backdrop-blur-md transition-opacity duration-200 cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Work Session Card */}
      <div
        className="relative z-[9950] bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-neutral-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto max-h-[94vh] flex flex-col select-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="work-session-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-4 sm:p-5 pb-3 border-b border-neutral-100 bg-white sticky top-0 z-20">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 id="work-session-title" className="text-base sm:text-lg font-extrabold text-neutral-900 leading-tight">
                  {t('dashboard.workSession', 'Work Session')}
                </h3>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[11px] text-neutral-500 font-semibold">{jobIdFormatted}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Minimize work session"
            title="Minimize to dashboard"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-neutral-700 flex items-center justify-center font-bold cursor-pointer transition-colors shadow-xs"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 overscroll-contain">
          {/* Top Job Information Details Grid */}
          <div className="bg-neutral-50/90 rounded-2xl p-4 border border-neutral-200/80 space-y-2.5">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-neutral-200/60">
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">{t('dashboard.workDescription', 'Service')}</span>
                <span className="text-sm sm:text-base font-extrabold text-neutral-900">{translatedServiceName}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">{t('pendingRequest.applicationId', 'Job ID')}</span>
                <span className="text-xs font-bold text-brand-primary font-mono">{jobIdFormatted}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-0.5">
              <div>
                <span className="text-neutral-400 font-medium block text-[11px]">Customer</span>
                <div className="flex items-center gap-1.5 font-bold text-neutral-800 mt-0.5">
                  <User className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                  <span className="truncate">{job.clientName}</span>
                </div>
              </div>

              <div>
                <span className="text-neutral-400 font-medium block text-[11px]">{t('dashboard.location', 'Location')}</span>
                <div className="flex items-center gap-1.5 text-neutral-700 mt-0.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" />
                  <span className="truncate">{translatedAddress}</span>
                </div>
              </div>

              <div>
                <span className="text-neutral-400 font-medium block text-[11px]">{t('dashboard.workStarted', 'Work Started')}</span>
                <div className="flex items-center gap-1.5 font-bold text-neutral-800 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                  <span>{startedTimeFormatted}</span>
                </div>
              </div>

              <div>
                <span className="text-neutral-400 font-medium block text-[11px]">{t('dashboard.estimatedTime', 'Estimated Duration')}</span>
                <div className="flex items-center gap-1.5 font-medium text-neutral-600 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                  <span>{estimatedWorkTimeText}</span>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN VISUAL FOCUS: Live Upward Stopwatch */}
          <div className="rounded-3xl p-5 sm:p-7 text-center transition-all duration-300 border-2 border-neutral-800 bg-neutral-900 text-white shadow-xl relative overflow-hidden">
            {/* Header Badge */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-neutral-200 text-xs font-bold uppercase tracking-wider border border-white/10">
                <Timer className="w-3.5 h-3.5 text-brand-primary animate-spin-slow" />
                <span>{t('dashboard.actualWorkDuration', 'Actual Work Duration')}</span>
              </div>
            </div>

            {/* Giant Live Stopwatch Digits (Counting UP continuously) */}
            <div className="py-2 sm:py-3">
              <div className="text-4xl sm:text-5xl md:text-6xl font-black font-mono tracking-wider sm:tracking-widest text-white drop-shadow-sm">
                {stopwatchDisplay}
              </div>
              <p className="text-xs mt-2 font-medium text-neutral-400 flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{t('dashboard.workSessionSub', 'Live tracking active for this service session.')}</span>
              </p>
            </div>
          </div>

          {/* Action Buttons: Completed & SOS */}
          <div className="space-y-3 pt-1">
            {/* Completed Button */}
            <button
              type="button"
              onClick={onCompleteClick}
              className="w-full h-14 sm:h-15 rounded-2xl font-extrabold text-base bg-[#01471f] hover:bg-[#013819] active:scale-[0.99] text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <CheckSquare className="w-5 h-5 stroke-[2.5]" />
              <span>{t('dashboard.completeWork', 'Complete Work')}</span>
            </button>

            {/* Highly Visible SOS Emergency Button */}
            <button
              type="button"
              onClick={() => setShowSosModal(true)}
              className="w-full py-3.5 px-4 rounded-2xl border-2 border-red-500/80 bg-red-50 hover:bg-red-100 active:scale-[0.99] text-red-700 transition-all flex items-center justify-between shadow-xs cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-xs shadow-xs group-hover:scale-105 transition-transform">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-black text-red-700 tracking-wide block leading-tight">SOS</span>
                  <span className="text-[11px] font-semibold text-red-600">{t('dashboard.emergencySos', 'Emergency SOS')}</span>
                </div>
              </div>
              <span className="text-xs font-bold text-red-700 bg-white px-2.5 py-1 rounded-xl border border-red-200">
                {t('dashboard.emergencySos', 'Tap for Help')}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* SOS Modal inside Work Session */}
      <SosModal
        isOpen={showSosModal}
        onClose={() => setShowSosModal(false)}
        job={job}
        elapsedFormatted={stopwatchDisplay}
      />
    </div>
  );

  return createPortal(modalContent, document.body);
};
