# API Specification & Communication Contract

**Document:** `api-contract.md`  
**Platform:** GigSevak Cooperative Gig Platform  
**Target Applications:** `user-frontend`, `worker-frontend`, `admin-frontend`, and Shared Express/MongoDB Backend  
**Status:** Authoritative API Contract v1.0  
**Date:** September 10, 2026  

---

## 1. Global API Standards & Envelope Specification

All endpoints in the GigSevak ecosystem adhere strictly to standard RESTful principles, JSON payloads, and a standardized top-level response envelope.

### 1.1 Success Response Envelope
All successful requests (`200 OK`, `201 Created`) MUST return the following schema:
```json
{
  "success": true,
  "data": {},
  "message": "Human-readable confirmation message."
}
```

### 1.2 Error Response Envelope
All client or server error responses (`400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`) MUST return:
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
| `400 Bad Request` | `VALIDATION_ERROR` | Schema validation failed for request body/params. |
| `401 Unauthorized` | `UNAUTHENTICATED` | Missing, expired, or invalid JWT Bearer token. |
| `403 Forbidden` | `ACCESS_DENIED` | Role or regional/society scope does not permit action. |
| `404 Not Found` | `RESOURCE_NOT_FOUND` | Document does not exist or is soft-deleted. |
| `409 Conflict` | `INVALID_STATE_TRANSITION` | Transition violates the canonical state machine. |
| `409 Conflict` | `DUPLICATE_RESOURCE` | Unique index violation (e.g. mobile, workerCode). |
| `422 Unprocessable` | `INVALID_OTP` | Doorstep OTP verification failed (wrong PIN). |
| `423 Locked` | `OTP_ATTEMPTS_EXCEEDED` | 5 consecutive failed OTP entries; locked 15 mins. |
| `429 Too Many Req`| `RATE_LIMIT_EXCEEDED` | Exceeded API rate limits (e.g. OTP generation). |
| `500 Server Error` | `INTERNAL_SERVER_ERROR` | Unhandled exception logged with correlation ID. |

---

## 2. Booking State Machine & Transition Rules

The backend strictly enforces deterministic state transitions. Attempting an unpermitted transition returns HTTP `409 Conflict` with code `INVALID_STATE_TRANSITION`.

### 2.1 State Transition Matrix
| Source State | Destination State | Triggering Endpoint / Action | Allowed Actor | Side Effects & Validations |
|---|---|---|---|---|
| `[START]` | `REQUESTED` | `POST /api/bookings` | `CUSTOMER` | Pricing calculated; booking code generated; regional dispatch queue notified. |
| `REQUESTED` | `ALLOCATED` | Internal Dispatch Engine or Admin | `SYSTEM`, `ADMIN` | Worker matched by geospatial proximity & skills; worker availability locked to `ON_JOB`. |
| `REQUESTED` | `CANCELLED` | `POST /api/bookings/:id/cancel` | `CUSTOMER`, `ADMIN` | Zero cancellation fee charged. |
| `ALLOCATED` | `ACCEPTED` | `POST /api/bookings/:id/accept` | `WORKER` | Assigned worker accepts order; customer alerted via socket/push. |
| `ALLOCATED` | `DECLINED` | `POST /api/bookings/:id/decline` | `WORKER` | Booking returned to `REQUESTED` pool; re-dispatched to next available worker. Worker decline count incremented. |
| `ALLOCATED` | `CANCELLED` | `POST /api/bookings/:id/cancel` | `CUSTOMER`, `ADMIN` | No penalty. Worker freed to `AVAILABLE`. |
| `ACCEPTED` | `IN_TRANSIT` | `POST /api/bookings/:id/start-travel`| `WORKER` | Live tracking activated; GPS telemetry starts streaming into `TrackingEvent`. |
| `ACCEPTED` | `CANCELLED` | `POST /api/bookings/:id/cancel` | `CUSTOMER`, `ADMIN` | If customer cancels > 5 min after accept, minor travel cancellation fee may apply. |
| `IN_TRANSIT` | `ARRIVED` | `POST /api/bookings/:id/arrive` | `WORKER` | **Geo-fence validated** (worker within 200m of customer address). **Reveals 4-digit start OTP to customer (ADR-03)**. |
| `IN_TRANSIT` | `CANCELLED` | `POST /api/bookings/:id/cancel` | `CUSTOMER`, `ADMIN` | Standard cancellation penalty charged to customer. |
| `ARRIVED` | `IN_PROGRESS` | `POST /api/bookings/:id/verify-otp` | `WORKER` | Worker submits 4-digit PIN provided by customer. Salted hash verified. Service timer starts. |
| `ARRIVED` | `CANCELLED` | `POST /api/bookings/:id/cancel` | `CUSTOMER`, `ADMIN` | Cancellation fee charged. Requires explicit cancellation reason. |
| `IN_PROGRESS`| `COMPLETED` | `POST /api/bookings/:id/complete` | `WORKER` | **WorkProof validation check** (requires min 1 before + 1 after photo). Material approval check (cannot complete if material cost pending). Escrow settlement triggered. |
| `IN_PROGRESS`| `CANCELLED` | Admin Override Only | `SOCIETY_ADMIN`, `SYSTEM_ADMIN` | Emergency abort. Requires cooperative dispute logging. |

