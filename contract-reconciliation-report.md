# GigSevak Contract Reconciliation Report

**Document:** `contract-reconciliation-report.md`  
**Version:** v1.1 Reconciliation Pass  
**Date:** September 10, 2026  
**Purpose:** Identify and resolve every cross-document contradiction before backend implementation begins.

---

## 1. Cross-Document Contradiction Matrix

| Domain | Canonical Contract v1 | API Contract v1 | RBAC v1 | ADR | Contradiction Found | Resolution |
|---|---|---|---|---|---|---|
| **Worker Pricing** | `Worker.pricing.{hourlyRate, baseVisitFee}` present alongside `Service.baseLaborPrice` | API does not define how price is computed | RBAC: Society Admin cannot alter base prices | Review (Issue 9): Recommended removing `Worker.baseServicePrice`, add `experienceTier` | **DIRECT CONFLICT**: Worker has autonomous `hourlyRate` but cooperative principle forbids arbitrary pricing | **RESOLVED** → See Section 3.1 |
| **Financial Model** | `CanonicalPricingBreakdown` defined, comment says "18% GST" inline | API references breakdown in request/response but no calculation documented | Not mentioned | Not mentioned | 18% GST stated as fact, but it is a document assumption, not legally verified. `baseLaborAmount` split rules use different percentages (85/10 or 85/9/1) with no formula specified | **RESOLVED** → See Section 3.2 |
| **Region Hierarchy** | `Region` has no `societyId` or `federationId` field. `Society` lists `jurisdictionRegionIds[]` | API: `GET /api/admin/regions` says Society Admin restricted to `jurisdictionRegionIds` | RBAC: Society Admin sees "Authorized regions" scoped via `Society.jurisdictionRegionIds` but `Region` has no back-reference | Not mentioned | **STRUCTURAL GAP**: RBAC region scope relies on `Society.jurisdictionRegionIds` (a Society-side array), but Region itself has no owner. `Federation Admin` cannot query `Region` by federation without this link. | **RESOLVED** → See Section 3.3 |
| **WorkerPrivate Fields** | `WorkerPrivate` contains: `aadhaarNumberMasked`, `panNumber`, `bankAccount`, `emergencyContact`, `verificationAudit`. Missing: `dateOfBirth`, `gender`, `insurance`, `schedulePreferences`, `earnings` | Not referenced | RBAC (Issue 11): Says Society Admin can view `phone, dateOfBirth, gender, kyc, insurance, schedulePreferences, earnings` — but NONE of these fields exist in `WorkerPrivate` | Not mentioned | **STRUCTURAL GAP**: RBAC specifies fields that don't exist in the canonical schema | **RESOLVED** → See Section 3.4 |
| **Trust Score Baseline** | Contract v1: baseline `70.0`, provisional until `>= 10 bookings` | Not referenced | Not referenced | Review (Issue 5): Recommended baseline `75.0`, provisional until `5 bookings`. Contract adopted `70.0` and `10 bookings` | **INCONSISTENCY**: Review says 75.0/5; Contract says 70.0/10. Review recommended 75.0 but Contract chose 70.0 | **RESOLVED** → Retain v1 contract values: **70.0 baseline, 10 bookings** (more conservative, safer for cooperative standing). Document as approved policy. |
| **Reviews — Tags** | Contract v1: No `tags` field exists. Only `categoryRatings` | Not referenced | Not referenced | Review (Issue 10): Recommended canonical enum tags `'PUNCTUAL'`, `'CLEAN_WORK'`, etc. | **MISSING**: Review recommended `tags`, but they were never added to canonical contract | **RESOLVED** → See Section 3.6 |
| **Material Approval API** | Contract v1: `materialDetails` sub-document embedded in `Booking` (single request, single approval). API: `POST /material-cost`, `PATCH /material-cost/authorize`. ADR: `PATCH /material-cost/approve` and `PATCH /material-cost/reject` as separate endpoints | API contract: `PATCH /api/bookings/:bookingId/material-cost/authorize` with body `{action: "APPROVE"/"REJECT"}`. ADR: separate `approve`/`reject` routes. RBAC example: `POST /bookings/:bookingId/material-cost/authorize` (inconsistent HTTP verb) | Not referenced | ADR: uses `PATCH /material-cost/approve` and `PATCH /material-cost/reject` | **TRIPLE INCONSISTENCY** in endpoint design. Resource oriented vs action-based. RBAC middleware example uses wrong verb. Single vs multiple requests unclear. | **RESOLVED** → See Section 3.7 |
| **Emergency SOS** | Contract v1: No `bookingType` field. Status enum has no SOS-specific states. | API: No SOS endpoint or flow defined | Not referenced | Review (Issue 14): Described emergency dispatch logic. ADR: Not addressed | **MISSING**: Emergency SOS described in review but not implemented in Contract or API | **RESOLVED** → See Section 3.8 |
| **Worker Decline / Reallocation** | Contract v1: `DECLINED` is a status in the enum. Review (Issue 7) says booking returns to `REQUESTED` after decline. No `reallocationCount` field in Booking. | API contract: `DECLINED → REQUESTED` described in state table but Booking entity has no `reallocationCount` | Not referenced | Not mentioned in ADR | **INCONSISTENCY**: `DECLINED` is in status enum but should not be a durable state per review. Schema missing `reallocationCount` | **RESOLVED** → See Section 3.9 |
| **Tracking TTL** | Contract v1: TTL on `createdAt` (correct). `timestamp` = sensor time. Both fields defined. `TrackingEvent` only emitted during `IN_TRANSIT` | API: TTL mentioned. No explicit definition of `timestamp` vs `createdAt` semantics | Not referenced | Not mentioned | **MINOR GAP**: Semantic distinction not formally documented. Behavior for delayed/offline events not specified | **RESOLVED** → See Section 3.10 |
| **Booking Lifecycle** | `DECLINED` is a valid enum value, but review says it should cycle back to `REQUESTED` | API state table has `DECLINED → REQUESTED` re-dispatch, but the Booking entity keeps `DECLINED` in enum | Not referenced | Not mentioned | Ambiguity around whether `DECLINED` is persisted or transient | **RESOLVED** → See Section 3.9 |

