/**
 * ============================================================
 * DEMO OTP AUTHENTICATION SERVICE — GigSevak Worker Platform
 * ============================================================
 *
 * ⚠️  THIS IS NOT REAL AUTHENTICATION ⚠️
 *
 * This module replaces Firebase Phone Auth with a fixed demo OTP
 * for DEVELOPMENT / DEMO purposes only.
 *
 * The accepted OTP is hardcoded as: 123456
 *
 * This bypass is ONLY active when the environment flag
 *   VITE_DEMO_OTP_AUTH=true
 * is set. When that flag is absent or false, verifyOtpCode()
 * will throw an error and the bypass cannot be used.
 *
 * DO NOT deploy with VITE_DEMO_OTP_AUTH=true in production.
 * ============================================================
 */

// ---------------------------------------------------------------------------
// Internal state: last phone number that "sent" an OTP in this session
// ---------------------------------------------------------------------------
let _pendingPhone: string | null = null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalise an Indian mobile number to +91XXXXXXXXXX.
 * Accepts raw 10-digit strings or numbers already prefixed with +91 / 91.
 * Throws a user-friendly Error if the number is invalid.
 */
function normaliseIndianPhone(phoneNumber: string): string {
  const digitsOnly = phoneNumber.replace(/\D/g, '').slice(-10);
  if (digitsOnly.length !== 10) {
    throw new Error('Please enter a valid 10-digit Indian mobile number');
  }
  if (!/^[6-9]/.test(digitsOnly)) {
    throw new Error('Please enter a valid 10-digit Indian mobile number');
  }
  return `+91${digitsOnly}`;
}

// ---------------------------------------------------------------------------
// Public types (mirror firebaseAuth.ts shapes so callers need no changes)
// ---------------------------------------------------------------------------

export interface SendOtpResult {
  /** Always a placeholder in demo mode — no real confirmationResult exists */
  confirmationResult: null;
  formattedNumber: string;
}

export interface VerifyOtpResult {
  /** Placeholder user — no real Firebase User object */
  user: null;
  /**
   * Empty string — no Firebase ID token is generated.
   * The backend loginWorker() call is still made; pass undefined/'' as the token.
   */
  idToken: '';
  phoneNumber: string;
}

// ---------------------------------------------------------------------------
// sendOtpSms — DEMO implementation
// ---------------------------------------------------------------------------

/**
 * DEMO: Simulates sending an OTP SMS without actually sending one.
 *
 * - Validates the phone number format.
 * - Stores the normalised number for later verification.
 * - Does NOT send any SMS or make any network call.
 *
 * @param phoneNumber  Raw phone string (10 digits or +91XXXXXXXXXX)
 * @returns            Resolved SendOtpResult with the formatted number
 */
export async function sendOtpSms(phoneNumber: string): Promise<SendOtpResult> {
  const formattedNumber = normaliseIndianPhone(phoneNumber);

  // Store for session so verifyOtpCode can confirm the same session
  _pendingPhone = formattedNumber;

  // Tiny artificial delay so loading spinners behave naturally in the UI
  await new Promise((resolve) => setTimeout(resolve, 400));

  return {
    confirmationResult: null,
    formattedNumber,
  };
}

// ---------------------------------------------------------------------------
// verifyOtpCode — DEMO implementation
// ---------------------------------------------------------------------------

/**
 * DEMO: Verifies the entered OTP code against the fixed demo OTP.
 *
 * Accepted OTP: 123456  (ONLY when VITE_DEMO_OTP_AUTH=true)
 *
 * ⚠️  This function MUST NOT succeed unless VITE_DEMO_OTP_AUTH === 'true'.
 *     This ensures the bypass cannot remain silently active in production builds.
 *
 * @param code  6-digit OTP string entered by the worker
 * @returns     Resolved VerifyOtpResult on success
 * @throws      Error with a user-friendly message on failure
 */
export async function verifyOtpCode(code: string): Promise<VerifyOtpResult> {
  // ── Safety gate: demo mode must be explicitly enabled ──────────────────
  const isDemoAuth = import.meta.env.VITE_DEMO_OTP_AUTH === 'true';
  if (!isDemoAuth) {
    throw new Error(
      'OTP verification is not configured. Please contact support.'
    );
  }

  // ── Basic format validation ─────────────────────────────────────────────
  const cleanCode = (code || '').trim();
  if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
    throw new Error('Please enter a valid 6-digit OTP code.');
  }

  // ── Session guard: must have called sendOtpSms first ───────────────────
  if (!_pendingPhone) {
    throw new Error(
      'No active OTP session found. Please click "Resend OTP" to request a new code.'
    );
  }

  // Tiny artificial delay so loading spinners behave naturally in the UI
  await new Promise((resolve) => setTimeout(resolve, 400));

  // ── DEMO OTP check ──────────────────────────────────────────────────────
  // IMPORTANT: 123456 is a fixed demo OTP and is NOT secure authentication.
  const DEMO_OTP = '123456';
  if (cleanCode !== DEMO_OTP) {
    throw new Error('Invalid OTP. Please enter the demo OTP: 123456');
  }

  const phoneNumber = _pendingPhone;
  // Clear session after successful verification
  _pendingPhone = null;

  return {
    user: null,
    idToken: '',   // No Firebase token in demo mode
    phoneNumber,
  };
}
