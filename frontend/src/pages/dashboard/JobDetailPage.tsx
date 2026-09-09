import React, { useState } from 'react';
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  Clock,
  MapPin,
  Check,
  X,
  ExternalLink,
  Send,
} from 'lucide-react';
import type { JobItem } from '../../types/dashboard';
import { useTranslation } from 'react-i18next';
import { getLocalizedJob } from '../../utils/localizedJobs';
import { GoogleJobMap } from '../../components/dashboard/GoogleJobMap';

interface JobDetailPageProps {
  job: JobItem;
  onBack: () => void;
  onUpdateJob?: (updatedJob: JobItem) => void;
}

export const JobDetailPage: React.FC<JobDetailPageProps> = ({
  job: rawJob,
  onBack,
  onUpdateJob,
}) => {
  const { i18n } = useTranslation();
  const activeLangCode = i18n.language || localStorage.getItem('workerLanguage') || 'en';
  const job = getLocalizedJob(rawJob, activeLangCode);
  const [isReached, setIsReached] = useState<boolean>(!!job.isLocationReached);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [showAllPhotosModal, setShowAllPhotosModal] = useState<boolean>(false);
  const [showCallModal, setShowCallModal] = useState<boolean>(false);
  const [showMessageModal, setShowMessageModal] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'worker' | 'client'; text: string; time: string }>>([
    { sender: 'client', text: 'Hello! Please let me know once you arrive at the gate.', time: '9:45 AM' },
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const handleToggleReached = () => {
    const nextState = !isReached;
    setIsReached(nextState);
    if (onUpdateJob) {
      onUpdateJob({ ...job, isLocationReached: nextState });
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
          <span>Back to Today's Work</span>
        </button>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-5 sm:p-7 space-y-6">
        {/* Top Client Information */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 pb-5 border-b border-neutral-100">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-neutral-100 border-2 border-brand-primary/20 shadow-xs">
              <img
                src={job.clientImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                alt={job.clientName}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#222222] tracking-tight">
                {job.clientName}
              </h1>
              {job.price && (
                <span className="text-sm font-bold px-3 py-1 rounded-xl bg-brand-light text-brand-primary border border-brand-primary/20">
                  {job.price}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-semibold text-brand-primary bg-brand-light/70 px-2 py-0.5 rounded-md">
                {job.serviceName}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-neutral-600">
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="w-4 h-4 text-brand-primary flex-shrink-0" />
                <span className="truncate">{job.clientAddress}</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-neutral-800">
                <Clock className="w-4 h-4 text-brand-primary flex-shrink-0" />
                <span>{job.scheduledTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons: Call & Message */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowCallModal(true)}
            className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-[#1C516C] text-[#1C516C] bg-white hover:bg-[#1C516C]/5 active:scale-95 text-sm font-bold transition-all shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1C516C]"
          >
            <Phone className="w-4 h-4 stroke-[2.2]" />
            <span>Call Customer</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMessageModal(true)}
            className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-[#1C516C] text-[#1C516C] bg-white hover:bg-[#1C516C]/5 active:scale-95 text-sm font-bold transition-all shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1C516C]"
          >
            <MessageSquare className="w-4 h-4 stroke-[2.2]" />
            <span>Chat Message</span>
          </button>
        </div>

        {/* Customer Uploaded Photos */}
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <h3 className="text-base font-bold text-[#222222]">
                Photos from the Customer
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                Issue reference images uploaded during customer request.
              </p>
            </div>
            {photos.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAllPhotosModal(true)}
                className="text-xs font-bold text-brand-primary hover:text-brand-hover hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>View all ({photos.length})</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {photos.slice(0, 4).map((photoUrl, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedPhotoIndex(idx)}
                className="group relative aspect-video rounded-2xl overflow-hidden bg-neutral-100 cursor-pointer border border-neutral-200/80 hover:border-brand-primary/60 transition-all duration-200 shadow-xs"
              >
                <img
                  src={photoUrl}
                  alt={`Customer uploaded ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
                <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-medium backdrop-blur-2xs">
                  Photo #{idx + 1}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Work Description */}
        <section className="space-y-2">
          <h3 className="text-base font-bold text-[#222222]">Work Description</h3>
          <div className="bg-neutral-50 rounded-2xl p-4 sm:p-5 border border-neutral-200/70 text-sm text-neutral-800 leading-relaxed">
            {job.description}
          </div>
        </section>

        {/* Location & Navigation / Google Maps API */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#222222]">Service Location</h3>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.clientAddress)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-primary hover:text-brand-hover hover:underline"
            >
              <span>Open in Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <GoogleJobMap
            latitude={job.latitude}
            longitude={job.longitude}
            address={job.clientAddress}
            clientName={job.clientName}
            serviceName={job.serviceName}
            className="h-56 sm:h-64 w-full"
          />
        </section>

        {/* Action Controls */}
        <div className="pt-2 space-y-3">
          <button
            type="button"
            onClick={() => {
              const nextStatus = job.status === 'completed' ? 'accepted' : 'completed';
              if (onUpdateJob) {
                onUpdateJob({ ...job, status: nextStatus as 'accepted' | 'completed' });
              }
            }}
            className={`w-full h-12 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99] border-2 ${
              job.status === 'completed'
                ? 'bg-[#01471f] text-white border-[#01471f]'
                : 'bg-white hover:bg-emerald-50/50 text-[#01471f] border-[#01471f]'
            }`}
          >
            <Check className={`w-4 h-4 stroke-[3] ${job.status === 'completed' ? 'text-white' : 'text-[#01471f]'}`} />
            <span>{job.status === 'completed' ? 'Service Task Completed' : 'Mark Service as Completed'}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleReached}
            className={`w-full h-13 rounded-2xl font-bold text-sm sm:text-base transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99] ${
              isReached
                ? 'bg-[#01471f] text-white border-2 border-[#01471f]'
                : 'bg-white text-[#1C516C] border-2 border-[#1C516C] hover:bg-[#1C516C]/5'
            }`}
          >
            {isReached ? (
              <>
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>Location Reached</span>
              </>
            ) : (
              <span>Reached Customer Location</span>
            )}
          </button>
        </div>
      </div>

      {/* Lightbox / Modals */}
      {selectedPhotoIndex !== null && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedPhotoIndex(null)}
        >
          <button
            onClick={() => setSelectedPhotoIndex(null)}
            className="absolute top-4 right-4 z-50 w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-2xl w-full max-h-[80vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={photos[selectedPhotoIndex]}
              alt={`Issue photo ${selectedPhotoIndex + 1}`}
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

      {/* Call Modal */}
      {showCallModal && (
        <div
          className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowCallModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-[#1C516C]/10 text-[#1C516C] flex items-center justify-center">
              <Phone className="w-8 h-8 animate-bounce text-[#1C516C]" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-[#222222]">Calling {job.clientName}</h4>
              <p className="text-sm font-semibold text-[#1C516C] mt-1">{job.clientPhone || '+91 98765 43210'}</p>
              <p className="text-xs text-[#6B6B6B] mt-2">Connecting via secure line...</p>
            </div>
            <button
              onClick={() => setShowCallModal(false)}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
            >
              End Call
            </button>
          </div>
        </div>
      )}

      {/* Chat Modal */}
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
              <h4 className="text-sm font-bold text-[#222222]">{job.clientName}</h4>
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
                placeholder="Type a message..."
                className="flex-1 px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-[#1C516C] text-white rounded-xl text-xs font-semibold"
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