---

## 2. Terminology Audit — Cross-Document Consistency

The following terms were audited for consistency across all five documents.

| Term | Contract v1 | API Contract | RBAC | ADR | Review | Status |
|---|---|---|---|---|---|---|
| `servicingSocietyId` | ✅ Used | ✅ Used | ✅ Used | ✅ Used | ✅ Recommended | **Consistent** |
| `referringSocietyId` | ✅ Used | ✅ Used | ✅ Used | ✅ Used | ✅ Recommended | **Consistent** |
| `societyId` (generic) | ✅ Used in Worker, Society, WorkerPrivate indexes | ✅ Used in admin scope | ✅ Used in middleware | ✅ Used | — | **Consistent** — `societyId` on Worker entity is the worker's cooperative membership, distinct from Booking's `servicingSocietyId` |
| `workerId` | ✅ | ✅ | ✅ | ✅ | ✅ | **Consistent** |
| `userId` | ✅ | ✅ | ✅ | ✅ | ✅ | **Consistent** |
| `bookingId` | ✅ | ✅ | ✅ | ✅ | ✅ | **Consistent** |
| `federationId` | ✅ | ✅ | ✅ | ✅ | ✅ | **Consistent** |
| `regionId` | ✅ | ✅ | ✅ | ✅ | — | **Consistent** |
| `serviceId` | ✅ | ✅ | — | — | — | **Consistent** |
| Booking status `DECLINED` | ✅ In enum | ✅ But shown as transient | — | — | ✅ Says it's transient | **FIXED** in v1.1 |
| `materialDetails` | ✅ Contract | `material-cost` path in API | — | `materialDetails` (DB) | `materialApproval` | **FIXED** in v1.1 — Standardized to `materialDetails` |
| Worker availability states | `'AVAILABLE' \| 'ON_JOB' \| 'OFF_DUTY' \| 'SUSPENDED'` | `AVAILABLE` used | — | — | — | **Consistent** |
| Complaint status | Contract: `SOCIETY_INVESTIGATION` | Not enumerated | — | — | Review: recommended `SOCIETY_INVESTIGATION` | **Consistent** |
| Role names | 5 roles defined | ✅ Used consistently | ✅ | ✅ | — | **Consistent** |
| `baseLaborAmount` | ✅ Contract | ✅ API | — | — | ✅ Review recommended | **Consistent** |
| `platformFee` (field) | ✅ Contract, 5% | ✅ API | — | — | ✅ Review | **Consistent** |
| `taxAmount` | ✅ Contract | ✅ API | — | — | ✅ Review | **Consistent** |
| Review `categoryRatings` | ✅ | ✅ | — | — | — | **Consistent** |
| Review `tags` | ❌ Missing in Contract | ❌ Missing in API | — | — | ✅ Recommended | **ADDED** in v1.1 |
| `experienceTier` | ❌ Not in Worker schema | ❌ Not in API | — | — | ✅ Recommended in Issue 9 | **ADDED** in v1.1 |
| `bookingType` | ❌ Not in Booking schema | ❌ Not in API | — | — | ✅ Recommended in Issue 14 | **ADDED** in v1.1 |
| `reallocationCount` | ❌ Not in Booking schema | — | — | — | ✅ Recommended in Issue 7 | **ADDED** in v1.1 |