---

## 3. Detailed API Specifications by Functional Group

### 3.1 Authentication Group

#### 3.1.1 Request OTP for Login / Registration
* **Endpoint:** `POST /api/auth/login`
* **Auth Requirement:** Public (None)
* **Required Role:** Any
* **Request Body:**
  ```json
  {
    "mobileNumber": "+919876543210",
    "role": "CUSTOMER"
  }
  ```
* **Validation Rules:**
  * `mobileNumber`: Must match valid Indian E.164 pattern `^\+91[6-9]\d{9}$`.
  * `role`: Must be one of `CUSTOMER`, `WORKER`, `SOCIETY_ADMIN`, `FEDERATION_ADMIN`, `SYSTEM_ADMIN`.
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "sessionId": "auth_sess_99a81b2c",
      "expiresInSeconds": 300,
      "isNewUser": false
    },
    "message": "OTP sent successfully to registered mobile."
  }
  ```
* **Error Responses:**
  * `400 Bad Request` (`VALIDATION_ERROR`): Invalid mobile number format.
  * `429 Too Many Requests` (`RATE_LIMIT_EXCEEDED`): Max 3 OTP requests per 10 minutes.
* **Side Effects:** Generates 6-digit SMS OTP; logs auth attempt.

---

#### 3.1.2 Verify OTP & Issue Token
* **Endpoint:** `POST /api/auth/verify-otp`
* **Auth Requirement:** Public
* **Request Body:**
  ```json
  {
    "mobileNumber": "+919876543210",
    "otp": "482910",
    "sessionId": "auth_sess_99a81b2c"
  }
  ```
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1Ni...",
      "refreshToken": "d8a7c29e...",
      "expiresIn": 3600,
      "user": {
        "userId": "64f1a2b3c4d5e6f7a8b9c001",
        "mobileNumber": "+919876543210",
        "fullName": "Gurpreet Singh",
        "role": "CUSTOMER",
        "languagePreference": "pa"
      }
    },
    "message": "Authentication successful."
  }
  ```
* **Error Responses:**
  * `401 Unauthorized` (`INVALID_OTP`): Incorrect OTP or session expired.

---

#### 3.1.3 Refresh Access Token
* **Endpoint:** `POST /api/auth/refresh`
* **Auth Requirement:** Public
* **Request Body:** `{ "refreshToken": "d8a7c29e..." }`
* **Success Response (`200 OK`):** Returns new `accessToken` and `refreshToken`.

---

### 3.2 Users Group

