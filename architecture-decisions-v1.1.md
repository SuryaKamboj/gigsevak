# Architectural Decision Records (ADRs) v1.1 — GigSevak Cooperative Platform

**Document:** `architecture-decisions-v1.1.md`  
**Status:** Reconciled Architectural Baseline v1.1  
**Date:** September 10, 2026  
**Supersedes:** `architecture-decisions.md` (v1.0)

**Summary of v1.1 changes from v1.0:**
- ADR-02 updated: Material cost API design changed from dual PATCH endpoints to resource-oriented sub-resource supporting up to 3 requests per booking
- ADR-05 (NEW): Worker Pricing Model — resolves the conflict between `Worker.pricing.hourlyRate` and `Service.baseLaborPrice`
- ADR-06 (NEW): Emergency SOS Booking — formally documents the simultaneous dispatch + atomic acceptance model
- ADR-07 (NEW): Worker Decline & Reallocation — formally documents `DECLINED` as a dispatch event, not a booking state

---

## 1. Executive Summary

This document evaluates and definitively resolves all fundamental architectural conflicts. Four decisions from v1.0 are preserved and one is updated. Three new ADRs have been added to resolve conflicts discovered during the v1.1 cross-document reconciliation.

| # | Decision Topic | Status | Summary |
|---|---|---|---|
| **ADR-01** | Pilot Geography | **Approved, Unchanged** | Punjab (Jalandhar & Kapurthala Corridor) |
| **ADR-02** | Material-Cost Authorization | **Updated v1.1** | Resource-oriented sub-resource (up to 3 requests); separate approve/reject endpoints |
| **ADR-03** | OTP Verification Visibility | **Approved, Unchanged** | OTP revealed only after `ARRIVED` geo-fence |
| **ADR-04** | Community / Team Pooling Model | **Approved, Unchanged** | Individual `Booking` documents per worker, shared `teamId` |
| **ADR-05** | Worker Pricing Model | **NEW** | `Service.baseLaborPrice × ExperienceTier × demandMultiplier`; workers do not set their own prices |
| **ADR-06** | Emergency SOS Dispatch | **NEW** | Simultaneous broadcast to all available workers within 7km; atomic first-accept wins |
| **ADR-07** | Worker Decline & Reallocation | **NEW** | `DECLINED` is a dispatch event only; booking returns to `REQUESTED`; `reallocationCount` tracked |

---

## 2. ADR-01: Pilot Geography Selection

*(Unchanged from v1.0 — reproduced for completeness)*

### Decision
**Adopt Punjab (Jalandhar & Kapurthala Corridor)** as the primary canonical pilot geography.

### Rationale
- `worker-frontend` already contains Jalandhar/Kapurthala geo-coordinates, Verhoeff Aadhaar validation, and Punjabi (`pa`) i18n pack.
- Operates under a unified jurisdiction: *Punjab Cooperative Societies Act, 1961*.
- Underserved tier-2 corridor with high unmet demand and strong cooperative culture.
- `Region` schema is polygon-agnostic; adding Delhi NCR or any state requires only seeding new `Region` documents.

### Architectural Impact
- Default map center: Jalandhar `[75.5762, 31.3260]`
- Address autocomplete biased to Punjab bounds `(IN-PB)`
- SMS templates in Punjabi and Hindi via DLT-registered gateway (**OD-04: provider not yet selected**)
- Initial seed data: Regions `PUN-JAL-01`, `PUN-KAP-01`; affiliated Punjab societies

---

## 3. ADR-02: Material-Cost Authorization Workflow (Updated v1.1)

### Context
Workers frequently need to procure physical parts on-site (valves, capacitors, sealants). The platform must handle these costs transparently.

### Decision
**Option A (retained):** Worker submits in-app material request with description + receipt photo → Customer approves → Amount added to final invoice.

### What Changed in v1.1

**v1.0 design:** Single `materialDetails` sub-document; single pair of endpoints (`POST /material-cost`, `PATCH /material-cost/authorize`).

**Problem discovered:** A single sub-document assumes only one material request per booking. In reality, a plumber may discover a cracked fitting (₹120), then later a corroded coupling (₹85) — two independent procurement events. The v1.0 design had no mechanism for this without overwriting the first claim.

Additionally, `PATCH /material-cost/authorize` was semantically ambiguous (mixed HTTP verb and action semantics) and conflicted with the ADR v1.0 text which used separate `approve`/`reject` URLs.

