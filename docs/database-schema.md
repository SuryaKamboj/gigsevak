# GigSevak — Canonical Database Schema & Mongoose Model Specifications

This document defines the 15 canonical domain models implemented in `gigsevak-backend/src/models`.
All models operate on a single shared MongoDB database instance.

---

## 1. User (`src/models/User.js`)
Stores authentication identities for customers, workers, society administrators, federation administrators, and platform super administrators.
- **Fields:**
  - `mobileNumber`: String (required, unique, indexed)
  - `email`: String (sparse)
  - `fullName`: String (required)
  - `role`: Enum `['CUSTOMER', 'WORKER', 'SOCIETY_ADMIN', 'FEDERATION_ADMIN', 'SYSTEM_ADMIN', 'PLATFORM_SUPER_ADMIN']`
  - `preferredLanguage` / `languagePreference`: Enum `['en', 'pa', 'hi']`
  - `isBlocked`: Boolean (default: `false`)
  - `passwordHash`: String (used for admin logins)
  - `societyId`: ObjectId -> `Society` (for Society Admins)
  - `federationId`: ObjectId -> `Federation` (for Federation Admins)
  - `addresses`: Subdocument Array `[AddressSchema]`
- **Indexes:** `{ mobileNumber: 1 }` (unique)

---

## 2. Worker (`src/models/Worker.js`)
Public profile of cooperative artisans and gig workers.
- **Fields:**
  - `userId`: ObjectId -> `User` (required, unique, indexed)
  - `workerCode`: String (unique, indexed, format: `WK-DEL-XXX`)
  - `societyId`: ObjectId -> `Society` (required, indexed)
  - `federationId`: ObjectId -> `Federation` (required)
  - `primaryRegionId`: ObjectId -> `Region`
  - `operatingRegionIds`: Array of ObjectIds -> `Region`
  - `fullName`: String (required)
  - `avatarUrl`: String
  - `gender`: Enum `['MALE', 'FEMALE', 'OTHER']`
  - `languagesSpoken`: Array of Strings
  - `primaryServiceCategory`: String
  - `experienceTier`: Enum `['STANDARD', 'SENIOR', 'MASTER']`
  - `skills`: Subdocument Array `[SkillSchema]`
  - `availabilityStatus`: Enum `['AVAILABLE', 'ON_JOB', 'OFF_DUTY', 'SUSPENDED']`
  - `isOnline`: Boolean
  - `currentLocation`: GeoJSON Point `{ type: 'Point', coordinates: [lng, lat] }`
  - `kycVerificationStatus`: Enum `['PENDING', 'IN_REVIEW', 'VERIFIED', 'REJECTED']`
  - `membershipStatus`: Enum `['APPLICANT', 'ACTIVE_MEMBER', 'PROBATIONARY', 'SUSPENDED']`
  - `shareholderFolioNumber`: String
  - `metrics`: `{ averageRating, reviewCount, completedJobsCount, acceptanceRate, cancellationRate, trustScore }`
- **Indexes:**
  - `{ currentLocation: '2dsphere' }`
  - `{ societyId: 1, availabilityStatus: 1 }`
  - `{ societyId: 1, experienceTier: 1 }`

---

## 3. WorkerPrivate (`src/models/WorkerPrivate.js`)
Strictly isolated sensitive worker verification and financial data.
- **Fields:**
  - `workerId`: ObjectId -> `Worker` (required, unique, indexed)
  - `userId`: ObjectId -> `User` (required)
  - `mobileNumberFull`: String
  - `mobileNumberMasked`: String
  - `aadhaarNumberMasked`: String
  - `panNumber`: String
  - `bankAccount`: `{ accountHolderName, accountNumberMasked, ifscCode, bankName, payoutMode, upiId, isVerified }`
  - `emergencyContact`: `{ name, relationship, mobileNumber }`
  - `earnings`: `{ totalLifetimeEarnings, currentMonthEarnings, lastSettlementDate }`
  - `verificationAudit`: `{ verifiedByAdminId, verifiedAt, rejectionReason, notes }`

---

## 4. Federation (`src/models/Federation.js`)
Apex regulatory and policy cooperative entity.
- **Fields:**
  - `federationCode`: String (required, unique)
  - `name`: String (required)
  - `state`: String (required)
  - `gstin`: String
  - `bankAccount`: Bank account details
  - `policies`: `{ platformReservePercent: 5, defaultTaxRatePercent: 18, disputeWindowDays: 7 }`

---

