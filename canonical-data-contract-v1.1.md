# Canonical Data Contract v1.1 (Reconciled Authoritative Specification)

**Document:** `canonical-data-contract-v1.1.md`  
**Platform:** GigSevak Cooperative Gig Platform  
**Target Applications:** `user-frontend`, `worker-frontend`, `admin-frontend`, and Shared Express/MongoDB Backend  
**Status:** Canonical Source of Truth — Reconciled v1.1  
**Date:** September 10, 2026  
**Supersedes:** `canonical-data-contract-v1.md`

**Summary of v1.1 changes from v1.0:**
- Worker pricing: Removed `pricing.{hourlyRate, baseVisitFee, minimumBillableHours}`; added `experienceTier`
- Region: Added `federationId`
- Booking: Removed `materialDetails`; added `materialRequests[]`; removed `DECLINED` from status enum; added `bookingType`, `reallocationCount`, `declinedWorkerIds`
- Review: Added `tags: CanonicalReviewTag[]`
- WorkerPrivate: Added `dateOfBirth`, `insurance`, `schedulePreferences`, `earnings`
- TrackingEvent: Added `isDelayed: boolean`
- Financial formula: Fully specified in Section 1.3

---

## 1. Global Architectural & Schema Conventions

### 1.1 Stable Identifier Conventions
All inter-entity relationships and foreign keys MUST use strictly standardized, stable ID fields. MongoDB `_id` values are 24-character hexadecimal `ObjectId` strings.

| Field Name | References |
|---|---|
| `userId` | `User._id` |
| `workerId` | `Worker._id` |
| `federationId` | `Federation._id` |
| `societyId` | `Society._id` (used on Worker for cooperative membership) |
| `servicingSocietyId` | `Society._id` of the cooperative employing the assigned worker (on Booking) |
| `referringSocietyId` | `Society._id` of the originating cooperative (on Booking, if cross-society pooled) |
| `regionId` | `Region._id` |
| `serviceId` | `Service._id` |
| `bookingId` | `Booking._id` |
| `reviewId` | `Review._id` |
| `complaintId` | `Complaint._id` |
| `paymentId` | `Payment._id` |

> [!IMPORTANT]
> `societyId` on the `Worker` entity means the worker's cooperative membership society. On `Booking`, `servicingSocietyId` and `referringSocietyId` are used — never plain `societyId`. This distinction is critical for cooperative pooling financial routing.

### 1.2 Geospatial Coordinate Standard (Strict GeoJSON)
All geographic positions MUST strictly adhere to GeoJSON RFC 7946:

```json
{ "type": "Point", "coordinates": [75.5762, 31.3260] }
```

> [!CAUTION]
> **CRITICAL RULE:** `coordinates` MUST ALWAYS be `[longitude, latitude]`. Never invert to `[latitude, longitude]`. All coordinate arrays must pass this validation:
> ```
> coords[0] ∈ [-180, 180]  (longitude)
> coords[1] ∈ [-90, 90]    (latitude)
> ```

### 1.3 Authoritative Pricing Formula

This formula is the single source of truth. No other document may define a different calculation.

**Inputs:**
- `S` = `Service.baseLaborPrice` — cooperative rate card in INR
- `E` = `ExperienceTierMultiplier` — cooperative-approved per worker (`STANDARD`=1.00, `SENIOR`=1.15, `MASTER`=1.25)
- `D` = `Region.demandMultiplier` — adjustable by Federation Admin (default: 1.0)
- `M` = Sum of all `APPROVED` `materialRequests[].claimedAmount`
- `X` = `additionalCharges` — admin-approved scope expansions (default: 0)
- `T` = `taxRate` — Federation-configured per `Federation.taxRatePercent` / 100

> [!WARNING]
> **TAX ASSUMPTION:** The default `taxRate` for the Punjab pilot is **18% GST**. This is an architectural assumption only — NOT legally verified. If GigSevak cooperative services qualify for GST exemption under agricultural or cooperative exemptions, `taxRate = 0`. Legal verification is required before production launch (**Open Decision OD-01**).

**Step-by-step calculation (all monetary values in INR, truncated to 2 decimal places):**

