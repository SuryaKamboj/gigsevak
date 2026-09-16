# API Specification & Communication Contract v1.1

**Document:** `api-contract-v1.1.md`  
**Platform:** GigSevak Cooperative Gig Platform  
**Status:** Authoritative API Contract v1.1 — Reconciled  
**Date:** September 10, 2026  
**Supersedes:** `api-contract.md` (v1.0)

**Summary of v1.1 changes from v1.0:**
- Material API: Replaced single endpoint pair with resource-oriented `materialRequests` sub-resource (multiple requests per booking supported, max 3)
- Review API: Added required `tags[]` field (canonical enum, max 5)
- Emergency SOS: Added `POST /api/bookings/sos` and SOS-specific dispatch rules
- Tracking: Added batch telemetry support, `isDelayed` flag semantics, `bookingType` in create body
- Decline: Updated to reflect dispatch-event-only behavior (no `DECLINED` booking state)
- Worker search: Added `experienceTier` filter parameter
- State machine: `DECLINED` removed as a booking state; reallocation count rules added
- Admin: Added experience tier update endpoint; regions scoped by `federationId`

---

## 1. Global API Standards & Envelope Specification

### 1.1 Success Response Envelope
```json
{
  "success": true,
  "data": {},
  "message": "Human-readable confirmation message."
}
```

### 1.2 Error Response Envelope
```json
{
  "success": false,
  "error": {
    "code": "MACHINE_READABLE_ERROR_CODE",
    "message": "Human-readable, localized error explanation.",
    "details": {}
  }
}
```

### 1.3 Canonical Error Codes

| HTTP Status | Error Code | Meaning / Trigger |
|---|---|---|
| `400 Bad Request` | `VALIDATION_ERROR` | Schema validation failed. |
| `401 Unauthorized` | `UNAUTHENTICATED` | Missing, expired, or invalid JWT. |
| `403 Forbidden` | `ACCESS_DENIED` | Role, tenant, or regional scope violation. |
| `404 Not Found` | `RESOURCE_NOT_FOUND` | Document not found or soft-deleted. |
| `409 Conflict` | `INVALID_STATE_TRANSITION` | Transition violates canonical state machine. |
| `409 Conflict` | `DUPLICATE_RESOURCE` | Unique index violation (mobile, workerCode, etc). |
| `409 Conflict` | `SOS_ALREADY_CLAIMED` | Emergency booking already accepted by another worker. |
| `409 Conflict` | `MATERIAL_REQUEST_PENDING` | Cannot submit new request while one is PENDING_APPROVAL. |
| `409 Conflict` | `MATERIAL_REQUEST_LIMIT` | Exceeded maximum 3 material requests per booking. |
| `422 Unprocessable` | `INVALID_OTP` | Doorstep OTP verification failed. |
| `422 Unprocessable` | `INVALID_REVIEW_TAG` | Tag value not in canonical CanonicalReviewTag enum. |
| `423 Locked` | `OTP_ATTEMPTS_EXCEEDED` | 5 consecutive OTP failures; 15-min lockout. |
| `429 Too Many Req` | `RATE_LIMIT_EXCEEDED` | API rate limit exceeded. |
| `500 Server Error` | `INTERNAL_SERVER_ERROR` | Unhandled exception; logged with correlation ID. |

---

## 2. Booking State Machine & Transition Rules

The backend strictly enforces deterministic transitions. Any illegal transition returns `409 INVALID_STATE_TRANSITION`.

> [!IMPORTANT]
> **`DECLINED` is NOT a booking status in v1.1.** Decline is a dispatch-level event. The booking document transitions from `ALLOCATED` back to `REQUESTED` immediately. `DECLINED` was removed from the Booking status enum.

### 2.1 State Transition Matrix

