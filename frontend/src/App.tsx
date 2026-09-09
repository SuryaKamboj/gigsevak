import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/worker/language" replace />} />
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
        <Route path="/worker/dashboard" element={<WorkerDashboard />} />
        <Route path="*" element={<Navigate to="/worker/language" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