---

## 3. Resolution Details

### 3.1 Worker Pricing — RESOLVED

**What conflicted:**
- `Service.baseLaborPrice` is the cooperative-approved standard tariff.
- `Worker.pricing.hourlyRate` and `Worker.pricing.baseVisitFee` give individual workers the ability to set arbitrary prices — directly contradicting cooperative pricing governance.
- Review (Issue 9) recommended removing arbitrary worker pricing, adding `experienceTier`.
- Contract v1 kept both `Service.baseLaborPrice` AND `Worker.pricing.hourlyRate`.

**Decision selected:** Remove `Worker.pricing.hourlyRate` and `Worker.pricing.baseVisitFee`. Add `Worker.experienceTier`. The canonical price calculation is:

```
Effective Labor Price = Service.baseLaborPrice × ExperienceTierMultiplier × Region.demandMultiplier
```

where `ExperienceTierMultiplier` is cooperative-approved and set by `SOCIETY_ADMIN`:
- `STANDARD`: 1.00×
- `SENIOR`: 1.15×
- `MASTER`: 1.25×

**Why:** Cooperative governance requires standardized pricing. Workers cannot unilaterally set their own rates; the society collectively sets them through the experience tier mechanism.

**Files changed:** `canonical-data-contract-v1.1.md`, `api-contract-v1.1.md`, `architecture-decisions-v1.1.md`

---

### 3.2 Financial Model — RESOLVED

**What conflicted:**
- `18% GST` was stated as fact in v1 contract comments.
- The cooperative split was described (85/10/5 or 85/9/1/5) but the exact formula for computing each field was never written down.
- Tax on material amounts vs labor amounts was ambiguous.
- Rounding behavior was never specified.

**Decision selected:**

Authoritative pricing formula (documented in `canonical-data-contract-v1.1.md` Section 1.3):

```
1. baseLaborAmount  = Service.baseLaborPrice × ExperienceTierMultiplier × Region.demandMultiplier
2. materialAmount   = sum of all approved material requests (0 if none)
3. additionalCharges = any admin-approved scope expansions (0 by default)
4. taxableBase      = baseLaborAmount + additionalCharges
   (NOTE: materialAmount is NOT taxed — it is direct cost reimbursement to worker)
5. taxAmount        = taxableBase × taxRate
   (taxRate is configurable per Federation; DEFAULT ASSUMPTION for pilot: 18%
    ⚠️ IMPORTANT: 18% GST is an ARCHITECTURAL ASSUMPTION for Punjab pilot only.
    Legal verification required before production launch. If service is GST-exempt
    under cooperative exemptions, taxRate = 0%.)
6. platformFee      = baseLaborAmount × 0.05   (5% of labor only)
7. totalAmount      = baseLaborAmount + materialAmount + additionalCharges + taxAmount + platformFee

REVENUE DISTRIBUTION (from totalAmount — platformFee — materialAmount):
  laborNet = baseLaborAmount + additionalCharges
  
  Standard (non-pooled, same society):
    workerPayoutAmount       = laborNet × 0.85  + materialAmount
    servicingSocietyAmount   = laborNet × 0.10
    referringSocietyAmount   = 0
    platformReserveAmount    = laborNet × 0.05

  Pooled (cross-society, referringSocietyId is set):
    workerPayoutAmount       = laborNet × 0.85  + materialAmount
    servicingSocietyAmount   = laborNet × 0.09
    referringSocietyAmount   = laborNet × 0.01
    platformReserveAmount    = laborNet × 0.05

ROUNDING: All monetary values truncated to 2 decimal places (INR paise precision).
          Use integer paise internally to prevent floating point drift.
          Display only: round to nearest rupee for customer-facing invoices.

INVARIANT CHECK: workerPayoutAmount + servicingSocietyAmount + referringSocietyAmount 
                + platformReserveAmount + taxAmount + platformFee 
                MUST equal totalAmount (within 1 paise floating tolerance).
```

**Why:** A finance engine cannot be built from ambiguous comments. Every field must have an exact derivation formula with unambiguous dependencies.

**Files changed:** `canonical-data-contract-v1.1.md`

---

### 3.3 Region Hierarchy — RESOLVED