| Source State | Destination State | Triggering Endpoint | Allowed Actor | Validations & Side Effects |
|---|---|---|---|---|
| `[NEW]` | `REQUESTED` | `POST /api/bookings` | `CUSTOMER` | Pricing calculated; OTP hash generated; dispatch notified. |
| `[NEW]` | `ACCEPTED` | `POST /api/bookings/sos` + first accept | `CUSTOMER` + `WORKER` | **SOS only.** Simultaneous broadcast to all AVAILABLE workers within 7km. First atomic accept wins. |
| `REQUESTED` | `ALLOCATED` | Internal Dispatch Engine | `SYSTEM` | Worker matched; `workerId` set; worker locked to `ON_JOB`. Logged in `dispatchLog`. |
| `REQUESTED` | `CANCELLED` | `POST /api/bookings/:id/cancel` | `CUSTOMER`, `ADMIN` | No cancellation fee. |
| `ALLOCATED` | `ACCEPTED` | `POST /api/bookings/:id/accept` | `WORKER` | Customer alerted via socket/push. |
| `ALLOCATED` | `REQUESTED` | `POST /api/bookings/:id/decline` | `WORKER` | **Not `DECLINED` state.** `workerId = null`, `reallocationCount++`, `declinedWorkerIds += workerId`, re-dispatched. |
| `ALLOCATED` | `CANCELLED` | `POST /api/bookings/:id/cancel` | `CUSTOMER`, `ADMIN` | No penalty. Worker freed. |
| `ACCEPTED` | `IN_TRANSIT` | `POST /api/bookings/:id/start-travel` | `WORKER` | `actualStartTime` set; tracking pipeline opened. |
| `ACCEPTED` | `CANCELLED` | `POST /api/bookings/:id/cancel` | `CUSTOMER`, `ADMIN` | Minor travel fee may apply if >5 min after ACCEPTED. |
| `IN_TRANSIT` | `ARRIVED` | `POST /api/bookings/:id/arrive` | `WORKER` | Geo-fence: worker within 200m of `serviceAddress.location`. OTP pushed to customer. |
| `IN_TRANSIT` | `CANCELLED` | `POST /api/bookings/:id/cancel` | `CUSTOMER`, `ADMIN` | Standard cancellation penalty. |
| `ARRIVED` | `IN_PROGRESS` | `POST /api/bookings/:id/verify-otp` | `WORKER` | Salted HMAC-SHA256 verification. Max 5 attempts. |
| `ARRIVED` | `CANCELLED` | `POST /api/bookings/:id/cancel` | `CUSTOMER`, `ADMIN` | Fee charged; explicit reason required. |
| `IN_PROGRESS` | `COMPLETED` | `POST /api/bookings/:id/complete` | `WORKER` | WorkProof required (≥1 before + ≥1 after). No PENDING_APPROVAL material requests. Escrow settled. |
| `IN_PROGRESS` | `CANCELLED` | Admin Override | `SOCIETY_ADMIN`, `SYSTEM_ADMIN` | Emergency only. Dispute log required. |
| `COMPLETED` | — | *(terminal)* | — | No further transitions. |
| `CANCELLED` | — | *(terminal)* | — | No further transitions. |

### 2.2 Reallocation Rules

When a worker declines (`ALLOCATED → REQUESTED`):
1. `reallocationCount < 3`: Re-dispatch within same society (≤10 km radius). Declined worker excluded via `declinedWorkerIds`.
2. `reallocationCount >= 3`: Expand dispatch radius to 12 km (inter-cooperative pooling). Set `referringSocietyId`.
3. If no worker accepts within 5 minutes after the 3rd decline: Booking transitions to `CANCELLED` with `reason: 'NO_WORKER_AVAILABLE'`.

### 2.3 Emergency SOS Dispatch Rules

When `bookingType = 'EMERGENCY_SOS'`:
1. Backend simultaneously broadcasts offer to **ALL** `AVAILABLE + VERIFIED` workers within 7 km.
2. First worker to `POST /api/bookings/:id/accept` wins via atomic `findOneAndUpdate({ status: 'REQUESTED' })`.
3. Booking transitions directly `REQUESTED → ACCEPTED` (skips `ALLOCATED`).
4. All other workers receive socket event `{ type: 'SOS_CLAIMED', bookingId }`. Their accept attempts return `409 SOS_ALREADY_CLAIMED`.
5. If no worker accepts within 3 minutes, radius expands to 12 km and re-broadcast.