**v1.1 design:** `Booking.materialRequests[]` — an array of `MaterialRequest` sub-documents. Dedicated resource-oriented endpoints.

### Authoritative API Design

```
POST   /api/bookings/:bookingId/material-requests
  → Worker creates a material request
  → Max 3 requests per booking
  → Cannot submit new request while any existing one is PENDING_APPROVAL

POST   /api/bookings/:bookingId/material-requests/:requestId/approve
  → Customer approves the specific request
  → booking.pricing.materialAmount += request.claimedAmount (auto-recalculated)

POST   /api/bookings/:bookingId/material-requests/:requestId/reject
  → Customer rejects; no pricing change

GET    /api/bookings/:bookingId/material-requests
  → List all requests for customer + worker + admin visibility
```

### Rules

| Rule | Specification |
|---|---|
| Max requests per booking | 3 |
| Blocking rule | Cannot submit new request if any is `PENDING_APPROVAL` |
| Completion gate | `POST /complete` fails if any request is `PENDING_APPROVAL` |
| Pricing update | `materialAmount` = sum of all `APPROVED` request amounts only |
| `REJECTED` requests | Excluded from pricing; worker may renegotiate verbally |

### Architectural Impact
- `Booking.materialDetails` (single sub-doc) REPLACED by `Booking.materialRequests[]`
- Frontend: Customer approval flow supports individual per-item decisions
- Frontend: Worker sees each request's status independently

---

## 4. ADR-03: OTP Verification Visibility & Lifecycle

*(Unchanged from v1.0 — reproduced for completeness)*

### Decision
**Customer sees 4-digit start OTP only when booking status is `ARRIVED`**, not on `ACCEPTED`.

### Rationale
- `ARRIVED` is geo-fence validated (worker within 200m of service address).
- If OTP were revealed on `ACCEPTED`, workers could call customers to obtain the PIN remotely and mark jobs as started without physically travelling.
- Plaintext OTP is **never stored** in the database. Only `HMAC-SHA256(PIN, bookingId + userId)` is stored.

### Architectural Impact
- `GET /api/bookings/:bookingId` redacts OTP unless `caller.role === 'CUSTOMER'` AND `status === 'ARRIVED'`
- `POST /arrive` triggers WebSocket push sending 4-digit PIN to customer
- Rate limit: 5 failed OTP attempts triggers `423 OTP_ATTEMPTS_EXCEEDED` with 15-minute lockout

---

## 5. ADR-04: Community Pooling & Multi-Worker Model

*(Unchanged from v1.0 — reproduced for completeness)*

### Decision
**Individual `Booking` document per worker**, unified under a shared `teamId`.

### Rationale
- No MongoDB write contention: each worker updates only their own document.
- Independent lifecycle, OTP handshake, and work proof per artisan.
- Clean cooperative accounting: each document maps to exactly one worker's labor payout.

### Schema
```typescript
teamId?: string | null;          // UUID linking all workers on one project
parentBookingId?: string | null; // Customer's originating booking reference
isTeamLead: boolean;             // Designates team coordinator
```

### Rule
`requiredWorkerCount > 1` → controller creates 1 reference + N individual `Booking` documents. Team project completes when all sibling bookings reach `COMPLETED`.

---

## 6. ADR-05: Worker Pricing Model (NEW)

### Context
Two competing pricing mechanisms existed in v1.0:
- `Service.baseLaborPrice`: the cooperative-approved standard tariff for each trade service.
- `Worker.pricing.hourlyRate` + `Worker.pricing.baseVisitFee`: individual worker-set rates.

These are fundamentally incompatible. Cooperative pricing governance requires standardization.

### Options Evaluated

| Option | Description | Verdict |
|---|---|---|
| **Option A: Service rate only** | `baseLaborPrice` is authoritative; all workers charge the same rate | Too rigid — penalizes masters vs apprentices |
| **Option B: Worker arbitrary rate** | Workers set their own `hourlyRate` | Violates cooperative pricing ethics; creates race-to-bottom or unfair premium confusion |
| **Option C: Service rate + experience tier multiplier** | `baseLaborPrice × ExperienceTierMultiplier × demandMultiplier` | **Selected** — transparent, cooperative-governed, meritocratic |

### Decision
**Option C: Cooperative-approved experience tier multiplier model.**