```
STEP 1: baseLaborAmount     = floor(S × E × D × 100) / 100
STEP 2: materialAmount      = M  (NOT taxed — direct cost reimbursement)
STEP 3: additionalCharges   = X
STEP 4: taxableBase         = baseLaborAmount + additionalCharges
STEP 5: taxAmount           = floor(taxableBase × T × 100) / 100
STEP 6: platformFee         = floor(baseLaborAmount × 0.05 × 100) / 100
STEP 7: totalAmount         = baseLaborAmount + materialAmount + additionalCharges
                              + taxAmount + platformFee

STEP 8: laborNet            = baseLaborAmount + additionalCharges

  If referringSocietyId = null (non-pooled, same society):
    workerPayoutAmount      = floor(laborNet × 0.85 × 100) / 100 + materialAmount
    servicingSocietyAmount  = floor(laborNet × 0.10 × 100) / 100
    referringSocietyAmount  = 0.00
    platformReserveAmount   = floor(laborNet × 0.05 × 100) / 100

  If referringSocietyId ≠ null (cross-society pooled booking):
    workerPayoutAmount      = floor(laborNet × 0.85 × 100) / 100 + materialAmount
    servicingSocietyAmount  = floor(laborNet × 0.09 × 100) / 100
    referringSocietyAmount  = floor(laborNet × 0.01 × 100) / 100
    platformReserveAmount   = floor(laborNet × 0.05 × 100) / 100

INVARIANT ASSERTION (backend must validate before saving):
  workerPayoutAmount + servicingSocietyAmount + referringSocietyAmount
  + platformReserveAmount + taxAmount + platformFee
  MUST equal totalAmount (±1 paise tolerance for floating point truncation)
```

### 1.4 Experience Tier Multipliers
Cooperative-approved labor multipliers, set by `SOCIETY_ADMIN` per worker:

| Tier | Multiplier | Approval |
|---|---|---|
| `STANDARD` | 1.00× | Default for all new members |
| `SENIOR` | 1.15× | Requires 50+ completed jobs + Society Admin approval |
| `MASTER` | 1.25× | Requires 200+ completed jobs + ITI/govt cert + Federation Admin approval |

### 1.5 Global Enums

```typescript
export type ServiceCategory =
  | 'PLUMBING' | 'ELECTRICAL' | 'CARPENTRY' | 'CLEANING'
  | 'PAINTING' | 'APPLIANCE_REPAIR' | 'MASONRY' | 'GARDENING' | 'OTHER';

export type CanonicalReviewTag =
  | 'PUNCTUAL'         // Positive: arrived on time
  | 'CLEAN_WORK'       // Positive: tidy workmanship
  | 'EXPERT_DIAGNOSIS' // Positive: correctly identified root cause
  | 'FAIR_PRICING'     // Positive: transparent and honest billing
  | 'POLITE_BEHAVIOR'  // Positive: respectful interaction
  | 'SAFETY_CONSCIOUS' // Positive: followed safety protocols
  | 'LATE_ARRIVAL'     // Negative: arrived after scheduled time
  | 'MESSY_WORK'       // Negative: left site in poor condition
  | 'OVERCHARGING'     // Negative: attempted to bill beyond approved amount
  | 'UNPROFESSIONAL';  // Negative: rude or inappropriate behavior

export type BookingType = 'STANDARD' | 'EMERGENCY_SOS' | 'COMMUNITY_POOL' | 'VOICE_BOOKING';
// NOTE: VOICE_BOOKING is reserved for future phone-agent-initiated bookings. Not implemented in v1 backend.

export type ExperienceTier = 'STANDARD' | 'SENIOR' | 'MASTER';
```

---

## 2. Canonical Entities Specification

### 2.1 Entity 1: `User` (Customer & Common Identity)