---

## 3. Detailed API Specifications by Functional Group

### 3.1 Authentication Group

#### `POST /api/auth/login` — Request SMS OTP
* **Auth:** Public
* **Body:** `{ "mobileNumber": "+919876543210", "role": "CUSTOMER" }`
* **Validation:** `mobileNumber` must match `^\+91[6-9]\d{9}$`. `role` must be a valid role enum value.
* **Rate Limit:** Max 3 OTP requests per 10 minutes per mobile number.
* **Success `200`:** `{ sessionId, expiresInSeconds: 300, isNewUser: boolean }`

---

#### `POST /api/auth/verify-otp` — Verify OTP & Issue JWT
* **Auth:** Public
* **Body:** `{ "mobileNumber": "+919876543210", "otp": "482910", "sessionId": "auth_sess_..." }`
* **Success `200`:** `{ accessToken, refreshToken, expiresIn: 3600, user: { userId, fullName, role, languagePreference } }`
* **Error `401`:** `INVALID_OTP` — incorrect OTP or expired session.

---

#### `POST /api/auth/refresh` — Refresh Access Token
* **Auth:** Public
* **Body:** `{ "refreshToken": "..." }`
* **Success `200`:** `{ accessToken, refreshToken }`

---

### 3.2 Users Group

#### `GET /api/users/me` — Get Current User Profile
* **Auth:** Bearer JWT; any authenticated role
* **Success `200`:** Returns `User` entity for caller.

---

#### `PATCH /api/users/me` — Update User Profile
* **Auth:** Bearer JWT; any authenticated role
* **Mutable fields:** `fullName`, `languagePreference`, `avatarUrl`, `addresses`
* **Immutable fields (rejected):** `role`, `mobileNumber`, `isBlocked`
* **Success `200`:** Returns updated `User`.

---

### 3.3 Workers Group

#### `GET /api/workers` — Search Available Workers
* **Auth:** Bearer JWT; `CUSTOMER`, `ADMIN`
* **Query params:**
  - `serviceCategory`: `ServiceCategory` enum (optional)
  - `experienceTier`: `STANDARD | SENIOR | MASTER` (optional) — **ADDED v1.1**
  - `latitude`: number (required for distance sort)
  - `longitude`: number (required for distance sort)
  - `radiusKm`: number (optional, default 10)
  - `page`, `limit`
* **Security:** Never exposes `WorkerPrivate` data. Response is strictly `Worker` public fields.
* **Success `200`:** Array of `Worker` items + `distanceMeters` field added to each.

---

#### `GET /api/workers/:workerId` — Get Worker Public Profile
* **Auth:** Bearer JWT; any authenticated user
* **Success `200`:** `Worker` profile + skills + cooperative badges + `TrustScore.currentScore`.

---

#### `PATCH /api/workers/me` — Worker Updates Own Profile
* **Auth:** Bearer JWT; `WORKER`
* **Mutable:** `languagesSpoken`, `avatarUrl`, skill descriptions (pre-verification)
* **Immutable via this endpoint:** `societyId`, `experienceTier` (set by Society Admin), `workerCode`
* **Success `200`:** Updated `Worker` document.

---

#### `PATCH /api/workers/me/availability` — Toggle Operational Availability
* **Auth:** Bearer JWT; `WORKER`
* **Body:**
  ```json
  {
    "isOnline": true,
    "availabilityStatus": "AVAILABLE",
    "currentLocation": { "type": "Point", "coordinates": [75.5762, 31.3260] }
  }
  ```
* **Validation:** Coordinates in `[longitude, latitude]` order within WGS84 bounds. Cannot go `AVAILABLE` if `kycVerificationStatus !== 'VERIFIED'`.
* **Success `200`:** Updated availability.

---

### 3.4 Services Catalog Group

#### `GET /api/services` — List Active Services
* **Auth:** Public / Any
* **Query params:** `category` (optional)
* **Success `200`:** Active `Service` items localized to user language preference.

