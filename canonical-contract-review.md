# Canonical Contract Review: Technical & Architectural Audit

**Document:** `canonical-contract-review.md`  
**Review Target:** `canonical-data-contract.md` (Version 1.0.0 Draft)  
**Project:** GigSevak Cooperative Gig Platform  
**Date:** September 10, 2026  
**Auditor:** Principal Solutions Architect  

---

## 1. Overview & Executive Summary

A comprehensive architectural inspection of the initial `canonical-data-contract.md` was conducted across all 15 proposed canonical entities, relationships, data fields, state machines, geospatial schemas, and RBAC rules.

While the original contract successfully resolved the broad divergence between `user-frontend` and `worker-frontend`, deep inspection revealed **14 technical, security, and schema modeling defects** that would cause friction, data corruption, or operational deadlocks during MongoDB/Express implementation.

This document details every identified defect, explains the concrete architectural risk, and specifies the authoritative remediation to be enacted in `canonical-data-contract-v1.md`.

---

## 2. Detailed Findings & Recommended Changes

### Issue 1: Redundant & Inconsistent Financial Ledger Fields in `Booking.pricing` and `Payment.breakdown`
* **Current Definition in Contract:**
  * In `Booking.pricing`:
    ```typescript
    pricing: {
      baseAmount: number;
      materialCost: number;
      additionalCharges: number;
      platformFee: number;
      taxes: number;
      totalAmount: number;
      workerPayout: number;
      servicingSocietyFee: number;
      referringSocietyFee: number;
      platformFeeAmount: number; // Redundant with platformFee above
    }
    ```
  * In `Payment.breakdown`:
    ```typescript
    breakdown: {
      baseLaborAmount: number; // Naming divergence: baseLaborAmount vs baseAmount
      materialAmount: number;  // Naming divergence: materialAmount vs materialCost
      additionalCharges: number;
      platformFee: number;
      taxes: number;
    }
    ```
* **Problem:**
  1. `Booking.pricing` contains both `platformFee` and `platformFeeAmount`, causing ambiguous source-of-truth calculations.
  2. `Payment.breakdown` uses `baseLaborAmount` and `materialAmount`, while `Booking.pricing` uses `baseAmount` and `materialCost`. This discrepancy breaks direct object mapping between the invoice ledger and the gateway payment document.
* **Recommended Change:**
  Standardize on a single, invariant pricing interface shared verbatim across `Booking.pricing` and `Payment.breakdown`:
  ```typescript
  interface CanonicalPricingBreakdown {
    baseLaborAmount: number;     // Authoritative labor rate
    materialAmount: number;      // Replacement parts added on site
    additionalCharges: number;   // Approved scope expansions
    platformFee: number;         // Platform commission (5%)
    taxAmount: number;           // Applicable GST
    totalAmount: number;         // Grand total billed to customer
    
    // Revenue Split (85% / 10% / 5% or 85% / 9% / 1% / 5% if pooled)
    workerPayoutAmount: number;
    servicingSocietyAmount: number;
    referringSocietyAmount: number; // 0 if not pooled
    platformReserveAmount: number;
  }
  ```
* **Reason:** Ensures strict 1:1 financial reconciliations between payment gateway receipts, booking invoices, and cooperative audit settlements.

---

### Issue 2: Ambiguous Naming Between Primary Society and Pooled Referring Society in `Booking`
* **Current Definition in Contract:**
  `Booking` has `societyId: string;` and optional `referringSocietyId?: string | null;`.
* **Problem:**
  Using `societyId` without the clarifying prefix creates severe ambiguity during cooperative order pooling. It is unclear whether `societyId` refers to the customer's home cooperative (referring) or the neighboring cooperative fulfilling the job (servicing).
* **Recommended Change:**
  Rename `societyId` to `servicingSocietyId`, and explicitly pair it with `referringSocietyId`:
  ```typescript
  servicingSocietyId: string; // Ref -> Society._id (Society that employs the assigned worker)
  referringSocietyId?: string | null; // Ref -> Society._id (Home society where customer booked, if pooled)
  ```
* **Reason:** Prevents financial settlement routing bugs where referral commissions (1%) and service shares (9%) could be credited to the wrong cooperative society.

---

### Issue 3: Inconsistent Terminology in `Complaint.status` (`GUILD_INVESTIGATION`)
* **Current Definition in Contract:**
  `Complaint.status`: `'SUBMITTED' | 'UNDER_REVIEW' | 'GUILD_INVESTIGATION' | 'RESOLVED' | 'DISMISSED'`
