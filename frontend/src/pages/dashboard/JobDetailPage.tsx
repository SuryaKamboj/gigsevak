import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  Clock,
  MapPin,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  Send,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { JobItem } from '../../types/dashboard';
import { GoogleJobMap } from '../../components/dashboard/GoogleJobMap';
import { OtpVerificationModal } from '../../components/dashboard/OtpVerificationModal';

interface JobDetailPageProps {
  job: JobItem;
  onBack: () => void;
  onUpdateJob?: (updatedJob: JobItem) => void;
}

export const JobDetailPage: React.FC<JobDetailPageProps> = ({
  job,
  onBack,
  onUpdateJob,
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  const [isReached, setIsReached] = useState<boolean>(!!job.isLocationReached);
  const [showOtpModal, setShowOtpModal] = useState<boolean>(false);

  useEffect(() => {
    setIsReached(!!job.isLocationReached);
  }, [job.isLocationReached]);

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [showAllPhotosModal, setShowAllPhotosModal] = useState<boolean>(false);
  const [showCallModal, setShowCallModal] = useState<boolean>(false);
  const [showMessageModal, setShowMessageModal] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'worker' | 'client'; text: string; time: string }>>([
    { sender: 'client', text: 'Hello! Please let me know once you arrive at the gate.', time: '9:45 AM' },
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const translatedServiceName = (currentLang !== 'en' && job.translations?.[currentLang]?.serviceName)
    ? job.translations[currentLang].serviceName
    : job.serviceName;

  const translatedAddress = (currentLang !== 'en' && job.translations?.[currentLang]?.clientAddress)
    ? job.translations[currentLang].clientAddress
    : job.clientAddress;

  const translatedScheduledTime = (currentLang !== 'en' && job.translations?.[currentLang]?.scheduledTime)
    ? job.translations[currentLang].scheduledTime
    : job.scheduledTime;

  const translatedDescription = (currentLang !== 'en' && job.translations?.[currentLang]?.description)
    ? job.translations[currentLang].description
    : job.description;

  const handleOtpSuccess = () => {
    setIsReached(true);
    setShowOtpModal(false);
    if (onUpdateJob) {
      onUpdateJob({ ...job, isLocationReached: true, locationVerified: true });
    }
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
        { sender: 'client', text: 'Thank you! I will be waiting for you.', time: 'Just now' },
      ]);
    }, 1200);
  };

  const photos = job.customerPhotos && job.customerPhotos.length > 0 ? job.customerPhotos : [job.serviceImage || job.image];

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      {/* Back Navigation */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#6B6B6B] hover:text-[#A66666] transition-colors py-1 px-2 -ml-2 rounded-xl hover:bg-neutral-100 cursor-pointer active:scale-95"
          aria-label="Back to Today's Work"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>{t('dashboard.todayWork', "Back to Today's Work")}</span>
        </button>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-5 sm:p-7 space-y-6">
        {/* Top Client Information */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 pb-5 border-b border-neutral-100">
          {/* Client Profile Image */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-neutral-100 border-2 border-brand-primary/20 shadow-xs">
              <img
                src={job.clientImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                alt={job.clientName}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Client Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#222222] tracking-tight">
                {job.clientName}
              </h1>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-brand-light text-brand-primary border border-brand-primary/20">
                {translatedServiceName}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#6B6B6B] flex items-center gap-1.5 mt-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" />
              <span>{translatedAddress}</span>
            </p>

            <p className="text-xs sm:text-sm text-[#222222] flex items-center gap-1.5 mt-1 font-semibold">
              <Clock className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" />
              <span>{translatedScheduledTime}</span>
            </p>
          </div>
        </div>

        {/* Call + Message Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowCallModal(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-brand-primary/30 text-brand-primary bg-brand-light/60 hover:bg-brand-light active:scale-95 text-xs sm:text-sm font-semibold transition cursor-pointer shadow-2xs"
          >
            <Phone className="w-4 h-4 text-brand-primary" />
            <span>{t('dashboard.call', 'Call')}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMessageModal(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-brand-primary/30 text-brand-primary bg-brand-light/60 hover:bg-brand-light active:scale-95 text-xs sm:text-sm font-semibold transition cursor-pointer shadow-2xs"
          >
            <MessageSquare className="w-4 h-4 text-brand-primary" />
            <span>{t('dashboard.message', 'Message')}</span>
          </button>

          {job.price && (
            <div className="hidden sm:flex ml-auto items-center text-sm font-bold text-brand-primary bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-100">
              {job.price}
            </div>
          )}
        </div>

        {/* Customer Uploaded Work Photos */}
        <section className="space-y-3 pt-2">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#222222]">
                {t('dashboard.photosFromCustomer', 'Photos from the Customer')}
              </h2>
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

          {/* Photo Preview Grid (Compact 4 columns) */}
          <div className="grid grid-cols-4 gap-2">
            {photos.slice(0, 4).map((photoUrl, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedPhotoIndex(idx)}
                className="group relative h-16 sm:h-20 rounded-xl overflow-hidden bg-neutral-100 cursor-pointer border border-neutral-200/80 hover:border-brand-primary/50 transition-all duration-200 shadow-2xs"
              >
                <img
                  src={photoUrl}
                  alt={`Customer issue photo ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
                <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/60 text-white text-[9px] font-medium backdrop-blur-2xs opacity-80 group-hover:opacity-100">
                  #{idx + 1}
                </span>
              </div>
            ))}
          </div>

          {photos.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAllPhotosModal(true)}
              className="text-xs font-semibold text-brand-primary hover:underline cursor-pointer block pt-1"
            >
              + {photos.length - 4} {t('dashboard.seeMore', 'more photos')}
            </button>
          )}
        </section>

        {/* Customer Work Description */}
        <section className="space-y-2 pt-2">
          <h2 className="text-base sm:text-lg font-bold text-[#222222]">
            {t('dashboard.workDescription', 'Work Description')}
          </h2>
          <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/60 text-xs sm:text-sm text-neutral-800 leading-relaxed">
            {translatedDescription}
          </div>
        </section>

        {/* Location / Google Map */}
        <section className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-[#222222]">
              {t('dashboard.location', 'Location')}
            </h2>
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
            address={translatedAddress}
            clientName={job.clientName}
            serviceName={translatedServiceName}
            className="h-56 sm:h-64 w-full"
          />
        </section>

        {/* "Reached the Location" Bottom Button */}
        <div className="pt-4">
          <button
            type="button"
            onClick={() => {
              if (!isReached) {
                setShowOtpModal(true);
              }
            }}
            disabled={isReached}
            className={`w-full h-13 sm:h-14 rounded-2xl font-bold text-sm sm:text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-xs ${
              isReached
                ? 'bg-[#01471f] text-white border-2 border-[#01471f] shadow-emerald-900/10 cursor-default'
                : 'bg-white text-[#1C516C] border-2 border-[#1C516C] hover:bg-[#1C516C]/5 shadow-neutral-200/50 cursor-pointer active:scale-[0.99]'
            }`}
          >
            {isReached ? (
              <>
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>{t('dashboard.locationReached', 'Location Reached')}</span>
              </>
            ) : (
              <span>{t('dashboard.reachedLocation', 'Reached the Location')}</span>
            )}
          </button>
        </div>
      </div>

      {/* OTP Verification Modal on top of JobDetailPage */}
      <OtpVerificationModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        onVerifySuccess={handleOtpSuccess}
      />

      {/* Lightbox Modal for Single Photo Enlargement */}
      {selectedPhotoIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedPhotoIndex(null)}
            className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
            aria-label="Close photo"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Navigation Arrows */}
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPhotoIndex((prev) => (prev! > 0 ? prev! - 1 : photos.length - 1));
                }}
                className="absolute left-4 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPhotoIndex((prev) => (prev! < photos.length - 1 ? prev! + 1 : 0));
                }}
                className="absolute right-4 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
                aria-label="Next photo"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div className="max-w-3xl w-full max-h-[85vh] flex flex-col items-center">
            <img
              src={photos[selectedPhotoIndex]}
              alt={`Customer Photo ${selectedPhotoIndex + 1}`}
              className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
            />
            <p className="text-white text-xs font-semibold mt-3">
              Photo {selectedPhotoIndex + 1} of {photos.length} — {translatedServiceName}
            </p>
          </div>
        </div>
      )}

      {/* Complete Photos Gallery Modal */}
      {showAllPhotosModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#222222]">{t('dashboard.customerUploadedPhotos', 'Customer Uploaded Photos')}</h3>
                <p className="text-xs text-[#6B6B6B]">All {photos.length} photos uploaded for {translatedServiceName}</p>
              </div>
              <button
                onClick={() => setShowAllPhotosModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3 p-1">
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
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-semibold">
                    #{i + 1}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowAllPhotosModal(false)}
                className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                {t('dashboard.closeGallery', 'Close Gallery')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mock Call Modal */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-16 h-16 mx-auto rounded-full bg-brand-light text-brand-primary flex items-center justify-center">
              <Phone className="w-8 h-8 animate-bounce" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#222222]">{t('dashboard.calling', { name: job.clientName, defaultValue: `Calling ${job.clientName}` })}</h3>
              <p className="text-sm font-semibold text-brand-primary mt-1">{job.clientPhone || '+91 98765 43210'}</p>
              <p className="text-xs text-[#6B6B6B] mt-2">{t('dashboard.connectingMasked', 'Connecting via GigSevak secure masked worker line...')}</p>
            </div>
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setShowCallModal(false)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                {t('dashboard.endCall', 'End Call')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mock Message Chat Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-3 flex flex-col h-[480px]">
            {/* Header */}
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
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {t('dashboard.onlineStatus', 'Online')}
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

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 p-1 text-xs">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${msg.sender === 'worker' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${
                      msg.sender === 'worker'
                        ? 'bg-brand-primary text-white rounded-tr-xs'
                        : 'bg-neutral-100 text-neutral-800 rounded-tl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-[#6B6B6B] mt-0.5 px-1">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Send Message Input */}
            <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-neutral-100">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={t('dashboard.typeMessagePlaceholder', 'Type a message to the customer...')}
                className="flex-1 px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-brand-primary"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-brand-primary hover:bg-brand-hover text-white rounded-xl text-xs font-semibold flex items-center justify-center transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetailPage;
