# Role-Based Access Control (RBAC) & Scoping Architecture v1.1

**Document:** `rbac-and-admin-scope-v1.1.md`  
**Platform:** GigSevak Cooperative Gig Platform  
**Status:** Authoritative Security Specification v1.1 — Reconciled  
**Date:** September 10, 2026  
**Supersedes:** `rbac-and-admin-scope.md` (v1.0)

**Summary of v1.1 changes from v1.0:**
- `WorkerPrivate` field access tiers formally defined (Tier 3 / Tier 4) with complete field list
- Region scoping updated: Federation Admin now uses `Region.federationId` (field added in data contract v1.1)
- `experienceTier` permissions added: Society Admin → up to SENIOR; Federation/System Admin → MASTER
- Material requests: clarified that `CUSTOMER` controls approval per-request (not single `authorize`)
- `VOICE_BOOKING` booking type: reserved, not yet RBAC-implemented
- Complaint refund limits formally tied to role and severity

---

## 1. Executive Summary & Security Principles

In a cooperative federation, administrative boundaries are **legal and jurisdictional**. A local society manager must never access worker records, financial ledgers, or customer disputes belonging to another independent society.

### Core Security Tenets

1. **Server-Side Tenancy Enforcement.** Authorization scope is extracted exclusively from cryptographically verified JWT claims. Client-supplied query parameters are never trusted to define scope. The backend middleware forcibly injects tenant predicates before executing any database query.

2. **Principle of Least Privilege for PII.** `WorkerPrivate` is a physically segregated collection. It is tiered into field-level access zones: some fields available to Society Admins for KYC verification; highly sensitive fields (bank account numbers, full Aadhaar hash, emergency contacts) restricted to the Worker themselves and System Admins only.

3. **DPDPA Compliance.** All PII access respects the Digital Personal Data Protection Act, 2023. Raw Aadhaar numbers are never stored. Masked forms only are accessible to admins. Bank account numbers are AES-256 encrypted at rest; only masked versions (last 4 digits) are accessible to Society Admins for payout confirmation.

4. **Cooperative Multi-Tier Governance.** Disputes begin at the Society level and escalate to the Federation only when cross-society pooling or severe malpractice is involved. Neither tier has access to the other tier's exclusive authorities.

5. **Role Isolation (No Multiple Roles).** A single user account holds exactly one role. A worker cannot simultaneously be a Society Admin under the same account. Role changes require administrative intervention and re-issuance of JWT.

---

## 2. Canonical Actor Roles

| Role Name | Scope | Typical User |
|---|---|---|
| `CUSTOMER` | Self-scoped. Own bookings, profile, reviews, complaints. | Resident booking home repairs. |
| `WORKER` | Self-scoped. Own profile, assigned bookings, work proof, material requests. | Plumber, electrician, artisan. |
| `SOCIETY_ADMIN` | **Tenant-scoped** to a single `Society._id`. Workers, bookings, KYC, low/medium complaints within their cooperative. | Manager of a Primary Cooperative / PACS. |
| `FEDERATION_ADMIN` | **Federation-scoped** across all member societies under `Federation._id`. Federation-wide analytics, dispute appeals, catalog governance. | State Cooperative Federation executive. |
| `SYSTEM_ADMIN` | **Global Unrestricted.** All collections, all federations, all data. Platform configuration, boundary editing, fee policy. | GigSevak core engineering/operations. |

---

## 3. Comprehensive RBAC Permissions Matrix

