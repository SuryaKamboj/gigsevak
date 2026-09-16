# Canonical Data Contract v1.0 (Authoritative Specification)

**Document:** `canonical-data-contract-v1.md`  
**Platform:** GigSevak Cooperative Gig Platform  
**Target Applications:** `user-frontend`, `worker-frontend`, `admin-frontend`, and Shared Express/MongoDB Backend  
**Status:** Canonical Source of Truth (Approved Baseline)  
**Date:** September 10, 2026  

---

## 1. Global Architectural & Schema Conventions

### 1.1 Stable Identifier Conventions
All inter-entity relationships and foreign keys MUST use strictly standardized, stable ID fields. MongoDB `_id` values are 24-character hexadecimal `ObjectId` strings. To avoid field-name divergence between frontends and backend, the following field naming convention is enforced across all entities and API payloads:

* `userId` (Ref $\rightarrow$ `User._id`)
* `workerId` (Ref $\rightarrow$ `Worker._id`)
* `federationId` (Ref $\rightarrow$ `Federation._id`)
* `societyId` (Ref $\rightarrow$ `Society._id`)
* `servicingSocietyId` (Ref $\rightarrow$ `Society._id` of the executing worker)
* `referringSocietyId` (Ref $\rightarrow$ `Society._id` of the booking originator, if pooled)
* `regionId` (Ref $\rightarrow$ `Region._id`)
* `serviceId` (Ref $\rightarrow$ `Service._id`)
* `bookingId` (Ref $\rightarrow$ `Booking._id`)
* `reviewId` (Ref $\rightarrow$ `Review._id`)
* `complaintId` (Ref $\rightarrow$ `Complaint._id`)
* `paymentId` (Ref $\rightarrow$ `Payment._id`)

### 1.2 Geospatial Coordinate Standard (Strict GeoJSON)
All geographic positions MUST strictly adhere to the GeoJSON RFC 7946 standard:
```json
{
  "type": "Point",
  "coordinates": [75.5762, 31.3260]
}
```
> [!CAUTION]
> **CRITICAL GEOSPATIAL RULE:** The `coordinates` array MUST ALWAYS follow `[longitude, latitude]`.  
> Never use `[latitude, longitude]`. Longitude always comes first in GeoJSON. MongoDB 2dsphere indexes will produce corrupt spatial queries if this order is inverted.

### 1.3 Universal Financial & Pricing Breakdown
To ensure zero financial discrepancy between invoices, bookings, and payment gateway receipts, the pricing breakdown is unified into a single invariant schema:

```typescript
export interface CanonicalPricingBreakdown {
  baseLaborAmount: number;        // Rate for standard service labor
  materialAmount: number;         // Material/parts authorized by customer (ADR-02)
  additionalCharges: number;      // Emergency, night, or special tool charges
  platformFee: number;            // 5% Platform infrastructure fee
  taxAmount: number;              // Applicable GST (18%)
  totalAmount: number;            // Grand total billed to customer
  
  // Cooperative Revenue Distribution
  workerPayoutAmount: number;     // 85% of labor + 100% of material
  servicingSocietyAmount: number; // 10% (or 9% if pooled) of labor
  referringSocietyAmount: number; // 1% of labor (if cross-society pool)
  platformReserveAmount: number;  // 5% retained by GigSevak Federation
}
```

### 1.4 Global Service Category Enum
All trade references across `Worker`, `Service`, and `Booking` MUST use the standardized enum:
```typescript
export type ServiceCategory = 
  | 'PLUMBING'
  | 'ELECTRICAL'
  | 'CARPENTRY'
  | 'CLEANING'
  | 'PAINTING'
  | 'APPLIANCE_REPAIR'
  | 'MASONRY'
  | 'GARDENING'
  | 'OTHER';
```

---

## 2. Canonical Entities Specification