#### 3.2.1 Get Current User Profile
* **Endpoint:** `GET /api/users/me`
* **Auth Requirement:** Bearer JWT
* **Required Role:** Any authenticated user
* **Success Response (`200 OK`):** Returns canonical `User` entity matching caller.

---

#### 3.2.2 Update Current User Profile
* **Endpoint:** `PATCH /api/users/me`
* **Auth Requirement:** Bearer JWT
* **Required Role:** Any authenticated user
* **Request Body:**
  ```json
  {
    "fullName": "Harpreet Kaur",
    "languagePreference": "pa",
    "avatarUrl": "https://cdn.gigsevak.coop/avatars/hk.jpg"
  }
  ```
* **Validation Rules:** Cannot change `role`, `mobileNumber`, or `isBlocked` via this endpoint.
* **Success Response (`200 OK`):** Returns updated `User` document.

---

### 3.3 Workers Group

#### 3.3.1 Search & List Available Workers (Public / Customer)
* **Endpoint:** `GET /api/workers`
* **Auth Requirement:** Bearer JWT
* **Required Role:** `CUSTOMER`, `ADMIN`
* **Request Parameters (Query):**
  * `serviceCategory`: (Optional) e.g. `PLUMBING`
  * `latitude`: (Required for distance sorting) number
  * `longitude`: (Required for distance sorting) number
  * `radiusKm`: (Optional, default 10) number
  * `page`: number
  * `limit`: number
* **Validation Rules:** Lat/Lng within pilot boundaries; never exposes `WorkerPrivate` data.
* **Success Response (`200 OK`):** Returns array of public `Worker` documents with distance in meters.

---

#### 3.3.2 Get Worker Public Profile by ID
* **Endpoint:** `GET /api/workers/:workerId`
* **Auth Requirement:** Bearer JWT
* **Required Role:** Any authenticated user
* **Success Response (`200 OK`):** Returns `Worker` profile, active skills, verified cooperative badges, and summary trust score.

---

#### 3.3.3 Worker Updates Own Profile
* **Endpoint:** `PATCH /api/workers/me`
* **Auth Requirement:** Bearer JWT
* **Required Role:** `WORKER`
* **Request Body:**
  ```json
  {
    "languagesSpoken": ["pa", "hi", "en"],
    "avatarUrl": "https://cdn.gigsevak.coop/workers/p1.jpg"
  }
  ```
* **Success Response (`200 OK`):** Returns updated `Worker` document.

---

#### 3.3.4 Toggle Worker Operational Availability
* **Endpoint:** `PATCH /api/workers/me/availability`
* **Auth Requirement:** Bearer JWT
* **Required Role:** `WORKER`
* **Request Body:**
  ```json
  {
    "isOnline": true,
    "availabilityStatus": "AVAILABLE",
    "currentLocation": {
      "type": "Point",
      "coordinates": [75.5762, 31.3260]
    }
  }
  ```
* **Validation Rules:** GeoJSON coordinates strictly `[longitude, latitude]`. Cannot toggle to `AVAILABLE` if KYC is unverified.
* **Success Response (`200 OK`):** Returns updated availability status.

---

### 3.4 Services Catalog Group

#### 3.4.1 List Active Services Catalog
* **Endpoint:** `GET /api/services`
* **Auth Requirement:** Public / Any
* **Request Parameters:** `category` (Optional)
* **Success Response (`200 OK`):** Returns list of active `Service` items localized to user preference.

---

#### 3.4.2 Get Service Details by ID
* **Endpoint:** `GET /api/services/:serviceId`
* **Auth Requirement:** Public / Any
* **Success Response (`200 OK`):** Returns full `Service` document with allowed add-ons and standard tariff.

---

### 3.5 Bookings Lifecycle Group

