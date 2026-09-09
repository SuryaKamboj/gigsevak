import React from 'react';
import { Clock, MapPin, User, Check, X, ArrowRight, ChevronRight, CheckSquare, Square, Navigation } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { JobItem } from '../../types/dashboard';
import { getLocalizedJob } from '../../utils/localizedJobs';

interface WorkCardProps {
  job: JobItem;
  onClick?: () => void;
  showActions?: boolean;
  showCompleteCheckbox?: boolean;
  onAccept?: (e: React.MouseEvent, job: JobItem) => void;
  onDecline?: (e: React.MouseEvent, job: JobItem) => void;
  onDetails?: (e: React.MouseEvent, job: JobItem) => void;
  onToggleCompleted?: (e: React.MouseEvent, job: JobItem) => void;
  onToggleReached?: (e: React.MouseEvent, job: JobItem) => void;
}

export const WorkCard: React.FC<WorkCardProps> = ({
  job: rawJob,
  onClick,
  showActions = false,
  showCompleteCheckbox = false,
  onAccept,
  onDecline,
  onDetails,
  onToggleCompleted,
  onToggleReached,
}) => {
  const { t, i18n } = useTranslation();
  const activeLangCode = i18n.language || localStorage.getItem('workerLanguage') || 'en';
  const job = getLocalizedJob(rawJob, activeLangCode);
  const isCompleted = job.status === 'completed';
  const isReached = !!job.isLocationReached;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border transition-all duration-200 flex flex-col gap-3 group cursor-pointer active:scale-[0.99] relative ${
        isCompleted
          ? 'border-emerald-200/80 bg-emerald-50/15'
          : 'border-neutral-100 hover:border-brand-primary/40 hover:shadow-md'
      }`}
    >
      {/* Main Row: Service Image + Info + Top-Right Details Button */}
      <div className="flex gap-3.5 sm:gap-4 items-center">
        {/* Left: Service Image */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-100">
          <img
            src={job.serviceImage || job.image}
            alt={job.serviceName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/5" />
        </div>

        {/* Right: Job Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-bold truncate leading-tight text-neutral-dark group-hover:text-brand-primary transition-colors">
                {job.serviceName}
              </h3>

              <div className="flex items-center gap-1.5 mt-1 text-xs sm:text-sm text-neutral-muted truncate">
                <User className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                <span className="font-medium text-neutral-700 truncate">{job.clientName}</span>
              </div>
            </div>

            {/* Top Right: See Details Button for Home Page Cards */}
            {showCompleteCheckbox && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDetails ? onDetails(e, job) : onClick?.();
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold bg-[#1C516C] hover:bg-[#164055] active:scale-95 text-white transition-all duration-150 shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1C516C] flex-shrink-0"
              >
                <span>{t('dashboard.seeDetails', 'See Details')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {!showCompleteCheckbox && job.price && (
              <span className="hidden sm:inline-flex text-xs font-semibold px-2 py-0.5 rounded-md bg-brand-light text-brand-primary flex-shrink-0">
                {job.price}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-neutral-muted">
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-brand-primary/70 flex-shrink-0" />
              <span className="truncate">{job.clientAddress}</span>
            </div>

            <div className="flex items-center gap-1.5 font-medium text-neutral-700 flex-shrink-0 mt-0.5 sm:mt-0">
              <Clock className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" />
              <span>{job.scheduledTime}</span>
            </div>
          </div>
        </div>

        {/* Right Chevron for visual affordance if no actions and no complete buttons */}
        {!showActions && !showCompleteCheckbox && (
          <div className="hidden xs:flex items-center text-neutral-300 group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all pl-1">
            <ChevronRight className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Action Buttons Row on Home Page: Reached & Completed */}
      {showCompleteCheckbox && (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2.5 border-t border-neutral-100">
          {/* Reached Location Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleReached?.(e, job);
            }}
            aria-label={isReached ? `Mark location as not reached for ${job.serviceName}` : `Mark location as reached for ${job.serviceName}`}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer active:scale-95 shadow-2xs border-2 ${
              isReached
                ? 'bg-[#01471f] text-white border-[#01471f] hover:bg-[#013819]'
                : 'bg-white hover:bg-[#1C516C]/5 text-[#1C516C] border-[#1C516C]'
            }`}
          >
            {isReached ? (
              <Check className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <Navigation className="w-4 h-4 stroke-[2.2]" />
            )}
            <span>{isReached ? t('dashboard.locationReached', 'Location Reached') : t('dashboard.reached', 'Reached')}</span>
          </button>

          {/* Completed button with green border */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompleted?.(e, job);
            }}
            aria-label={isCompleted ? `Mark ${job.serviceName} as pending` : `Mark ${job.serviceName} as completed`}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer active:scale-95 shadow-2xs border-2 ${
              isCompleted
                ? 'bg-[#01471f] text-white border-[#01471f] hover:bg-[#013819]'
                : 'bg-white hover:bg-emerald-50/50 text-[#01471f] border-[#01471f]'
            }`}
          >
            {isCompleted ? (
              <CheckSquare className="w-4 h-4 text-white stroke-[2.5]" />
            ) : (
              <Square className="w-4 h-4 text-[#01471f] stroke-[2.2]" />
            )}
            <span>{isCompleted ? t('dashboard.done', 'Completed') : t('dashboard.completed', 'Completed')}</span>
          </button>
        </div>
      )}

      {/* Action Buttons Row (Used in All Bookings page only) */}
      {showActions && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-3 border-t border-neutral-100">
          {/* Accept Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAccept?.(e, job);
            }}
            aria-label={`Accept booking for ${job.serviceName} from ${job.clientName}`}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#01471f] hover:bg-[#013819] active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all duration-150 shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#01471f] focus:ring-offset-1"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{t('dashboard.accept', 'Accept')}</span>
          </button>

          {/* Decline Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDecline?.(e, job);
            }}
            aria-label={`Decline booking for ${job.serviceName} from ${job.clientName}`}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#870404] hover:bg-[#700303] active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all duration-150 shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#870404] focus:ring-offset-1"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
            <span>{t('dashboard.decline', 'Decline')}</span>
          </button>

          {/* See More Details Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDetails?.(e, job);
            }}
            aria-label={`See more details for ${job.serviceName} booking`}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#1C516C] hover:bg-[#164055] active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all duration-150 shadow-xs cursor-pointer sm:ml-auto focus:outline-none focus:ring-2 focus:ring-[#1C516C] focus:ring-offset-1"
          >
            <span>{t('dashboard.seeMoreDetails', 'See More Details')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
