import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Camera, RotateCcw, AlertCircle, CheckCircle2, Upload, Sparkles, Sun, Eye } from 'lucide-react';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { AuthButton } from '../../components/auth/AuthButton';
import { SpeakerButton } from '../../components/common/SpeakerButton';
import { speakText, stopSpeech } from '../../utils/textToSpeech';
import {
  verifySelfieLiveness,
  saveSelfieVerification
} from '../../services/identityService';
import { onboardingService } from '../../services/onboardingService';

export const WorkerSelfie: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const activeLangCode = i18n.language || localStorage.getItem('workerLanguage') || 'en';
  const assistanceMode = localStorage.getItem('user_assistance_mode') || 'self';
  const isVoiceMode = assistanceMode === 'voice';

  // Video stream & preview states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | undefined>();

  // Clean up camera stream
  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    try {
      setErrorMessage(undefined);
      stopCamera();

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 640 }
          },
          audio: false
        });

        mediaStreamRef.current = stream;
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } else {
        setHasCameraPermission(false);
        setErrorMessage(t('identity.selfie.permissionDesc', { lng: activeLangCode }) || 'Camera is not supported or permission denied.');
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setHasCameraPermission(false);
      setErrorMessage(t('identity.selfie.permissionDesc', { lng: activeLangCode }) || 'Camera permission is required for live selfie. You can also upload a photo.');
    }
  }, [stopCamera, t, activeLangCode]);

  // Initialize camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Voice assistance speech on mount
  useEffect(() => {
    if (isVoiceMode) {
      const text = `${t('identity.selfie.title', { lng: activeLangCode }) || 'Live Selfie Verification'}. ${t('identity.selfie.subtitle', { lng: activeLangCode }) || 'Position your face in the center with good lighting'}.`;
      const timer = setTimeout(() => {
        speakText(text, { langCode: activeLangCode, rate: 0.9 });
      }, 400);

      return () => {
        clearTimeout(timer);
        stopSpeech();
      };
    }
  }, [isVoiceMode, activeLangCode, t]);

  // Capture Frame
  const handleCapture = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      setPhotoDataUrl(dataUrl);
      stopCamera();

      if (isVoiceMode) {
        speakText('Selfie captured. Tap confirm to verify.', { langCode: activeLangCode });
      }
    }
  };

  // Handle File Upload Fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setPhotoDataUrl(dataUrl);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  // Retake Photo
  const handleRetake = () => {
    setPhotoDataUrl(null);
    setErrorMessage(undefined);
    startCamera();
  };

  // Submit and Verify Live Selfie
  const handleVerifySelfie = async () => {
    if (!photoDataUrl) return;

    setIsVerifying(true);
    setErrorMessage(undefined);

    try {
      const result = await verifySelfieLiveness(photoDataUrl);
      saveSelfieVerification(result);
      onboardingService.updateState({ isSelfieVerified: true });
      setSuccessMessage(t('identity.selfie.verifiedSuccess', { lng: activeLangCode }) || 'Live selfie verified successfully!');

      if (isVoiceMode) {
        speakText(t('identity.selfie.verifiedSuccess', { lng: activeLangCode }) || 'Live selfie verified successfully!', { langCode: activeLangCode });
      }

      setTimeout(() => {
        navigate('/worker/categories', { replace: true });
      }, 800);
    } catch (err: any) {
      const errTxt = err.message || t('identity.selfie.errorTryAgain', { lng: activeLangCode }) || 'Could not verify selfie. Please ensure good lighting and try again.';
      setErrorMessage(errTxt);
      if (isVoiceMode) speakText(errTxt, { langCode: activeLangCode });
    } finally {
      setIsVerifying(false);
    }
  };

  const title = t('identity.selfie.title', { lng: activeLangCode }) || 'Live Selfie Verification';
  const subtitle = t('identity.selfie.subtitle', { lng: activeLangCode }) || 'Position your face clearly within the oval frame in good lighting';
  const centerInstr = t('identity.selfie.instructionCenter', { lng: activeLangCode }) || 'Center your face in the oval frame';
  const glassesInstr = t('identity.selfie.instructionNoGlasses', { lng: activeLangCode }) || 'Remove caps, sunglasses or masks';
  const captureBtnText = t('identity.selfie.captureBtn', { lng: activeLangCode }) || 'Capture Selfie';
  const retakeBtnText = t('identity.selfie.retakeBtn', { lng: activeLangCode }) || 'Retake Photo';
  const verifyBtnText = isVerifying 
    ? (t('identity.selfie.verifying', { lng: activeLangCode }) || 'Verifying Selfie...') 
    : (t('identity.selfie.submitBtn', { lng: activeLangCode }) || 'Verify & Continue');

  return (
    <AuthLayout
      progress={{
        currentStep: 2,
        step1Progress: 100,
        step2Progress: photoDataUrl ? (successMessage ? 100 : 75) : 50,
        step3Progress: 0,
      }}
    >
      <div className="space-y-5">
        {/* Header Section */}
        <div className="text-center space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#17212B]">
              {title}
            </h1>
            <SpeakerButton
              text={`${title}. ${subtitle}`}
              langCode={activeLangCode}
              size="sm"
              label="Listen instructions"
            />
          </div>
          <p className="text-sm sm:text-[15px] text-[#66737D] leading-relaxed max-w-[340px] mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Viewfinder Card */}
        <div className="bg-white rounded-2xl border border-[#D9D9D9] p-4 sm:p-5 shadow-soft space-y-4">
          {/* Camera Viewfinder Window */}
          <div className="relative w-full aspect-[4/3] max-h-[300px] rounded-2xl overflow-hidden bg-slate-950 border-2 border-[#1C516C]/20 flex flex-col items-center justify-center shadow-inner">
            {photoDataUrl ? (
              <img
                src={photoDataUrl}
                alt="Worker Selfie Preview"
                className="w-full h-full object-cover"
              />
            ) : hasCameraPermission === false ? (
              <div className="text-center p-6 space-y-3 text-slate-200">
                <div className="w-12 h-12 mx-auto rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">Camera Access Needed</p>
                  <p className="text-xs text-slate-400 max-w-[240px] mx-auto">
                    Please allow camera permission, or upload a clear photo from your device.
                  </p>
                </div>
                <div className="pt-1 flex flex-wrap gap-2 justify-center">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-3.5 py-1.5 rounded-lg bg-[#1C516C] text-white text-xs font-semibold hover:bg-[#133B50]"
                  >
                    Try Camera Again
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-lg bg-white/10 text-white text-xs font-semibold hover:bg-white/20"
                  >
                    Upload Photo
                  </button>
                </div>
              </div>
            ) : (
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

                {/* Oval Face Guide Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-40 h-52 sm:w-48 sm:h-60 border-2 border-dashed border-[#FDA649] rounded-full animate-pulse shadow-lg flex items-center justify-center">
                    <div className="w-2 h-2 bg-[#FDA649] rounded-full shadow" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Hidden File Picker Input for Fallback */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />

          {/* Guidelines Box */}
          <div className="grid grid-cols-2 gap-2 bg-[#F5F0DD]/60 border border-[#FDA649]/20 rounded-xl p-3 text-xs text-[#17212B]">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-[#FDA649] flex-shrink-0" />
              <span>{centerInstr}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#1C516C] flex-shrink-0" />
              <span>{glassesInstr}</span>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-[#953638] text-xs font-medium border border-red-200 animate-fadeIn">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 text-[#2E9B57] text-xs font-semibold border border-emerald-200 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Actions Button Group */}
          {photoDataUrl ? (
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleRetake}
                disabled={isVerifying}
                className="h-12 rounded-xl text-xs sm:text-sm font-semibold border border-[#D9D9D9] bg-white text-[#17212B] hover:bg-slate-50 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{retakeBtnText}</span>
              </button>
              <button
                type="button"
                onClick={handleVerifySelfie}
                disabled={isVerifying}
                className="h-12 rounded-xl text-xs sm:text-sm font-semibold border border-[#1C516C] bg-[#1C516C] text-white hover:bg-[#133B50] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-60"
              >
                <Sparkles className="w-4 h-4 text-[#FDA649]" />
                <span>{verifyBtnText}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <AuthButton
                type="button"
                onClick={handleCapture}
                disabled={!hasCameraPermission}
              >
                <div className="flex items-center justify-center gap-2">
                  <Camera className="w-4 h-4 text-[#FDA649]" />
                  <span>{captureBtnText}</span>
                </div>
              </AuthButton>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-11 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 bg-slate-50 text-[#66737D] hover:text-[#17212B] hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#1C516C]" />
                <span>Upload Selfie from Device</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  );
};

export default WorkerSelfie;