The effective price is:
```
Effective Labor Price = Service.baseLaborPrice × ExperienceTierMultiplier × Region.demandMultiplier
```

Workers do NOT set customer-facing prices independently. The `SOCIETY_ADMIN` grants experience tier upgrades after verifying completed job count and (for MASTER) certifications.

### Experience Tiers

| Tier | Multiplier | Granting Authority | Minimum Requirements |
|---|---|---|---|
| `STANDARD` | 1.00× | Auto (default) | New member |
| `SENIOR` | 1.15× | `SOCIETY_ADMIN` | ≥50 completed jobs |
| `MASTER` | 1.25× | `FEDERATION_ADMIN` or `SYSTEM_ADMIN` | ≥200 jobs + ITI/govt certification |

### Architectural Impact
- `Worker.pricing.{hourlyRate, baseVisitFee, minimumBillableHours}` **REMOVED**
- `Worker.experienceTier: ExperienceTier` **ADDED**
- `PATCH /api/admin/workers/:workerId` now accepts `experienceTier` update
- Booking pricing calculator reads `Service.baseLaborPrice`, `Worker.experienceTier`, `Region.demandMultiplier`
- Customer sees the final computed effective price — the underlying tier multiplier is visible on the worker's public profile for transparency

### Why This Matters for Cooperative Ethics
A cooperative cannot have members compete on price against each other — that destroys collective bargaining power. The tier system creates fair merit-based compensation while preserving cooperative rate solidarity. Customers always see the service rate card; workers earn more by improving skill, not by discounting.

---

## 7. ADR-06: Emergency SOS Dispatch Model (NEW)

### Context
`Booking.bookingType = 'EMERGENCY_SOS'` was described in the contract review but no formal dispatch model was defined. Standard sequential dispatch (wait for top-ranked worker → no → try next) is unsafe for emergencies (gas leaks, electrical shorts, active water bursts).

### Options Evaluated

| Option | Description | Verdict |
|---|---|---|
| **Option A: Sequential priority dispatch** | Same as standard; worker ranked by trust score and distance | **Rejected** — too slow for life-safety scenarios |
| **Option B: Simultaneous broadcast + first-accept** | All available verified workers within radius receive offer simultaneously; atomic first-accept wins | **Selected** |
| **Option C: Pre-assigned SOS teams** | Dedicated emergency squad always on standby | Not viable for cooperative; workers are independent artisans |

### Decision
**Option B: Simultaneous broadcast dispatch with atomic acceptance lock.**

### Authoritative SOS Rules

1. Customer submits `POST /api/bookings/sos`.
2. Backend resolves active region, identifies all workers matching `{ availabilityStatus: 'AVAILABLE', kycVerificationStatus: 'VERIFIED', currentLocation: { $near: { max: 7000m } } }`.
3. All qualifying workers receive a simultaneous socket event `{ type: 'SOS_DISPATCH', bookingId, distanceMeters }`.
4. First worker to call `POST /api/bookings/:id/accept` executes `findOneAndUpdate({ _id: bookingId, status: 'REQUESTED' }, { status: 'ACCEPTED', workerId: caller.workerId })`.
5. If the document update returns `null` (status already changed), the accept attempt returns `409 SOS_ALREADY_CLAIMED`.
6. Booking transitions directly `REQUESTED → ACCEPTED` (no `ALLOCATED` intermediate).
7. All other workers receive `{ type: 'SOS_CLAIMED', bookingId }` socket event — their accept calls will fail the atomic update.
8. If no worker accepts within **3 minutes**: radius expands to **12 km** and re-broadcast.
9. If no worker accepts within 5 minutes of the 12 km broadcast: booking transitions to `CANCELLED` with reason `'NO_WORKER_AVAILABLE'`. Customer receives alert to call emergency services if needed.

### Architectural Impact
- `Booking.bookingType` field ADDED (resolves missing field)
- `POST /api/bookings/sos` endpoint added (separate from `POST /api/bookings`)
- State machine: SOS bypasses `ALLOCATED` state
- Socket event types: `SOS_DISPATCH`, `SOS_CLAIMED` added to event catalog
- MongoDB atomic: `findOneAndUpdate` with status guard prevents double-acceptance

---

## 8. ADR-07: Worker Decline & Booking Reallocation Model (NEW)

