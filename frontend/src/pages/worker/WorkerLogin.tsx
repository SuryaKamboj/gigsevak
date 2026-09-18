import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { PhoneInput } from '../../components/auth/PhoneInput';
import { AuthButton } from '../../components/auth/AuthButton';
import { SpeakerButton } from '../../components/common/SpeakerButton';
import { sendOtpSms } from '../../services/demoOtpAuth';
import { authService } from '../../services/authService';

export const WorkerLogin: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const activeLangCode = i18n.language || localStorage.getItem('workerLanguage') || 'en';

  // If already logged in, redirect based on approval status
  React.useEffect(() => {
    if (authService.isAuthenticated()) {
      const status = localStorage.getItem('worker_application_status');
      navigate(status === 'approved' ? '/worker/dashboard' : '/worker/pending-request', { replace: true });
    }
  }, [navigate]);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const headingText = t('auth.loginTitle', { lng: activeLangCode }) || 'Welcome back!';
  const subtitleText = t('auth.loginSubtitle', { lng: activeLangCode }) || 'Enter your registered mobile number to log in';
  const continueText = t('common.continue', { lng: activeLangCode }) || 'Continue';
  const newToGigSevakText = t('auth.newToGigSevak', { lng: activeLangCode }) || 'New to GigSevak?';
  const createAccountText = t('auth.createAccount', { lng: activeLangCode }) || 'Create an account';
  const fullText = `${headingText}. ${subtitleText}`;

  const validate = () => {
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    if (!digitsOnly) {
      setError(t('auth.mobileNumber.invalidNumber', { lng: activeLangCode }) || 'Please enter your mobile number');
      return false;
    }
    if (digitsOnly.length !== 10 || !/^[6-9]/.test(digitsOnly)) {
      setError(t('auth.mobileNumber.invalidNumber', { lng: activeLangCode }) || 'Enter a valid 10-digit mobile number');
      return false;
    }
    setError(undefined);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setError(undefined);

    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const formattedNumber = `+91${cleanPhone}`;
      await sendOtpSms(formattedNumber);

      localStorage.setItem('user_mobile_number', formattedNumber);

      navigate('/worker/verify', {
        state: {
          phoneNumber: formattedNumber,
          mode: 'login'
        },
      });
    } catch (err: any) {
      console.error('Login send OTP error:', err);
      setError(err?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
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
          <p className="text-xs sm:text-sm text-[#66737D] leading-relaxed max-w-[320px] mx-auto">
            {subtitleText}
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1" noValidate>
          <PhoneInput
            id="worker-login-phone"
            value={phoneNumber}
            onChange={(val) => {
              setPhoneNumber(val);
              if (error) setError(undefined);
            }}
            error={error}
            disabled={isLoading}
          />

          <div className="pt-2">
            <AuthButton type="submit" variant="outline" isLoading={isLoading}>
              {continueText}
            </AuthButton>
          </div>
        </form>

        {/* Switch to Signup */}
        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-sm text-[#66737D]">
            {newToGigSevakText}{' '}
            <Link
              to="/worker/signup"
              className="font-semibold text-[#1C516C] hover:underline underline-offset-4 focus:outline-none focus:ring-1 focus:ring-[#1C516C] rounded"
            >
              {createAccountText}
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};
