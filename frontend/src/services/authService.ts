/**
 * Authentication Service — GigSevak Worker Platform
 *
 * Simple skeleton OTP auth. No third-party provider.
 * OTP is fixed at 123456 for demo/development.
 */

import { onboardingService } from './onboardingService';
import { sendOtpSms, verifyOtpCode } from './demoOtpAuth';

export interface WorkerUser {
  name?: string;
  phoneNumber: string;
  isVerified: boolean;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  user?: WorkerUser;
}

export const authService = {
  /**
   * Request OTP for a mobile number (demo skeleton — no SMS sent)
   */
  async requestOtp(phoneNumber: string, _name?: string): Promise<SendOtpResponse> {
    const cleanDigits = phoneNumber.replace(/\D/g, '').slice(-10);
    if (cleanDigits.length !== 10) {
      return {
        success: false,
        message: 'Enter a valid 10-digit mobile number',
      };
    }

    try {
      const res = await sendOtpSms(`+91${cleanDigits}`);
      return {
        success: true,
        message: `OTP sent to ${res.formattedNumber}`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Failed to send OTP via SMS.',
      };
    }
  },

  /**
   * Verify entered 6-digit OTP (demo skeleton — accepts 123456)
   */
  async verifyOtp(phoneNumber: string, otp: string, name?: string): Promise<VerifyOtpResponse> {
    try {
      const result = await verifyOtpCode(otp);
      let resolvedName = name || '';
      let isWorkerApproved = false;

      // Sync with backend using phone number
      try {
        const { workerBackendService } = await import('./workerBackendService');
        const cleanDigits = phoneNumber.replace(/\D/g, '').slice(-10);
        const formattedPhone = `+91${cleanDigits}`;
        const loginRes = await workerBackendService.loginWorker(formattedPhone, name);
        if (loginRes?.user?.fullName) {
          resolvedName = loginRes.user.fullName;
        }
        if (loginRes?.user?.kycVerificationStatus === 'VERIFIED') {
          isWorkerApproved = true;
        }
      } catch (err: any) {
        console.warn('[WorkerAuth] Backend auth sync warning:', err.message);
      }

      const user: WorkerUser = {
        phoneNumber: result.phoneNumber || phoneNumber,
        name: resolvedName,
        isVerified: true,
      };

      // Store in both localStorage and sessionStorage for persistence
      localStorage.setItem('gharsaathi_worker_session', JSON.stringify(user));
      sessionStorage.setItem('gharsaathi_worker_session', JSON.stringify(user));
      localStorage.setItem('user_mobile_number', user.phoneNumber);
      localStorage.setItem('worker_application_status', isWorkerApproved ? 'approved' : 'pending');

      return {
        success: true,
        message: 'Phone number verified successfully',
        user,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Incorrect OTP. Please try again.',
      };
    }
  },

  /**
   * Get currently authenticated worker session from localStorage or sessionStorage
   */
  getCurrentUser(): WorkerUser | null {
    try {
      const workerUserJson = localStorage.getItem('gigsevak_worker_user');
      if (workerUserJson) {
        const parsed = JSON.parse(workerUserJson);
        if (parsed?.fullName) {
          return {
            name: parsed.fullName,
            phoneNumber: parsed.mobileNumber || '',
            isVerified: true
          };
        }
      }

      const session = localStorage.getItem('gharsaathi_worker_session') || sessionStorage.getItem('gharsaathi_worker_session');
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed?.phoneNumber) {
          return parsed;
        }
      }

      const phone = localStorage.getItem('user_mobile_number');
      if (phone) {
        return {
          phoneNumber: phone,
          isVerified: true
        };
      }

      return null;
    } catch {
      return null;
    }
  },

  /**
   * Check if worker is currently authenticated and has an active session
   */
  isAuthenticated(): boolean {
    try {
      const token = localStorage.getItem('gigsevak_token') || sessionStorage.getItem('gigsevak_token');
      const session = localStorage.getItem('gharsaathi_worker_session') || sessionStorage.getItem('gharsaathi_worker_session');
      const phone = localStorage.getItem('user_mobile_number');
      const workerUser = localStorage.getItem('gigsevak_worker_user');
      return Boolean(token || phone || session || workerUser);
    } catch {
      return false;
    }
  },

  /**
   * Log out current session and clear stored credentials
   */
  logout(): void {
    try {
      localStorage.removeItem('gharsaathi_worker_session');
      localStorage.removeItem('gigsevak_token');
      localStorage.removeItem('gigsevak_worker_user');
      localStorage.removeItem('worker_application_status');
      localStorage.removeItem('user_mobile_number');
      localStorage.removeItem('user_assistance_mode');
      localStorage.removeItem('gigsevak_onboarding_state');
      localStorage.removeItem('gigsevak_identity_status');
      localStorage.removeItem('workerLanguage');
      localStorage.removeItem('user_selected_language');
      localStorage.removeItem('gigsevak_worker_categories');
      localStorage.removeItem('gigsevak_worker_location');
      localStorage.removeItem('gigsevak_account_worker');
      sessionStorage.clear();
      onboardingService.reset();
    } catch (e) {
      console.warn('Worker logout cleanup error:', e);
    }
  },
};