**What conflicted:**
- `Region` schema had no `societyId` or `federationId`. It was a standalone geographic entity.
- RBAC relied on `Society.jurisdictionRegionIds[]` to scope Society Admins to their legal territory.
- `Federation Admin` had no way to query `Region` by federation without traversing Society joins.
- The relationship was one-sided: Society knows its Regions, but Region doesn't know its Society or Federation.

**Decision selected:** Add `federationId` directly to `Region`. Retain `Society.jurisdictionRegionIds[]` for Society-to-Region mapping. Do NOT add `societyId` to Region because a Region can span multiple societies.

```
Federation (1) ──owns──> Region (many) via Region.federationId
Society (1) ──covers──> Region (many) via Society.jurisdictionRegionIds[]
Region does NOT have a single societyId because multiple societies can share border regions.
```

**Why adding `federationId` to Region:**
- Federation Admins can do `Region.find({ federationId: caller.federationId })` without traversing Society collection.
- Worker discovery `$geoNear` queries can filter by federation.
- Booking assignment validates that the service address falls within a Region that belongs to the booking's federation.
- RBAC middleware: `enforceRegionFederationScope` checks `Region.federationId === caller.federationId`.

**Files changed:** `canonical-data-contract-v1.1.md`, `rbac-and-admin-scope-v1.1.md`

---

### 3.4 WorkerPrivate Fields — RESOLVED

**What conflicted:**
- `canonical-contract-review.md` (Issue 11 / RBAC) listed fields that Society Admin can access: `phone`, `dateOfBirth`, `gender`, `kyc`, `insurance`, `schedulePreferences`, `earnings`.
- `WorkerPrivate` schema in Contract v1 did NOT contain `dateOfBirth`, `gender`, `insurance`, `schedulePreferences`, or `earnings`.
- `gender` was in `Worker` (public entity), not `WorkerPrivate`.

**Decision selected:**

**Data Tiers for Worker Information:**

**Tier 1 — Public (`Worker` entity, visible to all authenticated users):**
`fullName`, `avatarUrl`, `workerCode`, `primaryServiceCategory`, `skills[]`, `languagesSpoken`, `availabilityStatus`, `metrics.*`, `kycVerificationStatus` (status only, not documents), `membershipStatus`, `experienceTier`

**Tier 2 — Operational (`Worker` entity, visible to assigned booking customer + admins):**
`societyId`, `federationId`, `primaryRegionId`, `operatingRegionIds`, `isOnline`, `lastActiveAt`, `currentLocation` (during active booking only)

**Tier 3 — Protected-Operational (`WorkerPrivate`, Society Admin accessible — masked):**
`dateOfBirth`, `gender` (moved from Worker public to here — OPEN DECISION: see Open Decisions), `phone` (mobileNumber, masked last 4), `aadhaarNumberMasked`, `aadhaarFrontDocUrl`, `aadhaarBackDocUrl`, `policeClearanceCertUrl`, `verificationAudit`, `insurance`, `schedulePreferences`, `earnings` (cooperative dividend history, not bank account)

**Tier 4 — Highly Sensitive (`WorkerPrivate`, Worker + System Admin only):**
`aadhaarVerificationHash`, `panNumber`, `bankAccount.accountNumberEncrypted`, `bankAccount.ifscCode`, `bankAccount.upiId`, `emergencyContact` (full details)

**Note on `gender`:** Currently in `Worker` (public). Review (Issue 11) implies it should be in the admin-accessible tier. **OPEN DECISION: whether gender is public or protected.** For now, retained in Worker (public) with note.

**Files changed:** `canonical-data-contract-v1.1.md`, `rbac-and-admin-scope-v1.1.md`

---

### 3.5 Trust Score — RESOLVED

**What conflicted:**
- Review (Issue 5) recommended: baseline `75.0`, provisional until `5 bookings`.
- Contract v1 adopted: baseline `70.0`, provisional until `>= 10 bookings`.
- Two authoritative documents with different values for the same policy.

**Decision selected:** **Retain Contract v1 values: 70.0 baseline, 10 completed bookings.**

**Why:** `70.0` is a more conservative starting value for a cooperative that depends on community trust. `10 completed bookings` provides a statistically more reliable sample than 5. The review's `75.0` recommendation was made before the final business case was established. The contract, which post-dated the review, is the later authoritative document.

**Policy (authoritative, appears in all v1.1 documents):**
- New KYC-verified worker: `currentScore = 70.0`, `isProvisional = true`
- `isProvisional` remains `true` until `completedBookingsCount >= 10`
- Once `isProvisional = false`, the full weighted formula is applied
- `confidenceScore = min(completedBookingsCount / 10, 1.0)` (linear ramp)

