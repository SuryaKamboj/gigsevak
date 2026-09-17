import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { WorkerLanguageSelection } from './pages/worker/WorkerLanguageSelection';
import { WorkerAssistancePreference } from './pages/worker/WorkerAssistancePreference';
import { WorkerSignup } from './pages/worker/WorkerSignup';
import { WorkerLogin } from './pages/worker/WorkerLogin';
import { WorkerVerify } from './pages/worker/WorkerVerify';
import { WorkerVerification } from './pages/worker/WorkerVerification';
import { WorkerSelfie } from './pages/worker/WorkerSelfie';
import { WorkerCategories } from './pages/worker/WorkerCategories';
import { WorkerLocation } from './pages/worker/WorkerLocation';
import { WorkerDashboard } from './pages/worker/WorkerDashboard';
import { WorkerPendingRequest } from './pages/worker/WorkerPendingRequest';
import { JobDetailPage } from './pages/dashboard/JobDetailPage';
import { authService } from './services/authService';
import type { JobItem } from './types/dashboard';

import React, { useState, useEffect } from 'react';
import { workerBackendService } from './services/workerBackendService';

// Smart redirect component: check authentication and approval
const RootRedirect = () => {
  if (authService.isAuthenticated()) {
    const status = localStorage.getItem('worker_application_status');
    if (status === 'approved') {
      return <Navigate to="/worker/dashboard" replace />;
    }
    return <Navigate to="/worker/pending-request" replace />;
  }
  return <Navigate to="/worker/language" replace />;
};

// Route Guard: Strictly block dashboard and job access until approved by Admin
const RequireApprovedWorker: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [isAuth, setIsAuth] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    if (!authService.isAuthenticated()) {
      setIsAuth(false);
      setIsChecking(false);
      return;
    }

    workerBackendService.getProfile()
      .then((res: any) => {
        const worker = res?.data || res;
        const approved = worker?.kycVerificationStatus === 'VERIFIED';
        if (isMounted) {
          setIsApproved(approved);
          localStorage.setItem('worker_application_status', approved ? 'approved' : 'pending');
          setIsChecking(false);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          if (err?.status === 401) {
            setIsAuth(false);
          }
          setIsApproved(false);
          setIsChecking(false);
        }
      });

    return () => { isMounted = false; };
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#1C516C] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuth) {
    return <Navigate to="/worker/login" replace />;
  }

  if (!isApproved) {
    return <Navigate to="/worker/pending-request" replace />;
  }

  return <>{children}</>;
};

// Route wrapper for direct job links
const JobDetailRouteWrapper = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    workerBackendService
      .getJobs()
      .then((jobs) => {
        if (!isMounted) return;
        const found = jobs.find((j: any) => j._id === id || j.bookingCode === id);
        if (found) {
          const statusStr = (found.status || '').toLowerCase();
          setJob({
            id: found._id || found.bookingCode,
            serviceName: found.serviceId?.name || 'Cooperative Service',
            serviceImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
            image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
            clientName: found.userId?.fullName || 'Citizen Customer',
            clientImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
            clientAddress: found.serviceAddress?.addressLine1 ? `${found.serviceAddress.addressLine1}, ${found.serviceAddress.city || 'Delhi'}` : 'Customer Address',
            clientPhone: found.userId?.mobileNumber || '',
            scheduledTime: found.scheduledStartTime ? new Date(found.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Immediate Dispatch',
            date: 'today',
            status: ['completed'].includes(statusStr) ? 'completed' : ['in_progress', 'working'].includes(statusStr) ? 'in_progress' : ['accepted', 'in_transit', 'arrived'].includes(statusStr) ? 'accepted' : 'pending',
            price: `₹${found.pricing?.totalAmount || 420}`,
            duration: '45 mins',
            estimatedDuration: 45,
            description: (found as any).notes || 'Cooperative citizen service request',
            customerPhotos: [],
            latitude: 28.5300,
            longitude: 77.2090,
            isLocationReached: ['arrived', 'in_progress', 'completed'].includes(statusStr),
            locationVerified: ['arrived', 'in_progress', 'completed'].includes(statusStr),
          });
        }
        setLoading(false);
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] p-4 text-center">
        <p className="text-base font-bold text-neutral-800">Job not found</p>
        <p className="text-xs text-neutral-500 mt-1">This service request does not exist in the cooperative database.</p>
        <button
          onClick={() => navigate('/worker/dashboard')}
          className="mt-4 px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-xl cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return <JobDetailPage job={job} onBack={() => navigate('/worker/dashboard')} />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/worker/language" element={<WorkerLanguageSelection />} />
        <Route path="/worker/assistance" element={<WorkerAssistancePreference />} />
        <Route path="/worker/signup" element={<WorkerSignup />} />
        <Route path="/worker/login" element={<WorkerLogin />} />
        <Route path="/worker/verify" element={<WorkerVerify />} />
        <Route path="/worker/verification" element={<WorkerVerification />} />
        <Route path="/worker/selfie" element={<WorkerSelfie />} />
        <Route path="/worker/categories" element={<WorkerCategories />} />
        <Route path="/worker/location" element={<WorkerLocation />} />
        <Route path="/worker/status" element={<WorkerPendingRequest />} />
        <Route path="/worker/application-status" element={<WorkerPendingRequest />} />
        <Route path="/worker/pending-request" element={<WorkerPendingRequest />} />
        <Route
          path="/worker/dashboard"
          element={
            <RequireApprovedWorker>
              <WorkerDashboard />
            </RequireApprovedWorker>
          }
        />
        <Route
          path="/dashboard/jobs/:id"
          element={
            <RequireApprovedWorker>
              <JobDetailRouteWrapper />
            </RequireApprovedWorker>
          }
        />
        <Route
          path="/worker/jobs/:id"
          element={
            <RequireApprovedWorker>
              <JobDetailRouteWrapper />
            </RequireApprovedWorker>
          }
        />
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