* **Problem:**
  The contract established `Society` as the canonical entity replacing the legacy frontend term "Guild". Retaining `GUILD_INVESTIGATION` creates legacy schema leakage in an otherwise normalized system.
* **Recommended Change:**
  Update status enum to:
  `'SUBMITTED' | 'UNDER_REVIEW' | 'SOCIETY_INVESTIGATION' | 'RESOLVED' | 'DISMISSED'`
* **Reason:** Enforces domain naming consistency across all collections, models, and administrative dashboards.

---

### Issue 4: Missing Material Cost Approval Mechanism & Schema Gap
* **Current Definition in Contract:**
  `Booking.pricing.materialCost` and `WorkProof.partsReplaced` exist as static fields, but there is no transactional mechanism or status flag to represent when a worker requests extra hardware parts on-site and waits for customer approval.
* **Problem:**
  If a worker replaces a ₹300 capacitor on-site, directly mutating `Booking.pricing.materialCost` without customer authorization leads to customer disputes and unauthorized credit card/UPI charges.
* **Recommended Change:**
  Add a dedicated `materialApproval` sub-document to `Booking`:
  ```typescript
  materialApproval?: {
    requestedAmount: number;
    description: string;
    receiptPhotoUrl?: string;
    status: 'NONE' | 'PENDING_CUSTOMER_APPROVAL' | 'APPROVED' | 'REJECTED';
    requestedAt?: string;
    respondedAt?: string;
  };
  ```
* **Reason:** Protects consumer trust by providing an audit trail and real-time push notification flow before unexpected hardware costs are added to the final invoice.

---

### Issue 5: Trust Score Cold-Start Problem for Newly Onboarded Workers
* **Current Definition in Contract:**
  `TrustScore` formula:
  $$\text{Score} = 0.40(R) + 0.25(C) + 0.15(V) + 0.10(S) + 0.10(P)$$
  Where $R = \text{Rating}$, $C = \text{Completion Rate}$, $V = \text{Verification}$, $S = \text{Dispute/Complaint}$, $P = \text{Punctuality}$.
* **Problem:**
  A newly verified worker has completed 0 jobs and received 0 ratings ($R=0, C=0, P=0$). Even with 100% verification ($V=100$), their calculated score would be $15.0 / 100$, immediately placing them in "PROBATION" and completely suppressing them from customer search discovery!
* **Recommended Change:**
  Establish an explicit **Initial Baseline Trust Score**:
  * Upon completing KYC verification, initialize `overallScore = 75.0` (Grade: 'B').
  * The dynamic mathematical formula activates only after the worker completes a minimum threshold of 5 bookings.
* **Reason:** Eliminates the circular dependency where new workers cannot get gigs to build a score because their initial score is 0.

---

### Issue 6: Unindexed Spatial Fields and Potential GeoJSON Order Inversion Bugs
* **Current Definition in Contract:**
  Coordinates are correctly declared as `[number, number] // [lng, lat]`, but required MongoDB 2dsphere indexing directives and range boundary constraints are missing from the specification.
* **Problem:**
  1. MongoDB requires explicit `{ location: "2dsphere" }` compound indexes with status/skill filters (`{ "location": "2dsphere", "primaryServiceId": 1, "isAvailable": 1 }`) to achieve sub-100ms dispatch lookups.
  2. Without explicit schema validators, developers frequently invert coordinates to `[lat, lng]`, which produces valid JSON but triggers runtime MongoDB `Point must be in range [-180, 180], [-90, 90]` errors.
* **Recommended Change:**
  Explicitly mandate Mongoose schema-level coordinate range validation:
  ```typescript
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true,
    validate: {
      validator: (coords: number[]) => 
        coords.length === 2 &&
        coords[0] >= -180 && coords[0] <= 180 && // Longitude
        coords[1] >= -90 && coords[1] <= 90,     // Latitude
      message: "Coordinates must be valid [longitude, latitude] within WGS84 bounds"
    }
  }
  ```
* **Reason:** Guarantees database integrity and prevents production crashes during spatial clustering and `$near` queries.

---

### Issue 7: Absence of Re-allocation Transition in Booking State Machine
* **Current Definition in Contract:**
  In the state transition matrix, when a worker triggers `DECLINED`, the diagram notes `(Re-allocate) -> ARRIVED` or re-enters queue, but there is no explicit state or condition describing what happens to the booking document.
* **Problem:**
  If a booking stays in `DECLINED` status, the customer app thinks the entire order was terminated, when in reality the cooperative dispatch engine is looking for an alternate artisan.