---

#### `GET /api/services/:serviceId` — Get Service Details
* **Auth:** Public / Any
* **Success `200`:** Full `Service` document with add-ons and base labor price.

---

### 3.5 Bookings Lifecycle Group

#### `POST /api/bookings` — Create Standard Service Booking
* **Auth:** Bearer JWT; `CUSTOMER`
* **Body:**
  ```json
  {
    "serviceId": "64f1a2b3c4d5e6f7a8b9c020",
    "bookingType": "STANDARD",
    "scheduledStartTime": "2026-09-12T10:00:00.000Z",
    "serviceAddress": {
      "addressLine1": "Plot 14, Model Town",
      "city": "Jalandhar",
      "state": "Punjab",
      "pincode": "144003",
      "location": { "type": "Point", "coordinates": [75.5801, 31.3214] }
    },
    "requiredWorkerCount": 1,
    "notes": "Main kitchen drain is clogged."
  }
  ```
* **Validation:**
  - `bookingType` must be `STANDARD`, `COMMUNITY_POOL`, or `VOICE_BOOKING`. Do NOT use this endpoint for `EMERGENCY_SOS`.
  - Coordinates must fall within an active `Region` (`$geoIntersects` check).
  - `scheduledStartTime` must be ≥30 minutes from `now`.
* **Side effects:** Resolves `regionId`, `federationId`, `servicingSocietyId`. Generates cryptographic 4-digit OTP; stores HMAC hash. Sets `status = 'REQUESTED'`. Sets `reallocationCount = 0`, `declinedWorkerIds = []`.
* **Success `201`:** Created `Booking` entity.

---

#### `POST /api/bookings/sos` — Create Emergency SOS Booking
* **Auth:** Bearer JWT; `CUSTOMER`
* **Body:**
  ```json
  {
    "serviceId": "64f1a2b3c4d5e6f7a8b9c021",
    "serviceAddress": {
      "addressLine1": "House 22, Green Colony",
      "city": "Kapurthala",
      "state": "Punjab",
      "pincode": "144601",
      "location": { "type": "Point", "coordinates": [75.3832, 31.3808] }
    },
    "emergencyDescription": "Gas leak from kitchen pipe"
  }
  ```
* **Validation:**
  - `scheduledStartTime` is not required — SOS is immediate dispatch.
  - Coordinates must fall within an active `Region`.
* **Side effects:** Creates `Booking` with `bookingType = 'EMERGENCY_SOS'`, `status = 'REQUESTED'`. Immediately broadcasts to all `AVAILABLE + VERIFIED` workers within 7 km (simultaneous, not sequential). OTP hash generated.
* **Success `201`:** Created `Booking` entity. Dispatch broadcasts simultaneously.

---

#### `GET /api/bookings/:bookingId` — Get Booking Details
* **Auth:** Bearer JWT; `CUSTOMER` (owner), `WORKER` (assigned), `ADMIN`
* **OTP Redaction Rule (ADR-03):** The 4-digit plaintext PIN is **ONLY** included in the response when: `caller.role === 'CUSTOMER'` **AND** `caller.userId === booking.userId` **AND** `booking.status === 'ARRIVED'`. In all other cases, the OTP field is omitted from the response.
* **Success `200`:** `Booking` document.

---

#### `GET /api/bookings` — List Bookings (Filtered)
* **Auth:** Bearer JWT
* **Query params:** `status`, `bookingType`, `page`, `limit`, `teamId`
* **Role scoping (enforced server-side):**
  - `CUSTOMER`: `userId === caller.userId`
  - `WORKER`: `workerId === caller.workerId`
  - `SOCIETY_ADMIN`: `servicingSocietyId === caller.societyId` OR `referringSocietyId === caller.societyId`
  - `FEDERATION_ADMIN`: `federationId === caller.federationId`
* **Success `200`:** Paginated `Booking[]`.

---

