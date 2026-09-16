import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, Camera, RotateCcw, AlertCircle, CheckCircle2, Upload, Sparkles, Lock } from 'lucide-react';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { AuthButton } from '../../components/auth/AuthButton';
import { SpeakerButton } from '../../components/common/SpeakerButton';
import {
  validateAadhaarNumber,
  formatAadhaarNumber,
  initiateAadhaarVerification,
  verifyAadhaarOtp,
  verifySelfieLiveness,
  saveSelfieVerification
} from '../../services/identityService';
import { onboardingService } from '../../services/onboardingService';
import { workerBackendService } from '../../services/workerBackendService';

type AadhaarStatus = 'not_started' | 'in_progress' | 'otp_pending' | 'verified' | 'error';
type SelfieStatus = 'locked' | 'in_progress' | 'photo_selected' | 'verified' | 'error';

export const WorkerVerification: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const activeLangCode = i18n.language || localStorage.getItem('workerLanguage') || 'en';

  // Verification Step States
  const [aadhaarStatus, setAadhaarStatus] = useState<AadhaarStatus>('in_progress');
  const [selfieStatus, setSelfieStatus] = useState<SelfieStatus>('locked');

  // Aadhaar Form State
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [aadhaarError, setAadhaarError] = useState<string | undefined>();
  const [aadhaarInfo, setAadhaarInfo] = useState<string | undefined>();
  const [isVerifyingAadhaar, setIsVerifyingAadhaar] = useState(false);

  // Selfie / Camera State
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [selfieError, setSelfieError] = useState<string | undefined>();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isConfirmingSelfie, setIsConfirmingSelfie] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Start Camera
  const startCamera = useCallback(async () => {
    setSelfieError(undefined);
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
          audio: false,
        });
        mediaStreamRef.current = stream;
        setIsCameraActive(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (e) {
            console.warn('Video play error:', e);
          }
        }
      } else {
        setSelfieError(t('identity.selfie.notSupportedError', { lng: activeLangCode }) || 'Live camera is not supported on this browser. You can upload a selfie.');
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      setIsCameraActive(false);
      setSelfieError(t('identity.selfie.permissionError', { lng: activeLangCode }) || 'Camera permission is required. You can also tap "Upload Photo" below.');
    }
  }, [t, activeLangCode]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Auto start camera when selfie step becomes active
  useEffect(() => {
    if (selfieStatus === 'in_progress' && !photoDataUrl && !isCameraActive) {
      startCamera();
    }
  }, [selfieStatus, photoDataUrl, isCameraActive, startCamera]);

  // Ensure video element receives stream when active
  useEffect(() => {
    if (isCameraActive && videoRef.current && mediaStreamRef.current) {
      videoRef.current.srcObject = mediaStreamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [isCameraActive]);

  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAadhaarNumber(e.target.value);
    setAadhaarNumber(formatted);
    if (aadhaarError) setAadhaarError(undefined);
  };

  // Step 1: Initiate Aadhaar OTP
  const handleInitiateAadhaar = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawDigits = aadhaarNumber.replace(/\s/g, '');

    if (!rawDigits) {
      setAadhaarError(t('identity.aadhaar.required', { lng: activeLangCode }) || 'Aadhaar number is mandatory. Please enter your 12-digit Aadhaar number.');
      return;
    }

    if (rawDigits.length !== 12) {
      setAadhaarError(t('identity.aadhaar.invalidNumber', { lng: activeLangCode }) || 'Please enter a valid 12-digit Aadhaar number');
      return;
    }

    if (!validateAadhaarNumber(rawDigits)) {
      setAadhaarError(t('identity.aadhaar.verhoeffError', { lng: activeLangCode }) || 'Invalid Aadhaar number checksum (Verhoeff validation failed). Please check digits.');
      return;
    }

    setIsVerifyingAadhaar(true);
    setAadhaarError(undefined);

    try {
      const res = await initiateAadhaarVerification(rawDigits, true);
      setAadhaarStatus('otp_pending');
      setAadhaarInfo(res.message);
    } catch (err: any) {
      setAadhaarError(err.message || 'Failed to initiate Aadhaar verification');
    } finally {
      setIsVerifyingAadhaar(false);
    }
  };

  // Step 2: Verify Aadhaar OTP
  const handleVerifyAadhaarOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aadhaarOtp || aadhaarOtp.length !== 6) {
      setAadhaarError(t('identity.aadhaar.invalidOtp', { lng: activeLangCode }) || 'Please enter the 6-digit Aadhaar OTP (or 123456 in test mode)');
      return;
    }

    setIsVerifyingAadhaar(true);
    setAadhaarError(undefined);

    try {
      await verifyAadhaarOtp(aadhaarNumber, aadhaarOtp);
      setAadhaarStatus('verified');
      sessionStorage.setItem('gigsevak_worker_aadhaar', aadhaarNumber);
      onboardingService.updateState({ isAadhaarVerified: true });
      setSelfieStatus('in_progress');
    } catch (err: any) {
      setAadhaarError(err.message || 'Invalid Aadhaar OTP');
    } finally {
      setIsVerifyingAadhaar(false);
    }
  };

  // Capture Photo
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    const width = videoRef.current.videoWidth || 480;
    const height = videoRef.current.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      setPhotoDataUrl(dataUrl);
      setSelfieStatus('photo_selected');
      stopCamera();
    }
  };

  // Handle File Input upload as fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setPhotoDataUrl(dataUrl);
        setSelfieStatus('photo_selected');
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setPhotoDataUrl(null);
    setSelfieStatus('in_progress');
    startCamera();
  };

  // Step 3: Confirm Selfie & Verify Liveness
  const handleConfirmSelfie = async () => {
    if (aadhaarStatus !== 'verified') {
      setAadhaarError('Aadhaar verification is mandatory before completing identity verification.');
      return;
    }

    if (!photoDataUrl) {
      setSelfieError(t('identity.selfie.captureFirstError', { lng: activeLangCode }) || 'Please capture a live photo first');
      return;
    }

    setIsConfirmingSelfie(true);
    setSelfieError(undefined);

    try {
      const result = await verifySelfieLiveness(photoDataUrl);
      saveSelfieVerification(result);
      setSelfieStatus('verified');
      sessionStorage.setItem('gigsevak_worker_selfie', photoDataUrl);
      onboardingService.updateState({ isSelfieVerified: true });

      // Proactively sync identity verification to backend
      try {
        const storedPhone =
          localStorage.getItem('user_mobile_number') ||
          JSON.parse(localStorage.getItem('gharsaathi_worker_session') || '{}')?.phoneNumber;
        if (storedPhone) {
          const formattedPhone = storedPhone.startsWith('+91')
            ? storedPhone
            : `+91${storedPhone.replace(/\D/g, '').slice(-10)}`;
          await workerBackendService.loginWorker(formattedPhone, 'Worker Partner');
        }
        await workerBackendService.submitOnboardingApplication({
          aadhaarNumber,
          aadhaarVerified: true,
          selfieUrl: photoDataUrl
        });
      } catch (syncErr) {
        console.warn('Backend identity sync notice:', syncErr);
      }

      if (aadhaarStatus === 'verified') {
        setTimeout(() => {
          navigate('/worker/categories', { replace: true });
        }, 700);
      }
    } catch (err: any) {
      setSelfieError(err.message || 'Liveness check failed. Please retake photo.');
    } finally {
      setIsConfirmingSelfie(false);
    }
  };

  const isAllCompleted = aadhaarStatus === 'verified' && selfieStatus === 'verified';
  const step2Progress = selfieStatus === 'verified' ? 100 : aadhaarStatus === 'verified' ? 50 : 0;

  // Auto-redirect to the next step when both Aadhaar and Selfie are verified
  useEffect(() => {
    if (isAllCompleted) {
      const timer = setTimeout(() => {
        const state = onboardingService.getState();
        const nextPath = state.isCategoriesCompleted ? '/worker/location' : '/worker/categories';
        navigate(nextPath, { replace: true });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAllCompleted, navigate]);

  const headerTitle = t('identity.intro.title', { lng: activeLangCode }) || 'Complete Your Verification';
  const headerSubtitle = t('identity.intro.subtitle', { lng: activeLangCode }) || 'Both steps are required to start working on GigSevak.';

  const aadhaarTitle = t('identity.intro.stepAadhaarTitle', { lng: activeLangCode }) || 'Aadhaar Verification';
  const aadhaarDesc = aadhaarStatus === 'verified'
    ? (t('identity.intro.stepAadhaarVerified', { lng: activeLangCode }) || 'Aadhaar verified successfully')
    : (t('identity.intro.stepAadhaarDesc', { lng: activeLangCode }) || 'Verify your 12-digit Aadhaar number');

  const selfieTitle = t('identity.intro.stepSelfieTitle', { lng: activeLangCode }) || 'Live Selfie Verification';
  const selfieDesc = selfieStatus === 'verified'
    ? (t('identity.intro.stepSelfieVerified', { lng: activeLangCode }) || 'Selfie verified successfully')
    : selfieStatus === 'locked'
    ? (t('identity.intro.stepSelfieLocked', { lng: activeLangCode }) || 'Locked until Aadhaar is verified')
    : (t('identity.intro.stepSelfieDesc', { lng: activeLangCode }) || 'Take a live photo to verify your identity');

  const aadhaarLabel = t('identity.aadhaar.label', { lng: activeLangCode }) || 'Enter your 12-digit Aadhaar number';
  const aadhaarVerifyBtn = t('identity.aadhaar.verifyBtn', { lng: activeLangCode }) || 'Verify Aadhaar';
  const aadhaarOtpLabel = t('identity.aadhaar.otpLabel', { lng: activeLangCode }) || 'Enter 6-digit Aadhaar OTP';
  const aadhaarSubmitOtpBtn = t('identity.aadhaar.submitOtpBtn', { lng: activeLangCode }) || 'Submit Aadhaar OTP';

  const selfiePromptText = t('identity.selfie.subtitle', { lng: activeLangCode }) || 'Position your face inside the frame with good lighting';
  const openCameraBtnText = t('identity.selfie.openCameraBtn', { lng: activeLangCode }) || 'Open Live Camera';
  const captureBtnText = t('identity.selfie.captureBtn', { lng: activeLangCode }) || 'Capture Live Selfie';
  const retakeBtnText = t('identity.selfie.retakeBtn', { lng: activeLangCode }) || 'Retake';
  const confirmBtnText = isConfirmingSelfie 
    ? (t('identity.selfie.confirming', { lng: activeLangCode }) || 'Verifying...') 
    : (t('identity.selfie.confirmBtn', { lng: activeLangCode }) || 'Confirm');
  const successRedirectText = t('identity.selfie.successRedirect', { lng: activeLangCode }) || 'Verification completed successfully! Redirecting...';

  return (
    <AuthLayout
      progress={{
        currentStep: 2,
        step1Progress: 100,
        step2Progress,
        step3Progress: 0,
      }}
    >
      <div className="space-y-6">
        {/* Header Section */}
        <div className="text-center space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#17212B]">
              {headerTitle}
            </h1>
            <SpeakerButton
              text={`${headerTitle}. ${headerSubtitle}`}
              langCode={activeLangCode}
              size="sm"
              label="Listen instructions"
            />
          </div>
          <p className="text-sm sm:text-[15px] text-[#66737D] leading-relaxed max-w-[340px] mx-auto">
            {headerSubtitle}
          </p>
        </div>

        {/* Verification Steps List */}
        <div className="space-y-4">
          {/* STEP 1: AADHAAR VERIFICATION CARD */}
          <div
            className={`rounded-2xl border transition-all p-4 sm:p-5 ${
              aadhaarStatus === 'verified'
                ? 'border-emerald-200 bg-emerald-50/20'
                : 'border-[#D9D9D9] bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    aadhaarStatus === 'verified'
                      ? 'bg-[#2E9B57] text-white'
                      : 'bg-[#1C516C]/10 text-[#1C516C]'
                  }`}
                >
                  {aadhaarStatus === 'verified' ? <Check className="w-4 h-4 stroke-[3]" /> : '1'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[#17212B]">
                      {aadhaarTitle}
                    </h2>
                    <span className="text-[10px] font-bold text-[#953638] bg-[#953638]/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      Mandatory
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#66737D]">
                    {aadhaarDesc}
                  </p>
                </div>
              </div>

              {aadhaarStatus === 'verified' ? (
                <div className="w-6 h-6 rounded-full bg-[#2E9B57]/10 flex items-center justify-center text-[#2E9B57]">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAadhaarNumber('5489 6789 0124');
                    setAadhaarStatus('in_progress');
                  }}
                  className="text-[11px] font-semibold text-[#1C516C] bg-[#F5F0DD] px-2.5 py-1 rounded-lg hover:bg-[#ebdca6] transition-colors"
                >
                  Fill Test Aadhaar
                </button>
              )}
            </div>

            {/* Aadhaar Input Form */}
            {aadhaarStatus === 'in_progress' && (
              <form onSubmit={handleInitiateAadhaar} className="mt-4 pt-3 border-t border-slate-100 space-y-3" noValidate>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor="aadhaar-input" className="block text-xs font-semibold text-[#17212B]">
                      {aadhaarLabel} <span className="text-[#953638] font-bold">*</span>
                    </label>
                    <span className="text-[10px] text-[#66737D]">Demo: 5489 6789 0124</span>
                  </div>
                  <input
                    id="aadhaar-input"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={14}
                    value={aadhaarNumber}
                    onChange={handleAadhaarChange}
                    placeholder="XXXX XXXX XXXX"
                    disabled={isVerifyingAadhaar}
                    required
                    className={`w-full h-12 sm:h-13 px-4 text-center text-base sm:text-lg font-bold tracking-widest text-[#17212B] placeholder:text-[#66737D]/40 bg-white rounded-xl border transition-all outline-none ${
                      aadhaarError
                        ? 'border-[#953638] ring-2 ring-[#953638]/20 bg-red-50/10'
                        : 'border-[#D9D9D9] focus:border-[#1C516C] focus:ring-2 focus:ring-[#1C516C]/20'
                    }`}
                  />
                </div>

                {aadhaarError && (
                  <div className="flex items-center gap-1.5 text-xs text-[#953638] font-medium animate-fadeIn">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{aadhaarError}</span>
                  </div>
                )}

                <div className="pt-1">
                  <AuthButton
                    type="submit"
                    variant="outline"
                    isLoading={isVerifyingAadhaar}
                  >
                    {aadhaarVerifyBtn}
                  </AuthButton>
                </div>
              </form>
            )}

            {/* Aadhaar OTP Pending Form */}
            {aadhaarStatus === 'otp_pending' && (
              <form onSubmit={handleVerifyAadhaarOtp} className="mt-4 pt-3 border-t border-slate-100 space-y-3" noValidate>
                {aadhaarInfo && (
                  <p className="text-xs text-[#1C516C] bg-[#F5F0DD] p-2.5 rounded-lg font-medium">
                    {aadhaarInfo} (Test OTP: 123456)
                  </p>
                )}
                <div className="space-y-1">
                  <label htmlFor="aadhaar-otp-input" className="block text-xs font-semibold text-[#17212B]">
                    {aadhaarOtpLabel}
                  </label>
                  <input
                    id="aadhaar-otp-input"
                    type="tel"
                    inputMode="numeric"
                    maxLength={6}
                    value={aadhaarOtp}
                    onChange={(e) => setAadhaarOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    disabled={isVerifyingAadhaar}
                    className="w-full h-12 px-4 text-center text-lg font-bold tracking-widest text-[#17212B] bg-white rounded-xl border border-[#D9D9D9] focus:border-[#1C516C] focus:ring-2 focus:ring-[#1C516C]/20 outline-none"
                  />
                </div>

                {aadhaarError && (
                  <div className="flex items-center gap-1.5 text-xs text-[#953638] font-medium animate-fadeIn">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{aadhaarError}</span>
                  </div>
                )}

                <div className="pt-1 flex gap-2">
                  <div className="flex-1">
                    <AuthButton
                      type="submit"
                      variant="outline"
                      isLoading={isVerifyingAadhaar}
                    >
                      {aadhaarSubmitOtpBtn}
                    </AuthButton>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAadhaarOtp('123456');
                    }}
                    className="px-3 text-xs font-semibold text-[#1C516C] bg-[#F5F0DD] rounded-xl hover:bg-[#ebdca6]"
                  >
                    Use 123456
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* STEP 2: LIVE SELFIE VERIFICATION CARD */}
          <div
            className={`rounded-2xl border transition-all p-4 sm:p-5 ${
              selfieStatus === 'verified'
                ? 'border-emerald-200 bg-emerald-50/20'
                : aadhaarStatus !== 'verified'
                ? 'border-[#D9D9D9] bg-slate-50/70'
                : 'border-[#D9D9D9] bg-white shadow-soft'
            }`}
          >
            <div 
              className={`flex items-center justify-between ${
                aadhaarStatus === 'verified' ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'
              }`}
              onClick={() => {
                if (aadhaarStatus !== 'verified') {
                  setAadhaarError('Aadhaar verification is mandatory before proceeding to Selfie verification.');
                  return;
                }
                if (selfieStatus !== 'verified') {
                  setSelfieStatus('in_progress');
                  startCamera();
                }
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    selfieStatus === 'verified'
                      ? 'bg-[#2E9B57] text-white'
                      : aadhaarStatus !== 'verified'
                      ? 'bg-slate-200 text-slate-500'
                      : 'bg-[#1C516C]/10 text-[#1C516C]'
                  }`}
                >
                  {selfieStatus === 'verified' ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : aadhaarStatus !== 'verified' ? (
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                  ) : (
                    '2'
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[#17212B]">
                      {selfieTitle}
                    </h2>
                    {aadhaarStatus !== 'verified' && (
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Locked
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-[#66737D]">
                    {aadhaarStatus !== 'verified'
                      ? 'Locked — Complete mandatory Aadhaar verification first'
                      : selfieDesc}
                  </p>
                </div>
              </div>

              {selfieStatus === 'verified' && (
                <div className="w-6 h-6 rounded-full bg-[#2E9B57]/10 flex items-center justify-center text-[#2E9B57]">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}
            </div>

            {/* Selfie Active Interface - Only unlocked after Aadhaar is verified */}
            {aadhaarStatus === 'verified' && selfieStatus !== 'verified' && (
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-3.5">
                {/* Viewfinder Container */}
                <div className="relative w-full aspect-[4/3] max-h-[260px] rounded-2xl overflow-hidden bg-slate-900 border-2 border-[#1C516C]/30 flex flex-col items-center justify-center shadow-inner">
                  {photoDataUrl ? (
                    <img
                      src={photoDataUrl}
                      alt="Captured Worker Selfie"
                      className="w-full h-full object-cover"
                    />
                  ) : isCameraActive ? (
                    <div className="relative w-full h-full bg-black flex items-center justify-center">
                      <video
                        ref={(node) => {
                          videoRef.current = node;
                          if (node && mediaStreamRef.current && node.srcObject !== mediaStreamRef.current) {
                            node.srcObject = mediaStreamRef.current;
                            node.play().catch(() => {});
                          }
                        }}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform scale-x-[-1]"
                      />
                      {/* Face positioning oval outline overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-36 h-48 sm:w-40 sm:h-52 border-2 border-dashed border-[#FDA649] rounded-full animate-pulse shadow-lg flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-[#FDA649] rounded-full" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-5 space-y-2.5 bg-slate-900 text-white">
                      <div className="w-14 h-14 mx-auto rounded-full bg-white/10 flex items-center justify-center text-[#FDA649] border border-white/20">
                        <Camera className="w-7 h-7" />
                      </div>
                      <p className="text-xs text-slate-300 max-w-[240px] mx-auto leading-relaxed">
                        {selfiePromptText}
                      </p>
                    </div>
                  )}
                </div>

                {/* Hidden File Picker Input for Camera Fallback */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />

                {/* Controls & Action Buttons */}
                {photoDataUrl ? (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleRetake}
                      className="h-12 rounded-xl text-xs sm:text-sm font-semibold border border-[#D9D9D9] bg-white text-[#17212B] hover:bg-slate-50 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{retakeBtnText}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmSelfie}
                      disabled={isConfirmingSelfie}
                      className="h-12 rounded-xl text-xs sm:text-sm font-semibold border border-[#1C516C] bg-[#1C516C] text-white hover:bg-[#133B50] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-[#FDA649]" />
                      <span>{confirmBtnText}</span>
                    </button>
                  </div>
                ) : isCameraActive ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="w-full h-12 rounded-xl text-sm font-semibold border border-[#1C516C] bg-[#1C516C] text-white hover:bg-[#133B50] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-[#FDA649]" />
                      <span>{captureBtnText}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-12 rounded-xl text-sm font-semibold border border-slate-300 bg-white text-[#17212B] hover:bg-slate-50 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-[#1C516C]" />
                      <span>Upload Photo</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="w-full h-12 rounded-xl text-sm font-semibold border border-[#1C516C] bg-[#1C516C] text-white hover:bg-[#133B50] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-[#FDA649]" />
                      <span>{openCameraBtnText}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-12 rounded-xl text-sm font-semibold border border-slate-300 bg-white text-[#17212B] hover:bg-slate-50 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-[#1C516C]" />
                      <span>Upload Photo</span>
                    </button>
                  </div>
                )}

                {selfieError && (
                  <div className="flex items-center gap-1.5 text-xs text-[#953638] font-medium pt-1 animate-fadeIn">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{selfieError}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SUCCESS STATE */}
        {isAllCompleted && (
          <div className="pt-2 animate-fadeIn">
            <button
              type="button"
              onClick={() => {
                const state = onboardingService.getState();
                const nextPath = state.isCategoriesCompleted ? '/worker/location' : '/worker/categories';
                navigate(nextPath, { replace: true });
              }}
              className="w-full flex items-center justify-center gap-2 text-sm text-[#2E9B57] font-semibold text-center bg-emerald-50/60 border border-emerald-200 hover:bg-emerald-100/60 transition-colors py-3.5 px-4 rounded-xl shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5 text-[#2E9B57]" />
              <span>{successRedirectText}</span>
            </button>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};