* **Recommended Change:**
  Define an explicit transition:
  * Worker declines $\rightarrow$ Booking transitions from `ALLOCATED` back to `REQUESTED` with `reallocationCount` incremented and `workerId` reset to `null`.
  * If `reallocationCount >= 3`, trigger Inter-Cooperative Pooling (expand radius to 12km).
  * If no neighbor is found after 5 minutes, status transitions to `CANCELLED` (Reason: `NO_WORKER_AVAILABLE`).
* **Reason:** Prevents premature job cancellation and gives the cooperative pooling engine the resilience to cycle through candidate artisans automatically.

---

### Issue 8: Security Flaw: Lack of Cryptographic Salting Specification for `Booking.startOtpHash`
* **Current Definition in Contract:**
  `startOtpHash: string; // Salted SHA-256 hash of the 4-digit start PIN`
* **Problem:**
  A 4-digit PIN has only 10,000 combinations (`0000` to `9999`). A simple unsalted or globally salted SHA-256 hash can be reversed using a rainbow table in less than 2 milliseconds, allowing a rogue worker to compute the PIN and bypass doorstep verification without ever visiting the customer.
* **Recommended Change:**
  Mandate per-booking dynamic salt generation:
  $$\text{Salt} = \text{bookingId} + \text{customerId}$$
  $$\text{startOtpHash} = \text{HMAC-SHA256}(\text{PIN}, \text{Salt})$$
* **Reason:** Completely eliminates rainbow table attacks against the 4-digit start code.

---

### Issue 9: Disconnect Between `Service.basePrice` and `Worker.baseServicePrice`
* **Current Definition in Contract:**
  Both `Service.basePrice` and `Worker.baseServicePrice` exist as independent pricing numbers.
* **Problem:**
  In a cooperative model, services have standardized government/coop rate cards (e.g. electrical repair visit is ₹350). Having workers define arbitrary `baseServicePrice` creates rate-card discrepancies and breaks consumer trust in cooperative price transparency.
* **Recommended Change:**
  1. `Service.basePrice` is the authoritative platform/cooperative standard rate.
  2. `Worker.baseServicePrice` is replaced with `Worker.experienceTier: 'STANDARD' | 'SENIOR' | 'MASTER'`, which applies an authorized cooperative multiplier (e.g. 1.0x, 1.15x, 1.25x) approved by Society Admins.
* **Reason:** Aligns with cooperative governance policies while allowing master craftsmen to earn fair tier-based pay transparently.

---

### Issue 10: Missing Review Taxonomy Enforcement
* **Current Definition in Contract:**
  `Review.tags: string[]; // e.g. ["Punctual", "Expert Diagnosis"]`
* **Problem:**
  Free-form string arrays lead to noisy tagging (e.g. `"fast"`, `"Fast"`, `"arrived quick"`, `"good"`), preventing the AI Trust Score engine from accurately calculating the punctuality and quality score components.
* **Recommended Change:**
  Enforce a canonical enum taxonomy for review tags:
  `CanonicalReviewTag`:
  * Positive: `'PUNCTUAL'`, `'CLEAN_WORK'`, `'EXPERT_DIAGNOSIS'`, `'FAIR_PRICING'`, `'POLITE_BEHAVIOR'`, `'SAFETY_CONSCIOUS'`
  * Negative: `'LATE_ARRIVAL'`, `'MESSY_WORK'`, `'OVERCHARGING'`, `'UNPROFESSIONAL'`
* **Reason:** Enables automated sentiment parsing and objective trust score adjustments.

---

### Issue 11: Missing Society Admin Data Isolation in `WorkerPrivate`
* **Current Definition in Contract:**
  RBAC specifies Society Admins can read `WorkerPrivate` for their assigned society.
* **Problem:**
  A Society Admin needs to view a worker's KYC documents and phone number for verification, but should **NOT** be able to view raw encrypted bank account numbers, emergency contact personal details, or full Aadhaar numbers in plaintext.
* **Recommended Change:**
  Partition `WorkerPrivate` into field-level access scopes:
  * Admin-Accessible: `phone`, `dateOfBirth`, `gender`, `kyc`, `insurance`, `schedulePreferences`, `earnings`.
  * Highly Sensitive (System/Worker only): `bankAccount.accountNumberEncrypted` (masked version shown to admin for verification), emergency contact phone.
* **Reason:** Ensures compliance with Indian Digital Personal Data Protection Act (DPDP Act).

---