#### 3.5.1 Create Service Booking
* **Endpoint:** `POST /api/bookings`
* **Auth Requirement:** Bearer JWT
* **Required Role:** `CUSTOMER`
* **Request Body:**
  ```json
  {
    "serviceId": "64f1a2b3c4d5e6f7a8b9c020",
    "scheduledStartTime": "2026-09-12T10:00:00.000Z",
    "serviceAddress": {
      "addressLine1": "Plot 14, Model Town",
      "city": "Jalandhar",
      "state": "Punjab",
      "pincode": "144003",
      "location": {
        "type": "Point",
        "coordinates": [75.5801, 31.3214]
      }
    },
    "requiredWorkerCount": 1,
    "notes": "Main kitchen drain is clogged."
  }
  ```
* **Validation Rules:**
  * Coordinates must fall within an active `Region`.
  * `scheduledStartTime` must be at least 30 minutes in future.
* **Side Effects:**
  * Resolves servicing society and region.
  * Generates cryptographically secure 4-digit start PIN; stores salted HMAC in `security.otpHash`.
  * Status set to `REQUESTED`.
* **Success Response (`201 Created`):** Returns created `Booking` entity.

---

#### 3.5.2 Get Booking Details by ID
* **Endpoint:** `GET /api/bookings/:bookingId`
* **Auth Requirement:** Bearer JWT
* **Required Role:** `CUSTOMER` (owner), `WORKER` (assigned), `ADMIN`
* **Security Redaction Rules:**
  * Plaintext start OTP is strictly redacted **UNLESS** caller is the booking's `CUSTOMER` **AND** status is `ARRIVED` (ADR-03).
* **Success Response (`200 OK`):** Returns `Booking` document.

---

#### 3.5.3 List Bookings (Filtered)
* **Endpoint:** `GET /api/bookings`
* **Auth Requirement:** Bearer JWT
* **Query Parameters:** `status`, `page`, `limit`, `teamId`
* **Role Scoping:**
  * `CUSTOMER`: Automatically scoped to `userId === caller.userId`.
  * `WORKER`: Automatically scoped to `workerId === caller.workerId`.
  * `SOCIETY_ADMIN`: Automatically scoped to `servicingSocietyId === caller.societyId`.
* **Success Response (`200 OK`):** Paginated array of `Booking` items.

---

#### 3.5.4 Worker Accepts Booking
* **Endpoint:** `POST /api/bookings/:bookingId/accept`
* **Auth Requirement:** Bearer JWT
* **Required Role:** `WORKER`
* **Transition:** `ALLOCATED` $\rightarrow$ `ACCEPTED`
* **Success Response (`200 OK`):** Status updated to `ACCEPTED`.

---

#### 3.5.5 Worker Declines Booking
* **Endpoint:** `POST /api/bookings/:bookingId/decline`
* **Auth Requirement:** Bearer JWT
* **Required Role:** `WORKER`
* **Request Body:** `{ "reason": "DISTANCE_TOO_FAR" }`
* **Transition:** `ALLOCATED` $\rightarrow$ `DECLINED` (Triggers re-dispatch to `REQUESTED`)
* **Success Response (`200 OK`):** Booking released back to pool.

---

#### 3.5.6 Worker Starts Travel
* **Endpoint:** `POST /api/bookings/:bookingId/start-travel`
* **Auth Requirement:** Bearer JWT
* **Required Role:** `WORKER`
* **Transition:** `ACCEPTED` $\rightarrow$ `IN_TRANSIT`
* **Side Effects:** Sets `actualStartTime`; opens live tracking event pipeline.
* **Success Response (`200 OK`):** Status updated to `IN_TRANSIT`.

---

#### 3.5.7 Worker Arrives at Doorstep
* **Endpoint:** `POST /api/bookings/:bookingId/arrive`
* **Auth Requirement:** Bearer JWT
* **Required Role:** `WORKER`
* **Request Body:**
  ```json
  {
    "location": {
      "type": "Point",
      "coordinates": [75.5802, 31.3215]
    }
  }
  ```