| Entity | Action | `CUSTOMER` | `WORKER` | `SOCIETY_ADMIN` | `FEDERATION_ADMIN` | `SYSTEM_ADMIN` |
|---|---|---|---|---|---|---|
| **User** | Read | Own profile | Own profile | Own society workers' user records | Federation workers' user records | Full |
| | Update | Own profile | Own profile | ❌ | ❌ | Full |
| **Worker** | Read (public) | All public profiles | Own + public | Own society workers | All federation workers | Full |
| | Update profile | ❌ | Own skills/avatar (pre-verify) | KYC status, membership, `experienceTier` (up to SENIOR) | `experienceTier` = MASTER; federation-wide policy | Full |
| **WorkerPrivate** | Read (Tier 3) | ❌ NEVER | Own record | Own society workers (masked Tier 3 fields only) | Aggregated audit metrics only | Emergency access |
| | Read (Tier 4) | ❌ NEVER | Own record | ❌ NEVER | ❌ NEVER | Full |
| | Update | ❌ NEVER | Own record (pre-verify only) | Verification status + audit notes | Appeal notes | Full |
| **Federation** | Read | Public details | Public details | Affiliated federation public | Own federation full | Full |
| | Update | ❌ | ❌ | ❌ | Own federation config | Full |
| **Society** | Read | Public info | Affiliated society | Own society record | All federation societies | Full |
| | Update | ❌ | ❌ | Own office/contact/bank details | All federation societies | Full |
| **Region** | Read | Active regions | Operating regions (own + assigned) | `jurisdictionRegionIds` only | All in `federationId` | Full |
| | Update | ❌ | ❌ | ❌ | Demand multipliers only | GeoJSON boundaries + all fields |
| **Service** | Read | Public catalog | Public catalog | Public catalog | Full catalog | Full |
| | Update | ❌ | ❌ | ❌ | Base prices, add-ons (proposal) | Full publish authority |
| **Booking** | Create | Standard + SOS + COMMUNITY_POOL | ❌ | Manual/phone bookings (admin override) | ❌ | Full |
| | Read | Own bookings | Assigned bookings | `servicingSocietyId` OR `referringSocietyId` matches | `federationId` matches | Full |
| | Transition (lifecycle) | `cancel` (own, pre-IN_PROGRESS) | `accept`, `decline`, `start-travel`, `arrive`, `verify-otp`, `complete` | `reassign`, `cancel` (for own society), `IN_PROGRESS` cancel (emergency) | Intervene on federation appeal | Full |
| **MaterialRequest** | Create | ❌ | Assigned booking (IN_PROGRESS) | ❌ | ❌ | Full |
| | Read | Own booking | Own booking | Own society bookings | Federation bookings | Full |
| | Approve/Reject | Own booking | ❌ | ❌ | ❌ | Full |
| **WorkProof** | Create | ❌ | Assigned booking | ❌ | ❌ | Full |
| | Read | Own booking | Own booking | Own society bookings | Federation bookings | Full |
| **Review** | Create | Own completed booking | ❌ | ❌ | ❌ | Full |
| | Read | Public reviews | Public reviews | Own society reviews | Federation reviews | Full |
| **TrustScore** | Read | Summary score (from Worker.metrics) | Own detailed breakdown | Own society workers | Federation-wide aggregates | Full detail |
| | Mutate | ❌ | ❌ | Peer endorsement points | Policy parameter adjustments | Full recalculation |
| **Complaint** | Create | Own completed booking | Own completed booking | ❌ | ❌ | Full |
| | Resolve | ❌ | ❌ | LOW + MEDIUM; refund ≤ ₹1,000 | HIGH + CRITICAL + appeals; full refund authority | Full |
| **Payment** | Read | Own payment | Own payout share | Own society settlements | Federation ledgers | Full |
| | Initiate Refund | ❌ | ❌ | ≤₹1,000 authorized | Full refund authority | Full |

---

## 4. Deep-Dive Administrative Scoping Rules

### 4.1 Worker Records Access

**Society Admin:**
Backend MUST forcibly inject this predicate before every worker query:
```javascript
// Express middleware: enforceWorkerTenantScope
const query = { societyId: req.user.societyId, ...filter };
```
Accessing `/api/admin/workers/:workerId` for a worker belonging to a different society returns `403 ACCESS_DENIED`.

**Federation Admin:**
Backend injects: `{ federationId: req.user.federationId }`. Cross-society analytics are permitted but cross-federation access is not.

---

### 4.2 Region & Boundary Access