### 2.1 Entity 1: `User` (Customer & Common Identity)
Represents registered customers booking services, as well as the base authentication record for all human actors.

```typescript
export interface User {
  _id: string;                         // MongoDB ObjectId string
  mobileNumber: string;                // Canonical +91 E.164 phone number (Unique index)
  email?: string;                      // Optional verified email
  fullName: string;                    // Customer name
  role: 'CUSTOMER' | 'WORKER' | 'SOCIETY_ADMIN' | 'FEDERATION_ADMIN' | 'SYSTEM_ADMIN';
  languagePreference: 'en' | 'pa' | 'hi'; // Default 'pa' for pilot corridor
  avatarUrl?: string;
  isBlocked: boolean;
  addresses: Array<{
    addressId: string;                 // UUID
    label: 'HOME' | 'WORK' | 'OTHER';
    addressLine1: string;
    addressLine2?: string;
    landmark?: string;
    city: string;                      // e.g. "Jalandhar", "Kapurthala"
    state: string;                     // "Punjab"
    pincode: string;                   // "144001"
    location: {
      type: 'Point';
      coordinates: [number, number];   // [longitude, latitude]
    };
    isDefault: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 2.2 Entity 2: `Worker` (Public Professional Profile)
Represents the artisan's public-facing cooperative identity, skills, ratings, and operational status.

```typescript
export interface Worker {
  _id: string;                         // MongoDB ObjectId string
  userId: string;                      // Ref -> User._id (1:1 Relationship)
  workerCode: string;                  // e.g. "PB-JAL-PLM-0104" (Unique index)
  societyId: string;                   // Ref -> Society._id (Affiliated Cooperative)
  federationId: string;                // Ref -> Federation._id
  primaryRegionId: string;             // Ref -> Region._id
  operatingRegionIds: string[];        // Array of Region._ids authorized to serve
  
  fullName: string;
  avatarUrl?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  languagesSpoken: string[];           // ["pa", "hi", "en"]
  
  // Professional Competency
  primaryServiceCategory: ServiceCategory;
  skills: Array<{
    serviceId: string;                 // Ref -> Service._id
    category: ServiceCategory;
    experienceYears: number;
    certificateNumber?: string;
    isCertified: boolean;
  }>;
  
  // Operational Status
  availabilityStatus: 'AVAILABLE' | 'ON_JOB' | 'OFF_DUTY' | 'SUSPENDED';
  isOnline: boolean;
  lastActiveAt: Date;
  currentLocation?: {
    type: 'Point';
    coordinates: [number, number];     // [longitude, latitude]
  };
  
  // Pricing Structure
  pricing: {
    hourlyRate: number;                // Base labor rate per hour in INR
    baseVisitFee: number;              // Fixed initial inspection/travel fee in INR
    currency: 'INR';
    minimumBillableHours: number;      // Default 1
  };
  
  // Cooperative Standing & Metrics
  kycVerificationStatus: 'PENDING' | 'IN_REVIEW' | 'VERIFIED' | 'REJECTED';
  membershipStatus: 'APPLICANT' | 'ACTIVE_MEMBER' | 'PROBATIONARY' | 'SUSPENDED';
  shareholderFolioNumber?: string;     // Cooperative Society share certificate #
  
