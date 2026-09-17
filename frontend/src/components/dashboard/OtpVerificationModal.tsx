import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface OtpVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerifySuccess: () => void;
  /** If provided, called with the entered OTP string for real backend verification */
  onVerifyWithOtp?: (otp: string) => Promise<void>;
  serviceName?: string;
  clientName?: string;
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerifySuccess,
  onVerifyWithOtp,
}) => {
  const { t } = useTranslation();
  const [otpValue, setOtpValue] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Reset, blur background, clear text selections, lock body scroll, and auto-focus the single input
  useEffect(() => {
    if (isOpen) {
      setOtpValue('');
      setErrorMessage(null);
      setIsVerifying(false);

      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      window.getSelection()?.removeAllRanges();

      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 80);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (errorMessage) {
      setErrorMessage(null);
    }
    const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 4);
    setOtpValue(numericOnly);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleVerify();
    }
  };

  const handleVerify = async () => {
    if (otpValue.length < 4) {
      setErrorMessage(t('dashboard.enterCompleteOtp4', 'Please enter the complete 4-digit OTP provided by the customer.'));
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      if (onVerifyWithOtp) {
        // Real backend verification — errors are surfaced by the parent via toast
        await onVerifyWithOtp(otpValue);
        // Parent closes the modal on success; we just stop the spinner here
        setIsVerifying(false);
      } else {
        // Fallback: direct success callback (no backend check)
        setIsVerifying(false);
        onVerifySuccess();
      }
    } catch {
      setIsVerifying(false);
      setErrorMessage(t('dashboard.incorrectOtp', 'Incorrect OTP. Please check with the customer and try again.'));
    }
  };

  const modalElement = (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center p-3 sm:p-5 overflow-y-auto select-none"
      style={{ isolation: 'isolate' }}
    >
      {/* 1. Modal Overlay */}
      <div
        className="fixed inset-0 z-[9990] bg-black/75 backdrop-blur-md transition-opacity duration-200 cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. OTP Modal Card */}
      <div
        className="relative z-[10000] bg-white rounded-3xl w-full max-w-[420px] shadow-2xl border border-neutral-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto select-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-otp-modal-title"
      >
        {/* Header with Close 'X' Button */}
        <div className="flex items-start justify-between gap-3 p-5 sm:p-6 pb-2 relative z-[10001]">
          <div className="flex-1 min-w-0 pr-2">
            <h3
              id="location-otp-modal-title"
              className="text-xl sm:text-2xl font-extrabold text-[#222222] tracking-tight leading-tight"
            >
              {t('dashboard.verifyLocation', 'Verify Location')}
            </h3>
            <p className="text-xs sm:text-sm text-[#6B6B6B] mt-1.5 leading-relaxed">
              {t('dashboard.verifyLocationSub', 'Ask the customer for the OTP and enter it below to confirm that you have reached the location.')}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close OTP verification popup"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-neutral-800 hover:text-black flex items-center justify-center font-bold cursor-pointer transition-colors shadow-xs flex-shrink-0 border border-neutral-200/60 focus:outline-none focus:ring-2 focus:ring-neutral-400 relative z-[10001]"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 pt-3 space-y-5 relative z-[10001]">
          {/* Single Numeric OTP Input Field */}
          <div>
            <label
              htmlFor="location-otp-input"
              className="block text-xs sm:text-sm font-bold text-[#222222] mb-2.5 text-center"
            >
              {t('dashboard.customerOtp4', 'Customer 4-Digit OTP')}
            </label>

            <div className="relative flex items-center justify-center">
              <input
                id="location-otp-input"
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                autoComplete="one-time-code"
                placeholder={t('dashboard.enterOtp4', 'Enter 4-digit OTP')}
                value={otpValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                aria-label="Customer 4-digit OTP"
                className={`w-full h-14 sm:h-16 text-center text-2xl sm:text-3xl font-extrabold tracking-[0.4em] rounded-2xl border-2 transition-all duration-150 outline-none ${
                  errorMessage
                    ? 'border-red-500 bg-red-50/30 text-red-700 focus:border-red-600 focus:ring-4 focus:ring-red-100'
                    : otpValue
                    ? 'border-[#1C516C] bg-[#1C516C]/5 text-[#1C516C] focus:border-[#1C516C] focus:ring-4 focus:ring-[#1C516C]/15'
                    : 'border-neutral-200 bg-neutral-50/80 text-[#222222] placeholder:text-neutral-400 placeholder:text-base placeholder:font-medium placeholder:tracking-normal hover:border-neutral-300 focus:border-[#1C516C] focus:bg-white focus:ring-4 focus:ring-[#1C516C]/15'
                }`}
              />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="flex items-center gap-1.5 mt-3 text-red-600 text-xs font-semibold justify-center text-center animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Verify OTP Button */}
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              disabled={otpValue.length < 4 || isVerifying}
              onClick={handleVerify}
              className={`w-full h-13 sm:h-14 rounded-2xl font-extrabold text-sm sm:text-base transition-all duration-150 shadow-xs flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1C516C] ${
                otpValue.length === 4 && !isVerifying
                  ? 'bg-[#1C516C] hover:bg-[#164055] text-white active:scale-[0.99] shadow-md'
                  : 'bg-neutral-200 text-neutral-400 border border-neutral-300 opacity-60 cursor-not-allowed'
              }`}
            >
              {isVerifying ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>{t('dashboard.verifyOtpBtn', 'Verify OTP')}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalElement, document.body);
};
