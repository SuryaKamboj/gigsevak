import React, { useState } from 'react';
import { WorkCard } from '../../components/dashboard/WorkCard';
import { JobDetailsModal } from '../../components/dashboard/JobDetailsModal';
import { OtpVerificationModal } from '../../components/dashboard/OtpVerificationModal';
import { BeforeWorkModal } from '../../components/dashboard/BeforeWorkModal';
import { WorkSessionModal } from '../../components/dashboard/WorkSessionModal';
import { CompleteWorkModal } from '../../components/dashboard/CompleteWorkModal';
import { Calendar, Briefcase, CheckCircle2, Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { JobItem } from '../../types/dashboard';
import { authService } from '../../services/authService';

import { workerBackendService } from '../../services/workerBackendService';

interface HomePageProps {
  jobsList?: JobItem[];
  onUpdateJob?: (updatedJob: JobItem) => void;
  onAcceptJob?: (job: JobItem) => void;
  onDeclineJob?: (job: JobItem) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  jobsList = [],
  onUpdateJob,
  onAcceptJob,
  onDeclineJob,
}) => {
  const { t, i18n } = useTranslation();
  const activeLangCode = i18n.language || localStorage.getItem('workerLanguage') || 'en';

  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [otpJob, setOtpJob] = useState<JobItem | null>(null);
  const [beforeWorkJob, setBeforeWorkJob] = useState<JobItem | null>(null);
  const [activeSessionJob, setActiveSessionJob] = useState<JobItem | null>(null);
  const [completeWorkJob, setCompleteWorkJob] = useState<JobItem | null>(null);
  const [localJobs, setLocalJobs] = useState<JobItem[]>(jobsList);
  const [notification, setNotification] = useState<string | null>(null);

  const [profileName, setProfileName] = useState<string>('');

  React.useEffect(() => {
    setLocalJobs(jobsList);
  }, [jobsList]);

  React.useEffect(() => {
    workerBackendService
      .getProfile()
      .then((res: any) => {
        const p = res?.data || res;
        if (p?.fullName) {
          setProfileName(p.fullName);
        }
      })
      .catch(() => {});
  }, []);

  const workerName = (() => {
    if (profileName) return profileName;
    const user = authService.getCurrentUser();
    if (user?.name) {
      const clean = user.name.replace(/\bpartner\b/gi, '').trim();
      if (clean) return clean;
    }
    return 'Worker';
  })();

  const handleUpdate = (updatedJob: JobItem) => {
    setLocalJobs((prev) =>
      prev.map((j) => (j.id === updatedJob.id ? updatedJob : j))
    );
    if (selectedJob && selectedJob.id === updatedJob.id) {
      setSelectedJob(updatedJob);
    }
    if (activeSessionJob && activeSessionJob.id === updatedJob.id) {
      setActiveSessionJob(updatedJob);
    }
    if (beforeWorkJob && beforeWorkJob.id === updatedJob.id) {
      setBeforeWorkJob(updatedJob);
    }
    if (onUpdateJob) {
      onUpdateJob(updatedJob);
    }
  };

  // =========================================================================
  // FLOW 1: REACHED THE LOCATION FLOW
  // Reached Location -> 4-digit OTP (1234) -> Before-Work Photo -> Start Work -> Countdown Timer & SOS
  // =========================================================================

  // Step 1: Worker clicks "Reached the Location"
  const handleToggleReached = (e: React.MouseEvent, job: JobItem) => {
    e.stopPropagation();
    if (job.isLocationReached) {
      if (!job.workStarted) {
        setBeforeWorkJob(job);
      } else if (job.status !== 'completed') {
        setActiveSessionJob(job);
      }
      return;
    }
    // Opens "Verify Location" popup (4-digit OTP, mock: 1234)
    setOtpJob(job);
  };

  // Step 1 Success: Location OTP (1234) verified -> open Before-Work Photo interface
  const handleLocationOtpSuccess = () => {
    if (!otpJob) return;
    const updated: JobItem = { ...otpJob, isLocationReached: true, locationVerified: true };
    handleUpdate(updated);
    if (otpJob?.id) {
      workerBackendService.markInTransit(otpJob.id).catch(() => {});
      workerBackendService.markArrived(otpJob.id).catch(() => {});
    }
    setOtpJob(null);
    // Directly proceed to Step 2: Before-Work Photo interface ("Before You Start")
    setBeforeWorkJob(updated);
  };

  // Step 2 Success: Before-work photo captured -> Worker clicks "Start Work"
  const handleStartWorkSuccess = (beforeWorkPhoto: string) => {
    if (!beforeWorkJob) return;
    const now = Date.now();
    const updated: JobItem = {
      ...beforeWorkJob,
      beforeWorkPhoto,
      workStarted: true,
      workStartTime: now,
      status: 'in_progress',
    };
    handleUpdate(updated);
    if (beforeWorkJob?.id) {
      workerBackendService.startJobWithOtp(beforeWorkJob.id, '1234').catch(() => {});
    }
    setBeforeWorkJob(null);
    // Launch Step 3: Dedicated Work Session with live Stopwatch & SOS
    setActiveSessionJob(updated);
    setNotification(`✓ Work session started for "${beforeWorkJob.serviceName}"`);
    setTimeout(() => setNotification(null), 3000);
  };

  // =========================================================================
  // FLOW 2: COMPLETED BUTTON FLOW (COMPLETELY SEPARATE)
  // Completed Click -> Proof-of-Work Photo + 6-Digit OTP (123456) -> Verify & Complete -> Job Completed
  // =========================================================================

  // Step 1: Worker clicks "Completed"
  const handleToggleCompleted = (e: React.MouseEvent, job: JobItem) => {
    e.stopPropagation();
    if (job.status === 'completed') {
      return;
    }
    // IMMEDIATELY open "Complete Your Work" popup (Proof Photo + 6-digit Customer OTP 123456)
    setCompleteWorkJob(job);
  };

  // Step 2 Success: 6-digit OTP (123456) + Proof-of-work photo verified -> mark job completed
  const handleCompleteWorkSuccess = (proofPhoto: string) => {
    if (!completeWorkJob) return;
    const completionTime = Date.now();
    const startMs = completeWorkJob.workStartTime || completionTime;
    const totalSecs = Math.max(0, Math.floor((completionTime - startMs) / 1000));
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const actualDurationText = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    const nowFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated: JobItem = {
      ...completeWorkJob,
      status: 'completed',
      completionProofPhoto: proofPhoto,
      afterWorkPhoto: proofPhoto,
      completedAt: nowFormatted,
      completionTime,
      actualWorkDuration: actualDurationText,
      workCompleted: true,
      completionVerified: true,
    };
    handleUpdate(updated);
    if (completeWorkJob?.id) {
      workerBackendService.completeJob(completeWorkJob.id).catch(() => {});
    }
    setNotification('✓ Work completed successfully');
    setCompleteWorkJob(null);
    setActiveSessionJob(null);
    setTimeout(() => setNotification(null), 3000);
  };

  // Card click behavior
  const handleCardClick = (job: JobItem) => {
    if (job.workStarted && job.status !== 'completed') {
      setActiveSessionJob(job);
    } else {
      setSelectedJob(job);
    }
  };

  // Filter accepted, in_progress & completed jobs scheduled for today
  const todayJobs = localJobs.filter(
    (job: JobItem) =>
      (job.status === 'accepted' || job.status === 'in_progress' || job.status === 'completed') &&
      (job.date === 'today' || !job.date)
  );

  const pendingJobs = localJobs.filter((job: JobItem) => job.status === 'pending');

  const completedCount = todayJobs.filter((job) => job.status === 'completed').length;
  const inProgressCount = todayJobs.filter((job) => job.status === 'in_progress' || (job.workStarted && job.status !== 'completed')).length;

  // Dynamic formatted date
  const today = new Date();
  const dateFormatted = new Intl.DateTimeFormat(
    activeLangCode === 'hi' ? 'hi-IN' : activeLangCode === 'pa' ? 'pa-IN' : 'en-US',
    {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }
  ).format(today);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <section className="bg-gradient-to-r from-brand-primary/10 via-brand-light to-transparent p-5 sm:p-6 rounded-3xl border border-brand-primary/15 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 backdrop-blur-xs text-xs font-semibold text-brand-primary mb-3 shadow-xs border border-brand-primary/20">
            <Calendar className="w-3.5 h-3.5" />
            <span>{dateFormatted}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-dark tracking-tight">
            {t('dashboard.welcomeWorker', { name: workerName, defaultValue: `Welcome, ${workerName}!` })}
          </h1>

          {/* Summary Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-2">
            <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-3 border border-neutral-100 shadow-xs">
              <div className="text-xs text-neutral-muted font-medium">{t('dashboard.todayJobs', "Today's Jobs")}</div>
              <div className="text-xl font-bold text-neutral-dark mt-0.5">{todayJobs.length} {t('dashboard.assigned', 'Assigned')}</div>
            </div>
            <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-3 border border-neutral-100 shadow-xs">
              <div className="text-xs text-neutral-muted font-medium">{t('dashboard.completed', 'Completed')}</div>
              <div className="text-xl font-bold text-[#01471f] mt-0.5">{completedCount} {t('dashboard.of', 'of')} {todayJobs.length}</div>
            </div>
            <div className="hidden sm:block bg-white/90 backdrop-blur-xs rounded-2xl p-3 border border-neutral-100 shadow-xs">
              <div className="text-xs text-neutral-muted font-medium">{t('dashboard.workStatus', 'Work Status')}</div>
              <div className="text-sm font-bold text-emerald-600 mt-1 flex items-center gap-1">
                {inProgressCount > 0 ? (
                  <span className="flex items-center gap-1.5 text-brand-primary font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {inProgressCount} {t('dashboard.inProgress', 'in Progress')}
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> {t('dashboard.activeDay', 'Active Day')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Decorative background element */}
        <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-brand-primary/10 rounded-full blur-2xl pointer-events-none" />
      </section>

      {/* Notification Toast */}
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

      {/* Incoming Requests Alert Section */}
      {pendingJobs.length > 0 ? (
        <section className="space-y-3 bg-amber-500/10 border-2 border-amber-500/30 p-4 sm:p-5 rounded-3xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-600"></span>
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-neutral-dark">
                {t('dashboard.incomingRequests', 'New Incoming Service Requests')}
              </h2>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500 text-white shadow-xs">
              {pendingJobs.length} {t('dashboard.actionRequired', 'New Request')}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {pendingJobs.map((job: JobItem) => (
              <WorkCard
                key={job.id}
                job={job}
                showActions={true}
                showCompleteCheckbox={false}
                onAccept={async (e, j) => {
                  e?.stopPropagation();
                  if (onAcceptJob) {
                    await onAcceptJob(j);
                  } else {
                    handleUpdate({ ...j, status: 'accepted', date: 'today' });
                  }
                  setNotification(`✓ Accepted "${j.serviceName}"!`);
                  setTimeout(() => setNotification(null), 3000);
                }}
                onDecline={async (e, j) => {
                  e?.stopPropagation();
                  if (onDeclineJob) {
                    await onDeclineJob(j);
                  } else {
                    handleUpdate({ ...j, status: 'declined' });
                  }
                  setNotification(`Declined "${j.serviceName}"`);
                  setTimeout(() => setNotification(null), 3000);
                }}
                onDetails={() => setSelectedJob(job)}
                onClick={() => setSelectedJob(job)}
              />
            ))}
          </div>
        </section>
      ) : (
        <section className="space-y-3 bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-300"></span>
              </span>
              <h2 className="text-base sm:text-lg font-bold text-neutral-dark">
                {t('dashboard.incomingRequests', 'New Incoming Service Requests')}
              </h2>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200/60">
              0 {t('dashboard.actionRequired', 'New Request')}
            </span>
          </div>

          <div className="py-7 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5">
              <Inbox className="w-6 h-6 stroke-[1.75]" />
            </div>
            <p className="text-sm font-bold text-slate-700">
              {t('dashboard.noIncomingRequests', 'No incoming service requests')}
            </p>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              {t('dashboard.waitingForJobs', 'New service requests from citizens will appear here in real time.')}
            </p>
          </div>
        </section>
      )}

      {/* Today's Work Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-neutral-dark">
                {t('dashboard.todayWork', "Today's Work")}
              </h2>
            </div>
          </div>

          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600">
            {completedCount}/{todayJobs.length} {t('dashboard.done', 'Done')}
          </span>
        </div>

        {/* Work Cards List with Reached, Completed, and Details Buttons */}
        <div className="grid grid-cols-1 gap-3.5">
          {todayJobs.map((job: JobItem) => (
            <WorkCard
              key={job.id}
              job={job}
              showActions={false}
              showCompleteCheckbox={true}
              onToggleReached={handleToggleReached}
              onToggleCompleted={handleToggleCompleted}
              onDetails={() => setSelectedJob(job)}
              onClick={() => handleCardClick(job)}
            />
          ))}
        </div>
      </section>

      {/* Job Details Modal */}
      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onUpdateJob={handleUpdate}
        />
      )}

      {/* ================================================================= */}
      {/* FLOW 1 POPUPS: Location OTP -> Before-Work Photo -> Work Session  */}
      {/* ================================================================= */}

      {/* 1. Location OTP Verification (4-Digit OTP, Mock: 1234) */}
      <OtpVerificationModal
        isOpen={!!otpJob}
        onClose={() => setOtpJob(null)}
        onVerifySuccess={handleLocationOtpSuccess}
        mockOtp="1234"
        serviceName={otpJob?.serviceName}
        clientName={otpJob?.clientName}
      />

      {/* 2. Before-Work Photo Modal ("Before You Start" -> "Start Work") */}
      <BeforeWorkModal
        isOpen={!!beforeWorkJob}
        job={beforeWorkJob}
        onClose={() => setBeforeWorkJob(null)}
        onStartWork={handleStartWorkSuccess}
      />

      {/* 3. Work Session Interface (Live Stopwatch + SOS) */}
      <WorkSessionModal
        isOpen={!!activeSessionJob}
        job={activeSessionJob}
        onClose={() => setActiveSessionJob(null)}
        onCompleteClick={() => {
          if (activeSessionJob) {
            setCompleteWorkJob(activeSessionJob);
          }
        }}
      />

      {/* ================================================================= */}
      {/* FLOW 2 POPUP: Complete Your Work (Proof Photo + 6-Digit OTP 123456) */}
      {/* ================================================================= */}

      <CompleteWorkModal
        isOpen={!!completeWorkJob}
        onClose={() => setCompleteWorkJob(null)}
        onConfirm={handleCompleteWorkSuccess}
        mockOtp="123456"
        serviceName={completeWorkJob?.serviceName}
        clientName={completeWorkJob?.clientName}
      />
    </div>
  );
};

export default HomePage;