  // Rating & Trust
  metrics: {
    averageRating: number;             // e.g. 4.85
    reviewCount: number;               // Total customer reviews
    completedJobsCount: number;        // Total completed jobs
    acceptanceRate: number;            // 0 - 100%
    cancellationRate: number;          // 0 - 100%
    trustScore: number;                // Scaled from TrustScore entity (0 - 100)
  };
  
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 2.3 Entity 3: `WorkerPrivate` (Confidential PII & KYC Data)
Stored in a strictly segregated MongoDB collection. Never queryable by public users, search APIs, or unauthorized admins.

```typescript
export interface WorkerPrivate {
  _id: string;                         // MongoDB ObjectId string
  workerId: string;                    // Ref -> Worker._id (1:1 Unique index)
  userId: string;                      // Ref -> User._id
  
  // KYC & Government Identity
  aadhaarNumberMasked: string;         // "XXXX-XXXX-1234" (Strictly masked)
  aadhaarVerificationHash: string;     // SHA-256 hash for duplicate detection
  panNumber: string;                   // Tax identification
  aadhaarFrontDocUrl: string;          // Encrypted S3/GCS URL
  aadhaarBackDocUrl: string;
  policeClearanceCertUrl?: string;
  
  // Banking & Payout Ledger
  bankAccount: {
    accountHolderName: string;
    accountNumberEncrypted: string;
    ifscCode: string;
    bankName: string;
    branchName: string;
    payoutMode: 'NEFT' | 'IMPS' | 'UPI';
    upiId?: string;
    isVerified: boolean;
  };
  
  // Emergency Contacts
  emergencyContact: {
    name: string;
    relationship: string;
    mobileNumber: string;
  };
  
  // Background Verification Audit
  verificationAudit: {
    verifiedByAdminId?: string;        // Ref -> User._id (Society Admin)
    verifiedAt?: Date;
    rejectionReason?: string;
    notes?: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 2.4 Entity 4: `Federation` (Apex Cooperative Body)
The state or national cooperative federation governing regional societies (e.g. Punjab State Cooperative Federation).

```typescript
export interface Federation {
  _id: string;
  federationCode: string;              // e.g. "PB-FED-01"
  name: string;                        // "Punjab Cooperative Artisans Federation"
  state: string;                       // "Punjab"
  registrationNumber: string;          // Registered under Co-op Societies Act
  registeredOfficeAddress: string;
  contactEmail: string;
  contactPhone: string;
  platformSplitRatio: {
    workerSharePercent: number;        // Default: 85
    societySharePercent: number;       // Default: 10
    federationSharePercent: number;    // Default: 5
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 2.5 Entity 5: `Society` (Primary Cooperative Unit / PACS)
The local cooperative society where workers hold formal membership and share equity.

```typescript
export interface Society {
  _id: string;
  federationId: string;                // Ref -> Federation._id
  societyCode: string;                 // e.g. "SOC-PB-JAL-04"
  name: string;                        // "Jalandhar Central Artisans Cooperative Society"
  registrationNumber: string;          // Government Society Registration #
  primaryRegionId: string;             // Ref -> Region._id
  jurisdictionRegionIds: string[];     // Ref -> Region._id[]
  
  officeAddress: {
    street: string;
    city: string;
    district: string;
    state: string;
    pincode: string;
  };
  officeLocation: {
    type: 'Point';
    coordinates: [number, number];     // [longitude, latitude]
  };
  
  contactPerson: {
    name: string;
    designation: string;
    phone: string;
    email: string;
  };
  
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 2.6 Entity 6: `Region` (Geographic Operational Boundary)
Defines operating territories, pricing multipliers, and dispatch geo-fences.

```typescript
export interface Region {
  _id: string;
  regionCode: string;                  // e.g. "PUN-JAL-01"
  name: string;                        // "Jalandhar Urban Municipal Zone"
  state: string;                       // "Punjab"
  district: string;                    // "Jalandhar"
  boundary: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][]; // GeoJSON standard
  };
  centerPoint: {
    type: 'Point';
    coordinates: [number, number];     // [longitude, latitude]
  };
  demandMultiplier: number;            // 1.0 (surge/subsidy factor)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 2.7 Entity 7: `Service` (Catalog of Standardized Trades)
Canonical service catalog defining standard tariffs, duration, and safety protocols.

```typescript
export interface Service {
  _id: string;
  serviceCode: string;                 // e.g. "SRV-PLM-LEAK-01"
  category: ServiceCategory;
  title: {
    en: string;
    pa: string;
    hi: string;
  };
  description: {
    en: string;
    pa: string;
    hi: string;
  };
  iconUrl: string;
  imageUrl: string;
  baseLaborPrice: number;              // Standard benchmark price in INR
  baseEstimatedMinutes: number;        // e.g. 60 mins
  allowedAddons: Array<{
    addonId: string;
    title: { en: string; pa: string; hi: string };
    price: number;
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 2.8 Entity 8: `Booking` (Central Transaction Lifecycle)
The core transactional document orchestrating dispatch, physical arrival, OTP authentication, material authorization, and completion.

```typescript
export interface Booking {
  _id: string;
  bookingCode: string;                 // e.g. "GS-2026-09-88321" (Indexed)
  