```typescript
export interface User {
  _id: string;
  mobileNumber: string;                // +91 E.164 format (Unique index)
  email?: string;
  fullName: string;
  role: 'CUSTOMER' | 'WORKER' | 'SOCIETY_ADMIN' | 'FEDERATION_ADMIN' | 'SYSTEM_ADMIN';
  languagePreference: 'en' | 'pa' | 'hi';  // Default: 'pa' (Punjab pilot)
  avatarUrl?: string;
  isBlocked: boolean;
  addresses: Array<{
    addressId: string;                 // UUID v4
    label: 'HOME' | 'WORK' | 'OTHER';
    addressLine1: string;
    addressLine2?: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
    location: { type: 'Point'; coordinates: [number, number]; };  // [lng, lat]
    isDefault: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 2.2 Entity 2: `Worker` (Public & Operational Profile)

> [!NOTE]
> **v1.1 change:** `pricing.{hourlyRate, baseVisitFee, minimumBillableHours}` removed. `experienceTier` added. Pricing is now computed from `Service.baseLaborPrice × ExperienceTierMultiplier × Region.demandMultiplier`. Workers do NOT set their own customer-facing rates.

```typescript
export interface Worker {
  _id: string;
  userId: string;                      // Ref → User._id (1:1)
  workerCode: string;                  // e.g. "PB-JAL-PLM-0104" (Unique index)
  societyId: string;                   // Ref → Society._id (Cooperative membership)
  federationId: string;                // Ref → Federation._id
  primaryRegionId: string;             // Ref → Region._id
  operatingRegionIds: string[];        // Ref → Region._id[] (authorized service areas)

  // Public identity
  fullName: string;
  avatarUrl?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';  // Open Decision OD-02: may move to WorkerPrivate
  languagesSpoken: string[];           // ['pa', 'hi', 'en']

  // Professional competency
  primaryServiceCategory: ServiceCategory;
  experienceTier: ExperienceTier;      // Cooperative-approved tier (replaces hourlyRate)
  skills: Array<{
    serviceId: string;                 // Ref → Service._id
    category: ServiceCategory;
    experienceYears: number;
    certificateNumber?: string;
    isCertified: boolean;
  }>;

  // Operational status
  availabilityStatus: 'AVAILABLE' | 'ON_JOB' | 'OFF_DUTY' | 'SUSPENDED';
  isOnline: boolean;
  lastActiveAt: Date;
  currentLocation?: { type: 'Point'; coordinates: [number, number]; };

  // Cooperative standing
  kycVerificationStatus: 'PENDING' | 'IN_REVIEW' | 'VERIFIED' | 'REJECTED';
  membershipStatus: 'APPLICANT' | 'ACTIVE_MEMBER' | 'PROBATIONARY' | 'SUSPENDED';
  shareholderFolioNumber?: string;

  // Aggregated metrics (denormalized from TrustScore + bookings)
  metrics: {
    averageRating: number;             // 1.0 – 5.0
    reviewCount: number;
    completedJobsCount: number;
    acceptanceRate: number;            // 0 – 100
    cancellationRate: number;          // 0 – 100
    trustScore: number;                // 0 – 100 (copy from TrustScore.currentScore)
  };

  createdAt: Date;
  updatedAt: Date;
}
```

---

### 2.3 Entity 3: `WorkerPrivate` (Confidential PII & KYC)

Segregated collection. Access is strictly role-gated per RBAC Tier rules.

> [!NOTE]
> **v1.1 change:** Added `dateOfBirth`, `insurance`, `schedulePreferences`, `earnings` (referenced by RBAC but missing from v1.0 schema).

```typescript
export interface WorkerPrivate {
  _id: string;
  workerId: string;                    // Ref → Worker._id (1:1 Unique index)
  userId: string;                      // Ref → User._id

  // --- TIER 3 (Society Admin accessible, masked) ---

  dateOfBirth: Date;                   // For age verification (>= 18)
  // gender is currently in Worker (public) — see Open Decision OD-02

  // Masked contact (full number accessible to Worker + System Admin only)
  mobileNumberFull: string;            // Full E.164 number (System Admin / Worker only)
  mobileNumberMasked: string;          // "+91 XXXXXX4210" (Society Admin view)

  // KYC documents
  aadhaarNumberMasked: string;         // "XXXX-XXXX-1234" (Society Admin view)
  aadhaarFrontDocUrl: string;          // Pre-signed URL (Society Admin view)
  aadhaarBackDocUrl: string;
  policeClearanceCertUrl?: string;

  // Insurance
  insurance?: {
    provider: string;
    policyNumber: string;
    coverageType: string;
    expiresAt: Date;
  };

  // Schedule preferences (informational, for dispatch optimization)
  schedulePreferences?: {
    preferredWorkingDays: Array<'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'>;
    preferredStartTime: string;        // HH:MM (24h)
    preferredEndTime: string;
    maxDailyJobs: number;
  };

