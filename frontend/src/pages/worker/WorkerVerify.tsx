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

interface LocationState {
  phoneNumber?: string;
  mode?: 'signup' | 'login';
  isSimulated?: boolean;
  simulatedOtp?: string;
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

  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [resendNotification, setResendNotification] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

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

    if (otp.length < 6) {
      setError(t('auth.otp.invalidOtp', { lng: activeLangCode }) || 'Please enter the 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError(undefined);
    setResendNotification(undefined);

    try {
      await verifyOtpCode(otp);

      setSuccessMessage(t('auth.otp.otpVerifiedSuccess', { lng: activeLangCode }) || 'Mobile number verified successfully.');
      onboardingService.updateState({ mobileNumber: rawPhone, isMobileCompleted: true });

      // Save user session
      const userSession = {
        phoneNumber: rawPhone,
        name: 'GigSevak',
        isVerified: true,
        verifiedAt: new Date().toISOString()
      };
      sessionStorage.setItem('gharsaathi_worker_session', JSON.stringify(userSession));
      localStorage.setItem('user_mobile_number', rawPhone);

      setTimeout(() => {
        const target = mode === 'signup' ? '/worker/verification' : '/worker/dashboard';
        navigate(target, { replace: true });
      }, 700);
    } catch (err: any) {
      console.error('OTP verification error:', err);
      setError(err?.message || 'Invalid OTP. Please check the code and try again.');
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setOtp('');
    setError(undefined);
    setIsLoading(true);

    try {
      await sendOtpSms(rawPhone);
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
              disabled={isLoading || Boolean(successMessage)}
            />

            {/* OTP Validity Timer */}
            <OTPTimer timeString="02:00" />

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
              disabled={isLoading || Boolean(successMessage) || otp.length < 6}
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
              disabled={isLoading}
              className="text-sm font-semibold text-[#1C516C] hover:underline underline-offset-4 focus:outline-none focus:ring-1 focus:ring-[#1C516C] rounded p-0.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {resendOtpText}
            </button>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};
