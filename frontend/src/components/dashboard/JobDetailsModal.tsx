import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Phone,
  MessageSquare,
  Clock,
  MapPin,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Send,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { JobItem } from '../../types/dashboard';
import { GoogleJobMap } from './GoogleJobMap';
import { OtpVerificationModal } from './OtpVerificationModal';
import { CompleteWorkModal } from './CompleteWorkModal';
import { BeforeWorkModal } from './BeforeWorkModal';
import { WorkSessionModal } from './WorkSessionModal';

interface JobDetailsModalProps {
  job: JobItem;
  onClose: () => void;
  onUpdateJob?: (updatedJob: JobItem) => void;
  showBookingActions?: boolean;
  onAccept?: (job: JobItem) => void;
  onDecline?: (job: JobItem) => void;
}

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  job,
  onClose,
  onUpdateJob,
  showBookingActions = false,
  onAccept,
  onDecline,
}) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';

  const serviceName = job.translations?.[lang]?.serviceName || job.serviceName;
  const clientAddress = job.translations?.[lang]?.clientAddress || job.clientAddress;
  const scheduledTime = job.translations?.[lang]?.scheduledTime || job.scheduledTime;
  const description = job.translations?.[lang]?.description || job.description;

  const [isReached, setIsReached] = useState<boolean>(!!job.isLocationReached);
  const [showOtpModal, setShowOtpModal] = useState<boolean>(false);
  const [showBeforeWorkModal, setShowBeforeWorkModal] = useState<boolean>(false);
  const [showWorkSessionModal, setShowWorkSessionModal] = useState<boolean>(false);
  const [showCompleteModal, setShowCompleteModal] = useState<boolean>(false);

  useEffect(() => {
    setIsReached(!!job.isLocationReached);
  }, [job.isLocationReached]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [showAllPhotosModal, setShowAllPhotosModal] = useState<boolean>(false);
  const [showCallModal, setShowCallModal] = useState<boolean>(false);
  const [showMessageModal, setShowMessageModal] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'worker' | 'client'; text: string; time: string }>>([
    { sender: 'client', text: 'Hello! Please let me know once you arrive at the location.', time: '9:45 AM' },
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const handleOtpSuccess = () => {
    setIsReached(true);
    setShowOtpModal(false);
    const updated = { ...job, isLocationReached: true, locationVerified: true };
    if (onUpdateJob) {
      onUpdateJob(updated);
    }
    // Proceed directly to before-work photo step
    setShowBeforeWorkModal(true);
  };

  const handleStartWork = (beforeWorkPhoto: string) => {
    const now = Date.now();
    const updated: JobItem = {
      ...job,
      beforeWorkPhoto,
      workStarted: true,
      workStartTime: now,
      status: 'in_progress',
    };
    if (onUpdateJob) {
      onUpdateJob(updated);
    }
    setShowBeforeWorkModal(false);
    setShowWorkSessionModal(true);
  };

  const handleCompleteConfirm = (proofPhoto: string) => {
    const completionTime = Date.now();
    const startMs = job.workStartTime || (completionTime - (job.estimatedDuration || 120) * 60 * 1000);
    const totalMinutes = Math.max(1, Math.round((completionTime - startMs) / (1000 * 60)));
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const actualDurationText = hrs > 0 && mins > 0
      ? `${hrs} hour${hrs > 1 ? 's' : ''} ${mins} minute${mins > 1 ? 's' : ''}`
      : hrs > 0
      ? `${hrs} hour${hrs > 1 ? 's' : ''}`
      : `${mins} minute${mins > 1 ? 's' : ''}`;

    const nowFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated: JobItem = {
      ...job,
      status: 'completed',
      completionProofPhoto: proofPhoto,
      completedAt: nowFormatted,
      completionTime,
      actualWorkDuration: actualDurationText,
      workCompleted: true,
    };
    if (onUpdateJob) {
      onUpdateJob(updated);
    }
    setShowCompleteModal(false);
    setShowWorkSessionModal(false);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) => [
      ...prev,
      { sender: 'worker', text: inputMessage.trim(), time: now },
    ]);
    setInputMessage('');
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'client', text: 'Got it, thank you!', time: 'Just now' },
      ]);
    }, 1200);
  };

  const photos = job.customerPhotos && job.customerPhotos.length > 0 ? job.customerPhotos : [job.serviceImage || job.image];

  if (typeof document === 'undefined') return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9000] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto select-none transition-all duration-200"
      onClick={onClose}
    >
      {/* Modal Dialog Card */}
      <div
        className="bg-white rounded-3xl max-w-lg md:max-w-2xl w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl border border-neutral-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative my-auto select-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header: Client Information + Clear Close X */}
        <div className="flex items-start justify-between gap-3 p-4 sm:p-6 border-b border-neutral-100 bg-white sticky top-0 z-20">
          <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0 pr-2">
            {/* Client Profile Image */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200 flex-shrink-0 shadow-2xs">
              <img
                src={job.clientImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                alt={job.clientName}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Client Text Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg sm:text-xl font-extrabold text-[#222222] truncate leading-tight">
                  {job.clientName}
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-brand-light text-brand-primary border border-brand-primary/20 flex-shrink-0">
                  {serviceName}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#6B6B6B] flex items-center gap-1.5 mt-1 truncate">
                <MapPin className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" />
                <span className="truncate">{clientAddress}</span>
              </p>

              <p className="text-xs sm:text-sm text-[#222222] font-semibold flex items-center gap-1.5 mt-1">
                <Clock className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" />
                <span>{scheduledTime}</span>
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close job details"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-neutral-800 hover:text-black flex items-center justify-center font-bold cursor-pointer transition-colors shadow-xs flex-shrink-0 border border-neutral-200/60 focus:outline-none focus:ring-2 focus:ring-neutral-400"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 overscroll-contain">
          {/* Call + Message Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowCallModal(true)}
              className="flex-1 inline-flex items-center justify-center gap-2 h-11 sm:h-12 rounded-xl border-2 border-[#1C516C] text-[#1C516C] bg-white hover:bg-[#1C516C]/5 active:scale-95 text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1C516C]"
            >
              <Phone className="w-4 h-4 text-[#1C516C] stroke-[2.2]" />
              <span>{t('dashboard.call', 'Call')}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowMessageModal(true)}
              className="flex-1 inline-flex items-center justify-center gap-2 h-11 sm:h-12 rounded-xl border-2 border-[#1C516C] text-[#1C516C] bg-white hover:bg-[#1C516C]/5 active:scale-95 text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1C516C]"
            >
              <MessageSquare className="w-4 h-4 text-[#1C516C] stroke-[2.2]" />
              <span>{t('dashboard.message', 'Message')}</span>
            </button>
          </div>

          {/* Photos from the Customer */}
          <section className="space-y-2.5">
            <div className="flex items-baseline justify-between">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-[#222222]">
                  {t('dashboard.photosFromCustomer', 'Photos from the Customer')}
                </h4>
                <p className="text-xs text-[#6B6B6B]">
                  {t('dashboard.photosSubtitle', 'See what needs to be fixed or worked on.')}
                </p>
              </div>
              {photos.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllPhotosModal(true)}
                  className="text-xs font-bold text-brand-primary hover:text-brand-hover hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>{t('dashboard.seeMore', 'See more')} ({photos.length})</span>
                </button>
              )}
            </div>

            {/* Photo Preview Grid (Compact 4 columns / 2x2) */}
            <div className="grid grid-cols-4 gap-2">
              {photos.slice(0, 4).map((photoUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedPhotoIndex(idx)}
                  className="group relative h-16 sm:h-20 rounded-xl overflow-hidden bg-neutral-100 cursor-pointer border border-neutral-200/80 hover:border-brand-primary/60 transition-all duration-200 shadow-2xs"
                >
                  <img
                    src={photoUrl}
                    alt={`Customer photo ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
                  <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/60 text-white text-[9px] font-medium backdrop-blur-2xs">
                    #{idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Work Description */}
          <section className="space-y-2">
            <h4 className="text-sm sm:text-base font-bold text-[#222222]">
              {t('dashboard.workDescription', 'Work Description')}
            </h4>
            <div className="bg-neutral-50 rounded-2xl p-3.5 sm:p-4 border border-neutral-200/70 text-xs sm:text-sm text-neutral-800 leading-relaxed">
              {description}
            </div>
          </section>

          {/* Location / Google Map */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm sm:text-base font-bold text-[#222222]">
                {t('dashboard.location', 'Location & Route')}
              </h4>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${job.latitude},${job.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-brand-primary hover:text-brand-hover hover:underline"
              >
                <span>{t('dashboard.openInMaps', 'Open in Google Maps')}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Google Maps Component */}
            <GoogleJobMap
              latitude={job.latitude}
              longitude={job.longitude}
              address={clientAddress}
              clientName={job.clientName}
              serviceName={serviceName}
              className="h-52 sm:h-60 w-full"
            />
          </section>

          {/* In-Progress Work Session Callout Banner */}
          {job.workStarted && job.status !== 'completed' && (
            <div className="bg-neutral-900 text-white rounded-2xl p-4 shadow-md flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Work In Progress</span>
                </div>
                <p className="text-xs text-neutral-300">Live countdown timer &amp; SOS active</p>
              </div>

              <button
                type="button"
                onClick={() => setShowWorkSessionModal(true)}
                className="px-3.5 py-2 bg-white hover:bg-neutral-100 text-neutral-900 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer active:scale-95"
              >
                View Session
              </button>
            </div>
          )}

          {/* Completed Work Summary Card */}
          {job.status === 'completed' && (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-emerald-900">{t('dashboard.workSummary', 'Work Summary')}</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-600 text-white">
                  ✓ {t('dashboard.completed', 'Completed')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-neutral-700 pt-1 border-t border-emerald-200/60">
                <div>
                  <span className="text-[11px] text-neutral-500 block font-medium">{t('dashboard.workStarted', 'Work Started')}</span>
                  <span className="font-bold text-neutral-900">
                    {job.workStartTime ? new Date(job.workStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:30 AM'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-neutral-500 block font-medium">{t('dashboard.completed', 'Work Completed')}</span>
                  <span className="font-bold text-neutral-900">{job.completedAt || 'Completed'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-neutral-500 block font-medium">{t('dashboard.actualWorkDuration', 'Actual Work Duration')}</span>
                  <span className="font-mono font-bold text-emerald-800 text-sm">{job.actualWorkDuration || '00:00:00'}</span>
                </div>
                {job.estimatedDuration && (
                  <div>
                    <span className="text-[11px] text-neutral-500 block font-medium">{t('dashboard.estimatedTime', 'Estimated Time')}</span>
                    <span className="font-medium text-neutral-600">
                      {Math.floor(job.estimatedDuration / 60)}h {job.estimatedDuration % 60 ? `${job.estimatedDuration % 60}m` : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Before-Work & After-Work Proof Photos */}
          {(job.beforeWorkPhoto || job.completionProofPhoto) && (
            <section className="space-y-3">
              <h4 className="text-sm sm:text-base font-bold text-[#222222]">
                Service Photos &amp; Verification Proof
              </h4>

              <div className="grid grid-cols-2 gap-3">
                {/* Before-Work Photo */}
                {job.beforeWorkPhoto && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-neutral-600 block">
                      Before-Work Photo
                    </span>
                    <div className="rounded-xl overflow-hidden border border-neutral-200 bg-neutral-900 h-32 flex items-center justify-center shadow-2xs">
                      <img
                        src={job.beforeWorkPhoto}
                        alt="Before-work proof"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* After-Work Photo */}
                {job.completionProofPhoto && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-emerald-800 block">
                      {t('dashboard.afterWorkPhoto', 'After-Work Proof')}
                    </span>
                    <div className="rounded-xl overflow-hidden border border-emerald-300 bg-neutral-900 h-32 flex items-center justify-center shadow-2xs">
                      <img
                        src={job.completionProofPhoto}
                        alt="After-work proof"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Action Buttons */}
          <div className="pt-2 pb-2 space-y-2.5">
            {/* BOOKING MANAGEMENT MODE (Used in All Bookings or when job is Pending) */}
            {(showBookingActions || job.status === 'pending') ? (
              job.status === 'completed' ? (
                <button
                  type="button"
                  disabled={true}
                  className="w-full h-13 sm:h-14 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 bg-[#01471f] text-white border-2 border-[#01471f] shadow-emerald-900/10 cursor-default opacity-100"
                >
                  <Check className="w-5 h-5 stroke-[3] text-white" />
                  <span>{t('dashboard.bookingCompleted', 'Booking Completed')}</span>
                </button>
              ) : job.status === 'accepted' ? (
                <button
                  type="button"
                  disabled={true}
                  className="w-full h-13 sm:h-14 rounded-2xl font-extrabold text-base sm:text-lg flex items-center justify-center gap-2.5 bg-[#01471f] text-white border-2 border-[#01471f] shadow-lg shadow-emerald-950/20 cursor-default opacity-100 animate-in zoom-in-95 duration-200"
                >
                  <Check className="w-6 h-6 stroke-[3] text-white" />
                  <span>{t('dashboard.gigAccepted', 'Gig Accepted')}</span>
                </button>
              ) : job.status === 'declined' ? (
                <button
                  type="button"
                  disabled={true}
                  className="w-full h-13 sm:h-14 rounded-2xl font-extrabold text-base sm:text-lg flex items-center justify-center gap-2.5 bg-[#870404] text-white border-2 border-[#870404] shadow-lg shadow-rose-950/20 cursor-default opacity-100 animate-in zoom-in-95 duration-200"
                >
                  <X className="w-6 h-6 stroke-[3] text-white" />
                  <span>{t('dashboard.gigDeclined', 'Gig Declined')}</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3 w-full">
                  {/* Accept Button (Color: #01471f) */}
                  <button
                    type="button"
                    onClick={() => {
                      const updated: JobItem = { ...job, status: 'accepted', date: 'today' };
                      onAccept?.(updated);
                      onUpdateJob?.(updated);
                    }}
                    className="h-13 sm:h-14 w-full rounded-2xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 bg-[#01471f] hover:bg-[#013819] active:scale-95 text-white shadow-md hover:shadow-lg transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#01471f]"
                  >
                    <Check className="w-5 h-5 stroke-[2.5]" />
                    <span>{t('dashboard.accept', 'Accept')}</span>
                  </button>

                  {/* Decline Button (Color: #870404) */}
                  <button
                    type="button"
                    onClick={() => {
                      const updated: JobItem = { ...job, status: 'declined' };
                      onDecline?.(updated);
                      onUpdateJob?.(updated);
                    }}
                    className="h-13 sm:h-14 w-full rounded-2xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 bg-[#870404] hover:bg-[#700303] active:scale-95 text-white shadow-md hover:shadow-lg transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#870404]"
                  >
                    <X className="w-5 h-5 stroke-[2.5]" />
                    <span>{t('dashboard.decline', 'Decline')}</span>
                  </button>
                </div>
              )
            ) : (
              /* WORK LIFECYCLE MODE (Used in Today's Work) */
              <>
                {/* When Completed */}
                {job.status === 'completed' && (
                  <button
                    type="button"
                    disabled={true}
                    className="w-full h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 bg-[#01471f] text-white border-2 border-[#01471f] shadow-emerald-900/10 cursor-default opacity-100"
                  >
                    <Check className="w-4 h-4 stroke-[3] text-white" />
                    <span>{t('dashboard.taskCompleted', 'Task Completed')}</span>
                  </button>
                )}

                {/* When In Progress */}
                {job.workStarted && job.status !== 'completed' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowWorkSessionModal(true)}
                      className="w-full h-13 sm:h-14 rounded-2xl font-extrabold text-sm sm:text-base transition-all duration-150 shadow-md bg-neutral-900 hover:bg-black text-white flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                    >
                      <Clock className="w-5 h-5 text-brand-primary" />
                      <span>{t('dashboard.openWorkSession', 'Open Work Session (Timer & SOS)')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowCompleteModal(true)}
                      className="w-full h-12 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-xs border-2 bg-white hover:bg-emerald-50 text-[#01471f] border-[#01471f] cursor-pointer active:scale-[0.99]"
                    >
                      <Check className="w-4 h-4 stroke-[3] text-[#01471f]" />
                      <span>{t('dashboard.completeWork', 'Complete Work')}</span>
                    </button>
                  </>
                )}

                {/* When Reached but not started */}
                {isReached && !job.workStarted && job.status !== 'completed' && (
                  <button
                    type="button"
                    onClick={() => setShowBeforeWorkModal(true)}
                    className="w-full h-13 sm:h-14 rounded-2xl font-extrabold text-sm sm:text-base transition-all duration-150 shadow-md bg-[#1C516C] hover:bg-[#164055] text-white flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    <span>{t('dashboard.uploadBeforeWorkPhoto', 'Upload Before-Work Photo & Start Work')}</span>
                  </button>
                )}

                {/* When Not Reached yet */}
                {!isReached && job.status !== 'completed' && (
                  <button
                    type="button"
                    onClick={() => setShowOtpModal(true)}
                    className="w-full h-13 sm:h-14 rounded-2xl font-bold text-sm sm:text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-xs bg-white text-[#1C516C] border-2 border-[#1C516C] hover:bg-[#1C516C]/5 cursor-pointer active:scale-[0.99]"
                  >
                    <span>{t('dashboard.reachedLocation', 'Reached the Location')}</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* OTP Verification Modal on top of JobDetailsModal (4-digit, mock: 1234) */}
      <OtpVerificationModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        onVerifySuccess={handleOtpSuccess}
        mockOtp="1234"
        serviceName={job.serviceName}
        clientName={job.clientName}
      />

      {/* Before Work Modal on top of JobDetailsModal */}
      <BeforeWorkModal
        isOpen={showBeforeWorkModal}
        job={job}
        onClose={() => setShowBeforeWorkModal(false)}
        onStartWork={handleStartWork}
      />

      {/* Work Session Modal (Timer + SOS) */}
      <WorkSessionModal
        isOpen={showWorkSessionModal}
        job={job}
        onClose={() => setShowWorkSessionModal(false)}
        onCompleteClick={() => {
          setShowWorkSessionModal(false);
          setShowCompleteModal(true);
        }}
      />

      {/* Complete Work Modal (Proof Photo + 6-digit Customer OTP 123456) */}
      <CompleteWorkModal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        onConfirm={handleCompleteConfirm}
        mockOtp="123456"
        serviceName={job.serviceName}
        clientName={job.clientName}
      />

      {/* Single Photo Lightbox Modal */}
      {selectedPhotoIndex !== null && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedPhotoIndex(null)}
        >
          <button
            onClick={() => setSelectedPhotoIndex(null)}
            className="absolute top-4 right-4 z-50 w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
            aria-label="Close photo"
          >
            <X className="w-6 h-6" />
          </button>

          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPhotoIndex((prev) => (prev! > 0 ? prev! - 1 : photos.length - 1));
                }}
                className="absolute left-4 z-50 w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPhotoIndex((prev) => (prev! < photos.length - 1 ? prev! + 1 : 0));
                }}
                className="absolute right-4 z-50 w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
                aria-label="Next photo"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div className="max-w-2xl w-full max-h-[80vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={photos[selectedPhotoIndex]}
              alt={`Customer issue photo ${selectedPhotoIndex + 1}`}
              className="max-h-[70vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
            />
            <p className="text-white text-xs font-semibold mt-3">
              Photo {selectedPhotoIndex + 1} of {photos.length} — {job.serviceName}
            </p>
          </div>
        </div>
      )}

      {/* Complete Photos Gallery Modal */}
      {showAllPhotosModal && (
        <div
          className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowAllPhotosModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h4 className="text-base font-bold text-[#222222]">Customer Uploaded Photos</h4>
                <p className="text-xs text-[#6B6B6B]">{photos.length} photos uploaded for {job.serviceName}</p>
              </div>
              <button
                onClick={() => setShowAllPhotosModal(false)}
                className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-1">
              {photos.map((photo, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setShowAllPhotosModal(false);
                    setSelectedPhotoIndex(i);
                  }}
                  className="aspect-square rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200 cursor-pointer hover:border-brand-primary group relative"
                >
                  <img
                    src={photo}
                    alt={`Photo ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-semibold">
                    #{i + 1}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-1">
              <button
                onClick={() => setShowAllPhotosModal(false)}
                className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Close Gallery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mock Call Modal */}
      {showCallModal && (
        <div
          className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowCallModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-[#1C516C]/10 text-[#1C516C] flex items-center justify-center">
              <Phone className="w-8 h-8 animate-bounce text-[#1C516C]" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-[#222222]">Calling {job.clientName}</h4>
              <p className="text-sm font-semibold text-[#1C516C] mt-1">{job.clientPhone || '+91 98765 43210'}</p>
              <p className="text-xs text-[#6B6B6B] mt-2">Connecting via GigSevak secure masked line...</p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setShowCallModal(false)}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                End Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mock Message Chat Modal */}
      {showMessageModal && (
        <div
          className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowMessageModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-3 flex flex-col h-[460px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2.5">
                <img
                  src={job.clientImage}
                  alt={job.clientName}
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div>
                  <h4 className="text-sm font-bold text-[#222222]">{job.clientName}</h4>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowMessageModal(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 p-1 text-xs">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${msg.sender === 'worker' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${
                      msg.sender === 'worker'
                        ? 'bg-[#1C516C] text-white rounded-tr-xs'
                        : 'bg-neutral-100 text-neutral-800 rounded-tl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-[#6B6B6B] mt-0.5 px-1">{msg.time}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-neutral-100">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type a message to customer..."
                className="flex-1 px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-[#1C516C]"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-[#1C516C] hover:bg-[#164055] text-white rounded-xl text-xs font-semibold flex items-center justify-center transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
};
