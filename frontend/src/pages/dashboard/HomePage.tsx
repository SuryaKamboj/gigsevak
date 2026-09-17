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
  onRefresh?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  jobsList = [],
  onUpdateJob,
  onAcceptJob,
  onDeclineJob,
  onRefresh,
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
  const [loadingJobId, setLoadingJobId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string>('');

  React.useEffect(() => { setLocalJobs(jobsList); }, [jobsList]);

  React.useEffect(() => {
    workerBackendService.getProfile()
      .then((res: any) => { const p = res?.data || res; if (p?.fullName) setProfileName(p.fullName); })
      .catch(() => {});
  }, []);

  const workerName = (() => {
    if (profileName) return profileName;
    const user = authService.getCurrentUser();
    if (user?.name) { const clean = user.name.replace(/\bpartner\b/gi, '').trim(); if (clean) return clean; }
    return 'Worker';
  })();

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleUpdate = (updatedJob: JobItem) => {
    setLocalJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
    if (selectedJob?.id === updatedJob.id) setSelectedJob(updatedJob);
    if (activeSessionJob?.id === updatedJob.id) setActiveSessionJob(updatedJob);
    if (beforeWorkJob?.id === updatedJob.id) setBeforeWorkJob(updatedJob);
    if (onUpdateJob) onUpdateJob(updatedJob);
  };

  const callTransition = async (
    job: JobItem,
    apiCall: () => Promise<any>,
    successStatus: JobItem['status'],
    successMsg: string,
    extraFields: Partial<JobItem> = {}
  ): Promise<boolean> => {
    setLoadingJobId(job.id);
    try {
      const res = await apiCall();
      if (res?.success === false) { showToast(`Warning: ${res?.error?.message || 'Action failed'}`); return false; }
      handleUpdate({ ...job, status: successStatus, backendStatus: successStatus.toUpperCase(), ...extraFields });
      showToast(successMsg);
      onRefresh?.();
      return true;
    } catch (err: any) {
      showToast(`Warning: ${err?.response?.data?.error?.message || err?.message || 'Action failed'}`);
      return false;
    } finally {
      setLoadingJobId(null);
    }
  };

  const handleAcceptJob = async (job: JobItem) => {
    if (onAcceptJob) { await onAcceptJob(job); return; }
    await callTransition(job, () => workerBackendService.acceptJob(job.id), 'accepted', `Accepted "${job.serviceName}"!`, { date: 'today' });
  };

  const handleDeclineJob = async (job: JobItem) => {
    if (onDeclineJob) { await onDeclineJob(job); return; }
    await callTransition(job, () => workerBackendService.declineJob(job.id), 'declined', `Declined "${job.serviceName}"`);
  };

  const handleMarkOnTheWay = async (job: JobItem) => {
    await callTransition(job, () => workerBackendService.markInTransit(job.id), 'in_transit', `On the way to "${job.serviceName}"`, { isLocationReached: false });
  };

  const handleMarkArrived = async (job: JobItem) => {
    const ok = await callTransition(job, () => workerBackendService.markArrived(job.id), 'arrived', `Arrived at "${job.serviceName}"`, { isLocationReached: true, locationVerified: true });
    if (ok) setOtpJob({ ...job, status: 'arrived', isLocationReached: true, locationVerified: true });
  };

  const handleStartJobOtp = async (enteredOtp: string) => {
    if (!otpJob) return;
    setLoadingJobId(otpJob.id);
    try {
      const res = await workerBackendService.startJobWithOtp(otpJob.id, enteredOtp);
      if (res?.success === false) { showToast(`Warning: ${res?.error?.message || 'Invalid OTP'}`); return; }
      const updated: JobItem = { ...otpJob, status: 'in_progress', backendStatus: 'IN_PROGRESS', workStarted: true, workStartTime: Date.now(), isLocationReached: true };
      handleUpdate(updated);
      setOtpJob(null);
      setBeforeWorkJob(updated);
      showToast(`Job started for "${otpJob.serviceName}"`);
      onRefresh?.();
    } catch (err: any) {
      showToast(`Warning: ${err?.response?.data?.error?.message || err?.message || 'Invalid OTP'}`);
    } finally {
      setLoadingJobId(null);
    }
  };

  const handleStartWorkSuccess = (beforeWorkPhoto: string) => {
    if (!beforeWorkJob) return;
    const updated: JobItem = { ...beforeWorkJob, beforeWorkPhoto, workStarted: true, workStartTime: beforeWorkJob.workStartTime || Date.now(), status: 'in_progress' };
    handleUpdate(updated);
    setBeforeWorkJob(null);
    setActiveSessionJob(updated);
  };

  const handleInitiateCompleteJob = async (job: JobItem) => {
    setLoadingJobId(job.id);
    try {
      const res = await workerBackendService.completeJob(job.id);
      if (res?.success === false) {
        showToast(`Warning: ${res?.error?.message || 'Could not complete job'}`);
        return;
      }
      const updated: JobItem = {
        ...job,
        status: 'completion_pending',
        backendStatus: 'COMPLETION_PENDING',
      };
      handleUpdate(updated);
      setCompleteWorkJob(updated);
      showToast('Completion PIN generated. Ask customer for their 4-digit PIN.');
      onRefresh?.();
    } catch (err: any) {
      showToast(`Warning: ${err?.response?.data?.error?.message || err?.message || 'Could not complete job'}`);
    } finally {
      setLoadingJobId(null);
    }
  };

  const handleCompleteWorkSuccess = async (proofPhoto: string, enteredPin: string) => {
    if (!completeWorkJob) return;
    setLoadingJobId(completeWorkJob.id);
    try {
      const res = await workerBackendService.verifyCompletionPin(completeWorkJob.id, enteredPin);
      if (res?.success === false) {
        throw new Error(res?.error?.message || 'Incorrect PIN');
      }
      const completionTime = Date.now();
      const startMs = completeWorkJob.workStartTime || completionTime;
      const totalSecs = Math.max(0, Math.floor((completionTime - startMs) / 1000));
      const h = Math.floor(totalSecs / 3600), m = Math.floor((totalSecs % 3600) / 60), s = totalSecs % 60;
      handleUpdate({
        ...completeWorkJob, status: 'completed', backendStatus: 'COMPLETED',
        completionProofPhoto: proofPhoto, afterWorkPhoto: proofPhoto,
        completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        completionTime, actualWorkDuration: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`,
        workCompleted: true, completionVerified: true,
      });
      showToast('Work completed successfully');
      setCompleteWorkJob(null);
      setActiveSessionJob(null);
      onRefresh?.();
    } finally {
      setLoadingJobId(null);
    }
  };

  const handleCardClick = (job: JobItem) => {
    if (job.workStarted && job.status !== 'completed') setActiveSessionJob(job);
    else setSelectedJob(job);
  };

  const pendingJobs = localJobs.filter(j => j.status === 'pending');
  const activeJobs = localJobs.filter(j =>
    ['accepted', 'in_transit', 'arrived', 'in_progress', 'completion_pending', 'completed'].includes(j.status) && (j.date === 'today' || !j.date)
  );
  const completedCount = activeJobs.filter(j => j.status === 'completed').length;
  const inProgressCount = activeJobs.filter(j => j.status === 'in_progress').length;

  const today = new Date();
  const dateFormatted = new Intl.DateTimeFormat(
    activeLangCode === 'hi' ? 'hi-IN' : activeLangCode === 'pa' ? 'pa-IN' : 'en-US',
    { weekday: 'long', month: 'short', day: 'numeric' }
  ).format(today);

  const getJobAction = (job: JobItem) => {
    switch (job.status) {
      case 'accepted':           return { label: 'On the Way',         fn: () => handleMarkOnTheWay(job),        cls: 'bg-blue-600 hover:bg-blue-700' };
      case 'in_transit':         return { label: 'Mark Arrived',        fn: () => handleMarkArrived(job),         cls: 'bg-amber-500 hover:bg-amber-600' };
      case 'arrived':            return { label: 'Enter Customer OTP',  fn: () => setOtpJob(job),                 cls: 'bg-indigo-600 hover:bg-indigo-700' };
      case 'in_progress':        return { label: 'Job Completed',       fn: () => handleInitiateCompleteJob(job), cls: 'bg-emerald-600 hover:bg-emerald-700' };
      case 'completion_pending': return { label: 'Enter Customer PIN',  fn: () => setCompleteWorkJob(job),        cls: 'bg-emerald-600 hover:bg-emerald-700' };
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-gradient-to-r from-brand-primary/10 via-brand-light to-transparent p-5 sm:p-6 rounded-3xl border border-brand-primary/15 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 backdrop-blur-xs text-xs font-semibold text-brand-primary mb-3 shadow-xs border border-brand-primary/20">
            <Calendar className="w-3.5 h-3.5" />
            <span>{dateFormatted}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-dark tracking-tight">
            {t('dashboard.welcomeWorker', { name: workerName, defaultValue: `Welcome, ${workerName}!` })}
          </h1>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-2">
            <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-3 border border-neutral-100 shadow-xs">
              <div className="text-xs text-neutral-muted font-medium">{t('dashboard.todayJobs', "Today's Jobs")}</div>
              <div className="text-xl font-bold text-neutral-dark mt-0.5">{activeJobs.length} {t('dashboard.assigned', 'Assigned')}</div>
            </div>
            <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-3 border border-neutral-100 shadow-xs">
              <div className="text-xs text-neutral-muted font-medium">{t('dashboard.completed', 'Completed')}</div>
              <div className="text-xl font-bold text-[#01471f] mt-0.5">{completedCount} {t('dashboard.of', 'of')} {activeJobs.length}</div>
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
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> {t('dashboard.activeDay', 'Active Day')}</span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-brand-primary/10 rounded-full blur-2xl pointer-events-none" />
      </section>

      {notification && (
        <div className="p-3 bg-neutral-900 text-white text-xs sm:text-sm font-medium rounded-2xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-neutral-400 hover:text-white ml-2 text-xs font-bold cursor-pointer">x</button>
        </div>
      )}

      {pendingJobs.length > 0 ? (
        <section className="space-y-3 bg-amber-500/10 border-2 border-amber-500/30 p-4 sm:p-5 rounded-3xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-600"></span>
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-neutral-dark">{t('dashboard.incomingRequests', 'New Incoming Service Requests')}</h2>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500 text-white shadow-xs">{pendingJobs.length} {t('dashboard.actionRequired', 'New Request')}</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {pendingJobs.map((job: JobItem) => (
              <WorkCard key={job.id} job={job} showActions={true} showCompleteCheckbox={false}
                onAccept={async (e, j) => { e?.stopPropagation(); await handleAcceptJob(j); }}
                onDecline={async (e, j) => { e?.stopPropagation(); await handleDeclineJob(j); }}
                onDetails={() => setSelectedJob(job)} onClick={() => setSelectedJob(job)}
              />
            ))}
          </div>
        </section>
      ) : (
        <section className="space-y-3 bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-300"></span>
              <h2 className="text-base sm:text-lg font-bold text-neutral-dark">{t('dashboard.incomingRequests', 'New Incoming Service Requests')}</h2>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200/60">0 {t('dashboard.actionRequired', 'New Request')}</span>
          </div>
          <div className="py-7 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5"><Inbox className="w-6 h-6 stroke-[1.75]" /></div>
            <p className="text-sm font-bold text-slate-700">{t('dashboard.noIncomingRequests', 'No incoming service requests')}</p>
            <p className="text-xs text-slate-500 max-w-sm mt-1">{t('dashboard.waitingForJobs', 'New service requests from citizens will appear here in real time.')}</p>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold"><Briefcase className="w-4 h-4" /></div>
            <h2 className="text-lg sm:text-xl font-bold text-neutral-dark">{t('dashboard.todayWork', "Today's Work")}</h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600">{completedCount}/{activeJobs.length} {t('dashboard.done', 'Done')}</span>
        </div>
        <div className="grid grid-cols-1 gap-3.5">
          {activeJobs.map((job: JobItem) => {
            const action = getJobAction(job);
            const isLoading = loadingJobId === job.id;
            return (
              <div key={job.id} className="bg-white rounded-2xl shadow-xs border border-neutral-100 overflow-hidden">
                <WorkCard job={job} showActions={false} showCompleteCheckbox={false}
                  onDetails={() => setSelectedJob(job)} onClick={() => handleCardClick(job)} />
                {action ? (
                  <div className="px-3.5 pb-3.5">
                    <button type="button" disabled={isLoading} onClick={action.fn}
                      className={`w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${action.cls}`}>
                      {isLoading ? 'Please wait...' : action.label}
                    </button>
                  </div>
                ) : job.status === 'completed' ? (
                  <div className="px-3.5 pb-3.5">
                    <div className="w-full py-2.5 rounded-xl text-sm font-bold text-white text-center bg-emerald-600 opacity-80">Completed</div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {selectedJob && (
        <JobDetailsModal job={selectedJob} onClose={() => setSelectedJob(null)} onUpdateJob={handleUpdate}
          showBookingActions={selectedJob.status === 'pending'}
          onAccept={async (j) => { await handleAcceptJob(j); setSelectedJob(null); }}
          onDecline={async (j) => { await handleDeclineJob(j); setSelectedJob(null); }}
        />
      )}

      <OtpVerificationModal isOpen={!!otpJob} onClose={() => setOtpJob(null)}
        onVerifySuccess={() => {}} onVerifyWithOtp={handleStartJobOtp}
        serviceName={otpJob?.serviceName} clientName={otpJob?.clientName} />

      <BeforeWorkModal isOpen={!!beforeWorkJob} job={beforeWorkJob}
        onClose={() => setBeforeWorkJob(null)} onStartWork={handleStartWorkSuccess} />

      <WorkSessionModal isOpen={!!activeSessionJob} job={activeSessionJob}
        onClose={() => setActiveSessionJob(null)}
        onCompleteClick={() => {
          if (activeSessionJob) {
            const j = activeSessionJob;
            setActiveSessionJob(null);
            if (j.status === 'completion_pending') {
              setCompleteWorkJob(j);
            } else {
              handleInitiateCompleteJob(j);
            }
          }
        }} />

      <CompleteWorkModal isOpen={!!completeWorkJob} onClose={() => setCompleteWorkJob(null)}
        onConfirm={handleCompleteWorkSuccess}
        serviceName={completeWorkJob?.serviceName} clientName={completeWorkJob?.clientName} />
    </div>
  );
};

export default HomePage;