  // Earnings history (cooperative dividend audit trail, not bank account)
  earnings?: {
    totalLifetimeEarnings: number;     // INR (Society Admin may view for compliance)
    currentMonthEarnings: number;
    lastSettlementDate: Date;
  };

  // Verification audit trail
  verificationAudit: {
    verifiedByAdminId?: string;        // Ref → User._id (Society Admin)
    verifiedAt?: Date;
    rejectionReason?: string;
    notes?: string;
  };

  // --- TIER 4 (Worker + System Admin only) ---

  aadhaarVerificationHash: string;     // SHA-256(raw Aadhaar) — duplicate detection only
  panNumber: string;
  bankAccount: {
    accountHolderName: string;
    accountNumberEncrypted: string;    // AES-256 encrypted
    accountNumberMasked: string;       // "XXXX XXXX 4829" (Society Admin view for payout confirmation)
    ifscCode: string;
    bankName: string;
    branchName: string;
    payoutMode: 'NEFT' | 'IMPS' | 'UPI';
    upiId?: string;
    isVerified: boolean;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    mobileNumber: string;              // Tier 4 — not visible to Society Admin
  };

  createdAt: Date;
  updatedAt: Date;
}
```

---

### 2.4 Entity 4: `Federation` (Apex Cooperative Body)

> [!NOTE]
> **v1.1 change:** Added `taxRatePercent` (configurable per federation, replaces hardcoded 18% assumption).

```typescript
export interface Federation {
  _id: string;
  federationCode: string;              // "PB-FED-01"
  name: string;
  state: string;
  registrationNumber: string;
  registeredOfficeAddress: string;
  contactEmail: string;
  contactPhone: string;
  platformSplitRatio: {
    workerSharePercent: number;        // Default: 85
    societySharePercent: number;       // Default: 10 (9 if pooled)
    referringSocietySharePercent: number; // Default: 0 (1 if pooled)
    federationSharePercent: number;    // Default: 5
  };
  taxRatePercent: number;              // Default assumption: 18 (OD-01: requires legal verification)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 2.5 Entity 5: `Society` (Primary Cooperative Unit / PACS)

```typescript
export interface Society {
  _id: string;
  federationId: string;                // Ref → Federation._id
  societyCode: string;                 // "SOC-PB-JAL-04"
  name: string;
  registrationNumber: string;
  primaryRegionId: string;             // Ref → Region._id (main operating region)
  jurisdictionRegionIds: string[];     // Ref → Region._id[] (all authorized regions)

  officeAddress: {
    street: string; city: string; district: string; state: string; pincode: string;
  };
  officeLocation: { type: 'Point'; coordinates: [number, number]; };  // [lng, lat]

  contactPerson: {
    name: string; designation: string; phone: string; email: string;
  };

  bankDetails: {
    accountNumber: string; ifscCode: string; bankName: string;
  };

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 2.6 Entity 6: `Region` (Geographic Operational Boundary)

> [!NOTE]
> **v1.1 change:** Added `federationId`. A Region belongs to exactly one Federation. Multiple Societies may serve the same Region (via `Society.jurisdictionRegionIds`).

```typescript
export interface Region {
  _id: string;
  regionCode: string;                  // "PUN-JAL-01"
  federationId: string;                // Ref → Federation._id (ADDED IN v1.1)
  name: string;
  state: string;
  district: string;
  boundary: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];  // GeoJSON
  };
  centerPoint: { type: 'Point'; coordinates: [number, number]; };  // [lng, lat]
  demandMultiplier: number;            // 1.0 default; adjustable by Federation Admin
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 2.7 Entity 7: `Service` (Cooperative Trade Catalog)