  // Associated Parties
  userId: string;                      // Ref -> User._id (Customer)
  workerId?: string | null;            // Ref -> Worker._id (Assigned Worker)
  servicingSocietyId: string;          // Ref -> Society._id (Worker's cooperative)
  referringSocietyId?: string | null;  // Ref -> Society._id (Originating cooperative if pooled)
  federationId: string;                // Ref -> Federation._id
  regionId: string;                    // Ref -> Region._id
  serviceId: string;                   // Ref -> Service._id
  
  // Community Pooling & Multi-Worker Coordination (ADR-04)
  teamId?: string | null;              // UUID uniting team members for 1 project
  parentBookingId?: string | null;     // Ref -> Booking._id of primary customer booking
  isTeamLead: boolean;                 // Identifies team coordinator
  
  // Canonical State Lifecycle
  status: 
    | 'REQUESTED'
    | 'ALLOCATED'
    | 'ACCEPTED'
    | 'DECLINED'
    | 'IN_TRANSIT'
    | 'ARRIVED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED';
    
  // Service Address & Geo Location
  serviceAddress: {
    addressLine1: string;
    addressLine2?: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
    location: {
      type: 'Point';
      coordinates: [number, number];   // [longitude, latitude]
    };
  };
  
  // Scheduling
  scheduledStartTime: Date;
  actualStartTime?: Date;
  completedAt?: Date;
  
  // Security & Doorstep OTP Handshake (ADR-03)
  security: {
    otpHash: string;                   // HMAC-SHA256(PIN, bookingId + userId)
    failedAttempts: number;            // Lockout counter (max 5)
    lockedUntil?: Date | null;
    verifiedAt?: Date | null;
  };
  
  // Dynamic Material Cost Authorization (ADR-02)
  materialDetails: {
    status: 'NONE' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
    claimedAmount: number;
    description?: string;
    receiptImageUrl?: string;
    requestedAt?: Date;
    resolvedAt?: Date;
  };
  
  // Canonical Financial Ledger (Issue 1)
  pricing: CanonicalPricingBreakdown;
  