**Files changed:** `canonical-data-contract-v1.1.md`

---

### 3.6 Reviews — Tags — RESOLVED

**What conflicted:**
- Review (Issue 10) recommended canonical enum tags and free-form prohibition.
- Contract v1 `Review` entity has `categoryRatings` but no `tags` field at all.

**Decision selected:** Add both `categoryRatings` (retained) AND `tags` (new) to the `Review` entity. Both fields serve different purposes: `categoryRatings` provides structured quantitative scores; `tags` provide quick qualitative signals for TrustScore computation.

**Canonical enum:**
```typescript
type CanonicalReviewTag =
  | 'PUNCTUAL'         // Positive
  | 'CLEAN_WORK'       // Positive
  | 'EXPERT_DIAGNOSIS' // Positive
  | 'FAIR_PRICING'     // Positive
  | 'POLITE_BEHAVIOR'  // Positive
  | 'SAFETY_CONSCIOUS' // Positive
  | 'LATE_ARRIVAL'     // Negative
  | 'MESSY_WORK'       // Negative
  | 'OVERCHARGING'     // Negative
  | 'UNPROFESSIONAL';  // Negative
```
**Rules:**
- `tags` is an array of `CanonicalReviewTag`.
- Free-form strings are **prohibited** — API validation must reject any value not in the enum.
- Maximum 5 tags per review.
- Tags are factored into TrustScore computation (positive tags reinforce relevant weights; negative tags trigger penalty review).

**Files changed:** `canonical-data-contract-v1.1.md`, `api-contract-v1.1.md`

---

### 3.7 Material Approval API — RESOLVED

**What conflicted:**
- Contract v1: single embedded `materialDetails` sub-document (implies only one material request per booking).
- API Contract v1: `POST /material-cost`, `PATCH /material-cost/authorize` with body `{action: "APPROVE"/"REJECT"}`.
- ADR (architecture-decisions.md): `PATCH /material-cost/approve` and `PATCH /material-cost/reject` as separate endpoints.
- RBAC middleware example: `POST /bookings/:bookingId/material-cost/authorize` (wrong HTTP verb for state change).

**Decision selected:** Use a **resource-oriented** model with support for **multiple material requests per booking**. A worker may discover multiple separate parts needed at different stages of `IN_PROGRESS`.

**Authoritative API design:**
```
POST   /api/bookings/:bookingId/material-requests
  → Worker creates a new material request (allowed state: IN_PROGRESS)
  → Returns { requestId, status: 'PENDING_APPROVAL' }

POST   /api/bookings/:bookingId/material-requests/:requestId/approve
  → Customer approves the specific request
  → Updates Booking pricing.materialAmount += request.claimedAmount

POST   /api/bookings/:bookingId/material-requests/:requestId/reject
  → Customer rejects the specific request
  → No change to pricing; worker must renegotiate or proceed without

GET    /api/bookings/:bookingId/material-requests
  → List all material requests for this booking (customer + worker + admin)
```

**Schema change:** `Booking.materialDetails` (single sub-document) replaced by `Booking.materialRequests[]` (array).

**Rules:**
- Maximum 3 material requests per booking (prevents abuse).
- Worker cannot submit a new request if any existing one is still `PENDING_APPROVAL`.
- `POST /api/bookings/:bookingId/complete` is **rejected** if any request is in `PENDING_APPROVAL`.
- If all requests are `APPROVED` or `REJECTED`, completion is allowed.
- `Booking.pricing.materialAmount` = sum of all `APPROVED` request amounts.

**Files changed:** `canonical-data-contract-v1.1.md`, `api-contract-v1.1.md`, `architecture-decisions-v1.1.md`

---

### 3.8 Emergency SOS — RESOLVED

**What conflicted:**
- Review (Issue 14) specified Emergency SOS dispatch logic in detail.
- Contract v1 `Booking` had no `bookingType` field.
- API Contract had no SOS endpoint.
- ADR did not address Emergency SOS.

**Decision selected:** Add `bookingType` field to `Booking` entity. Add SOS-specific dispatch rules to API contract. No special SOS booking status states — the same state machine applies, but the dispatch engine behaves differently.

```typescript
bookingType: 'STANDARD' | 'EMERGENCY_SOS' | 'COMMUNITY_POOL' | 'VOICE_BOOKING';
```