## 5. Society (`src/models/Society.js`)
Primary cooperative society unit.
- **Fields:**
  - `societyCode`: String (required, unique)
  - `federationId`: ObjectId -> `Federation` (required)
  - `name`: String (required)
  - `registrationNumber`: String (required)
  - `district`: String
  - `state`: String
  - `revenueSharePercent`: Number (default: 10)
  - `bankAccount`: Bank details
  - `status`: Enum `['ACTIVE', 'INACTIVE', 'SUSPENDED']`

---

## 6. Region (`src/models/Region.js`)
Operational cluster with geospatial boundaries.
- **Fields:**
  - `regionCode`: String (required, unique)
  - `federationId`: ObjectId -> `Federation` (required)
  - `societyId`: ObjectId -> `Society`
  - `name`: String (required)
  - `pincodes`: Array of Strings
  - `centerPoint`: GeoJSON Point `{ type: 'Point', coordinates: [lng, lat] }`
  - `demandMultiplier`: Number (default: 1.0)
  - `isActive`: Boolean

---

## 7. Service (`src/models/Service.js`)
Canonical cooperative service catalog item.
- **Fields:**
  - `serviceCode`: String (required, unique, indexed)
  - `name`: String
  - `title`: `{ en: String, pa: String, hi: String }`
  - `category`: Enum `['PLUMBING', 'ELECTRICAL', 'CARPENTRY', 'CLEANING', 'PAINTING', 'APPLIANCE_REPAIR', 'APPLIANCE', 'MASONRY', 'GARDENING', 'OTHER']`
  - `description`: Mixed (String or Object)
  - `baseLaborPrice`: Number (required)
  - `defaultDurationMinutes`: Number (default: 60)
  - `allowedAddons`: Array
  - `isActive`: Boolean

---

## 8. Booking (`src/models/Booking.js`)
Core lifecycle state machine entity.
- **Fields:**
  - `bookingCode`: String (required, unique, indexed)
  - `bookingType`: Enum `['STANDARD', 'EMERGENCY_SOS', 'COMMUNITY_POOL', 'VOICE_BOOKING']`
  - `userId`: ObjectId -> `User` (required, indexed)
  - `workerId`: ObjectId -> `Worker` (default: null)
  - `servicingSocietyId`: ObjectId -> `Society` (required)
  - `referringSocietyId`: ObjectId -> `Society`
  - `federationId`: ObjectId -> `Federation` (required)
  - `regionId`: ObjectId -> `Region` (required)
  - `serviceId`: ObjectId -> `Service` (required)
  - `teamId`: String (sparse index, for sister bookings)
  - `parentBookingId`: ObjectId -> `Booking`
  - `isTeamLead`: Boolean
  - `status`: Enum `['REQUESTED', 'ALLOCATED', 'ACCEPTED', 'IN_TRANSIT', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']`
  - `serviceAddress`: `{ addressLine1, city, state, pincode, location }`
  - `scheduledStartTime`: Date
  - `actualStartTime`: Date
  - `completedAt`: Date
  - `security`: `{ otpHash, failedAttempts, lockedUntil, verifiedAt }`
  - `materialRequests`: `[MaterialRequestSchema]`
  - `pricing`: `PricingSchema` (calculated by pricing service)
  - `cancellationDetails`: `{ cancelledBy, cancellerUserId, reason, cancelledAt }`
- **Indexes:**
  - `{ userId: 1, createdAt: -1 }`
  - `{ workerId: 1, status: 1 }`
  - `{ servicingSocietyId: 1, status: 1 }`
  - `{ teamId: 1 }` (sparse)

---

## 9. Review (`src/models/Review.js`)
Verified customer ratings and reviews.
- **Fields:**
  - `bookingId`: ObjectId -> `Booking` (required, unique)
  - `userId`: ObjectId -> `User` (required)
  - `workerId`: ObjectId -> `Worker` (required)
  - `rating`: Number (1 to 5)
  - `categoryRatings`: `{ punctuality, workQuality, behavior, transparency }`
  - `tags`: Array of canonical tags
  - `comment`: String

---

## 10. TrustScore (`src/models/TrustScore.js`)
Cooperative credibility metrics for workers.

## 11. WorkGalleryItem (`src/models/WorkGalleryItem.js`)
Worker craft portfolio images.

## 12. WorkProof (`src/models/WorkProof.js`)
Geotagged before/after photo audits for bookings.

## 13. Complaint (`src/models/Complaint.js`)
Dispute logging, tracking, and resolution records.

## 14. Payment (`src/models/Payment.js`)
Financial transactions, gateway orders, captures, and refunds.

## 15. TrackingEvent (`src/models/TrackingEvent.js`)
Real-time GPS transit coordinates with 2dsphere index.