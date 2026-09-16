# Role-Based Access Control (RBAC) & Scoping Architecture

**Document:** `rbac-and-admin-scope.md`  
**Platform:** GigSevak Cooperative Gig Platform  
**Target Applications:** `user-frontend`, `worker-frontend`, `admin-frontend`, and Shared Express/MongoDB Backend  
**Status:** Authoritative Security Specification v1.0  
**Date:** September 10, 2026  

---

## 1. Executive Summary & Principles

In a cooperative federation model, administrative boundaries are legal and jurisdictional, not merely stylistic. A local Primary Cooperative Society (e.g., Jalandhar Central Artisans Society) must never inspect worker records, financial ledgers, or customer disputes belonging to an independent neighboring society (e.g., Kapurthala Artisans Society).

### Core Security Tenets
1. **Server-Side Tenancy Enforcement:** Scoping predicates (`societyId`, `federationId`, `userId`) are extracted exclusively from cryptographically verified JWT claims. Query parameters supplied by the client are never trusted to define authorization scope.
2. **Principle of Least Privilege for PII:** Sensitive personally identifiable information (PII) stored in `WorkerPrivate` is segregated and accessible only on a strict need-to-know basis.
3. **Multi-Tier Dispute Governance:** Operational arbitration begins at the local Society level and escalates to the Apex Federation level if cross-society pooling or severe malpractice occurs.

---

## 2. Canonical Actor Roles

| Role Name | Scope & Identity | Typical User |
|---|---|---|
| `CUSTOMER` | Self-scoped. Can only view and mutate their own bookings, reviews, profile, and active orders. | Resident booking home repairs. |
| `WORKER` | Self-scoped. Can view and mutate their own profile, skills, availability, assigned bookings, and work proof. | Plumber, electrician, artisan. |
| `SOCIETY_ADMIN` | **Tenant-scoped** to a single `Society._id`. Authorized to manage affiliated workers, local bookings, KYC, and initial complaints. | Manager of a Primary Cooperative / PACS. |
| `FEDERATION_ADMIN` | **Federation-scoped** across all member societies belonging to `Federation._id`. Manages regional policies, appeals, and catalog tariffs. | State Cooperative Federation executive. |
| `SYSTEM_ADMIN` | **Global Platform Scope**. Unrestricted system oversight, boundary definitions, platform fee structures, and technical debugging. | GigSevak core technical team. |

---

## 3. Comprehensive RBAC Permissions Matrix