#### `POST /api/bookings/:bookingId/accept` — Worker Accepts Booking
* **Auth:** Bearer JWT; `WORKER`
* **Transition:** `ALLOCATED → ACCEPTED` (or `REQUESTED → ACCEPTED` for SOS)
* **SOS atomic race:** Uses `findOneAndUpdate({ _id, status: 'REQUESTED' })`. Returns `409 SOS_ALREADY_CLAIMED` if the booking was already accepted by another worker.
* **Success `200`:** Status updated to `ACCEPTED`.

---

#### `POST /api/bookings/:bookingId/decline` — Worker Declines Booking
* **Auth:** Bearer JWT; `WORKER`
* **Transition:** `ALLOCATED → REQUESTED` (Booking re-enters dispatch pool. No `DECLINED` state.)
* **Body:** `{ "reason": "DISTANCE_TOO_FAR" }`
* **Side effects:** `workerId = null`, `reallocationCount++`, caller's `workerId` appended to `declinedWorkerIds`. Dispatch event logged in `dispatchLog[].action = 'DECLINED'`. Re-dispatch triggered per reallocation rules (Section 2.2).
* **Success `200`:** `{ message: "Booking returned to dispatch pool.", reallocationCount: 1 }`

---

#### `POST /api/bookings/:bookingId/start-travel` — Worker Starts Travel
* **Auth:** Bearer JWT; `WORKER`
* **Transition:** `ACCEPTED → IN_TRANSIT`
* **Side effects:** `actualStartTime = now()`. Live tracking pipeline opened.
* **Success `200`:** Status `IN_TRANSIT`.

---

#### `POST /api/bookings/:bookingId/arrive` — Worker Arrives
* **Auth:** Bearer JWT; `WORKER`
* **Body:** `{ "location": { "type": "Point", "coordinates": [75.5802, 31.3215] } }`
* **Validation:** Worker coordinates must be within **200 meters** of `serviceAddress.location` (MongoDB `$geoNear` distance check).
* **Transition:** `IN_TRANSIT → ARRIVED`
* **Side effects (ADR-03):** Generates fresh plaintext OTP from stored hash for delivery. Sends WebSocket push / FCM notification revealing 4-digit PIN to customer only.
* **Success `200`:** Status `ARRIVED`.

---

#### `POST /api/bookings/:bookingId/verify-otp` — Verify Doorstep OTP
* **Auth:** Bearer JWT; `WORKER`
* **Body:** `{ "otp": "4821" }`
* **Validation:**
  - Compute `HMAC-SHA256(otp, bookingId + userId)`. Compare with `security.otpHash`.
  - On mismatch: increment `security.failedAttempts`. If `failedAttempts >= 5`: set `security.lockedUntil = now + 15min`, return `423 OTP_ATTEMPTS_EXCEEDED`.
  - If `security.lockedUntil` is set and `now < lockedUntil`: return `423` without verification.
* **Transition:** `ARRIVED → IN_PROGRESS`
* **Side effects:** `security.verifiedAt = now()`.
* **Success `200`:** Status `IN_PROGRESS`.

---

#### `POST /api/bookings/:bookingId/complete` — Worker Completes Service
* **Auth:** Bearer JWT; `WORKER`
* **Pre-flight checks:**
  1. `WorkProof` record exists with ≥1 `beforeWorkPhotos` AND ≥1 `afterWorkPhotos`.
  2. No `materialRequests[]` item has `status = 'PENDING_APPROVAL'`.
* **Transition:** `IN_PROGRESS → COMPLETED`
* **Side effects:** `completedAt = now()`. Payment escrow captured. Cooperative revenue distribution triggered asynchronously. `Worker.availabilityStatus = 'AVAILABLE'`. Customer prompted to leave a review.
* **Success `200`:** Status `COMPLETED`.

---

#### `POST /api/bookings/:bookingId/cancel` — Cancel Booking
* **Auth:** Bearer JWT; `CUSTOMER`, `WORKER`, `ADMIN`
* **Body:** `{ "reason": "Customer emergency rescheduling" }`
* **Allowed source states:** `REQUESTED`, `ALLOCATED`, `ACCEPTED`, `IN_TRANSIT`, `ARRIVED`. (Admins only: `IN_PROGRESS`)
* **Side effects:** Worker freed to `AVAILABLE`. Cancellation fee assessed per state policy.
* **Success `200`:** Status `CANCELLED`.

