import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
  setPersistence,
  browserLocalPersistence,
  type User
} from 'firebase/auth';

/**
 * Firebase Configuration for GigSevak / GharSaathi
 * Reuses the existing Firebase project: gigseva-862fb
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyARFBf7MiFuzCSe_88izp9LwGbvNZgmXUQ',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'gigseva-862fb.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'gigseva-862fb',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'gigseva-862fb.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '544287126361',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:544287126361:web:8e9106187fa9f2ccf89248',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-VJ5N8HS6M7'
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Ensure local persistence for worker authentication sessions
try {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('[Firebase Auth] Persistence set notice:', err?.message || err);
  });
} catch { }

let recaptchaVerifier: RecaptchaVerifier | null = null;
let currentConfirmationResult: ConfirmationResult | null = null;
let isSendingOtp = false;

/**
 * Get or initialize the invisible RecaptchaVerifier.
 * The worker does NOT see or interact with an image or checkbox CAPTCHA.
 */
export function getRecaptchaVerifier(): RecaptchaVerifier {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized');
  }

  // Ensure mount container exists in DOM
  let container = document.getElementById('recaptcha-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'recaptcha-container';
    document.body.appendChild(container);
  }

  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        // Invisible app verification passed
      },
      'expired-callback': () => {
        // Response expired, reset verifier
        resetRecaptchaVerifier();
      }
    });
  }

  return recaptchaVerifier;
}

/**
 * Reset and clear any existing RecaptchaVerifier instance
 */
export function resetRecaptchaVerifier(): void {
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch (e) {
      console.warn('[Firebase Auth] RecaptchaVerifier clear notice:', e);
    }
    recaptchaVerifier = null;
  }
  const container = document.getElementById('recaptcha-container');
  if (container) {
    container.innerHTML = '';
  }
}

export function setConfirmationResult(result: ConfirmationResult | null) {
  currentConfirmationResult = result;
  if (typeof window !== 'undefined') {
    (window as any).__gigsevak_confirmation_result = result;
  }
}

export function getConfirmationResult(): ConfirmationResult | null {
  if (currentConfirmationResult) return currentConfirmationResult;
  if (typeof window !== 'undefined' && (window as any).__gigsevak_confirmation_result) {
    return (window as any).__gigsevak_confirmation_result;
  }
  return null;
}

export interface SendOtpResult {
  confirmationResult: ConfirmationResult;
  formattedNumber: string;
}

/**
 * Send real Firebase Phone OTP SMS to an Indian mobile number.
 * Normalizes input to +91XXXXXXXXXX and executes signInWithPhoneNumber with invisible reCAPTCHA.
 */
export async function sendOtpSms(phoneNumber: string): Promise<SendOtpResult> {
  const digitsOnly = phoneNumber.replace(/\D/g, '').slice(-10);
  if (digitsOnly.length !== 10) {
    throw new Error('Please enter a valid 10-digit Indian mobile number');
  }
  const formattedNumber = `+91${digitsOnly}`;

  if (isSendingOtp) {
    throw new Error('An OTP request is already in progress. Please wait a moment.');
  }

  isSendingOtp = true;
  try {
    const verifier = getRecaptchaVerifier();
    const confirmationResult = await signInWithPhoneNumber(auth, formattedNumber, verifier);
    setConfirmationResult(confirmationResult);

    return {
      confirmationResult,
      formattedNumber
    };
  } catch (err: any) {
    resetRecaptchaVerifier();
    throw formatFirebaseError(err);
  } finally {
    isSendingOtp = false;
  }
}

export interface VerifyOtpResult {
  user: User;
  idToken: string;
  phoneNumber: string;
}

/**
 * Verify OTP entered by the worker using Firebase confirmationResult.confirm(otp).
 * Returns the verified Firebase User and ID token for backend authentication.
 */
export async function verifyOtpCode(code: string): Promise<VerifyOtpResult> {
  const cleanCode = (code || '').trim();
  if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
    throw new Error('Please enter a valid 6-digit OTP code.');
  }

  const confirmation = getConfirmationResult();
  if (!confirmation || typeof confirmation.confirm !== 'function') {
    throw new Error('No active OTP verification session found. Please click "Resend OTP" to request a new code.');
  }

  try {
    const userCredential = await confirmation.confirm(cleanCode);
    const user = userCredential.user;
    const idToken = await user.getIdToken();
    const phoneNumber = user.phoneNumber || '';

    return {
      user,
      idToken,
      phoneNumber
    };
  } catch (err: any) {
    throw formatFirebaseError(err);
  }
}

/**
 * Map Firebase error codes to user-friendly UI messages
 */
export function formatFirebaseError(err: any): Error {
  const code = err?.code || '';
  let message = err?.message || 'An unexpected authentication error occurred.';

  switch (code) {
    case 'auth/invalid-phone-number':
      message = 'Invalid mobile number format. Please enter a valid 10-digit Indian phone number.';
      break;
    case 'auth/missing-phone-number':
      message = 'Please enter your 10-digit mobile number.';
      break;
    case 'auth/quota-exceeded':
      message = 'Daily SMS verification quota has been reached. Please try again later or contact support.';
      break;
    case 'auth/too-many-requests':
      message = 'Too many attempts from this device. Please wait a few minutes before trying again.';
      break;
    case 'auth/captcha-check-failed':
      message = 'Security verification failed. Please refresh the page and try again.';
      break;
    case 'auth/app-not-authorized':
      message = 'This application domain is not authorized in Firebase Console. Please verify authorized domains.';
      break;
    case 'auth/invalid-verification-code':
      message = 'Incorrect OTP entered. Please check the 6-digit code received on your phone and try again.';
      break;
    case 'auth/code-expired':
      message = 'The OTP code has expired. Please click "Resend OTP" to receive a new code.';
      break;
    case 'auth/network-request-failed':
      message = 'Network connection error. Please check your internet connection and try again.';
      break;
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      message = 'Verification was cancelled. Please try again.';
      break;
    default:
      if (err?.message?.toLowerCase().includes('recaptcha')) {
        message = 'Security check verification failed. Please refresh the page and try again.';
      }
      break;
  }

  const customError = new Error(message) as any;
  customError.code = code;
  customError.originalError = err;
  return customError;
}