  // Cancellation Audit
  cancellationDetails?: {
    cancelledBy: 'CUSTOMER' | 'WORKER' | 'ADMIN' | 'SYSTEM';
    cancellerUserId: string;           // Ref -> User._id
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
Direct post-service customer appraisal of artisan punctuality, skill, and behavior.

```typescript
export interface Review {
  _id: string;
  bookingId: string;                   // Ref -> Booking._id (1:1 Unique index)
  userId: string;                      // Ref -> User._id (Customer)
  workerId: string;                    // Ref -> Worker._id (Artisan)
  servicingSocietyId: string;          // Ref -> Society._id
  
  rating: number;                      // 1 to 5 stars
  categoryRatings: {
    punctuality: number;               // 1 to 5
    workQuality: number;               // 1 to 5
    behavior: number;                  // 1 to 5
    transparency: number;              // 1 to 5
  };
  comment?: string;
  customerPhotos?: string[];           // Customer uploaded photos
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
Represents the cooperative's proprietary credibility rating for each worker, balancing review history, peer endorsements, punctuality, and dispute records.

```typescript
export interface TrustScore {
  _id: string;
  workerId: string;                    // Ref -> Worker._id (1:1 Unique index)
  currentScore: number;                // 0.0 to 100.0 (Baseline 70.0 for new workers)
  isProvisional: boolean;              // true until >= 10 bookings completed
  completedBookingsCount: number;      // Total jobs contributing to calculation
  confidenceScore: number;             // 0.0 to 1.0 (statistical confidence)
  
  breakdown: {
    customerRatingWeight: number;      // 0 - 30 pts (Based on 5-star feedback)
    punctualityWeight: number;         // 0 - 25 pts (On-time arrival rate)
    jobCompletionWeight: number;       // 0 - 25 pts (Low cancellation rate)
    societyPeerEndorsementWeight: number; // 0 - 10 pts (Cooperative standing)
    trainingCertificationWeight: number;  // 0 - 10 pts (Govt/ITI certificates)
    complaintPenaltyDeduction: number; // Negative pts deducted for verified complaints
  };
  
  history: Array<{
    previousScore: number;
    newScore: number;
    delta: number;
    reason: string;
    referenceId?: string;              // Ref -> Booking._id or Complaint._id
    calculatedAt: Date;
  }>;
  
  lastCalculatedAt: Date;
  updatedAt: Date;
}
```

---

### 2.11 Entity 11: `WorkGalleryItem` (Worker Portfolio)
Portfolio showcase of past craftsmanship displayed on the worker's public profile.

```typescript
export interface WorkGalleryItem {
  _id: string;
  workerId: string;                    // Ref -> Worker._id
  serviceCategory: ServiceCategory;
  title: string;
  description?: string;
  imageUrl: string;                    // Cloud storage URL
  thumbnailUrl?: string;
  isVerifiedBySociety: boolean;
  bookingId?: string | null;           // Optional link to real Booking
  createdAt: Date;
}
```

---

### 2.12 Entity 12: `WorkProof` (Doorstep Service Audit Trail)
Auditable digital evidence capturing condition before and after work execution.

```typescript
export interface WorkProof {
  _id: string;
  bookingId: string;                   // Ref -> Booking._id (1:1 Unique index)
  workerId: string;                    // Ref -> Worker._id
  
  beforeWorkPhotos: Array<{
    url: string;
    capturedAt: Date;
    location?: {
      type: 'Point';
      coordinates: [number, number];   // Geo-tagged validation
    };
  }>;
  
  afterWorkPhotos: Array<{
    url: string;
    capturedAt: Date;
    location?: {
      type: 'Point';
      coordinates: [number, number];
    };
  }>;
  
  customerSignatureUrl?: string;
  workNotes?: string;
  submittedAt: Date;
}
```

---

### 2.13 Entity 13: `Complaint` (Dispute & Grievance Resolution)
Formal grievance filed by customer or worker, arbitrated under cooperative society governance.

```typescript
export interface Complaint {
  _id: string;
  complaintCode: string;               // e.g. "CMP-2026-0041"
  bookingId: string;                   // Ref -> Booking._id
  complainantUserId: string;           // Ref -> User._id
  complainantRole: 'CUSTOMER' | 'WORKER';
  accusedWorkerId?: string | null;     // Ref -> Worker._id
  
  servicingSocietyId: string;          // Ref -> Society._id
  federationId: string;                // Ref -> Federation._id
  
  category: 
    | 'POOR_WORKMANSHIP'
    | 'OVERCHARGING'
    | 'UNPROFESSIONAL_BEHAVIOR'
    | 'PROPERTY_DAMAGE'
    | 'NO_SHOW'
    | 'OTHER';
    
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  
  // Normalized Status Enum (Issue 3)
  status: 
    | 'SUBMITTED'
    | 'UNDER_REVIEW'
    | 'SOCIETY_INVESTIGATION'
    | 'RESOLVED'
    | 'DISMISSED';
    
  description: string;
  evidencePhotoUrls: string[];
  
  resolution?: {
    resolvedByAdminId: string;         // Ref -> User._id (Society or Federation Admin)
    resolutionAction: 
      | 'FULL_REFUND'
      | 'PARTIAL_REFUND'
      | 'WORKER_FINED'
      | 'WORKER_SUSPENDED'
      | 'NO_ACTION_DISMISSED';
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
Payment transaction tracking customer payment gateway intents, escrow hold, and cooperative settlement splits.

```typescript
export interface Payment {
  _id: string;
  paymentCode: string;                 // e.g. "PAY-2026-00918"
  bookingId: string;                   // Ref -> Booking._id (1:1 Relationship)
  userId: string;                      // Ref -> User._id (Customer)
  servicingSocietyId: string;          // Ref -> Society._id
  referringSocietyId?: string | null;  // Ref -> Society._id
  
  gatewayProvider: 'RAZORPAY' | 'CASH_ON_DELIVERY' | 'UPI_DIRECT';
  gatewayTransactionId?: string;       // Razorpay order_id / payment_id
  
  status: 
    | 'PENDING'
    | 'HELD_IN_ESCROW'
    | 'SETTLED_TO_COOP'
    | 'REFUNDED'
    | 'FAILED';
    
  // Mirrored Unified Pricing Breakdown (Issue 1)
  breakdown: CanonicalPricingBreakdown;
  
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
Real-time GPS telemetry emitted by worker device during `IN_TRANSIT`. Stored in high-throughput collection with automated TTL purge.

```typescript
export interface TrackingEvent {
  _id: string;
  bookingId: string;                   // Ref -> Booking._id (Indexed)
  workerId: string;                    // Ref -> Worker._id (Indexed)
  
  location: {
    type: 'Point';
    coordinates: [number, number];     // [longitude, latitude]
  };
  
  heading?: number;                    // Bearing in degrees (0 - 360)
  speedKmh?: number;                   // Speed in km/h
  accuracyMeters?: number;             // GPS horizontal accuracy
  
  timestamp: Date;                     // Sensor timestamp
  createdAt: Date;                     // Ingestion timestamp (TTL index 7 days)
}
```

---

## 3. Database Indexes & Storage Optimizations

| Collection | Index Keys | Type | Purpose |
|---|---|---|---|
| `User` | `{ mobileNumber: 1 }` | Unique | Fast customer/worker lookup on authentication |
| `Worker` | `{ workerCode: 1 }` | Unique | Public code resolution |
| `Worker` | `{ userId: 1 }` | Unique | 1:1 foreign key binding |
| `Worker` | `{ currentLocation: "2dsphere" }` | Geospatial | Real-time dispatch & radius search |
| `Worker` | `{ societyId: 1, availabilityStatus: 1 }` | Compound | Society roster management |
| `WorkerPrivate`| `{ workerId: 1 }` | Unique | Segregated confidential PII binding |
| `Region` | `{ boundary: "2dsphere" }` | Geospatial | `$geoIntersects` dispatch boundary check |
| `Booking` | `{ bookingCode: 1 }` | Unique | Customer and worker reference code |
| `Booking` | `{ userId: 1, createdAt: -1 }` | Compound | Customer order history pagination |
| `Booking` | `{ workerId: 1, status: 1 }` | Compound | Worker active assignment queries |
| `Booking` | `{ servicingSocietyId: 1, status: 1 }`| Compound | Society admin operational dashboard |
| `Booking` | `{ teamId: 1 }` | Sparse | Community pooling sister booking queries |
| `TrackingEvent`| `{ bookingId: 1, timestamp: -1 }` | Compound | Active live tracking stream |
| `TrackingEvent`| `{ createdAt: 1 }` | TTL (604800s) | Automatic 7-day expiration/purge of telemetry |

---

*End of Canonical Data Contract v1.0 (`canonical-data-contract-v1.md`)*
