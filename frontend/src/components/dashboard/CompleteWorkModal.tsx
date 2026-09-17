import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Upload,
  Camera,
  Trash2,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  SwitchCamera,
  Scan,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CompleteWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (proofPhotoUrl: string, pin: string) => Promise<void> | void;
  serviceName?: string;
  clientName?: string;
  mockOtp?: string;
}

export const CompleteWorkModal: React.FC<CompleteWorkModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string>('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Live Camera states
  const [isLiveCameraActive, setIsLiveCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Stop active camera stream tracks
  const stopLiveCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  // Start live camera stream
  const startLiveCamera = useCallback(async (mode: 'environment' | 'user' = facingMode) => {
    try {
      setErrorMessage(null);
      stopLiveCamera();

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        mediaStreamRef.current = stream;
        setHasCameraPermission(true);
        setIsLiveCameraActive(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((e) => console.warn('Video play error:', e));
        }
      } else {
        setHasCameraPermission(false);
        setErrorMessage('Camera is not supported on this browser/device. Please upload a photo instead.');
      }
    } catch (err: any) {
      console.warn('Camera access denied or error:', err);
      if (mode === 'environment') {
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          mediaStreamRef.current = fallbackStream;
          setHasCameraPermission(true);
          setIsLiveCameraActive(true);
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            videoRef.current.play().catch(() => {});
          }
          return;
        } catch {
          // Both failed
        }
      }
      setHasCameraPermission(false);
      setErrorMessage('Camera access was denied or is unavailable. Please grant camera permissions or upload an image file.');
    }
  }, [facingMode, stopLiveCamera]);

  // Capture frame from live video stream onto canvas
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      if (facingMode === 'user') {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setPhotoPreview(dataUrl);
      setPhotoName(`completion-proof-${new Date().toISOString().slice(11, 19).replace(/:/g, '')}.jpg`);
      setErrorMessage(null);

      stopLiveCamera();
      setIsLiveCameraActive(false);
    }
    setIsCapturing(false);
  };

  const handleSwitchCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startLiveCamera(nextMode);
  };

  const handleCancelCamera = () => {
    stopLiveCamera();
    setIsLiveCameraActive(false);
  };

  // Reset states and handle body scroll locking when opened
  useEffect(() => {
    if (isOpen) {
      setPhotoPreview(null);
      setPhotoName('');
      setOtpDigits(['', '', '', '']);
      setErrorMessage(null);
      setIsSubmitting(false);
      setIsLiveCameraActive(false);

      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      window.getSelection()?.removeAllRanges();

      const timer = setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 80);

      return () => {
        clearTimeout(timer);
        stopLiveCamera();
        document.body.style.overflow = originalOverflow;
      };
    } else {
      stopLiveCamera();
    }
  }, [isOpen, stopLiveCamera]);

  if (!isOpen || typeof document === 'undefined') return null;

  // Handle Photo selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please upload a valid image file (PNG, JPG, JPEG, WEBP).');
        return;
      }
      setPhotoName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
        if (errorMessage && !errorMessage.includes('OTP')) {
          setErrorMessage(null);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setPhotoName('');
  };

  // Handle 6-digit OTP changes
  const handleOtpChange = (index: number, value: string) => {
    if (errorMessage) {
      setErrorMessage(null);
    }

    const cleaned = value.replace(/\D/g, '');

    if (!cleaned) {
      const newDigits = [...otpDigits];
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }

    if (cleaned.length > 1) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 4 && index + i < 4; i++) {
        if (cleaned[i]) {
          newDigits[index + i] = cleaned[i];
        }
      }
      setOtpDigits(newDigits);
      const nextIdx = Math.min(index + cleaned.length, 3);
      otpInputRefs.current[nextIdx]?.focus();
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = cleaned[0];
    setOtpDigits(newDigits);

    if (cleaned && index < 3) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 3) {
      e.preventDefault();
      otpInputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirmCompletion();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pastedData) return;

    const newDigits = ['', '', '', ''];
    for (let i = 0; i < 4; i++) {
      newDigits[i] = pastedData[i] || '';
    }
    setOtpDigits(newDigits);
    if (errorMessage) {
      setErrorMessage(null);
    }

    const focusIdx = Math.min(pastedData.length, 3);
    otpInputRefs.current[focusIdx]?.focus();
  };

  const enteredOtp = otpDigits.join('');
  const isFormValid = Boolean(enteredOtp.length === 4);

  const handleConfirmCompletion = async () => {
    if (enteredOtp.length < 4) {
      setErrorMessage(t('dashboard.enterOtp4', 'Please enter the complete 4-digit customer OTP.'));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const photoToSubmit = photoPreview || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80';
      await onConfirm(photoToSubmit, enteredOtp);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.message || 'Verification failed. Please check the PIN.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center p-3 sm:p-5 overflow-y-auto select-none"
      style={{ isolation: 'isolate' }}
    >
      {/* Background Overlay */}
      <div
        className="fixed inset-0 z-[9990] bg-black/75 backdrop-blur-md transition-opacity duration-200 cursor-pointer"
        onClick={() => {
          stopLiveCamera();
          onClose();
        }}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        className="relative z-[10000] bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-neutral-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto max-h-[92vh] flex flex-col select-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="complete-work-modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 p-5 sm:p-6 pb-3 border-b border-neutral-100 bg-white sticky top-0 z-20">
          <div className="flex-1 min-w-0 pr-2">
            <h3
              id="complete-work-modal-title"
              className="text-xl sm:text-2xl font-extrabold text-[#222222] tracking-tight leading-tight"
            >
              {t('dashboard.completeYourWork', 'Complete Your Work')}
            </h3>
            <p className="text-xs sm:text-sm text-[#6B6B6B] mt-1 leading-relaxed">
              {t('dashboard.completeYourWorkSub', 'Upload a photo of the completed work and enter the OTP provided by the customer to confirm that you have completed the job.')}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              stopLiveCamera();
              onClose();
            }}
            aria-label="Close completion popup"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-neutral-800 hover:text-black flex items-center justify-center font-bold cursor-pointer transition-colors shadow-xs flex-shrink-0 border border-neutral-200/60 focus:outline-none focus:ring-2 focus:ring-neutral-400"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 overscroll-contain">
          {/* STEP 1: PROOF OF WORK */}
          <section className="space-y-3">
            <div>
              <h4 className="text-sm sm:text-base font-bold text-[#222222] flex items-center gap-1.5">
                <span>{t('dashboard.afterWorkPhoto', 'Upload Proof of Work')}</span>
                <span className="text-red-500 font-bold">*</span>
              </h4>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                {t('dashboard.completeYourWorkSub', 'Take a live photo or upload an image showing the completed work.')}
              </p>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* 1. STATE: LIVE CAMERA VIEWFINDER ACTIVE */}
            {isLiveCameraActive ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-[#1C516C] bg-black shadow-xl animate-in fade-in zoom-in-95 duration-200">
                {/* Live Video Element */}
                <div className="relative w-full aspect-[4/3] max-h-[340px] bg-black flex items-center justify-center overflow-hidden">
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
                    className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform scale-x-[-1]' : ''}`}
                  />

                  {/* Alignment Crosshairs / Guide Frame */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4">
                    <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-white/60 border-dashed rounded-2xl flex items-center justify-center">
                      <Scan className="w-8 h-8 text-white/50 animate-pulse" />
                    </div>
                    <span className="text-[11px] font-semibold text-white/90 bg-black/50 px-2.5 py-0.5 rounded-full mt-2 backdrop-blur-xs">
                      {t('dashboard.alignWorkArea', 'Align completed work in frame')}
                    </span>
                  </div>

                  {/* Top Controls: Switch Camera & Cancel */}
                  <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-10 pointer-events-auto">
                    <button
                      type="button"
                      onClick={handleSwitchCamera}
                      title={t('dashboard.flipCamera', 'Flip Camera')}
                      className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition active:scale-95 cursor-pointer border border-white/20 flex items-center gap-1 text-xs font-semibold"
                    >
                      <SwitchCamera className="w-4 h-4" />
                      <span className="hidden xs:inline">{t('dashboard.flipCamera', 'Flip')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelCamera}
                      title={t('dashboard.cancelCamera', 'Cancel Camera')}
                      className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition active:scale-95 cursor-pointer border border-white/20"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Bottom Capture Controls Bar */}
                <div className="p-3.5 bg-neutral-950 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={handleCapturePhoto}
                    disabled={isCapturing}
                    aria-label="Capture Completion Photo"
                    className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-4 border-white bg-emerald-600 hover:bg-emerald-500 active:scale-90 transition-all shadow-lg flex items-center justify-center cursor-pointer disabled:opacity-50"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </button>
                </div>
              </div>
            ) : !photoPreview ? (
              /* 2. STATE: NO PHOTO CAPTURED */
              <div className="border-2 border-dashed border-neutral-300 hover:border-[#A66666] bg-neutral-50/70 hover:bg-[#A66666]/5 rounded-2xl p-5 sm:p-6 text-center transition-all duration-200 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#A66666]/10 text-[#A66666] flex items-center justify-center shadow-2xs">
                  <Upload className="w-6 h-6 stroke-[2.2]" />
                </div>

                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-bold text-[#222222]">
                    {t('dashboard.afterWorkPhoto', 'Select or capture completion proof photo')}
                  </p>
                  <p className="text-[11px] text-[#6B6B6B]">
                    {t('dashboard.openLiveCamera', 'Live Camera')} or JPG/PNG (Max 10MB)
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => startLiveCamera('environment')}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#1C516C] hover:bg-[#164055] text-white shadow-2xs cursor-pointer active:scale-95 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{t('dashboard.takePhoto', 'Take Photo')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white hover:bg-neutral-100 text-[#222222] border border-neutral-300 shadow-2xs cursor-pointer active:scale-95 transition-all"
                  >
                    <Upload className="w-4 h-4 text-[#A66666]" />
                    <span>{t('dashboard.uploadFromGallery', 'Upload Photo')}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* 3. STATE: PHOTO PREVIEW */
              <div className="space-y-2">
                <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-neutral-900 shadow-md">
                  <img
                    src={photoPreview}
                    alt="Work completion proof"
                    className="w-full h-44 sm:h-56 object-contain bg-neutral-950"
                  />

                  {/* Top Success Badge */}
                  <div className="absolute top-2.5 left-2.5 bg-emerald-600/90 backdrop-blur-xs text-white px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t('dashboard.afterWorkPhoto', 'Proof of work uploaded')}</span>
                  </div>

                  {/* Bottom Actions Bar */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-3 flex items-center justify-between gap-2">
                    <p className="text-[11px] font-medium text-white/90 truncate max-w-[150px] sm:max-w-[200px]">
                      {photoName || 'proof-photo.jpg'}
                    </p>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => startLiveCamera('environment')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold backdrop-blur-xs transition cursor-pointer"
                        title={t('dashboard.retakePhoto', 'Retake Live Photo')}
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{t('dashboard.retakePhoto', 'Retake')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-semibold backdrop-blur-xs transition cursor-pointer"
                        title={t('dashboard.removePhoto', 'Remove Photo')}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{t('dashboard.removePhoto', 'Remove')}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{t('dashboard.afterWorkPhoto', 'Proof of work uploaded')}</span>
                </p>
              </div>
            )}
          </section>

          {/* STEP 2: COMPLETION 6-DIGIT OTP */}
          <section className="space-y-3 pt-1">
            <div>
              <h4 className="text-sm sm:text-base font-bold text-[#222222] flex items-center gap-1.5">
                <span>{t('dashboard.customerOtp4', 'Customer 4-Digit OTP')}</span>
                <span className="text-red-500 font-bold">*</span>
              </h4>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                {t('dashboard.completeYourWorkSub', 'Ask the customer for the OTP to confirm that the work has been completed.')}
              </p>
            </div>

            {/* 6 Separate OTP Input Boxes */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 py-1">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpInputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  onPaste={handleOtpPaste}
                  aria-label={`Completion OTP Digit ${idx + 1}`}
                  className={`w-11 h-13 sm:w-13 sm:h-15 text-center text-xl sm:text-2xl font-extrabold rounded-2xl border-2 transition-all duration-150 outline-none select-none ${
                    errorMessage && !photoPreview
                      ? 'border-red-500 bg-red-50/30 text-red-700 focus:border-red-600 focus:ring-4 focus:ring-red-100'
                      : digit
                      ? 'border-[#1C516C] bg-[#1C516C]/5 text-[#1C516C] focus:border-[#1C516C] focus:ring-4 focus:ring-[#1C516C]/15'
                      : 'border-neutral-200 bg-neutral-50/80 text-[#222222] hover:border-neutral-300 focus:border-[#1C516C] focus:bg-white focus:ring-4 focus:ring-[#1C516C]/15'
                  }`}
                />
              ))}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-semibold justify-center text-center animate-in fade-in duration-150 px-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{errorMessage}</span>
                  {hasCameraPermission === false && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-bold text-red-900 underline mt-1 block"
                    >
                      Click here to upload from device instead
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Verify & Complete Button */}
          <div className="pt-2">
            <button
              type="button"
              disabled={!isFormValid || isSubmitting || isLiveCameraActive}
              onClick={handleConfirmCompletion}
              className={`w-full h-13 sm:h-14 rounded-2xl font-extrabold text-sm sm:text-base transition-all duration-150 shadow-xs flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1C516C] ${
                isFormValid && !isSubmitting && !isLiveCameraActive
                  ? 'bg-[#1C516C] hover:bg-[#164055] text-white active:scale-[0.99] shadow-md hover:shadow-lg'
                  : 'bg-neutral-200 text-neutral-400 border border-neutral-300 opacity-60 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>{t('dashboard.confirmAndComplete', 'Verify & Complete')}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