**SOS dispatch flow:**
1. Customer submits `POST /api/bookings` with `bookingType: 'EMERGENCY_SOS'`
2. Backend simultaneously sends offer to ALL `AVAILABLE + VERIFIED` workers within 7 km
3. First worker to POST `/api/bookings/:bookingId/accept` wins via **atomic `findOneAndUpdate({ status: 'REQUESTED' })`** — only succeeds if status is still `REQUESTED`
4. All other workers receive socket event `{ type: 'SOS_CLAIMED', bookingId }` — their accept calls return `409 INVALID_STATE_TRANSITION`
5. Booking transitions `REQUESTED → ACCEPTED` directly (skips `ALLOCATED` state — see state machine update)
6. 7 km emergency radius is authoritative (from review). After 3 minutes with no acceptance, radius expands to 12 km.

**Files changed:** `canonical-data-contract-v1.1.md`, `api-contract-v1.1.md`

---

### 3.9 Worker Decline / Reallocation — RESOLVED

**What conflicted:**
- Contract v1 `Booking.status` enum includes `'DECLINED'` as a value.
- Review (Issue 7) recommended `DECLINED` is not a durable state — booking should return to `REQUESTED`.
- API contract state table shows `ALLOCATED → DECLINED → re-dispatch to REQUESTED`.
- No `reallocationCount` field existed in Booking schema.

**Decision selected:** `DECLINED` is **NOT** a durable booking status. It is a **dispatch event**, not a booking state.

**Authoritative rules:**
- When a worker declines: a `DispatchEvent` record is created (or logged as an audit entry). The Booking immediately transitions `ALLOCATED → REQUESTED` (never touches `DECLINED`).
- `DECLINED` is **removed** from the Booking status enum.
- `reallocationCount: number` field is **added** to `Booking`.
- `declinedWorkerIds: string[]` field is **added** to `Booking` — so declined workers are not re-offered the same booking.

**Reallocation rules:**
- `reallocationCount < 3`: Re-dispatch within same society (same 10 km radius).
- `reallocationCount >= 3`: Expand to 12 km inter-cooperative pool.
- If no worker accepts within 5 minutes after the 3rd decline: Booking transitions to `CANCELLED` with `cancellationDetails.reason = 'NO_WORKER_AVAILABLE'`.

**Files changed:** `canonical-data-contract-v1.1.md`, `api-contract-v1.1.md`

---

### 3.10 Tracking TTL — RESOLVED

**What conflicted:**
- Contract v1 correctly separated `timestamp` (sensor time) and `createdAt` (ingestion time).
- TTL was correctly placed on `createdAt`.
- But the semantics were not formally documented, and behavior for offline/delayed events was unspecified.

**Decision selected:**

```
timestamp  = The instant the GPS sensor recorded the reading on the worker device.
             This is the authoritative event time for route reconstruction.
             This value CANNOT be trusted for TTL (worker device clock may be wrong).
             
createdAt  = The instant the backend ingested the event from the API.
             This is the authoritative ingestion time.
             TTL index MUST be on createdAt (not timestamp).
             TTL duration: 7 days (604,800 seconds).

Delayed events: If a worker was offline and bulk-syncs GPS points when connectivity resumes,
  the `timestamp` values will be historical but `createdAt` will be the sync time.
  Route reconstruction uses `timestamp` for ordering.
  Events with `timestamp` older than 24 hours at time of ingestion are accepted but
  flagged with `isDelayed: true` — they are valid for audit but excluded from
  live tracking display.

Max batch size: 50 events per POST /api/bookings/:bookingId/tracking call.
```

**Files changed:** `canonical-data-contract-v1.1.md`, `api-contract-v1.1.md`

---

## 4. Final Quality Gate Results

### A. Resolved Contradictions (Complete List)

1. ✅ Worker arbitrary pricing removed; `experienceTier` + `Service.baseLaborPrice` is authoritative.
2. ✅ Financial formula fully documented with per-field calculation, tax assumption labeled, rounding rules defined.
3. ✅ Region hierarchy gap: `federationId` added to `Region`. Society → Region link retained via `Society.jurisdictionRegionIds[]`.
4. ✅ WorkerPrivate fields gap: Added `dateOfBirth`, `insurance`, `schedulePreferences`, `earnings` to WorkerPrivate Tier 3.
5. ✅ Trust Score baseline conflict: 70.0 / 10 bookings is the authoritative single policy.
6. ✅ Reviews `tags` field added with canonical enum; free-form prohibited.
7. ✅ Material API unified: resource-oriented, multiple requests supported, HTTP methods corrected.
8. ✅ Emergency SOS: `bookingType` field added; 7km simultaneous dispatch with atomic acceptance defined.
9. ✅ `DECLINED` removed from Booking status enum; `reallocationCount` + `declinedWorkerIds` added.
10. ✅ Tracking TTL semantics: `timestamp` vs `createdAt` formally defined; delayed event handling specified.

