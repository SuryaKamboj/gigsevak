/**
 * Mock Authentication Service for GharSaathi Worker Platform
 * 
 * Note: This is frontend-only for prototyping.
 * To integrate with real backend API in the future, replace the mock implementations
 * with actual HTTP fetch / axios calls to your authentication endpoints.
 */

import { onboardingService } from './onboardingService';

export interface WorkerUser {
  name?: string;
  phoneNumber: string;
  isVerified: boolean;
}

export const MOCK_OTP = '123456';

export interface SendOtpResponse {
  success: boolean;
  message: string;
  mockOtpHint?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  user?: WorkerUser;
}

export const authService = {
  /**
   * Request OTP for mobile number (signup or login)
   */
  async requestOtp(phoneNumber: string, _name?: string): Promise<SendOtpResponse> {
    // Simulate brief network latency for realistic UX feel
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Basic format check
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return {
        success: false,
        message: 'Enter a valid 10-digit mobile number',
      };
    }

    return {
      success: true,
      message: `OTP sent to +91 ${cleanPhone}`,
      mockOtpHint: MOCK_OTP,
    };
  },

  /**
   * Verify entered 6-digit OTP
   */
  async verifyOtp(phoneNumber: string, otp: string, name?: string): Promise<VerifyOtpResponse> {
    // Simulate brief network latency
    await new Promise((resolve) => setTimeout(resolve, 400));

    if (otp === MOCK_OTP) {
      const user: WorkerUser = {
        phoneNumber,
        name: name || 'Rajesh Kumar',
        isVerified: true,
      };

      // Authenticate with shared GigSevak backend to acquire JWT
      try {
        const { workerBackendService } = await import('./workerBackendService');
        const formattedPhone = phoneNumber.startsWith('+91') ? phoneNumber : `+91${phoneNumber.replace(/\D/g, '').slice(-10)}`;
        await workerBackendService.loginWorker(formattedPhone, name || 'Rajesh Kumar');
      } catch (err: any) {
        console.warn('[WorkerAuth] Backend auth sync warning:', err.message);
      }

      // Store in both localStorage and sessionStorage for persistence
      localStorage.setItem('gharsaathi_worker_session', JSON.stringify(user));
      sessionStorage.setItem('gharsaathi_worker_session', JSON.stringify(user));
      localStorage.setItem('user_mobile_number', phoneNumber);
      localStorage.setItem('worker_application_status', 'approved');

      return {
        success: true,
        message: 'Phone number verified successfully',
        user,
      };
    }

    return {
      success: false,
      message: 'Incorrect OTP. Please try again.',
    };
  },

  /**
   * Get currently authenticated worker session from localStorage or sessionStorage
   */
  getCurrentUser(): WorkerUser | null {
    try {
      const session = localStorage.getItem('gharsaathi_worker_session') || sessionStorage.getItem('gharsaathi_worker_session');
      if (session) return JSON.parse(session);

      const workerUserJson = localStorage.getItem('gigsevak_worker_user');
      if (workerUserJson) {
        const parsed = JSON.parse(workerUserJson);
        return {
          name: parsed.fullName || 'Rajesh Kumar',
          phoneNumber: parsed.mobileNumber || '',
          isVerified: true
        };
      }

      const phone = localStorage.getItem('user_mobile_number');
      if (phone) {
        return {
          name: 'Rajesh Kumar',
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
      const status = localStorage.getItem('worker_application_status');
      const phone = localStorage.getItem('user_mobile_number');
      return Boolean(token || session || status === 'approved' || phone);
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
