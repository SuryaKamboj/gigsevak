import api from './api';

export interface WorkerJob {
  _id: string;
  bookingCode: string;
  status: string;
  serviceId?: {
    name: string;
    category: string;
  };
  userId?: {
    fullName: string;
    mobileNumber: string;
  };
  serviceAddress?: {
    addressLine1: string;
    city: string;
    pincode: string;
  };
  scheduledStartTime: string;
  pricing?: {
    totalAmount: number;
    workerPayoutAmount: number;
    materialAmount: number;
  };
  materialRequests?: Array<{
    requestId: string;
    claimedAmount: number;
    description: string;
    status: string;
  }>;
}

export const workerBackendService = {
  /**
   * Authenticate worker and store JWT token
   */
  async loginWorker(mobileNumber: string, fullName = 'Worker') {
    const res = await api.post('/auth/verify-otp', {
      mobileNumber,
      role: 'WORKER',
      fullName
    });

    const token = res?.data?.accessToken || res?.accessToken;
    const user = res?.data?.user || res?.user;

    if (token) {
      localStorage.setItem('gigsevak_token', token);
      sessionStorage.setItem('gigsevak_token', token);
      if (user) {
        localStorage.setItem('gigsevak_worker_user', JSON.stringify(user));
      }
      localStorage.setItem('user_mobile_number', mobileNumber);
    }
    return res?.data || res;
  },

  /**
   * Get worker profile & KYC info
   */
  async getProfile() {
    const res = await api.get('/workers/me');
    return res.data;
  },

  /**
   * Update complete worker profile details in MongoDB
   */
  async updateProfile(profileData: any) {
    const res = await api.put('/workers/me', profileData);
    return res.data;
  },

  /**
   * Update worker status & online toggle
   */
  async updateAvailability(isOnline: boolean, availabilityStatus?: string) {
    const res = await api.put('/workers/me/availability', { isOnline, availabilityStatus });
    return res.data;
  },

  /**
   * Update worker location
   */
  async updateLocation(latitude: number, longitude: number) {
    const res = await api.put('/workers/me/location', { latitude, longitude });
    return res.data;
  },

  /**
   * Submit KYC details
   */
  async submitKyc(kycData: any) {
    const res = await api.post('/workers/me/kyc', kycData);
    return res.data;
  },

  /**
   * Submit complete onboarding application (Aadhaar, selfie, skills, location)
   */
  async submitOnboardingApplication(data: {
    fullName?: string;
    aadhaarNumber?: string;
    aadhaarVerified?: boolean;
    selfieUrl?: string;
    skills?: string[];
    primaryServiceCategory?: string;
    location?: { latitude: number; longitude: number; name?: string };
    serviceArea?: string;
    addressLine?: string;
  }) {
    const res = await api.post('/workers/me/onboarding', data);
    return res.data;
  },

  /**
   * List jobs assigned or offered to worker
   */
  async getJobs(status?: string): Promise<WorkerJob[]> {
    const query = status ? `?status=${status}` : '';
    const res = await api.get(`/workers/me/jobs${query}`);
    return res.data || [];
  },

  /**
   * Accept job offer
   */
  async acceptJob(bookingId: string) {
    const res = await api.post(`/bookings/${bookingId}/accept`);
    return res.data;
  },

  /**
   * Decline job offer
   */
  async declineJob(bookingId: string, reason?: string) {
    const res = await api.post(`/bookings/${bookingId}/decline`, { reason });
    return res.data;
  },

  /**
   * Mark en-route to customer
   */
  async markInTransit(bookingId: string) {
    const res = await api.post(`/bookings/${bookingId}/in-transit`);
    return res.data;
  },

  /**
   * Mark arrived at customer location
   */
  async markArrived(bookingId: string) {
    const res = await api.post(`/bookings/${bookingId}/arrived`);
    return res.data;
  },

  /**
   * Start job using customer's 4-digit OTP
   */
  async startJobWithOtp(bookingId: string, otp: string) {
    const res = await api.post(`/bookings/${bookingId}/start-job`, { otp });
    return res.data;
  },

  /**
   * Submit extra material claim
   */
  async submitMaterialRequest(bookingId: string, claimedAmount: number, description: string) {
    const res = await api.post(`/bookings/${bookingId}/material-request`, {
      claimedAmount,
      description
    });
    return res.data;
  },

  /**
   * Worker clicks "Complete Job" → backend generates PIN, sets COMPLETION_PENDING
   */
  async completeJob(bookingId: string) {
    const res = await api.post(`/bookings/${bookingId}/complete`);
    return res.data;
  },

  /**
   * Worker submits the 4-digit PIN they received verbally from the customer.
   * Backend verifies against stored HMAC hash → sets COMPLETED in MongoDB.
   */
  async verifyCompletionPin(bookingId: string, pin: string) {
    const res = await api.post(`/bookings/${bookingId}/verify-completion`, { pin });
    return res.data;
  }
};

export default workerBackendService;
