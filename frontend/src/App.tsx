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
import { MOCK_JOBS } from './data/mockJobs';

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
  const [isApproved, setIsApproved] = useState<boolean>(() => {
    return localStorage.getItem('worker_application_status') === 'approved';
  });

  useEffect(() => {
    let isMounted = true;
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
      .catch(() => {
        if (isMounted) {
          const localApproved = localStorage.getItem('worker_application_status') === 'approved';
          setIsApproved(localApproved);
          setIsChecking(false);
        }
      });

    return () => { isMounted = false; };
  }, []);

  if (isChecking && !isApproved) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-600">Verifying authorization status...</p>
        </div>
      </div>
    );
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
  const found = MOCK_JOBS.find((j) => j.id === id);
  const fallbackJob = found || {
    id: id || 'GS-202609-29833',
    serviceName: 'Electrical Repair & Switchboard Wiring',
    serviceImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
    clientName: 'Rahul Verma',
    clientImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    clientAddress: 'B-42 Lajpat Nagar II, New Delhi',
    clientPhone: '+91 63963 23790',
    scheduledTime: 'Immediate Dispatch',
    date: 'today',
    status: 'accepted' as const,
    price: '₹420',
    duration: '45 mins',
    estimatedDuration: 45,
    description: 'Emergency electrical check and MCB replacement.',
    customerPhotos: [],
    latitude: 28.5300,
    longitude: 77.2090,
    isLocationReached: false,
    locationVerified: false,
  };

  return <JobDetailPage job={fallbackJob} onBack={() => navigate('/worker/dashboard')} />;
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