* **Validation Rules:**
  * Coordinates must be within 200m radius of `serviceAddress.location`.
* **Transition:** `IN_TRANSIT` $\rightarrow$ `ARRIVED`
* **Side Effects (ADR-03):** Triggers WebSocket / push notification revealing the 4-digit start OTP to the customer.
* **Success Response (`200 OK`):** Status updated to `ARRIVED`.

---

#### 3.5.8 Verify Doorstep OTP & Start Work
* **Endpoint:** `POST /api/bookings/:bookingId/verify-otp`
* **Auth Requirement:** Bearer JWT
* **Required Role:** `WORKER`
* **Request Body:** `{ "otp": "4821" }`
* **Validation Rules:**
  * Computes `HMAC-SHA256(otp, bookingId + userId)` and compares against `security.otpHash`.
  * Max 5 attempts. Exceeding triggers `423 Locked`.
* **Transition:** `ARRIVED` $\rightarrow$ `IN_PROGRESS`
* **Success Response (`200 OK`):** Status updated to `IN_PROGRESS`.

---

#### 3.5.9 Material Cost Submission (Worker - ADR-02)
* **Endpoint:** `POST /api/bookings/:bookingId/material-cost`
* **Auth Requirement:** Bearer JWT
* **Required Role:** `WORKER`
* **Allowed State:** `IN_PROGRESS`
* **Request Body:**
  ```json
  {
    "claimedAmount": 450,
    "description": "Replacement 1-inch brass ball valve",
    "receiptImageUrl": "https://cdn.gigsevak.coop/receipts/rec_01.jpg"
  }
  ```
* **Side Effects:** Sets `materialDetails.status = 'PENDING_APPROVAL'`; sends in-app prompt to customer.
* **Success Response (`200 OK`):** Material claim submitted.

---

#### 3.5.10 Authorize Material Cost (Customer - ADR-02)
* **Endpoint:** `PATCH /api/bookings/:bookingId/material-cost/authorize`
* **Auth Requirement:** Bearer JWT
* **Required Role:** `CUSTOMER`
* **Request Body:** `{ "action": "APPROVE" }` or `{ "action": "REJECT", "reason": "Too expensive" }`
* **Side Effects:**
  * If approved: updates `pricing.materialAmount`, recalculates `totalAmount` and taxes. Sets `materialDetails.status = 'APPROVED'`.
  * If rejected: sets `materialDetails.status = 'REJECTED'`.
* **Success Response (`200 OK`):** Pricing updated.

---

#### 3.5.11 Worker Completes Service
* **Endpoint:** `POST /api/bookings/:bookingId/complete`
* **Auth Requirement:** Bearer JWT
* **Required Role:** `WORKER`
* **Validation Rules:**
  * Must have at least 1 verified `WorkProof` record with before/after photos.
  * Cannot complete if `materialDetails.status === 'PENDING_APPROVAL'`.
* **Transition:** `IN_PROGRESS` $\rightarrow$ `COMPLETED`
* **Side Effects:** Sets `completedAt`; triggers final payment capture and cooperative revenue distribution.
* **Success Response (`200 OK`):** Status updated to `COMPLETED`.

---

#### 3.5.12 Cancel Booking
* **Endpoint:** `POST /api/bookings/:bookingId/cancel`
* **Auth Requirement:** Bearer JWT
* **Required Role:** `CUSTOMER`, `WORKER`, `ADMIN`
* **Request Body:** `{ "reason": "Customer emergency rescheduling" }`
* **Allowed Transitions:** `REQUESTED`, `ALLOCATED`, `ACCEPTED`, `IN_TRANSIT`, `ARRIVED` $\rightarrow$ `CANCELLED`.
* **Side Effects:** Worker freed; cancellation fees assessed according to state matrix.
* **Success Response (`200 OK`):** Status updated to `CANCELLED`.

---

### 3.6 Work Proof Group