### Issue 12: Missing TTL and Compound Indexes for `TrackingEvent`
* **Current Definition in Contract:**
  Declares `timestamp: string` and notes a TTL index.
* **Problem:**
  Without specifying exact compound indexing rules, high-frequency GPS pings (every 5–10 seconds per active gig) will rapidly degrade MongoDB query performance on live tracking routes.
* **Recommended Change:**
  Formally mandate two indexes:
  1. Compound query index: `{ bookingId: 1, timestamp: -1 }` (Serves the customer live tracking map).
  2. Spatial TTL index: `{ location: "2dsphere" }` and `{ timestamp: 1 }, { expireAfterSeconds: 604800 }` (7 days auto-pruning).
* **Reason:** Ensures sub-millisecond route coordinate retrieval while preventing unbounded disk space consumption.

---

### Issue 13: Missing `resolvedBy` and Audit Attribution in `Complaint`
* **Current Definition in Contract:**
  `Complaint.assignedOfficerId` exists, but resolution audit trail is minimal.
* **Problem:**
  Cooperative dispute resolution requires strict legal accountability. If a Society Admin grants a customer refund or suspends a worker, the administrative action must record who issued the resolution, their official designation, and the timestamp.
* **Recommended Change:**
  Expand `Complaint.resolution`:
  ```typescript
  resolution?: {
    actionTaken: 'REFUND_ISSUED' | 'REWORK_ORDERED' | 'WORKER_WARNED' | 'DISMISSED';
    refundAmount?: number;
    notes: string;
    resolvedByUserId: string; // Ref -> User._id (Admin)
    resolvedByRole: 'SOCIETY_ADMIN' | 'FEDERATION_ADMIN' | 'SYSTEM_ADMIN';
    resolvedAt: string; // ISO 8601
  };
  ```
* **Reason:** Provides an unforgeable administrative audit trail for NCCT regulatory audits.

---

### Issue 14: Emergency SOS Dispatch Bypasses Geographic Assignment Rules
* **Current Definition in Contract:**
  `Booking.bookingType: 'EMERGENCY_SOS'` is listed, but its state transition rules do not differ from standard dispatch.
* **Problem:**
  Standard dispatch waits up to 60 seconds for a single top-ranked worker to accept. For an emergency gas leak, active water burst, or short circuit, waiting for a single worker is unsafe.
* **Recommended Change:**
  Explicitly specify the Emergency SOS matching rule:
  * When `bookingType === 'EMERGENCY_SOS'`, the backend simultaneously allocates the booking to **ALL active verified workers within 7km**.
  * The first worker to press "Accept" locks the gig (`atomic findOneAndUpdate({ status: 'ALLOCATED' })`).
  * Instant status transition to `ACCEPTED`. All other workers receive a socket notification that the emergency gig was claimed.
* **Reason:** Guarantees true sub-15 minute emergency response times promised in the PRD.

---

## 3. Review Summary Matrix

| Entity Reviewed | Total Fields Audited | Issues Identified | Status for v1.0 Finalization |
| :--- | :---: | :---: | :--- |
| **User** | 12 | Clean (Sub-profile scoping refined) | Approved with minor refinement |
| **Worker** | 22 | Issue 6 (GeoJSON bounds), Issue 9 (Base price) | Changes specified |
| **WorkerPrivate** | 20 | Issue 11 (Admin isolation), DPDP Act compliance | Changes specified |
| **Federation** | 10 | Clean | Approved |
| **Society** | 14 | Clean | Approved |
| **Region** | 10 | Clean | Approved |
| **Service** | 15 | Issue 9 (Decoupled base rate) | Changes specified |
| **Booking** | 30 | Issue 1 (Pricing), Issue 2 (Society naming), Issue 4 (Materials), Issue 7 (Re-allocation), Issue 8 (Salted OTP) | Critical changes specified |
| **Review** | 9 | Issue 10 (Tag taxonomy) | Changes specified |
| **TrustScore** | 9 | Issue 5 (Cold start baseline) | Changes specified |
| **WorkGalleryItem** | 11 | Clean | Approved |
| **WorkProof** | 8 | Issue 4 (Part cost linkage) | Changes specified |
| **Complaint** | 12 | Issue 3 (Society naming), Issue 13 (Resolution audit) | Changes specified |
| **Payment** | 12 | Issue 1 (Pricing alignment) | Changes specified |
| **TrackingEvent** | 7 | Issue 6, Issue 12 (TTL and spatial indexes) | Changes specified |

---
*All approved changes will be directly reflected in `canonical-data-contract-v1.md`.*
