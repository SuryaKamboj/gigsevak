import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { OTPInput } from '../../components/auth/OTPInput';
import { OTPTimer } from '../../components/auth/OTPTimer';
import { AuthButton } from '../../components/auth/AuthButton';
import { SpeakerButton } from '../../components/common/SpeakerButton';
import { verifyOtpCode, sendOtpSms } from '../../services/firebaseAuth';
import { onboardingService } from '../../services/onboardingService';
import { workerBackendService } from '../../services/workerBackendService';

interface LocationState {
  phoneNumber?: string;
  mode?: 'signup' | 'login';
}

export const WorkerVerify: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const activeLangCode = i18n.language || localStorage.getItem('workerLanguage') || 'en';

  const state = (location.state as LocationState) || {};
  const rawPhone = state.phoneNumber || '';
  const mode = state.mode || 'signup';

  // Masked phone format: +91 ••••••1234
  const lastFourDigits = rawPhone.replace(/\D/g, '').slice(-4) || '••••';
  const maskedPhone = rawPhone ? `+91 ••••••${lastFourDigits}` : '';

  const OTP_VALIDITY_SECONDS = 120; // 2 minutes OTP validity
  const RESEND_COOLDOWN_SECONDS = 30; // 30 seconds resend cooldown

  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [resendNotification, setResendNotification] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [validitySeconds, setValiditySeconds] = useState(OTP_VALIDITY_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  // Active countdown timer effect
  React.useEffect(() => {
    const timer = setInterval(() => {
      setValiditySeconds((prev) => (prev > 0 ? prev - 1 : 0));
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const headingText = t('auth.otp.title', { lng: activeLangCode }) || 'Verify your mobile number';
  const enterOtpText = t('auth.otp.description', { lng: activeLangCode }) || 'Enter the 6-digit OTP sent to your mobile number';
  const changeNumberText = t('auth.otp.changeNumber', { lng: activeLangCode }) || 'Change mobile number';
  const verifyOtpText = t('auth.otp.verifyOtp', { lng: activeLangCode }) || 'Verify OTP';
  const didntReceiveText = t('auth.otp.didntReceive', { lng: activeLangCode }) || "Didn't receive the OTP?";
  const resendOtpText = t('auth.otp.resendOtp', { lng: activeLangCode }) || 'Resend OTP';
  const fullText = `${headingText}. ${enterOtpText}`;

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading || successMessage) return;

    if (validitySeconds <= 0) {
      setError(t('auth.otp.expiredOtp', { lng: activeLangCode }) || 'OTP has expired. Please click "Resend OTP" to receive a new code.');
      return;
    }

    if (otp.length < 6) {
      setError(t('auth.otp.invalidOtp', { lng: activeLangCode }) || 'Please enter the 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError(undefined);
    setResendNotification(undefined);

    try {
      const verifyResult = await verifyOtpCode(otp);
      const firebaseIdToken = verifyResult?.idToken;

      setSuccessMessage(t('auth.otp.otpVerifiedSuccess', { lng: activeLangCode }) || 'Mobile number verified successfully.');
      onboardingService.updateState({ mobileNumber: rawPhone, isMobileCompleted: true });

      let isWorkerApproved = false;
      let resolvedWorkerName = '';
      try {
        const cleanDigits = rawPhone.replace(/\D/g, '').slice(-10);
        const formattedPhone = `+91${cleanDigits}`;
        const loginRes = await workerBackendService.loginWorker(formattedPhone, undefined, firebaseIdToken);
        if (loginRes?.user?.fullName) {
          resolvedWorkerName = loginRes.user.fullName;
        }
        const profileRes = await workerBackendService.getProfile();
        const workerDoc = profileRes?.data || profileRes;
        if (workerDoc?.fullName) {
          resolvedWorkerName = workerDoc.fullName;
        }
        isWorkerApproved = workerDoc?.kycVerificationStatus === 'VERIFIED';
      } catch (err: any) {
        console.warn('Backend login warning during OTP verification:', err?.message || err);
      }

      // Save user session permanently in localStorage with real worker identity
      const userSession = {
        phoneNumber: rawPhone,
        name: resolvedWorkerName,
        isVerified: true,
        verifiedAt: new Date().toISOString()
      };
      localStorage.setItem('gharsaathi_worker_session', JSON.stringify(userSession));
      sessionStorage.setItem('gharsaathi_worker_session', JSON.stringify(userSession));
      localStorage.setItem('user_mobile_number', rawPhone);
      localStorage.setItem('worker_application_status', isWorkerApproved ? 'approved' : 'pending');

      setTimeout(() => {
        if (mode === 'signup') {
          navigate('/worker/verification', { replace: true });
        } else {
          navigate(isWorkerApproved ? '/worker/dashboard' : '/worker/pending-request', { replace: true });
        }
      }, 700);
    } catch (err: any) {
      console.error('OTP verification error:', err);
      setError(err?.message || 'Invalid OTP. Please check the code and try again.');
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isLoading) return;

    setOtp('');
    setError(undefined);
    setIsLoading(true);

    try {
      await sendOtpSms(rawPhone);
      setValiditySeconds(OTP_VALIDITY_SECONDS);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);

      setResendNotification(t('auth.otp.otpResentSuccess', { lng: activeLangCode }) || 'OTP sent again successfully');

      setTimeout(() => {
        setResendNotification(undefined);
      }, 3500);
    } catch (err: any) {
      setError(err?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      progress={{
        currentStep: 1,
        step1Progress: successMessage ? 100 : 0,
        step2Progress: 0,
        step3Progress: 0,
      }}
    >
      <div className="space-y-6">
        {/* Back Link */}
        <div className="-mt-1">
          <Link
            to={mode === 'login' ? '/worker/login' : '/worker/signup'}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#66737D] hover:text-[#1C516C] transition-colors focus:outline-none focus:ring-1 focus:ring-[#1C516C] rounded"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{changeNumberText}</span>
          </Link>
        </div>

        {/* Header Section */}
        <div className="text-center space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#17212B]">
              {headingText}
            </h1>
            <SpeakerButton
              text={fullText}
              langCode={activeLangCode}
              size="sm"
              label="Listen instructions"
            />
          </div>
          <div className="text-sm sm:text-[15px] text-[#66737D] leading-relaxed max-w-[320px] mx-auto space-y-0.5">
            <p>{enterOtpText}</p>
            <p className="font-semibold text-[#17212B] tracking-wider pt-0.5">
              {maskedPhone}
            </p>
          </div>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleVerify} className="space-y-4 pt-1" noValidate>
          <div className="space-y-3">
            <OTPInput
              value={otp}
              onChange={(newOtp) => {
                setOtp(newOtp);
                if (error) setError(undefined);
                if (resendNotification) setResendNotification(undefined);
              }}
              hasError={Boolean(error)}
              disabled={isLoading || Boolean(successMessage) || validitySeconds <= 0}
            />

            {/* OTP Validity Timer */}
            <OTPTimer secondsLeft={validitySeconds} />

            {/* Error Message */}
            {error && (
              <p className="text-xs sm:text-sm text-[#953638] font-medium text-center animate-fadeIn">
                {error}
              </p>
            )}

            {/* Resend Notification Message */}
            {resendNotification && (
              <p className="text-xs sm:text-sm text-[#1C516C] font-semibold text-center animate-fadeIn">
                {resendNotification}
              </p>
            )}

            {/* Success State */}
            {successMessage && (
              <div className="flex items-center justify-center gap-1.5 text-sm text-[#2E9B57] font-semibold text-center animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-[#2E9B57]" />
                <span>{successMessage}</span>
              </div>
            )}
          </div>

          {/* Verify OTP Button */}
          <div className="pt-2">
            <AuthButton
              type="submit"
              variant="outline"
              disabled={isLoading || Boolean(successMessage) || otp.length < 6 || validitySeconds <= 0}
              isLoading={isLoading}
            >
              {verifyOtpText}
            </AuthButton>
          </div>
        </form>

        {/* Resend OTP Section */}
        <div className="text-center pt-2 border-t border-slate-100 space-y-1">
          <p className="text-sm text-[#66737D]">
            {didntReceiveText}
          </p>
          <div>
            <button
              type="button"
              onClick={handleResend}
              disabled={isLoading || resendCooldown > 0}
              className={`text-sm font-semibold p-0.5 transition-colors rounded focus:outline-none focus:ring-1 focus:ring-[#1C516C] ${resendCooldown > 0 || isLoading
                  ? 'text-slate-400 cursor-not-allowed'
                  : 'text-[#1C516C] hover:underline underline-offset-4 cursor-pointer'
                }`}
            >
              {resendCooldown > 0
                ? t('auth.otp.resendIn', { seconds: resendCooldown, lng: activeLangCode }) || `Resend in ${resendCooldown}s`
                : resendOtpText}
            </button>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};