### Context
The v1.0 state machine included `DECLINED` as a booking status value. The contract review (Issue 7) recommended `DECLINED` be treated as a transient event rather than a durable state, returning the booking to `REQUESTED`. There was no `reallocationCount` field. This created ambiguity and an implementation risk: frontends might display a `DECLINED` booking as terminated.

### Options Evaluated

| Option | Booking Status After Decline | Verdict |
|---|---|---|
| **Option A: `DECLINED` is a durable state** | Stays `DECLINED` until admin re-dispatches manually | **Rejected** — customer sees "declined" which feels like rejection/failure; requires manual admin intervention |
| **Option B: `DECLINED` is a dispatch event; booking returns to `REQUESTED`** | Returns to `REQUESTED`; dispatch engine re-runs automatically | **Selected** — transparent, automatic, no customer-visible failure state |

### Decision
**Option B: `DECLINED` is a dispatch event, not a booking state.**

When a worker declines:
1. A record is written to `Booking.dispatchLog[]` with `{ workerId, action: 'DECLINED', timestamp, reason }`.
2. Booking status transitions `ALLOCATED → REQUESTED`.
3. `workerId = null`, `reallocationCount++`, declined worker added to `declinedWorkerIds[]`.
4. Dispatch engine immediately re-runs (excluding `declinedWorkerIds`).

### Authoritative Reallocation Rules

| Condition | Dispatch Behavior |
|---|---|
| `reallocationCount < 3` | Re-dispatch within same society. Radius ≤10 km. Excludes `declinedWorkerIds`. |
| `reallocationCount >= 3` | Expand radius to 12 km. Include neighboring cooperative societies (`referringSocietyId` may be set). |
| No acceptance after 5 min post-3rd decline | `CANCELLED` with `reason: 'NO_WORKER_AVAILABLE'`. |

### Schema Changes
- `DECLINED` **REMOVED** from `Booking.status` enum
- `reallocationCount: number` **ADDED** to `Booking` (default: 0)
- `declinedWorkerIds: string[]` **ADDED** to `Booking` (default: [])
- `dispatchLog: DispatchLogEntry[]` **ADDED** to `Booking`

### Architectural Impact
- Frontend (customer): Booking remains in `REQUESTED` state visually — "Looking for an artisan..." — until a different worker accepts. No negative-looking status.
- Frontend (worker): Declined bookings disappear from the worker's queue; only active accepted bookings appear.
- Backend: Decline endpoint handler writes to `dispatchLog`, resets `workerId`, increments `reallocationCount`, and triggers re-dispatch asynchronously.
- Admin: `dispatchLog` provides full audit trail of all workers who were offered and declined a booking.

---

## 9. Architecture Decisions Verification Matrix

| ADR | Integrity | Security | Scalability | Cooperative Alignment |
|---|---|---|---|---|
| **ADR-01 (Punjab Pilot)** | Verified against `worker-frontend` geo assets | Punjab Co-op Societies Act compliant | GeoJSON schema is multi-region ready | Supports PACS & Labor Cooperatives |
| **ADR-02 v1.1 (Material Requests)** | Array prevents single-claim overwrite | Customer photo receipt required per request; explicit per-item approval | Max 3 requests limit prevents collection bloat | Transparent cost trail; protects worker reimbursement rights |
| **ADR-03 (OTP on ARRIVE)** | Geo-fence enforces physical presence | HMAC; never plaintext at rest; 5-attempt lockout | Socket push with SMS fallback | Eliminates ghost jobs; validates diligence |
| **ADR-04 (Team Pooling)** | Normalized documents; no write contention | Individual biometric proof per worker | Horizontal scale via independent write locks | Multi-society pooling without friction |
| **ADR-05 (Pricing Tiers)** | Single formula; zero ambiguity | Prevents arbitrary worker price manipulation | Denormalized multiplier cached on Worker | Cooperative pricing solidarity; meritocratic earnings |
| **ADR-06 (SOS Dispatch)** | Atomic accept prevents double-booking | Worker identity verified before SOS offer | Simultaneous socket broadcast scales horizontally | Life-safety response; cooperative emergency duty |
| **ADR-07 (Decline/Reallocate)** | `dispatchLog` provides full audit trail | Declined workers excluded from re-offer loop | Async re-dispatch doesn't block API response | Cooperative solidarity — no worker penalized for legitimate decline |

---

*End of Architecture Decision Records v1.1*