#### 3.6.1 Submit Work Proof Photos
* **Endpoint:** `POST /api/bookings/:bookingId/work-proof`
* **Auth Requirement:** Bearer JWT
* **Required Role:** `WORKER`
* **Request Body:**
  ```json
  {
    "stage": "BEFORE",
    "photoUrls": ["https://cdn.gigsevak.coop/proofs/b1.jpg"],
    "workNotes": "Severe leak at pipe elbow joint."
  }
  ```
* **Success Response (`201 Created`):** Proof recorded.

---

#### 3.6.2 Get Work Proof for Booking
* **Endpoint:** `GET /api/bookings/:bookingId/work-proof`
* **Auth Requirement:** Bearer JWT
* **Required Role:** `CUSTOMER`, `WORKER`, `ADMIN`
* **Success Response (`200 OK`):** Returns complete `WorkProof` document.

---

### 3.7 Reviews Group

#### 3.7.1 Submit Customer Review
* **Endpoint:** `POST /api/bookings/:bookingId/review`
* **Auth Requirement:** Bearer JWT
* **Required Role:** `CUSTOMER`
* **Request Body:**
  ```json
  {
    "rating": 5,
    "categoryRatings": {
      "punctuality": 5,
      "workQuality": 5,
      "behavior": 5,
      "transparency": 5
    },
    "comment": "Prompt arrival and clean workmanship.",
    "customerPhotos": []
  }
  ```
* **Side Effects:** Recalculates `Worker.metrics.averageRating` and triggers async update of `TrustScore`.
* **Success Response (`201 Created`):** Review published.

---

#### 3.7.2 Get Worker Public Reviews
* **Endpoint:** `GET /api/workers/:workerId/reviews`
* **Auth Requirement:** Public / Bearer JWT
* **Success Response (`200 OK`):** Paginated public reviews.

---

### 3.8 Complaints Group

#### 3.8.1 File a Dispute / Complaint
* **Endpoint:** `POST /api/bookings/:bookingId/complaints`
* **Auth Requirement:** Bearer JWT
* **Required Role:** `CUSTOMER`, `WORKER`
* **Request Body:**
  ```json
  {
    "category": "POOR_WORKMANSHIP",
    "severity": "HIGH",
    "description": "Pipe leaked again within 2 hours of completion.",
    "evidencePhotoUrls": ["https://cdn.gigsevak.coop/complaints/c1.jpg"]
  }
  ```
* **Side Effects:** Creates `Complaint` in `SUBMITTED` state; alerts Society Admin.
* **Success Response (`201 Created`):** Returns `Complaint` ticket.

---

#### 3.8.2 Get Complaint Details
* **Endpoint:** `GET /api/complaints/:complaintId`
* **Auth Requirement:** Bearer JWT
* **Required Role:** Complainant, Accused, or Admin.
* **Success Response (`200 OK`):** Returns `Complaint` document.

---

### 3.9 Payments & Settlement Group

#### 3.9.1 Initialize / Fetch Booking Payment
* **Endpoint:** `POST /api/bookings/:bookingId/payment`
* **Auth Requirement:** Bearer JWT
* **Required Role:** `CUSTOMER`
* **Request Body:** `{ "gatewayProvider": "RAZORPAY" }`
* **Success Response (`200 OK`):** Returns payment intent, gateway order ID, and exact pricing breakdown.

---

#### 3.9.2 Execute Refund
* **Endpoint:** `POST /api/payments/:paymentId/refund`
* **Auth Requirement:** Bearer JWT
* **Required Role:** `SOCIETY_ADMIN`, `FEDERATION_ADMIN`, `SYSTEM_ADMIN`
* **Request Body:** `{ "amount": 500, "reason": "Arbitration refund" }`
* **Success Response (`200 OK`):** Payment status set to `REFUNDED`.

---

### 3.10 High-Throughput Telemetry / Tracking Group