---

### 3.6 Material Requests Group (Revised v1.1)

> [!NOTE]
> **Breaking change from v1.0:** The single `material-cost/authorize` endpoint is replaced by a resource-oriented `materialRequests` sub-resource supporting up to 3 independent requests per booking.

#### `POST /api/bookings/:bookingId/material-requests` — Submit Material Request
* **Auth:** Bearer JWT; `WORKER`
* **Allowed state:** `IN_PROGRESS`
* **Body:**
  ```json
  {
    "claimedAmount": 450,
    "description": "Replacement 1-inch brass ball valve — item purchased from local hardware",
    "receiptImageUrl": "https://cdn.gigsevak.coop/receipts/rec_01.jpg"
  }
  ```
* **Validation:**
  - `claimedAmount > 0`
  - `description` required
  - Cannot submit if any existing request is `PENDING_APPROVAL` (`409 MATERIAL_REQUEST_PENDING`)
  - Cannot submit if `materialRequests.length >= 3` (`409 MATERIAL_REQUEST_LIMIT`)
* **Side effects:** New `MaterialRequest` created with `status = 'PENDING_APPROVAL'`. In-app prompt + push notification sent to customer with receipt photo and amount.
* **Success `201`:** `{ requestId, status: 'PENDING_APPROVAL', claimedAmount: 450 }`

---

#### `POST /api/bookings/:bookingId/material-requests/:requestId/approve` — Customer Approves Request
* **Auth:** Bearer JWT; `CUSTOMER` (booking owner)
* **Transition:** `PENDING_APPROVAL → APPROVED`
* **Side effects:**
  - `booking.pricing.materialAmount += request.claimedAmount`
  - `totalAmount` recalculated
  - Payment gateway notified if pre-authorization in use
* **Success `200`:** `{ requestId, status: 'APPROVED', updatedPricing: CanonicalPricingBreakdown }`

---

#### `POST /api/bookings/:bookingId/material-requests/:requestId/reject` — Customer Rejects Request
* **Auth:** Bearer JWT; `CUSTOMER` (booking owner)
* **Transition:** `PENDING_APPROVAL → REJECTED`
* **Side effects:** No pricing change. Worker notified via socket. Worker may renegotiate or proceed without the material.
* **Success `200`:** `{ requestId, status: 'REJECTED' }`

---

#### `GET /api/bookings/:bookingId/material-requests` — List All Material Requests
* **Auth:** Bearer JWT; `CUSTOMER` (owner), `WORKER` (assigned), `ADMIN`
* **Success `200`:** Array of `MaterialRequest[]` with statuses.

---

### 3.7 Work Proof Group

#### `POST /api/bookings/:bookingId/work-proof` — Submit Work Proof
* **Auth:** Bearer JWT; `WORKER`
* **Body:**
  ```json
  {
    "stage": "BEFORE",
    "photoUrls": ["https://cdn.gigsevak.coop/proofs/b1.jpg"],
    "location": { "type": "Point", "coordinates": [75.5801, 31.3214] },
    "workNotes": "Severe leak at pipe elbow joint."
  }
  ```
* **`stage`:** `BEFORE` or `AFTER`
* **Success `201`:** Proof recorded.

---

#### `GET /api/bookings/:bookingId/work-proof` — Get Work Proof
* **Auth:** Bearer JWT; `CUSTOMER`, `WORKER`, `ADMIN`
* **Success `200`:** `WorkProof` document.

---

### 3.8 Reviews Group

#### `POST /api/bookings/:bookingId/review` — Submit Customer Review
* **Auth:** Bearer JWT; `CUSTOMER` (booking owner)
* **Allowed state:** Booking must be `COMPLETED`. One review per booking (unique index on `bookingId`).
* **Body:**
  ```json
  {
    "rating": 5,
    "categoryRatings": {
      "punctuality": 5,
      "workQuality": 5,
      "behavior": 5,
      "transparency": 5
    },
    "tags": ["PUNCTUAL", "CLEAN_WORK"],
    "comment": "Prompt arrival and clean workmanship."
  }
  ```
