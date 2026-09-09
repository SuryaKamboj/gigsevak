import React, { useState } from 'react';
import { MOCK_JOBS } from '../../data/mockJobs';
import { WorkCard } from '../../components/dashboard/WorkCard';
import { JobDetailsModal } from '../../components/dashboard/JobDetailsModal';
import { Search, CalendarCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { JobItem } from '../../types/dashboard';
import { getLocalizedJob } from '../../utils/localizedJobs';

export const OrdersPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const activeLangCode = i18n.language || localStorage.getItem('workerLanguage') || 'en';
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'scheduled' | 'completed'>('all');
  const [bookings, setBookings] = useState<JobItem[]>(MOCK_JOBS);
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const handleAccept = (_e: React.MouseEvent, job: JobItem) => {
    setBookings((prev) =>
      prev.map((item) =>
        item.id === job.id ? { ...item, status: 'accepted' as const } : item
      )
    );
    setNotification(`✓ ${t('dashboard.accept', 'Accepted')}: "${job.serviceName}" (#${job.id})`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDecline = (_e: React.MouseEvent, job: JobItem) => {
    setBookings((prev) =>
      prev.map((item) =>
        item.id === job.id ? { ...item, status: 'declined' as const } : item
      )
    );
    setNotification(`${t('dashboard.decline', 'Declined')}: "${job.serviceName}" (#${job.id})`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDetails = (_e: React.MouseEvent, job: JobItem) => {
    setSelectedJob(job);
  };

  const handleUpdateJob = (updatedJob: JobItem) => {
    setBookings((prev) =>
      prev.map((item) => (item.id === updatedJob.id ? updatedJob : item))
    );
    setSelectedJob(updatedJob);
  };

  const filteredJobs = bookings.filter((job: JobItem) => {
    const loc = getLocalizedJob(job, activeLangCode);
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      job.serviceName.toLowerCase().includes(q) ||
      loc.serviceName.toLowerCase().includes(q) ||
      job.clientName.toLowerCase().includes(q) ||
      loc.clientName.toLowerCase().includes(q) ||
      job.clientAddress.toLowerCase().includes(q) ||
      loc.clientAddress.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (activeTab === 'scheduled') return job.status !== 'completed' && job.status !== 'declined';
    if (activeTab === 'completed') return job.status === 'completed';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-dark">
          {t('dashboard.allBookings', 'All Bookings')}
        </h1>
      </div>

      {/* Action Notification Toast */}
      {notification && (
        <div className="p-3 bg-neutral-900 text-white text-xs sm:text-sm font-medium rounded-2xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <span>{notification}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-neutral-400 hover:text-white ml-2 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('dashboard.searchBookingsPlaceholder', 'Search bookings by customer, service or area...')}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-brand-primary text-white shadow-xs'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            {t('dashboard.filterAll', 'All')} ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'scheduled'
                ? 'bg-brand-primary text-white shadow-xs'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            {t('dashboard.filterScheduled', 'Active / Scheduled')}
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-brand-primary text-white shadow-xs'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            {t('dashboard.filterCompleted', 'Completed')}
          </button>
        </div>
      </div>

      {/* List of Bookings */}
      <div className="space-y-3.5">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job: JobItem) => (
            <WorkCard
              key={job.id}
              job={job}
              showActions={true}
              onAccept={handleAccept}
              onDecline={handleDecline}
              onDetails={handleDetails}
              onClick={() => setSelectedJob(job)}
            />
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-neutral-100">
            <CalendarCheck className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-600 font-semibold">{t('dashboard.noBookings', 'No bookings found')}</p>
            <p className="text-xs text-neutral-400 mt-1">{t('dashboard.noBookingsSub', 'Try changing your search term or filter.')}</p>
          </div>
        )}
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onUpdateJob={handleUpdateJob}
        />
      )}
    </div>
  );
};