#### 3.10.1 Post Live Location Telemetry
* **Endpoint:** `POST /api/bookings/:bookingId/tracking`
* **Auth Requirement:** Bearer JWT
* **Required Role:** `WORKER`
* **Request Body:**
  ```json
  {
    "location": {
      "type": "Point",
      "coordinates": [75.5780, 31.3240]
    },
    "heading": 180.5,
    "speedKmh": 25.2,
    "accuracyMeters": 8.0,
    "timestamp": "2026-09-10T17:15:00.000Z"
  }
  ```
* **Allowed State:** Booking MUST be `IN_TRANSIT`.
* **Success Response (`200 OK`):** Telemetry ingested.

---

#### 3.10.2 Get Live Location Telemetry
* **Endpoint:** `GET /api/bookings/:bookingId/tracking`
* **Auth Requirement:** Bearer JWT
* **Required Role:** `CUSTOMER` (booking owner), `ADMIN`
* **Success Response (`200 OK`):** Returns latest `TrackingEvent` or live stream coordinates.

---

### 3.11 Admin Operations Group (Scoped RBAC)

#### 3.11.1 List Managed Workers
* **Endpoint:** `GET /api/admin/workers`
* **Auth Requirement:** Bearer JWT
* **Required Role:** `SOCIETY_ADMIN`, `FEDERATION_ADMIN`, `SYSTEM_ADMIN`
* **Backend Scoping Enforcement:**
  * `SOCIETY_ADMIN`: Filter injected automatically: `{ societyId: caller.societyId }`. Rejects query attempts for other societies.
  * `FEDERATION_ADMIN`: Filter injected automatically: `{ federationId: caller.federationId }`.
* **Success Response (`200 OK`):** Paginated worker roster.

---

#### 3.11.2 List Societies
* **Endpoint:** `GET /api/admin/societies`
* **Auth Requirement:** Bearer JWT
* **Required Role:** `SOCIETY_ADMIN` (returns own society), `FEDERATION_ADMIN` (returns federation societies), `SYSTEM_ADMIN`.
* **Success Response (`200 OK`):** Array of `Society` documents.

---

#### 3.11.3 List & Manage Regions
* **Endpoint:** `GET /api/admin/regions`
* **Auth Requirement:** Bearer JWT
* **Required Role:** Admin roles. `SOCIETY_ADMIN` restricted to `jurisdictionRegionIds`.
* **Success Response (`200 OK`):** Array of `Region` polygons.

---

#### 3.11.4 Manage Worker Status / KYC Approval
* **Endpoint:** `PATCH /api/admin/workers/:workerId`
* **Auth Requirement:** Bearer JWT
* **Required Role:** `SOCIETY_ADMIN` (for own society workers), `FEDERATION_ADMIN`, `SYSTEM_ADMIN`
* **Request Body:**
  ```json
  {
    "kycVerificationStatus": "VERIFIED",
    "membershipStatus": "ACTIVE_MEMBER",
    "shareholderFolioNumber": "PB-JAL-SH-9921"
  }
  ```
* **Success Response (`200 OK`):** Updated worker profile.

---

#### 3.11.5 Reassign Booking to Alternative Worker
* **Endpoint:** `PATCH /api/admin/bookings/:bookingId/reassign`
* **Auth Requirement:** Bearer JWT
* **Required Role:** `SOCIETY_ADMIN` (if booking belongs to own society), `SYSTEM_ADMIN`
* **Request Body:**
  ```json
  {
    "newWorkerId": "64f1a2b3c4d5e6f7a8b9c088",
    "reassignmentReason": "Original worker vehicle breakdown"
  }
  ```
* **Validation Rules:**
  * `newWorkerId` must be `AVAILABLE` and affiliated with the servicing society.
  * Previous worker reset to `AVAILABLE`.
* **Success Response (`200 OK`):** Booking reassigned and worker notified.

---

*End of API Contract (`api-contract.md`)*