* **Validation:**
  - `rating` must be integer 1–5.
  - `tags` must be array of valid `CanonicalReviewTag` values. Max 5 tags. Invalid value returns `422 INVALID_REVIEW_TAG`.
  - `categoryRatings.*` must each be integer 1–5.
* **Side effects:** `Worker.metrics.averageRating` updated (denormalized). Async `TrustScore` recalculation triggered. Tags factored into `punctualityWeight` and `customerRatingWeight`.
* **Success `201`:** Published `Review` document.

---

#### `GET /api/workers/:workerId/reviews` — Get Worker Public Reviews
* **Auth:** Public / Any
* **Query params:** `page`, `limit`, `tag` (filter by tag)
* **Success `200`:** Paginated public reviews (only `isPublic = true`).

---

### 3.9 Complaints Group

#### `POST /api/bookings/:bookingId/complaints` — File a Complaint
* **Auth:** Bearer JWT; `CUSTOMER`, `WORKER`
* **Body:**
  ```json
  {
    "category": "POOR_WORKMANSHIP",
    "severity": "HIGH",
    "description": "Pipe leaked again within 2 hours.",
    "evidencePhotoUrls": ["https://cdn.gigsevak.coop/complaints/c1.jpg"]
  }
  ```
* **Side effects:** Creates `Complaint` in `SUBMITTED` state. Society Admin of `servicingSocietyId` is alerted. Complaint code assigned.
* **Success `201`:** `Complaint` ticket.

---

#### `GET /api/complaints/:complaintId` — Get Complaint Details
* **Auth:** Bearer JWT; Complainant, Accused, or Admin.
* **Success `200`:** `Complaint` document.

---

#### `PATCH /api/complaints/:complaintId/resolve` — Resolve Complaint (Admin)
* **Auth:** Bearer JWT; `SOCIETY_ADMIN`, `FEDERATION_ADMIN`, `SYSTEM_ADMIN`
* **RBAC:**
  - `SOCIETY_ADMIN`: Can resolve `LOW` or `MEDIUM` severity complaints. Max refund ₹1,000.
  - `FEDERATION_ADMIN`: Can resolve `HIGH` or `CRITICAL`. Full refund authority.
* **Body:**
  ```json
  {
    "resolutionAction": "PARTIAL_REFUND",
    "refundAmount": 800,
    "comments": "Worker admitted to incomplete pipe sealing. Partial refund approved."
  }
  ```
* **Success `200`:** `Complaint` updated to `RESOLVED` with resolution audit embedded.

---

### 3.10 Payments & Settlement Group

#### `POST /api/bookings/:bookingId/payment` — Initialize Payment
* **Auth:** Bearer JWT; `CUSTOMER`
* **Body:** `{ "gatewayProvider": "RAZORPAY" }`
* **Success `200`:** Payment intent, gateway order ID, and exact `CanonicalPricingBreakdown`.

---

#### `POST /api/payments/:paymentId/refund` — Execute Refund
* **Auth:** Bearer JWT; `SOCIETY_ADMIN`, `FEDERATION_ADMIN`, `SYSTEM_ADMIN`
* **Body:** `{ "amount": 500, "reason": "Arbitration refund per CMP-2026-0041" }`
* **Success `200`:** Payment status `REFUNDED`.

---

### 3.11 Tracking Telemetry Group

#### `POST /api/bookings/:bookingId/tracking` — Post GPS Telemetry
* **Auth:** Bearer JWT; `WORKER`
* **Allowed state:** Booking must be `IN_TRANSIT`.
* **Body (single event):**
  ```json
  {
    "location": { "type": "Point", "coordinates": [75.5780, 31.3240] },
    "heading": 180.5,
    "speedKmh": 25.2,
    "accuracyMeters": 8.0,
    "timestamp": "2026-09-10T17:15:00.000Z"
  }
  ```