**Society Admin:**
- Can only view regions listed in their `Society.jurisdictionRegionIds`.
- Cannot alter Region boundary coordinates, demand multipliers, or any region field.
- Backend enforces: `Region._id must be in Society.jurisdictionRegionIds`.

**Federation Admin:**
- Can view all regions where `Region.federationId === caller.federationId` (**v1.1: uses `Region.federationId` directly**).
- Can adjust `demandMultiplier` field only.

**System Admin:**
- Exclusive authority to edit GeoJSON boundary polygons and create/deactivate regions.

---

### 4.3 Booking Access & Interventions

**Society Admin** can view and manage bookings where:
`Booking.servicingSocietyId === caller.societyId` **OR** `Booking.referringSocietyId === caller.societyId`

This covers both jobs performed by their artisans and jobs that originated in their society and were pooled to a neighboring cooperative.

**Federation Admin:**
All bookings where `Booking.federationId === caller.federationId`.

**Reassignment Authority:**
Only `SOCIETY_ADMIN` (for own society's workers) or `SYSTEM_ADMIN` may invoke `PATCH /api/admin/bookings/:bookingId/reassign`. Permitted when booking is in `REQUESTED`, `ALLOCATED`, `ACCEPTED`, or `IN_TRANSIT`. **Prohibited once `IN_PROGRESS`.**

---

### 4.4 WorkerPrivate Field-Level Access Tiers

All `WorkerPrivate` access is mediated by the backend; the frontend receives only the fields the caller's role is authorized to see. The backend controller explicitly constructs the response projection for each role.

#### Tier 3 — Protected-Operational (Society Admin Accessible)

Society Admin CAN view and use for KYC verification:
- `dateOfBirth` (age check ≥18)
- `mobileNumberMasked` ("+91 XXXXXX4210")
- `aadhaarNumberMasked` ("XXXX-XXXX-1234")
- `aadhaarFrontDocUrl` (pre-signed URL to document image)
- `aadhaarBackDocUrl`
- `policeClearanceCertUrl`
- `insurance.provider`, `insurance.coverageType`, `insurance.expiresAt` (policyNumber excluded)
- `schedulePreferences.*`
- `earnings.totalLifetimeEarnings`, `earnings.currentMonthEarnings`, `earnings.lastSettlementDate`
- `bankAccount.accountNumberMasked` ("XXXX XXXX 4829") — for payout confirmation only
- `bankAccount.bankName`, `bankAccount.ifscCode`, `bankAccount.payoutMode`, `bankAccount.isVerified`
- `verificationAudit.*`

Society Admin CANNOT view (Tier 4 only):
- `aadhaarVerificationHash` (cryptographic hash, no use for admin)
- `panNumber`
- `bankAccount.accountNumberEncrypted`
- `bankAccount.upiId`
- `emergencyContact.*` (full details)
- `mobileNumberFull` (only masked version)

#### Tier 4 — Highly Sensitive (Worker self + System Admin only)

Worker can view and update (pre-verification):
- `bankAccount.accountNumberEncrypted` (to enter/update their own bank details)
- `bankAccount.upiId`
- `emergencyContact.*`
- `panNumber`

System Admin:
- Full unrestricted access to all Tier 3 and Tier 4 fields for platform compliance, investigations, and emergency support.

> [!CAUTION]
> `bankAccount.accountNumberEncrypted` must NEVER be returned in API responses. Only `accountNumberMasked` is returned over the wire. Decryption occurs server-side exclusively for payout gateway calls.

---

### 4.5 KYC Verification Authority

| Actor | Authority |
|---|---|
| `SOCIETY_ADMIN` | Performs first-line KYC review. Inspects Tier 3 docs. Clicks "Verify Member" to set `kycVerificationStatus = 'VERIFIED'`. Can also set to `REJECTED` with reason. |
| `FEDERATION_ADMIN` | Can request re-verification, audit verification trails. Cannot directly flip `kycVerificationStatus`. |
| `SYSTEM_ADMIN` | Full authority. Can override any KYC status. |

Once `kycVerificationStatus = 'VERIFIED'`, the worker's banking details are **locked**. Any future changes to `bankAccount` require explicit `SOCIETY_ADMIN` approval to prevent payout fraud.

---

### 4.6 Experience Tier Governance

| Tier | Who Can Grant | Conditions |
|---|---|---|
| `STANDARD` | Auto-assigned at onboarding | Default for all new members |
| `SENIOR` | `SOCIETY_ADMIN` | ≥50 completed jobs + Society Admin approval |
| `MASTER` | `FEDERATION_ADMIN` or `SYSTEM_ADMIN` | ≥200 completed jobs + ITI/govt certification + Federation Admin approval |

**Security rule:** `SOCIETY_ADMIN` CANNOT set `experienceTier = 'MASTER'`. Attempting to do so returns `403 ACCESS_DENIED: Insufficient role for MASTER tier assignment`.

---

### 4.7 Complaint & Grievance Arbitration Authority

| Complaint Severity | First Authority | Escalation |
|---|---|---|
| `LOW`, `MEDIUM` | `SOCIETY_ADMIN` of `servicingSocietyId` | Max refund ₹1,000. Actions: request rework, partial refund, dismiss. |
| `HIGH`, `CRITICAL` | `FEDERATION_ADMIN` Appellate Committee | No refund ceiling. Actions: full refund, fine, suspension, blacklist. |
| Cross-society or insurance claim | `FEDERATION_ADMIN` (mandatory) | Society Admin loses authority when `referringSocietyId ≠ null` for HIGH/CRITICAL cases. |

> [!IMPORTANT]
> The ₹1,000 Society Admin refund cap is a document assumption. Confirm with cooperative governance board before production launch (**Open Decision OD-05**).

---

### 4.8 Service Catalog Governance

| Actor | Authority |
|---|---|
| `CUSTOMER`, `WORKER`, `SOCIETY_ADMIN` | Read-only. Zero write access to service catalog. |
| `FEDERATION_ADMIN` | Can PROPOSE base rate changes and duration updates for their federation territory. Final publish requires System Admin. |
| `SYSTEM_ADMIN` | Sole publish authority for canonical `Service` items and platform fee configuration. |

**Why Society Admin is read-only:** Prevents rogue price manipulation. The cooperative's competitive advantage is standardized, trust-verified pricing. Any Society Admin who could edit base rates would undermine the entire pricing model.

---

## 5. Backend Authorization Middleware Architecture

### 5.1 Middleware Chain (Express)

Every protected route passes through this ordered middleware chain:

```javascript
router.patch(
  '/admin/workers/:workerId',
  authenticateJwt,                    // 1. Verify and decode JWT
  requireRole(['SOCIETY_ADMIN', 'FEDERATION_ADMIN', 'SYSTEM_ADMIN']), // 2. Role check
  enforceWorkerTenantScope,           // 3. Tenancy predicate injection
  validateRequest(workerUpdateSchema), // 4. Request body validation
  adminController.updateWorkerStatus  // 5. Business logic
);

router.post(
  '/bookings/:bookingId/material-requests',
  authenticateJwt,
  requireRole(['WORKER']),
  enforceBookingWorkerAssignment,     // Validates caller.workerId === booking.workerId
  enforceBookingState(['IN_PROGRESS']),
  validateRequest(materialRequestSchema),
  bookingController.submitMaterialRequest
);

router.post(
  '/bookings/:bookingId/material-requests/:requestId/approve',
  authenticateJwt,
  requireRole(['CUSTOMER']),
  enforceBookingOwnership,            // Validates caller.userId === booking.userId
  validateRequest(materialApprovalSchema),
  bookingController.approveMaterialRequest
);
```

### 5.2 `enforceWorkerTenantScope` Middleware Logic

```javascript
async function enforceWorkerTenantScope(req, res, next) {
  const { role, societyId, federationId } = req.user;
  
  // System Admin bypasses all tenant scoping
  if (role === 'SYSTEM_ADMIN') return next();
  
  const worker = await Worker.findById(req.params.workerId).lean();
  if (!worker) return res.status(404).json({ success: false, error: { code: 'RESOURCE_NOT_FOUND' } });
  
  if (role === 'SOCIETY_ADMIN') {
    if (worker.societyId.toString() !== societyId.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Society Admin out of jurisdiction' }
      });
    }
  }
  
  if (role === 'FEDERATION_ADMIN') {
    if (worker.federationId.toString() !== federationId.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Federation Admin out of federation scope' }
      });
    }
  }
  
  req.targetWorker = worker; // Pass to controller
  next();
}
```

### 5.3 `enforceRegionFederationScope` Middleware Logic (ADDED v1.1)

```javascript
async function enforceRegionFederationScope(req, res, next) {
  const { role, societyId, federationId } = req.user;
  
  if (role === 'SYSTEM_ADMIN') return next();
  
  const region = await Region.findById(req.params.regionId).lean();
  if (!region) return res.status(404).json({ ... });
  
  if (role === 'SOCIETY_ADMIN') {
    const society = await Society.findById(societyId).lean();
    if (!society.jurisdictionRegionIds.includes(region._id.toString())) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Region not in Society jurisdiction' }
      });
    }
  }
  
  if (role === 'FEDERATION_ADMIN') {
    // v1.1: Region.federationId enables direct federation scope check
    if (region.federationId.toString() !== federationId.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Region belongs to a different federation' }
      });
    }
  }
  
  req.targetRegion = region;
  next();
}
```

### 5.4 `enforceWorkerPrivateFieldProjection` Middleware Logic (ADDED v1.1)

This middleware constructs the MongoDB projection for `WorkerPrivate` queries based on caller role.

```javascript
function enforceWorkerPrivateFieldProjection(req, res, next) {
  const { role } = req.user;
  
  const TIER_3_FIELDS = {
    dateOfBirth: 1,
    mobileNumberMasked: 1,
    aadhaarNumberMasked: 1,
    aadhaarFrontDocUrl: 1,
    aadhaarBackDocUrl: 1,
    policeClearanceCertUrl: 1,
    'insurance.provider': 1,
    'insurance.coverageType': 1,
    'insurance.expiresAt': 1,
    schedulePreferences: 1,
    earnings: 1,
    'bankAccount.accountNumberMasked': 1,
    'bankAccount.bankName': 1,
    'bankAccount.ifscCode': 1,
    'bankAccount.payoutMode': 1,
    'bankAccount.isVerified': 1,
    verificationAudit: 1,
  };
  
  if (role === 'SYSTEM_ADMIN') {
    req.privateProjection = {}; // All fields (except accountNumberEncrypted which is never returned)
    req.privateProjection['bankAccount.accountNumberEncrypted'] = 0;
    return next();
  }
  
  if (role === 'SOCIETY_ADMIN') {
    req.privateProjection = TIER_3_FIELDS;
    return next();
  }
  
  if (role === 'WORKER') {
    // Worker sees their own full Tier 3 + Tier 4 EXCEPT encrypted account number
    req.privateProjection = { 'bankAccount.accountNumberEncrypted': 0 };
    return next();
  }
  
  // FEDERATION_ADMIN sees no individual worker private documents; only aggregated reports
  // CUSTOMER: access denied entirely (handled by requireRole middleware)
  return res.status(403).json({
    success: false,
    error: { code: 'ACCESS_DENIED', message: 'Insufficient role for WorkerPrivate access' }
  });
}
```

---

## 6. Open Decisions

| # | Decision | Current Assumption |
|---|---|---|
| **OD-02** | Should `Worker.gender` move from public Worker entity to `WorkerPrivate` Tier 3? Currently public (allows customers to filter by gender). | Retained as public. |
| **OD-05** | Is the ₹1,000 Society Admin refund cap the correct legally-agreed limit? | ₹1,000 assumed. Confirm with cooperative governance. |

---

*End of RBAC & Scoping Architecture v1.1*
