import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, ShieldAlert, CheckCircle2, PhoneCall, MapPin, User, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { JobItem } from '../../types/dashboard';

interface SosModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobItem | null;
  elapsedFormatted: string;
}

export const SosModal: React.FC<SosModalProps> = ({
  isOpen,
  onClose,
  job,
  elapsedFormatted,
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en';
  const [isAlertSent, setIsAlertSent] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setIsAlertSent(false);
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

  if (!isOpen || !job || typeof document === 'undefined') return null;

  const jobIdFormatted = job.id.toUpperCase().startsWith('JOB-')
    ? job.id.toUpperCase()
    : `JOB-${job.id.replace(/\D/g, '') || '1001'}`;

  const translatedAddress = (currentLang !== 'en' && job.translations?.[currentLang]?.clientAddress)
    ? job.translations[currentLang].clientAddress
    : job.clientAddress;

  const modalContent = (
    <div
      className="fixed inset-0 z-[10010] flex items-center justify-center p-3 sm:p-5 overflow-y-auto select-none"
      style={{ isolation: 'isolate' }}
    >
      {/* Background Overlay */}
      <div
        className="fixed inset-0 z-[10010] bg-black/80 backdrop-blur-md transition-opacity duration-200 cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        className="relative z-[10020] bg-white rounded-3xl w-full max-w-md shadow-2xl border border-red-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto select-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sos-modal-title"
      >
        {!isAlertSent ? (
          /* Confirmation State */
          <div className="p-5 sm:p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close emergency popup"
                className="w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center font-bold cursor-pointer"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            <div>
              <h3 id="sos-modal-title" className="text-xl sm:text-2xl font-extrabold text-neutral-900">
                {t('dashboard.emergencySos', 'Emergency Assistance')}
              </h3>
              <p className="text-sm text-neutral-600 mt-1 leading-relaxed">
                {t('dashboard.sosSub', 'Are you in immediate danger or do you need emergency assistance?')}
              </p>
            </div>

            <div className="bg-red-50 rounded-2xl p-3.5 border border-red-200 text-xs text-red-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-red-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Immediate Safety Support</span>
              </div>
              <p className="text-[11px] text-red-800">
                This will alert the GigSevak safety monitoring team with your current GPS location and active job details.
              </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="h-12 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 font-bold text-sm transition cursor-pointer"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={() => setIsAlertSent(true)}
                className="h-12 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>{t('dashboard.sosConfirm', 'Confirm SOS')}</span>
              </button>
            </div>
          </div>
        ) : (
          /* SOS Alert Sent State */
          <div className="p-5 sm:p-6 space-y-5 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center animate-pulse">
              <PhoneCall className="w-8 h-8 text-red-600" />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>SOS Alert Sent</span>
              </div>
              <h3 className="text-xl font-extrabold text-neutral-900 pt-1">
                Emergency Assistance Notified
              </h3>
              <p className="text-xs text-neutral-600">
                Emergency assistance has been notified. Stay safe at your location.
              </p>
            </div>

            {/* Job & Location Details */}
            <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 text-left text-xs space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-neutral-200/60">
                <span className="text-neutral-500 font-medium">{t('pendingRequest.applicationId', 'Job ID')}</span>
                <span className="font-extrabold text-neutral-900">{jobIdFormatted}</span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <User className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                <span className="text-neutral-700 truncate font-semibold">{t('dashboard.customer', 'Customer')}: {job.clientName}</span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                <span className="text-neutral-700 truncate">{t('dashboard.location', 'Location')}: {translatedAddress}</span>
              </div>

              <div className="flex items-center gap-2 pt-1 text-neutral-700">
                <Clock className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                <span>{t('dashboard.actualWorkDuration', 'Current Work Duration')}: <strong className="text-neutral-900">{elapsedFormatted}</strong></span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full h-12 rounded-xl bg-neutral-900 hover:bg-black text-white font-bold text-sm transition cursor-pointer"
            >
              {t('dashboard.workSession', 'Return to Work Session')}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