### B. Open Decisions (Require Human/Business Approval)

| # | Open Decision | Impact | Default Assumption |
|---|---|---|---|
| **OD-01** | **GST Rate:** Is the GigSevak service exempt from GST under cooperative or agricultural exemptions? 18% is a document assumption only. | Financial: Every invoice amount, payout, and settlement figure changes. | 18% applied for pilot. Legal review required before production launch. |
| **OD-02** | **Gender field visibility:** Should `Worker.gender` remain public (current placement in `Worker`) or be moved to `WorkerPrivate` Tier 3 (protected)? | RBAC and DPDPA compliance. Some customers want to choose a female worker. Making it private breaks this UX flow. | Retained as public in `Worker` with a note. |
| **OD-03** | **Payment gateway:** Which provider handles multi-party cooperative settlements: Razorpay Route, Cashfree Marketplace, or direct NEFT settlement engine? | Settlement architecture, API keys, webhook design. | Razorpay is listed as default. Confirm before backend implementation. |
| **OD-04** | **SMS / OTP gateway:** Which DLT-registered provider delivers OTP SMS in Punjabi and Hindi? | Auth flow reliability. | OPEN — no provider selected yet. |
| **OD-05** | **Complaint refund limit for Society Admin:** ₹1,000 limit is specified in RBAC. Is this the correct and legally agreed limit? | Disputes. Grievance governance. | ₹1,000 retained as assumption. |
| **OD-06** | **`VOICE_BOOKING` booking type:** Is phone-agent-initiated booking in scope for v1 backend? | API, admin interface complexity. | Enum value added but feature flagged. Not implemented in v1 backend. |

### C. Final Entity List

15 canonical entities (unchanged from v1.0), with the following structural changes:
- `Worker`: Removed `pricing.{hourlyRate, baseVisitFee, minimumBillableHours}`; Added `experienceTier`
- `Region`: Added `federationId`
- `Booking`: Removed `materialDetails` sub-doc; Added `materialRequests[]`; Removed `DECLINED` from status enum; Added `bookingType`, `reallocationCount`, `declinedWorkerIds`
- `Review`: Added `tags: CanonicalReviewTag[]`
- `WorkerPrivate`: Added `dateOfBirth`, `insurance`, `schedulePreferences`, `earnings`
- `TrackingEvent`: Added `isDelayed: boolean`

### D. Final Booking State Machine

```
[CREATE]
  ↓ POST /api/bookings
  
REQUESTED  ──(dispatch engine / SOS: simultaneous offer)──> ALLOCATED (STANDARD)
           ──(SOS: first accept wins)──────────────────────> ACCEPTED  (EMERGENCY_SOS)
           ──(POST /cancel by CUSTOMER/ADMIN)──────────────> CANCELLED

ALLOCATED  ──(POST /accept by WORKER)──────────────────────> ACCEPTED
           ──(POST /decline by WORKER)─────────────────────> [dispatch event logged]
           │    reallocationCount++, declinedWorkerIds += workerId
           │    workerId = null, status = REQUESTED
           └────────────────────────────────────────────────> REQUESTED (re-dispatch)
           ──(POST /cancel by CUSTOMER/ADMIN)──────────────> CANCELLED

ACCEPTED   ──(POST /start-travel by WORKER)────────────────> IN_TRANSIT
           ──(POST /cancel by CUSTOMER/ADMIN)──────────────> CANCELLED

IN_TRANSIT ──(POST /arrive by WORKER, geo-fence < 200m)────> ARRIVED
           │    [OTP revealed to customer via push/socket]
           ──(POST /cancel by CUSTOMER/ADMIN)──────────────> CANCELLED

ARRIVED    ──(POST /verify-otp by WORKER, salted HMAC)─────> IN_PROGRESS
           ──(POST /cancel by CUSTOMER/ADMIN)──────────────> CANCELLED

IN_PROGRESS──(POST /complete by WORKER)────────────────────> COMPLETED
           │    [WorkProof required: ≥1 before + ≥1 after]
           │    [No material requests in PENDING_APPROVAL]
           ──(POST /cancel — SOCIETY_ADMIN/SYSTEM_ADMIN only)> CANCELLED

COMPLETED  ──(terminal state, no further transitions)

CANCELLED  ──(terminal state, no further transitions)

NOTES:
• DECLINED is not a Booking status. It is a dispatch-level event.
• reallocationCount >= 3 triggers inter-cooperative pool (12 km radius).
• No accepts after 5 minutes post-3rd-decline → CANCELLED (reason: NO_WORKER_AVAILABLE).
• Emergency SOS: REQUESTED → ACCEPTED directly (no ALLOCATED intermediate).
```