| Entity | Action | `CUSTOMER` | `WORKER` | `SOCIETY_ADMIN` | `FEDERATION_ADMIN` | `SYSTEM_ADMIN` |
|---|---|---|---|---|---|---|
| **User** | Read | Own profile | Own profile | Society workers' user records | Federation workers' user records | Full Access |
| | Update | Own profile | Own profile | None | None | Full Access |
| **Worker** | Read | Public profiles | Own profile | Own society workers | All federation workers | Full Access |
| | Update | None | Own profile (skills/status) | Own society workers (status/membership) | None | Full Access |
| **WorkerPrivate** | Read | ❌ NEVER | Own record | Own society workers (masked KYC) | Audit logs only | Emergency only |
| | Update | ❌ NEVER | Own record (pre-verify) | Verification status & audit notes | Appeal notes | Full Access |
| **Federation** | Read | Public details | Public details | Affiliated federation | Own federation | Full Access |
| | Update | ❌ NEVER | ❌ NEVER | ❌ NEVER | Own federation | Full Access |
| **Society** | Read | Public info | Affiliated society | Own society record | All federation societies | Full Access |
| | Update | ❌ NEVER | ❌ NEVER | Own office/contact | All federation societies | Full Access |
| **Region** | Read | Active regions | Operating regions | Authorized regions | All federation regions | Full Access |
| | Update | ❌ NEVER | ❌ NEVER | ❌ NEVER | Multipliers | Full Access |
| **Service** | Read | Public catalog | Public catalog | Public catalog | Full catalog | Full catalog |
| | Update | ❌ NEVER | ❌ NEVER | ❌ NEVER | Base prices / add-ons | Full Access |
| **Booking** | Create | Allowed | ❌ NEVER | Manual phone bookings | ❌ NEVER | Full Access |
| | Read | Own bookings | Assigned bookings | Own society bookings | Federation bookings | Full Access |
| | Transition | Cancel only | Accept/Travel/Arrive/Work | Reassign / Cancel / Intervene | Intervene on appeal | Full Access |
| **WorkProof** | Read | Own booking | Own booking | Own society bookings | Federation bookings | Full Access |
| | Create | ❌ NEVER | Assigned booking | ❌ NEVER | ❌ NEVER | Full Access |
| **Review** | Create | Own booking | ❌ NEVER | ❌ NEVER | ❌ NEVER | Full Access |
| | Read | Public reviews | Public reviews | Own society reviews | Federation reviews | Full Access |
| **TrustScore** | Read | Summary score | Own detailed score | Own society workers | Federation workers | Full Access |
| | Mutate | ❌ NEVER | ❌ NEVER | Endorsement points | Policy adjustment | Full Access |
| **Complaint** | Create | Own booking | Own booking | ❌ NEVER | ❌ NEVER | Full Access |
| | Resolve | ❌ NEVER | ❌ NEVER | Low/Med local complaints | High/Critical & Appeals | Full Access |
| **Payment** | Read | Own payment | Own payout share | Own society settlements | Federation ledgers | Full Access |
| | Refund | ❌ NEVER | ❌ NEVER | Authorized limits | Full refund authority | Full Access |

---

## 4. Deep-Dive Administrative Scoping Rules

### 4.1 Worker Records Access
* **Society Admin:**
  * Can query only workers where `Worker.societyId === caller.societyId`.
  * The backend Express controller MUST forcibly inject this clause:
    ```javascript
    const query = { societyId: req.user.societyId, ...filter };
    ```
  * If a Society Admin attempts to access `/api/admin/workers/:workerId` where the worker belongs to another society, the server immediately rejects the request with `403 Forbidden` (`ACCESS_DENIED`).
* **Federation Admin:**
  * Can access all workers where `Worker.federationId === caller.federationId`.
  * Allows cross-society compliance monitoring and state-wide skill gap analytics.

---

### 4.2 Region & Boundary Access
* **Society Admin:**
  * Restricted to regions listed in `Society.jurisdictionRegionIds`.
  * Can dispatch and view demand heatmaps only within their legally registered operational territory.
  * Cannot alter `Region` boundary coordinates, demand multipliers, or state tax parameters.
* **Federation Admin & System Admin:**
  * Federation Admin can adjust demand multipliers and service availability within federation regions.
  * System Admin possesses exclusive authority to modify GeoJSON boundary polygons.

---

### 4.3 Booking Access & Interventions
* **Society Admin:**
  * Can view and manage bookings where:
    `Booking.servicingSocietyId === caller.societyId` **OR** `Booking.referringSocietyId === caller.societyId`.
  * This allows the admin to monitor both jobs performed by their artisans and jobs booked by local residents that were pooled out.
* **Federation Admin:**
  * Can view all bookings where `Booking.federationId === caller.federationId`.
