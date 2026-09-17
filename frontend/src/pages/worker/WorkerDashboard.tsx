import React, { useState } from 'react';
import { Header } from '../../components/dashboard/Header';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { BottomNav } from '../../components/dashboard/BottomNav';
import { HomePage } from '../dashboard/HomePage';
import { OrdersPage } from '../dashboard/OrdersPage';
import { VoicePage } from '../dashboard/VoicePage';
import { AccountPage } from '../dashboard/AccountPage';
import type { JobItem, NavTab } from '../../types/dashboard';
import { workerBackendService } from '../../services/workerBackendService';
import { authService } from '../../services/authService';

const mapBackendJobToJobItem = (job: any): JobItem => {
  const statusStr = (job.status || '').toLowerCase();
  const isCompleted = statusStr === 'completed';
  const isInProgress = ['in_progress', 'working'].includes(statusStr);
  const isAccepted = ['accepted', 'in_transit', 'arrived'].includes(statusStr);
  const isDeclined = ['declined', 'cancelled'].includes(statusStr);

  const finalStatus: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'declined' = 
    isCompleted ? 'completed' :
    isInProgress ? 'in_progress' :
    isAccepted ? 'accepted' :
    isDeclined ? 'declined' : 'pending';

  return {
    id: job._id || job.bookingCode || job.bookingId,
    serviceName: job.serviceId?.name || (job.serviceId?.category ? `${job.serviceId.category} Service` : 'Cooperative Service'),
    serviceImage: job.serviceId?.imageUrl || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
    image: job.serviceId?.imageUrl || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
    clientName: job.userId?.fullName || 'Citizen Customer',
    clientImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    clientAddress: job.serviceAddress?.addressLine1 ? `${job.serviceAddress.addressLine1}, ${job.serviceAddress.city || 'Delhi'}` : 'Customer Location',
    clientPhone: job.userId?.mobileNumber || '+91 98765 43210',
    scheduledTime: job.scheduledStartTime ? new Date(job.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Immediate Dispatch',
    date: 'today',
    status: finalStatus,
    price: `₹${job.pricing?.totalAmount || 420}`,
    duration: job.serviceId?.defaultDurationMinutes ? `${job.serviceId.defaultDurationMinutes} mins` : '45 mins',
    estimatedDuration: job.serviceId?.defaultDurationMinutes || 45,
    description: job.notes || 'Cooperative citizen service request',
    customerPhotos: [],
    latitude: job.serviceAddress?.location?.coordinates?.[1] || 28.5300,
    longitude: job.serviceAddress?.location?.coordinates?.[0] || 77.2090,
    isLocationReached: ['arrived', 'in_progress', 'completed'].includes(statusStr),
    locationVerified: ['arrived', 'in_progress', 'completed'].includes(statusStr)
  };
};

export const WorkerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [jobsList, setJobsList] = useState<JobItem[]>([]);

  const fetchRealJobs = async () => {
    try {
      const backendJobs = await workerBackendService.getJobs();
      if (Array.isArray(backendJobs)) {
        const mapped = backendJobs.map(mapBackendJobToJobItem);
        setJobsList(mapped);
      } else {
        setJobsList([]);
      }
    } catch (err: any) {
      if (err?.status === 401) {
        throw err;
      }
      console.warn('[WorkerDashboard] getJobs notice:', err?.message || err);
    }
  };

  React.useEffect(() => {
    let isMounted = true;
    let interval: any = null;

    // Verify worker approval status on mount
    workerBackendService.getProfile()
      .then((res: any) => {
        const worker = res?.data || res;
        if (worker && worker.kycVerificationStatus !== 'VERIFIED') {
          localStorage.setItem('worker_application_status', 'pending');
          window.location.href = '/worker/pending-request';
        }
      })
      .catch((err: any) => {
        if (err?.status === 401) {
          authService.logout();
          window.location.href = '/worker/login';
        }
      });

    fetchRealJobs().catch(() => {});
    interval = setInterval(async () => {
      if (!isMounted) return;
      try {
        await fetchRealJobs();
      } catch (err: any) {
        if (err?.status === 401) {
          clearInterval(interval);
          authService.logout();
          window.location.href = '/worker/login';
        }
      }
    }, 5000);

    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
    };
  }, []);

  const handleUpdateJob = (updatedJob: JobItem) => {
    setJobsList((prev) =>
      prev.map((job) => (job.id === updatedJob.id ? updatedJob : job))
    );
  };

  const handleAcceptJob = async (job: JobItem) => {
    try {
      if (job.id) {
        await workerBackendService.acceptJob(job.id);
      }
    } catch (err: any) {
      console.warn('[WorkerDashboard] acceptJob notice:', err?.message || err);
    }
    const updated: JobItem = { ...job, status: 'accepted', date: 'today' };
    handleUpdateJob(updated);
    fetchRealJobs();
  };

  const handleDeclineJob = async (job: JobItem) => {
    try {
      if (job.id) {
        await workerBackendService.declineJob(job.id);
      }
    } catch (err: any) {
      console.warn('[WorkerDashboard] declineJob notice:', err?.message || err);
    }
    const updated: JobItem = { ...job, status: 'declined' };
    handleUpdateJob(updated);
    fetchRealJobs();
  };

  const renderActivePage = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomePage
            jobsList={jobsList}
            onUpdateJob={handleUpdateJob}
            onAcceptJob={handleAcceptJob}
            onDeclineJob={handleDeclineJob}
          />
        );
      case 'orders':
        return (
          <OrdersPage
            jobsList={jobsList}
            onUpdateJob={handleUpdateJob}
            onAcceptJob={handleAcceptJob}
            onDeclineJob={handleDeclineJob}
          />
        );
      case 'voice':
        return <VoicePage />;
      case 'account':
        return <AccountPage />;
      default:
        return (
          <HomePage
            jobsList={jobsList}
            onUpdateJob={handleUpdateJob}
            onAcceptJob={handleAcceptJob}
            onDeclineJob={handleDeclineJob}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans selection:bg-brand-primary/20 selection:text-brand-primary">
      {/* Top Header */}
      <Header
        isAvailable={isAvailable}
        onToggleAvailability={() => setIsAvailable((prev) => !prev)}
        onLogoClick={() => setActiveTab('home')}
      />

      {/* Main Body Layout */}
      <div className="flex-1 flex w-full">
        {/* Desktop Left Icon-Only Sidebar */}
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Content Area */}
        <main className="flex-1 min-w-0 md:pl-20 pb-24 md:pb-12 pt-4 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full transition-all">
          {renderActivePage()}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />
    </div>
  );
};

export default WorkerDashboard;