```typescript
export interface Service {
  _id: string;
  serviceCode: string;                 // "SRV-PLM-LEAK-01"
  category: ServiceCategory;
  title: { en: string; pa: string; hi: string; };
  description: { en: string; pa: string; hi: string; };
  iconUrl: string;
  imageUrl: string;
  baseLaborPrice: number;              // Authoritative cooperative rate in INR (STANDARD tier, D=1.0)
  baseEstimatedMinutes: number;
  allowedAddons: Array<{
    addonId: string;
    title: { en: string; pa: string; hi: string; };
    price: number;
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 2.8 Entity 8: `Booking` (Central Transaction Lifecycle)

> [!NOTE]
> **v1.1 changes:**
> - Added `bookingType`
> - Removed `DECLINED` from status enum (`DECLINED` is a dispatch event, not a booking state)
> - Added `reallocationCount` and `declinedWorkerIds`
> - Replaced single `materialDetails` sub-document with `materialRequests[]` array
> - Added `dispatchLog[]` for audit trail

```typescript
export interface MaterialRequest {
  requestId: string;                   // UUID v4
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  claimedAmount: number;               // INR
  description: string;
  receiptImageUrl?: string;
  requestedAt: Date;
  resolvedAt?: Date;
}

export interface CanonicalPricingBreakdown {
  baseLaborAmount: number;
  materialAmount: number;              // Sum of APPROVED materialRequests
  additionalCharges: number;
  platformFee: number;
  taxAmount: number;
  totalAmount: number;
  workerPayoutAmount: number;
  servicingSocietyAmount: number;
  referringSocietyAmount: number;
  platformReserveAmount: number;
}

export interface Booking {
  _id: string;
  bookingCode: string;                 // "GS-2026-09-88321" (Unique index)
  bookingType: BookingType;            // ADDED v1.1

  // Parties
  userId: string;                      // Ref → User._id (Customer)
  workerId?: string | null;            // Ref → Worker._id (Assigned Worker)
  servicingSocietyId: string;          // Ref → Society._id (Worker's cooperative)
  referringSocietyId?: string | null;  // Ref → Society._id (Originating cooperative, if pooled)
  federationId: string;                // Ref → Federation._id
  regionId: string;                    // Ref → Region._id
  serviceId: string;                   // Ref → Service._id

  // Community pooling (ADR-04)
  teamId?: string | null;
  parentBookingId?: string | null;
  isTeamLead: boolean;

  // State lifecycle
  // NOTE: DECLINED has been REMOVED. It is a dispatch event, not a booking state.
  status:
    | 'REQUESTED'
    | 'ALLOCATED'
    | 'ACCEPTED'
    | 'IN_TRANSIT'
    | 'ARRIVED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED';

  // Reallocation tracking (ADDED v1.1)
  reallocationCount: number;           // Incremented each time a worker declines
  declinedWorkerIds: string[];         // Workers excluded from future dispatch for this booking

  // Dispatch log (ADDED v1.1 for audit trail)
  dispatchLog: Array<{
    workerId: string;
    action: 'OFFERED' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
    timestamp: Date;
    reason?: string;
  }>;

  // Service address
  serviceAddress: {
    addressLine1: string;
    addressLine2?: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
    location: { type: 'Point'; coordinates: [number, number]; };  // [lng, lat]
  };

  // Scheduling
  scheduledStartTime: Date;
  actualStartTime?: Date;
  completedAt?: Date;

  // OTP security (ADR-03)
  security: {
    otpHash: string;                   // HMAC-SHA256(PIN, bookingId + userId)
    failedAttempts: number;
    lockedUntil?: Date | null;
    verifiedAt?: Date | null;
  };

  // Material requests — replaces single materialDetails (CHANGED v1.1)
  materialRequests: MaterialRequest[]; // Max 3 per booking. New request blocked if any PENDING_APPROVAL.

  // Pricing
  pricing: CanonicalPricingBreakdown;

