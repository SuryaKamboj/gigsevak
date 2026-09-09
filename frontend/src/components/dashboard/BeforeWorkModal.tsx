import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Upload,
  Camera,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  Play,
  SwitchCamera,
  AlertCircle,
  Scan,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { JobItem } from '../../types/dashboard';

interface BeforeWorkModalProps {
  isOpen: boolean;
  job: JobItem | null;
  onClose: () => void;
  onStartWork: (beforeWorkPhoto: string) => void;
}

export const BeforeWorkModal: React.FC<BeforeWorkModalProps> = ({
  isOpen,
  job,
  onClose,
  onStartWork,
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live Camera states
  const [isLiveCameraActive, setIsLiveCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      // If environment camera failed, attempt fallback to default camera
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
      // If front camera, flip horizontally for mirror effect; if rear, render normal
      if (facingMode === 'user') {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setPhotoPreview(dataUrl);
      setPhotoName(`live-capture-${new Date().toISOString().slice(11, 19).replace(/:/g, '')}.jpg`);
      setErrorMessage(null);

      // Stop camera and exit viewfinder mode
      stopLiveCamera();
      setIsLiveCameraActive(false);
    }
    setIsCapturing(false);
  };

  // Flip camera between rear (environment) and front (user)
  const handleSwitchCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startLiveCamera(nextMode);
  };

  // Close live camera viewfinder
  const handleCancelCamera = () => {
    stopLiveCamera();
    setIsLiveCameraActive(false);
  };

  // Reset and handle body scroll locking when opened
  useEffect(() => {
    if (isOpen) {
      setPhotoPreview(job?.beforeWorkPhoto || null);
      setPhotoName('');
      setErrorMessage(null);
      setIsLiveCameraActive(false);

      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      window.getSelection()?.removeAllRanges();

      return () => {
        stopLiveCamera();
        document.body.style.overflow = originalOverflow;
      };
    } else {
      stopLiveCamera();
    }
  }, [isOpen, job, stopLiveCamera]);

  if (!isOpen || !job || typeof document === 'undefined') return null;

  const translatedServiceName = (currentLang !== 'en' && job.translations?.[currentLang]?.serviceName)
    ? job.translations[currentLang].serviceName
    : job.serviceName;

  const translatedAddress = (currentLang !== 'en' && job.translations?.[currentLang]?.clientAddress)
    ? job.translations[currentLang].clientAddress
    : job.clientAddress;

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
        setErrorMessage(null);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setPhotoName('');
  };

  const handleStart = () => {
    if (!photoPreview) {
      setErrorMessage(t('dashboard.takePhotoFirst', 'Please capture or upload a before-work photo first.'));
      return;
    }
    onStartWork(photoPreview);
  };

  // Format estimated work duration in human readable format
  const formatEstimatedDuration = (minutes?: number, fallbackDuration?: string) => {
    if (!minutes) return fallbackDuration || '1 hour';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0 && mins > 0) {
      return `${hrs} hour${hrs > 1 ? 's' : ''} ${mins} minutes`;
    }
    if (hrs > 0) {
      return `${hrs} hour${hrs > 1 ? 's' : ''}`;
    }
    return `${mins} minutes`;
  };

  const formattedEstimated = formatEstimatedDuration(job.estimatedDuration, job.duration);

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
        aria-labelledby="before-work-modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 p-5 sm:p-6 pb-3 border-b border-neutral-100 bg-white sticky top-0 z-20">
          <div className="flex-1 min-w-0 pr-2">
            <h3
              id="before-work-modal-title"
              className="text-xl sm:text-2xl font-extrabold text-[#222222] tracking-tight leading-tight"
            >
              {t('dashboard.beforeYouStart', 'Before You Start')}
            </h3>
            <p className="text-xs sm:text-sm text-[#6B6B6B] mt-1 leading-relaxed">
              {t('dashboard.beforeYouStartSub', 'Take a clear photo of the work area before starting service.')}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              stopLiveCamera();
              onClose();
            }}
            aria-label="Close before you start popup"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-neutral-800 hover:text-black flex items-center justify-center font-bold cursor-pointer transition-colors shadow-xs flex-shrink-0 border border-neutral-200/60 focus:outline-none focus:ring-2 focus:ring-neutral-400"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 overscroll-contain">
          {/* Job Summary Banner */}
          <div className="bg-neutral-50 rounded-2xl p-3.5 sm:p-4 border border-neutral-200/70 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">
                {translatedServiceName}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                ✓ {t('dashboard.locationVerified', 'Location Verified')}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-neutral-700">
              <div className="flex items-center gap-1.5 truncate">
                <User className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                <span className="font-semibold">{job.clientName}</span>
              </div>

              <div className="flex items-center gap-1.5 font-bold text-[#1C516C]">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{t('dashboard.estimatedWorkTime', 'Estimated Work Time')}: {formattedEstimated}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-neutral-500 truncate pt-0.5">
              <MapPin className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" />
              <span className="truncate">{translatedAddress}</span>
            </div>
          </div>

          {/* Photo Upload / Live Camera Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-[#222222] flex items-center gap-1.5">
                  <span>{t('dashboard.uploadBeforeWorkPhoto', 'Upload Before-Work Photo')}</span>
                  <span className="text-red-500 font-bold">*</span>
                </h4>
                <p className="text-xs text-[#6B6B6B] mt-0.5">
                  {t('dashboard.beforeWorkPhotoHint', 'Take a photo of the work area before starting the job.')}
                </p>
              </div>
            </div>

            {/* Hidden File Picker Input */}
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
                      {t('dashboard.alignWorkArea', 'Align work area in frame')}
                    </span>
                  </div>

                  {/* Top Controls: Switch Camera & Cancel */}
                  <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-10 pointer-events-auto">
                    <button
                      type="button"
                      onClick={handleSwitchCamera}
                      title={t('dashboard.flipCamera', 'Flip')}
                      className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition active:scale-95 cursor-pointer border border-white/20 flex items-center gap-1 text-xs font-semibold"
                    >
                      <SwitchCamera className="w-4 h-4" />
                      <span className="hidden xs:inline">{t('dashboard.flipCamera', 'Flip')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelCamera}
                      title={t('dashboard.cancelCamera', 'Cancel')}
                      className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition active:scale-95 cursor-pointer border border-white/20"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Bottom Capture Controls Bar */}
                <div className="p-3.5 bg-neutral-950 flex items-center justify-center gap-4">
                  {/* Large Live Shutter Button */}
                  <button
                    type="button"
                    onClick={handleCapturePhoto}
                    disabled={isCapturing}
                    aria-label={t('dashboard.takePhoto', 'Take Photo')}
                    className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-4 border-white bg-red-600 hover:bg-red-500 active:scale-90 transition-all shadow-lg flex items-center justify-center cursor-pointer disabled:opacity-50"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </button>
                </div>
              </div>
            ) : !photoPreview ? (
              /* 2. STATE: NO PHOTO CAPTURED (Buttons to Take Photo or Upload) */
              <div className="border-2 border-dashed border-neutral-300 hover:border-[#A66666] bg-neutral-50/70 hover:bg-[#A66666]/5 rounded-2xl p-5 sm:p-6 text-center transition-all duration-200 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#A66666]/10 text-[#A66666] flex items-center justify-center shadow-2xs">
                  <Camera className="w-6 h-6 stroke-[2.2]" />
                </div>

                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-bold text-[#222222]">
                    {t('dashboard.captureInitialCondition', 'Capture or select initial condition photo')}
                  </p>
                  <p className="text-[11px] text-[#6B6B6B]">
                    {t('dashboard.cameraOrUploadHint', 'Live Camera or JPG/PNG (Max 10MB)')}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                  {/* Live Camera Shutter trigger */}
                  <button
                    type="button"
                    onClick={() => startLiveCamera('environment')}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#1C516C] hover:bg-[#164055] text-white shadow-2xs cursor-pointer active:scale-95 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{t('dashboard.takePhoto', 'Take Photo')}</span>
                  </button>

                  {/* Device File Picker trigger */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white hover:bg-neutral-100 text-[#222222] border border-neutral-300 shadow-2xs cursor-pointer active:scale-95 transition-all"
                  >
                    <Upload className="w-4 h-4 text-[#A66666]" />
                    <span>{t('dashboard.uploadPhoto', 'Upload Photo')}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* 3. STATE: PHOTO PREVIEW WITH ACTIONS */
              <div className="space-y-2">
                <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-neutral-900 shadow-md">
                  <img
                    src={photoPreview}
                    alt="Before-work preview"
                    className="w-full h-44 sm:h-56 object-contain bg-neutral-950"
                  />

                  {/* Top Success Badge */}
                  <div className="absolute top-2.5 left-2.5 bg-emerald-600/90 backdrop-blur-xs text-white px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t('dashboard.beforeWorkCaptured', 'Before-work photo captured')}</span>
                  </div>

                  {/* Bottom Actions Bar */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-3 flex items-center justify-between gap-2">
                    <p className="text-[11px] font-medium text-white/90 truncate max-w-[150px] sm:max-w-[200px]">
                      {photoName || 'before-work-photo.jpg'}
                    </p>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => startLiveCamera('environment')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold backdrop-blur-xs transition cursor-pointer"
                        title={t('dashboard.retakePhoto', 'Retake')}
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{t('dashboard.retakePhoto', 'Retake')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-semibold backdrop-blur-xs transition cursor-pointer"
                        title={t('dashboard.removePhoto', 'Remove')}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{t('dashboard.removePhoto', 'Remove')}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{t('dashboard.beforeWorkReady', 'Before-work photo ready for verification')}</span>
                </p>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-medium flex items-start gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p>{errorMessage}</p>
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

          {/* Start Work Button */}
          <div className="pt-2">
            <button
              type="button"
              disabled={!photoPreview || isLiveCameraActive}
              onClick={handleStart}
              className={`w-full h-13 sm:h-14 rounded-2xl font-extrabold text-sm sm:text-base transition-all duration-150 shadow-xs flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1C516C] ${
                photoPreview && !isLiveCameraActive
                  ? 'bg-[#1C516C] hover:bg-[#164055] text-white active:scale-[0.99] shadow-md hover:shadow-lg'
                  : 'bg-neutral-200 text-neutral-400 border border-neutral-300 opacity-60 cursor-not-allowed'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{t('dashboard.startWork', 'Start Work')}</span>
            </button>
            <p className="text-[11px] text-neutral-500 text-center mt-2">
              {t('dashboard.countdownNotice', 'Countdown timer will start as soon as you tap "Start Work".')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