* **Batch body (offline sync):**
  ```json
  {
    "events": [
      { "location": {...}, "timestamp": "2026-09-10T17:10:00.000Z" },
      { "location": {...}, "timestamp": "2026-09-10T17:11:00.000Z" }
    ]
  }
  ```
* **Validation:** Max 50 events per batch request. Backend sets `createdAt = now()`. If `timestamp < (now - 24h)`, sets `isDelayed = true`. Delayed events excluded from live tracking display but retained for audit.
* **Success `200`:** Telemetry ingested. Returns `{ accepted: N, delayed: M }`.

---

#### `GET /api/bookings/:bookingId/tracking` — Get Current Location / Route
* **Auth:** Bearer JWT; `CUSTOMER` (booking owner), `ADMIN`
* **Response:** Latest `TrackingEvent` coordinates (live) or full route array (completed bookings). Delayed events excluded from live view.
* **Success `200`:** `{ latest: TrackingEvent, route: TrackingEvent[] }`

---

### 3.12 Admin Operations Group

#### `GET /api/admin/workers` — List Managed Workers
* **Auth:** Bearer JWT; `SOCIETY_ADMIN`, `FEDERATION_ADMIN`, `SYSTEM_ADMIN`
* **Scoping (server-enforced):**
  - `SOCIETY_ADMIN`: `{ societyId: caller.societyId }` injected.
  - `FEDERATION_ADMIN`: `{ federationId: caller.federationId }` injected.
* **Query params:** `kycVerificationStatus`, `availabilityStatus`, `experienceTier`, `page`, `limit`
* **Success `200`:** Paginated `Worker[]`.

---

#### `PATCH /api/admin/workers/:workerId` — Manage Worker Status / KYC
* **Auth:** Bearer JWT; `SOCIETY_ADMIN` (own society), `FEDERATION_ADMIN`, `SYSTEM_ADMIN`
* **Mutable fields:**
  ```json
  {
    "kycVerificationStatus": "VERIFIED",
    "membershipStatus": "ACTIVE_MEMBER",
    "shareholderFolioNumber": "PB-JAL-SH-9921",
    "experienceTier": "SENIOR"
  }
  ```
* **RBAC:** `SOCIETY_ADMIN` can set `experienceTier` up to `SENIOR`. `FEDERATION_ADMIN` or `SYSTEM_ADMIN` required for `MASTER` tier.
* **Success `200`:** Updated `Worker` document.

---

#### `GET /api/admin/societies` — List Societies
* **Auth:** Bearer JWT; Admin roles
* **Scoping:** `SOCIETY_ADMIN` returns own society only. `FEDERATION_ADMIN` returns all federation societies.
* **Success `200`:** `Society[]`

---

#### `GET /api/admin/regions` — List Regions
* **Auth:** Bearer JWT; Admin roles
* **Scoping:**
  - `SOCIETY_ADMIN`: Returns only regions in `Society.jurisdictionRegionIds`.
  - `FEDERATION_ADMIN`: Returns all regions where `Region.federationId === caller.federationId`.
  - `SYSTEM_ADMIN`: Returns all regions globally.
* **Success `200`:** `Region[]` with GeoJSON polygons.

---

#### `PATCH /api/admin/bookings/:bookingId/reassign` — Reassign Worker
* **Auth:** Bearer JWT; `SOCIETY_ADMIN` (own society), `SYSTEM_ADMIN`
* **Body:**
  ```json
  {
    "newWorkerId": "64f1a2b3c4d5e6f7a8b9c088",
    "reassignmentReason": "Original worker vehicle breakdown"
  }
  ```
* **Validation:**
  - Booking must be in `REQUESTED`, `ALLOCATED`, `ACCEPTED`, or `IN_TRANSIT`. Prohibited if `IN_PROGRESS` or later.
  - `newWorkerId` must be `AVAILABLE` and `kycVerificationStatus = 'VERIFIED'`.
  - Previous worker freed to `AVAILABLE`.
* **Success `200`:** Booking reassigned and new worker notified.

---

*End of API Contract v1.1*