  // Cancellation
  cancellationDetails?: {
    cancelledBy: 'CUSTOMER' | 'WORKER' | 'ADMIN' | 'SYSTEM';
    cancellerUserId: string;
    reason: string;
    cancelledAt: Date;
    penaltyCharged: number;
  };

  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 2.9 Entity 9: `Review` (Customer Feedback & Rating)

> [!NOTE]
> **v1.1 change:** Added `tags: CanonicalReviewTag[]`. Canonical enum only — free-form strings prohibited. Max 5 tags.

```typescript
export interface Review {
  _id: string;
  bookingId: string;                   // Ref → Booking._id (1:1 Unique index)
  userId: string;                      // Ref → User._id (Customer)
  workerId: string;                    // Ref → Worker._id
  servicingSocietyId: string;          // Ref → Society._id

  rating: number;                      // 1 – 5 (integer)
  categoryRatings: {
    punctuality: number;               // 1 – 5
    workQuality: number;               // 1 – 5
    behavior: number;                  // 1 – 5
    transparency: number;              // 1 – 5
  };
  tags: CanonicalReviewTag[];          // ADDED v1.1; max 5; no free-form strings
  comment?: string;
  customerPhotos?: string[];
  workerResponse?: {
    comment: string;
    respondedAt: Date;
  };
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 2.10 Entity 10: `TrustScore` (Algorithmic Merit Ledger)

**Authoritative policy (single source of truth):**
- New KYC-verified worker: `currentScore = 70.0`, `isProvisional = true`
- `isProvisional` becomes `false` after `completedBookingsCount >= 10`
- `confidenceScore = min(completedBookingsCount / 10, 1.0)`

```typescript
export interface TrustScore {
  _id: string;
  workerId: string;                    // Ref → Worker._id (1:1 Unique index)
  currentScore: number;                // 0.0 – 100.0; initial = 70.0
  isProvisional: boolean;              // true until completedBookingsCount >= 10
  completedBookingsCount: number;
  confidenceScore: number;             // 0.0 – 1.0; = min(count/10, 1.0)

  breakdown: {
    customerRatingWeight: number;      // 0 – 30 pts
    punctualityWeight: number;         // 0 – 25 pts
    jobCompletionWeight: number;       // 0 – 25 pts
    societyPeerEndorsementWeight: number; // 0 – 10 pts
    trainingCertificationWeight: number;  // 0 – 10 pts
    complaintPenaltyDeduction: number; // Negative pts
  };

  history: Array<{
    previousScore: number;
    newScore: number;
    delta: number;
    reason: string;
    referenceId?: string;              // Ref → Booking._id or Complaint._id
    calculatedAt: Date;
  }>;

  lastCalculatedAt: Date;
  updatedAt: Date;
}
```

---

### 2.11 Entity 11: `WorkGalleryItem` (Worker Portfolio)

```typescript
export interface WorkGalleryItem {
  _id: string;
  workerId: string;
  serviceCategory: ServiceCategory;
  title: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  isVerifiedBySociety: boolean;
  bookingId?: string | null;
  createdAt: Date;
}
```

---

### 2.12 Entity 12: `WorkProof` (Doorstep Service Audit Trail)

```typescript
export interface WorkProof {
  _id: string;
  bookingId: string;                   // Ref → Booking._id (1:1 Unique index)
  workerId: string;

  beforeWorkPhotos: Array<{
    url: string;
    capturedAt: Date;
    location?: { type: 'Point'; coordinates: [number, number]; };
  }>;

  afterWorkPhotos: Array<{
    url: string;
    capturedAt: Date;
    location?: { type: 'Point'; coordinates: [number, number]; };
  }>;

  customerSignatureUrl?: string;
  workNotes?: string;
  submittedAt: Date;
}
```

---

### 2.13 Entity 13: `Complaint` (Dispute & Grievance Resolution)

```typescript
export interface Complaint {
  _id: string;
  complaintCode: string;               // "CMP-2026-0041"
  bookingId: string;
  complainantUserId: string;
  complainantRole: 'CUSTOMER' | 'WORKER';
  accusedWorkerId?: string | null;

  servicingSocietyId: string;
  federationId: string;

  category:
    | 'POOR_WORKMANSHIP' | 'OVERCHARGING' | 'UNPROFESSIONAL_BEHAVIOR'
    | 'PROPERTY_DAMAGE'  | 'NO_SHOW'      | 'OTHER';

  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  status:
    | 'SUBMITTED'
    | 'UNDER_REVIEW'
    | 'SOCIETY_INVESTIGATION'
    | 'RESOLVED'
    | 'DISMISSED';

  description: string;
  evidencePhotoUrls: string[];

  resolution?: {
    resolvedByAdminId: string;         // Ref → User._id
    resolvedByRole: 'SOCIETY_ADMIN' | 'FEDERATION_ADMIN' | 'SYSTEM_ADMIN';
    resolutionAction:
      | 'FULL_REFUND' | 'PARTIAL_REFUND' | 'WORKER_FINED'
      | 'WORKER_SUSPENDED' | 'NO_ACTION_DISMISSED';
    refundAmount?: number;
    comments: string;
    resolvedAt: Date;
  };

