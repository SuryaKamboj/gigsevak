/**
 * OTP Authentication Service — GigSevak Worker Platform
 *
 * Simple skeleton OTP flow for demo/development.
 * No third-party auth provider is used.
 *
 * Accepted OTP: 123456 (fixed, for demo purposes only)
 */

// Last phone number that requested an OTP in this session
let _pendingPhone: string | null = null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normaliseIndianPhone(phoneNumber: string): string {
  const digitsOnly = phoneNumber.replace(/\D/g, '').slice(-10);
  if (digitsOnly.length !== 10 || !/^[6-9]/.test(digitsOnly)) {
    throw new Error('Please enter a valid 10-digit Indian mobile number');
  }
  return `+91${digitsOnly}`;
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface SendOtpResult {
  confirmationResult: null;
  formattedNumber: string;
}

export interface VerifyOtpResult {
  user: null;
  idToken: '';
  phoneNumber: string;
}

// ---------------------------------------------------------------------------
// sendOtpSms
// ---------------------------------------------------------------------------

/**
 * Simulates sending an OTP.
 * No SMS is sent — this is a demo skeleton only.
 */
export async function sendOtpSms(phoneNumber: string): Promise<SendOtpResult> {
  const formattedNumber = normaliseIndianPhone(phoneNumber);
  _pendingPhone = formattedNumber;

  // Small delay so UI loading states feel natural
  await new Promise((resolve) => setTimeout(resolve, 400));

  return { confirmationResult: null, formattedNumber };
}

// ---------------------------------------------------------------------------
// verifyOtpCode
// ---------------------------------------------------------------------------

/**
 * Verifies the OTP entered by the worker.
 * Accepted OTP: 123456 (demo skeleton — NOT real authentication)
 */
export async function verifyOtpCode(code: string): Promise<VerifyOtpResult> {
  const cleanCode = (code || '').trim();

  if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
    throw new Error('Please enter a valid 6-digit OTP.');
  }

  if (!_pendingPhone) {
    throw new Error('No active OTP session. Please click "Resend OTP".');
  }

  await new Promise((resolve) => setTimeout(resolve, 400));

  // Demo OTP — 123456 is the only accepted code
  if (cleanCode !== '123456') {
    throw new Error('Invalid OTP. Please try again.');
  }

  const phoneNumber = _pendingPhone;
  _pendingPhone = null;

  return { user: null, idToken: '', phoneNumber };
}