### E. Final Pricing Formula

```
INPUTS:
  S  = Service.baseLaborPrice (cooperative rate card, INR)
  E  = ExperienceTierMultiplier (1.00 | 1.15 | 1.25 — cooperative-approved)
  D  = Region.demandMultiplier  (1.0 default, adjustable by Federation Admin)
  M  = sum of APPROVED materialRequests[*].claimedAmount
  X  = additionalCharges (admin-approved scope expansions, default 0)
  T  = taxRate (Federation-configured, default assumption 18% — OD-01)
  P  = 0.05 (platform fee percentage, fixed by System Admin)

STEP 1: baseLaborAmount      = S × E × D
STEP 2: materialAmount       = M
STEP 3: additionalCharges    = X
STEP 4: taxableBase          = baseLaborAmount + additionalCharges
STEP 5: taxAmount            = floor(taxableBase × T × 100) / 100  [paise-truncated]
STEP 6: platformFee          = floor(baseLaborAmount × P × 100) / 100
STEP 7: totalAmount          = baseLaborAmount + materialAmount + additionalCharges + taxAmount + platformFee

STEP 8: laborNet             = baseLaborAmount + additionalCharges

  Non-pooled (referringSocietyId = null):
    workerPayoutAmount       = floor(laborNet × 0.85 × 100) / 100 + materialAmount
    servicingSocietyAmount   = floor(laborNet × 0.10 × 100) / 100
    referringSocietyAmount   = 0
    platformReserveAmount    = floor(laborNet × 0.05 × 100) / 100

  Pooled (referringSocietyId ≠ null):
    workerPayoutAmount       = floor(laborNet × 0.85 × 100) / 100 + materialAmount
    servicingSocietyAmount   = floor(laborNet × 0.09 × 100) / 100
    referringSocietyAmount   = floor(laborNet × 0.01 × 100) / 100
    platformReserveAmount    = floor(laborNet × 0.05 × 100) / 100

INVARIANT (assert before storing):
  workerPayoutAmount + servicingSocietyAmount + referringSocietyAmount
  + platformReserveAmount + taxAmount + platformFee
  MUST equal totalAmount (allow ±1 paise rounding tolerance)
```

### F. Final RBAC Hierarchy

Roles are independent permission sets, not an inheritance chain. Each role is independently assigned. A user cannot hold multiple roles simultaneously (a worker cannot also be a society admin under the same account).

```
PERMISSION HIERARCHY (most → least privileged):

SYSTEM_ADMIN
│  Global unrestricted: all collections, all federations, all data.
│  Exclusive: GeoJSON boundary edits, platform fee config, system config.
│
FEDERATION_ADMIN
│  Scoped to: all societies and workers where Federation._id matches
│  Exclusive: demand multiplier edits, inter-society dispute appeals,
│             service catalog rate proposals
│
SOCIETY_ADMIN
│  Scoped to: workers/bookings where societyId OR servicingSocietyId 
│             OR referringSocietyId matches their society
│  Exclusive: first-line KYC verification, member onboarding,
│             low/medium complaint resolution (<= ₹1,000 refund)
│
WORKER
│  Scoped to: own profile, own assigned bookings, own work proof
│  Exclusive: accept/decline/arrive/verify-otp/complete transitions,
│             submit material requests
│
CUSTOMER
   Scoped to: own bookings, own profile, own reviews, own complaints
   Exclusive: create bookings, authorize material requests, submit reviews
```

### G. Implementation Readiness

Based on this reconciliation:
- All 10 cross-document contradictions are resolved.
- 6 open decisions remain that require business/legal confirmation (none are architecture-blocking for the schema itself).
- All entity schemas are internally consistent.
- All API endpoints are consistent with entity schemas.
- All RBAC rules reference existing entity fields.
- State machine is deterministic and machine-checkable.
- Financial formula is exact and reproducible.

> **NOT READY — OPEN DECISIONS REMAIN**
> 
> Specifically: **OD-01 (GST rate)** and **OD-03 (payment gateway)** must be confirmed before financial and payment backend can be implemented. The data model and API structure can proceed to implementation — these open decisions affect configuration values and external integrations, not schema design.
>
> Practical split:
> - **READY** for: Mongoose schema implementation, Express route scaffolding, auth/RBAC middleware, booking lifecycle, work proof, tracking, worker management, admin CRUD.
> - **BLOCKED** for: Payment gateway integration, invoice tax computation, cooperative payout settlement.

---

*End of Contract Reconciliation Report*