  createdAt: Date;
  updatedAt: Date;
}
```

---

### 2.14 Entity 14: `Payment` (Financial Settlement & Escrow)

```typescript
export interface Payment {
  _id: string;
  paymentCode: string;                 // "PAY-2026-00918"
  bookingId: string;
  userId: string;
  servicingSocietyId: string;
  referringSocietyId?: string | null;

  gatewayProvider: 'RAZORPAY' | 'CASH_ON_DELIVERY' | 'UPI_DIRECT';  // OD-03: confirm provider
  gatewayTransactionId?: string;

  status:
    | 'PENDING'
    | 'HELD_IN_ESCROW'
    | 'SETTLED_TO_COOP'
    | 'REFUNDED'
    | 'FAILED';

  breakdown: CanonicalPricingBreakdown;  // Exact mirror of Booking.pricing at time of capture

  settlementDetails?: {
    workerSettlementRef?: string;
    societySettlementRef?: string;
    settledAt?: Date;
  };

  refundDetails?: {
    refundId: string;
    amount: number;
    reason: string;
    refundedAt: Date;
  };

  createdAt: Date;
  updatedAt: Date;
}
```

---

### 2.15 Entity 15: `TrackingEvent` (High-Volume Geospatial Telemetry)

> [!NOTE]
> **v1.1 change:** Added `isDelayed`. TTL is explicitly on `createdAt`. `timestamp` = device sensor time; `createdAt` = backend ingestion time.

```typescript
export interface TrackingEvent {
  _id: string;
  bookingId: string;                   // Ref → Booking._id (indexed)
  workerId: string;                    // Ref → Worker._id (indexed)

  location: { type: 'Point'; coordinates: [number, number]; };  // [lng, lat]

  heading?: number;                    // 0 – 360 degrees
  speedKmh?: number;
  accuracyMeters?: number;

  timestamp: Date;                     // Device/sensor event time (used for route ordering)
  createdAt: Date;                     // Backend ingestion time (TTL index is on THIS field)
  isDelayed: boolean;                  // true if timestamp is >24h before createdAt (offline sync)
}
```

**TTL policy:** `createdAt` TTL index = 604,800 seconds (7 days). Delayed events are accepted but excluded from live tracking display. Max 50 events per batch API call.

---

## 3. Database Indexes & Storage Optimizations

| Collection | Index Keys | Type | Purpose |
|---|---|---|---|
| `User` | `{ mobileNumber: 1 }` | Unique | Auth lookup |
| `Worker` | `{ workerCode: 1 }` | Unique | Public code resolution |
| `Worker` | `{ userId: 1 }` | Unique | 1:1 binding |
| `Worker` | `{ currentLocation: "2dsphere" }` | Geospatial | Dispatch radius search |
| `Worker` | `{ societyId: 1, availabilityStatus: 1 }` | Compound | Society roster |
| `Worker` | `{ societyId: 1, experienceTier: 1 }` | Compound | Tier-based pricing lookup |
| `WorkerPrivate` | `{ workerId: 1 }` | Unique | PII binding |
| `Region` | `{ boundary: "2dsphere" }` | Geospatial | `$geoIntersects` boundary check |
| `Region` | `{ federationId: 1, isActive: 1 }` | Compound | Federation admin region list |
| `Booking` | `{ bookingCode: 1 }` | Unique | Reference code lookup |
| `Booking` | `{ userId: 1, createdAt: -1 }` | Compound | Customer order history |
| `Booking` | `{ workerId: 1, status: 1 }` | Compound | Worker job queue |
| `Booking` | `{ servicingSocietyId: 1, status: 1 }` | Compound | Society admin dashboard |
| `Booking` | `{ teamId: 1 }` | Sparse | Team booking queries |
| `Booking` | `{ status: 1, bookingType: 1, createdAt: -1 }` | Compound | SOS dispatch queue |
| `TrackingEvent` | `{ bookingId: 1, timestamp: -1 }` | Compound | Live tracking stream |
| `TrackingEvent` | `{ createdAt: 1 }` | TTL (604800s) | 7-day auto-purge |

---

*End of Canonical Data Contract v1.1*