* **Worker Reassignment Authority:**
  * Only a `SOCIETY_ADMIN` (for their own society's workers) or `SYSTEM_ADMIN` can invoke `PATCH /api/admin/bookings/:bookingId/reassign`.
  * Reassignment is permitted only when a booking is in `REQUESTED`, `ALLOCATED`, `ACCEPTED`, or `IN_TRANSIT` (emergency breakdown). It is strictly prohibited once the booking reaches `IN_PROGRESS`.

---

### 4.4 Confidential PII & `WorkerPrivate` Scoping
To comply with the *Digital Personal Data Protection Act (DPDPA), 2023*:
* **Customer:** Has zero read or write access to `WorkerPrivate`. (Can only view public profile: name, photo, badges, rating).
* **Society Admin:**
  * Can view: `aadhaarNumberMasked` (e.g. `XXXX-XXXX-9912`), `aadhaarFrontDocUrl`, `aadhaarBackDocUrl`, `policeClearanceCertUrl`, `bankAccount` (for payout verification), `emergencyContact`.
  * **CANNOT view:** Raw unmasked Aadhaar numbers (GigSevak never stores raw Aadhaar numbers; only masked strings and irreversible SHA-256 validation hashes).
* **Federation Admin:**
  * Sees aggregated KYC metrics (e.g., "94% Verified in Jalandhar"). Cannot view individual bank account numbers or identity document photos unless explicitly elevated for a formal grievance arbitration.
* **Worker:**
  * Can view and update their own banking details and documents prior to formal verification. Once `kycVerificationStatus === 'VERIFIED'`, banking details are locked and require admin approval to modify.

---

### 4.5 KYC Verification Authority
* **First-Line Review:** Exclusively performed by `SOCIETY_ADMIN`. The cooperative society manager physically inspects original documents, verifies cooperative share purchase, and clicks "Verify Member".
* **Audit & Escalation:** `FEDERATION_ADMIN` and `SYSTEM_ADMIN` can audit verification trails, request re-verification, or suspend non-compliant workers.

---

### 4.6 Grievance & Dispute Arbitration Authority
* **Low & Medium Severity Complaints:**
  * Handled directly by `SOCIETY_ADMIN` of the `servicingSocietyId`.
  * Permitted actions: Request rework, issue partial customer refund up to ₹1,000, or dismiss frivolous complaints.
* **High & Critical Severity / Cross-Society Disputes:**
  * Escalated to `FEDERATION_ADMIN` Appellate Committee.
  * Required for: Worker suspension, blacklisting, insurance claims for property damage, or full refunds exceeding ₹1,000.

---

### 4.7 Service Catalog & Pricing Governance
* **Society Admin:**
  * Strictly Read-Only. Society Admins **cannot** alter base service prices, change commission splits, or delete services. This prevents rogue price gouging and preserves standardized pricing across the cooperative ecosystem.
* **Federation Admin:**
  * Can propose standard base rates, season add-ons, and duration guidelines for the federation's territory.
* **System Admin:**
  * Publishes canonical catalog items and platform fee configuration.

---

## 5. Backend Authorization Middleware Architecture

In the Express backend, authorization is enforced via modular, composable middleware chained prior to controller execution:

```javascript
// Example Express Route Definition
router.patch(
  '/admin/workers/:workerId',
  authenticateJwt,
  requireRole(['SOCIETY_ADMIN', 'FEDERATION_ADMIN', 'SYSTEM_ADMIN']),
  enforceWorkerTenantScope, // Validates caller.societyId === targetWorker.societyId
  validateRequest(workerUpdateSchema),
  adminController.updateWorkerStatus
);

router.post(
  '/bookings/:bookingId/material-cost/authorize',
  authenticateJwt,
  requireRole(['CUSTOMER']),
  enforceBookingOwnership, // Validates caller.userId === targetBooking.userId
  validateRequest(materialAuthSchema),
  bookingController.authorizeMaterialCost
);
```

### 5.1 Enforce Tenant Scope Middleware Logic
1. Extract `req.user` from verified JWT.
2. If `req.user.role === 'SYSTEM_ADMIN'`, proceed immediately (`next()`).
3. If `req.user.role === 'SOCIETY_ADMIN'`:
   - Inspect target resource.
   - If resource has `societyId` or `servicingSocietyId`, verify it matches `req.user.societyId`.
   - If mismatch, terminate request with `HTTP 403 Forbidden` (`ACCESS_DENIED: Society Admin out of jurisdiction`).
4. If `req.user.role === 'FEDERATION_ADMIN'`:
   - Verify target resource's `federationId` matches `req.user.federationId`.
   - If mismatch, terminate request with `HTTP 403 Forbidden`.

---

*End of RBAC & Scoping Architecture (`rbac-and-admin-scope.md`)*
