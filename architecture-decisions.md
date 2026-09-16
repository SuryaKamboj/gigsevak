# Architectural Decision Records (ADRs): GigSevak Cooperative Platform

**Document:** `architecture-decisions.md`  
**Target Platform:** GigSevak Cooperative Gig Platform (`user-frontend`, `worker-frontend`, `admin-frontend`, Shared Backend)  
**Date:** September 10, 2026  
**Status:** Approved Architectural Baseline  

---

## 1. Executive Summary

This document evaluates and definitively resolves the four fundamental architectural conflicts identified in the initial draft of `canonical-data-contract.md`. Each decision has been evaluated through the lens of cooperative economics, real-world operational ergonomics in the Indian service sector, security/fraud prevention, and database scalability.

### Summary of Decisions
| # | Decision Topic | Recommended Option | Core Rationale |
|---|---|---|---|
| **ADR-01** | Pilot Geography | **Punjab (Jalandhar & Kapurthala Corridor)** | Deep localization in `worker-frontend`, single cooperative jurisdiction (Punjab Co-op Societies Act 1961), NCCT alignment. |
| **ADR-02** | Material-Cost Authorization | **Worker Submits Quote + Receipt $\rightarrow$ Customer In-App Approval** | Reflects physical trade realities (plumbing/electrical); prevents off-platform cash extortion while protecting customer. |
| **ADR-03** | OTP Verification Visibility | **Customer Sees OTP Only After Worker Sets `ARRIVED`** | Eliminates phone-call OTP harvesting; enforces physical doorstep geo-proximity prior to service commencement. |
| **ADR-04** | Community / Team Pooling Model | **Individual `Booking` Document per Worker with Shared `teamId`** | Avoids document-level write contention; allows granular lifecycle, OTP, work proof, and payout per artisan. |

---

## 2. ADR-01: Pilot Geography Selection

### Context
GigSevak must launch its pilot in a defined geography to prove cooperative gig dynamics, worker onboarding through Primary Agricultural Credit Societies (PACS) / Labor Societies, customer demand, and doorstep delivery before national rollout. The two candidate territories are:
* **Option A:** Punjab (Jalandhar and Kapurthala Corridor).
* **Option B:** Delhi NCR (National Capital Region).

### Comparative Analysis

| Evaluation Criterion | Option A: Punjab (Jalandhar - Kapurthala) | Option B: Delhi NCR |
|---|---|---|
| **Existing Codebase Assets** | Complete: `worker-frontend` contains Jalandhar/Kapurthala geo-coordinates, tehsils, Verhoeff Aadhaar validation, and Punjabi (`pa`) i18n language pack. | Partial: Requires new geofence polygons, translation, and localized testing. |
| **Cooperative Governance** | Clean: Operates under the unified *Punjab Cooperative Societies Act, 1961*. Direct alignment with state cooperative federations and District Central Cooperative Banks (DCCBs). | Complex: Fragmented across 3 state jurisdictions (Delhi, Haryana, UP) and the Multi-State Cooperative Societies Act. |
| **Market Dynamics & Competition** | Underserved tier-2/rural-urban corridor with high unmet demand for verified artisans; cooperative trust creates a distinct competitive moat. | Red-ocean market dominated by VC-funded incumbents (Urban Company) engaging in predatory discounting and high CAC. |
| **Worker Inclusivity** | Strong community solidarity among local trade unions, ITI certified youth, and cooperative credit societies. | High migrant worker churn; low institutional loyalty to cooperative membership structures. |

### Decision & Recommendation
**Adopt Option A: Punjab (Jalandhar & Kapurthala Corridor)** as the primary canonical pilot geography for v1.0.  
*Architectural Provision:* The `Region` schema is designed to be multi-region and polygon-agnostic. Adding Delhi NCR requires zero schema changes—only seeding new `Region` documents with Delhi GeoJSON boundaries.

### Architectural Impact
* **Impact on Frontend:**
  * `user-frontend`: Default map view centers on Jalandhar `[75.5762, 31.3260]`. Address autocomplete biased to Punjab bounds (`IN-PB`).
  * `worker-frontend`: Retains its active Punjabi (`pa`), Hindi (`hi`), and English (`en`) tri-lingual toggle. Society onboarding lists registered Kapurthala and Jalandhar labor societies.
  * `admin-frontend`: District and tehsil analytics pre-configured for Jalandhar, Kapurthala, Nakodar, Phagwara, and Kartarpur.
* **Impact on Backend:**
  * Region boundary validation checks coordinates against seeded Punjab GeoJSON polygons using MongoDB `$geoIntersects`.
  * SMS and WhatsApp notification templates configured in Punjabi and Hindi.
* **Impact on Database:**
  * `Region` collection seeded with `PUN-JAL-01`, `PUN-KAP-01`.
  * `Society` collection seeded with initial cooperative societies affiliated with the Punjab State Cooperative Federation.
* **Impact on APIs:**
  * `GET /api/regions` returns active Punjab clusters.
  * `GET /api/societies?regionId=...` filters societies strictly within Jalandhar/Kapurthala jurisdiction.

---

## 3. ADR-02: Material-Cost Authorization Workflow

### Context
Skilled trades (plumbing, electrical repairs, appliance servicing, masonry) frequently encounter unforeseen physical component failures on-site (e.g., cracked PVC pipes, burnt motor capacitors, replacement brass valves). The platform must handle these material costs.
* **Option A:** Dynamic Material Cost: Worker requests material amount with itemized description and photo of invoice $\rightarrow$ Customer receives real-time approval prompt $\rightarrow$ Customer approves $\rightarrow$ Amount appended to final digital invoice.
* **Option B:** Rigid Labor-Only Pricing: The platform bills only labor. Customers are instructed to purchase all materials themselves or pay workers directly in cash off-platform.

### Comparative Analysis

| Evaluation Criterion | Option A: In-App Quote & Approval Flow | Option B: Rigid Labor-Only Model |
|---|---|---|
| **Real-World Viability** | High: Customers do not know exact technical specifications for plumbing/electrical parts and rely on the worker to procure them. | Low: Customers purchase wrong parts, causing delays; or workers demand arbitrary cash amounts off-platform. |
| **Fraud & Dispute Rate** | Low: Digital receipt photo mandatory; customer must explicitly tap "Approve" with total price preview before job finishes. | High: Cash exchange without audit trails causes frequent disputes, bad ratings, and platform disintermediation. |
| **Platform Revenue & Trust** | Platform captures total transaction value; cooperative warranty covers authorized parts. | Platform has zero visibility into materials; customer blames platform when unverified parts fail. |
| **Workflow Complexity** | Requires a dedicated state transition or sub-document event (`MATERIAL_APPROVAL_PENDING` / `MATERIAL_APPROVED`). | Zero backend state management for materials. |

### Decision & Recommendation
**Adopt Option A: In-App Material Cost Request and Customer Approval.**  
Cooperative ethics demand fairness for both worker and consumer. Labor-only rigidity drives users off-platform into cash exploitation. An in-app authorization gate gives the customer absolute control while giving the worker a legal, protected mechanism to recoup procurement expenses.

### Architectural Impact
* **Impact on Frontend:**
  * `worker-frontend`: Dedicated "Add Material Cost" modal during `IN_PROGRESS` state. Requires inputting: (1) item description, (2) amount in INR, and (3) camera capture of the hardware shop receipt.
  * `user-frontend`: Instant WebSocket notification / push alert displaying "Worker has requested ₹X for materials [View Receipt Photo]". Actions: "Approve ₹X" or "Reject / Request Discussion".
* **Impact on Backend:**
  * Endpoint `POST /api/bookings/:bookingId/material-cost` to submit claim.
  * Endpoint `POST /api/bookings/:bookingId/material-cost/authorize` (`action: "APPROVE" | "REJECT"`).
  * Lock mechanism: `POST /api/bookings/:bookingId/complete` is rejected if a material claim is still pending customer approval.
* **Impact on Database:**
  * `Booking` document embeds `materialDetails`:
    ```typescript
    materialDetails: {
      status: 'NONE' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
      claimedAmount: number;
      description?: string;
      receiptImageUrl?: string;
      requestedAt?: Date;
      resolvedAt?: Date;
    }
    ```
  * `Booking.pricing.materialAmount` updated upon approval; financial ledger automatically recomputes `totalAmount` and `taxes`.
* **Impact on APIs:**
  * `POST /api/bookings/:bookingId/material-cost` (Worker)
  * PATCH `/api/bookings/:bookingId/material-cost/approve` (Customer)
  * PATCH `/api/bookings/:bookingId/material-cost/reject` (Customer)

---

## 4. ADR-03: OTP Verification Visibility & Lifecycle

### Context
To ensure service delivery integrity and prevent ghost bookings, an OTP/PIN handshake is required to transition a booking into active execution.
* **Option A:** Customer sees OTP **only after** worker triggers `ARRIVED` (enforced by geo-proximity).
* **Option B:** Customer sees OTP immediately upon worker **`ACCEPTED`**.

### Comparative Analysis

| Evaluation Criterion | Option A: OTP Revealed Only on `ARRIVED` | Option B: OTP Revealed on `ACCEPTED` |
|---|---|---|
| **Doorstep Verification** | Guaranteed: Worker must physically travel to customer location, click `ARRIVED` within geofence, then ask customer for OTP. | Compromised: Worker can call customer on phone immediately upon accepting: *"Sir, please share OTP so I can start travel."* |
| **Fraud & Cancellation Loophole** | Zero: Worker cannot start job or falsely mark "In Progress" while sitting at home or working another private job. | High: Once OTP is shared prematurely, worker can start job remotely and demand cancellation fees or fake completion. |
| **Customer Clarity** | Clear mental model: "The worker is at my door; I give the OTP to let them begin the work." | Confusing: Customer wonders why OTP is displayed 45 minutes before anyone arrives. |
| **System Resilience** | Requires push notification / socket update to reveal OTP when worker arrives, with SMS fallback. | Static display on customer screen. |

### Decision & Recommendation
**Adopt Option A: Customer sees OTP only when booking status is `ARRIVED`.**  
Under no circumstances should the OTP be displayed to the customer or stored in plaintext on the client before the worker has physically reached the premises. This is standard zero-trust security for physical gig platforms.

### Architectural Impact
* **Impact on Frontend:**
  * `user-frontend`: Booking tracking screen displays:
    * During `ACCEPTED` / `IN_TRANSIT`: "Worker is on the way. Your Start PIN will appear here once the worker arrives at your door."
    * Upon `ARRIVED` event: Pulsing security card reveals the 4-digit PIN: `*** -> [ 4 8 2 1 ]` with helper text: "Share this code only after verifying the worker's identity at your door."
  * `worker-frontend`: Pin keypad opens automatically upon tapping "I Have Arrived". Worker enters the 4-digit code provided by customer.
* **Impact on Backend:**
  * `GET /api/bookings/:bookingId` redacts the OTP unless `caller.role === 'CUSTOMER'` AND `status === 'ARRIVED'`.
  * Plaintext OTP is **never** stored in the database. Backend generates a cryptographically secure 4-digit PIN, stores only `saltedHash = HMAC-SHA256(PIN, bookingId + customerId)`, and sends the plaintext PIN to the customer strictly on `ARRIVED` event.
  * Rate-limiting on `POST /api/bookings/:bookingId/verify-otp` (maximum 5 failed attempts before 15-minute temporary lockout).
* **Impact on Database:**
  * `Booking.security`:
    ```typescript
    security: {
      otpHash: string; // HMAC-SHA256(pin, salt)
      failedAttempts: number;
      lockedUntil?: Date | null;
      verifiedAt?: Date | null;
    }
    ```
* **Impact on APIs:**
  * `POST /api/bookings/:bookingId/arrive` (Worker, triggers OTP release)
  * `POST /api/bookings/:bookingId/verify-otp` (Worker submits PIN to begin `IN_PROGRESS`)

---

## 5. ADR-04: Community Pooling & Multi-Worker Model

### Context
Large cooperative service requests (e.g., full house post-construction cleaning, complex plumbing overhaul, agricultural processing) require a team of workers (2 to 5 artisans), potentially pooled from neighboring cooperative societies.
* **Option A:** Individual `Booking` Document per worker, unified under a shared `teamId` (or `parentBookingId`).
* **Option B:** Specialized Multi-Worker Single `Booking` Document with an embedded array of assigned workers.

### Comparative Analysis

| Evaluation Criterion | Option A: Individual Bookings with Shared `teamId` | Option B: Embedded Multi-Worker Array in Single Document |
|---|---|---|
| **MongoDB Concurrency & Locking** | Excellent: Each worker updates their own document independently. Zero document version conflicts (`VersionError` in Mongoose). | Poor: High write contention. When worker 1 uploads photos while worker 2 submits OTP and worker 3 updates GPS, race conditions cause frequent write conflicts. |
| **Granular Worker Lifecycle** | Flexible: Worker A arrives at 09:00 AM; Worker B arrives at 09:30 AM due to transit. Each has distinct arrival time, OTP handshake, and work proof. | Complex: Requires multi-state machines inside array elements (`workers[0].status`, `workers[1].status`) alongside an aggregate booking status. |
| **Financial Settlement & Cooperative Splits** | Clean: Each document represents exactly one artisan's labor payout (85%), society commission (10%), and platform fee (5%). Cross-society pooling is trivial. | Fragile: Complex nested accounting calculation inside one document; splitting across different societies becomes messy to audit. |
| **Schema Uniformity** | 100% Uniform: The entire backend uses one canonical `Booking` schema. Solo bookings simply have `teamId: null` and `isTeamLead: false`. | Fractured: Requires maintaining two different booking schemas or complex conditional validation throughout all endpoints. |

### Decision & Recommendation
**Adopt Option A: Individual `Booking` Document per worker with a shared `teamId`.**  
This adheres to pure domain-driven design. Each artisan performs individual labor, incurs individual liability, submits individual before/after work proof, and receives individual cooperative dividend credits. A shared `teamId` and `parentBookingId` cleanly unites them for the customer's grouped invoice and tracking UI.

### Architectural Impact
* **Impact on Frontend:**
  * `user-frontend`: Team bookings display a unified parent order summary with nested cards for each assigned team member (`teamMembers: Booking[]`).
  * `worker-frontend`: The artisan sees their individual job card. If designated as `isTeamLead: true`, they also see a "Team Overview" tab showing their co-workers' arrival statuses.
  * `admin-frontend`: Can filter bookings by `teamId` to monitor multi-worker project health.
* **Impact on Backend:**
  * Order creation controller accepts `workerCount: number`. If `> 1`, it creates 1 Parent Reservation / Team Reference and $N$ individual `Booking` documents linked via `teamId`.
  * Completion of the team project triggers when all sibling bookings reach `COMPLETED`.
* **Impact on Database:**
  * In `Booking` schema:
    ```typescript
    teamId?: string | null;           // UUID grouping all bookings in this assignment
    parentBookingId?: string | null; // Top-level booking reference for the customer
    isTeamLead: boolean;             // Designates team lead coordinator
    ```
* **Impact on APIs:**
  * `GET /api/bookings?teamId=...` returns all sister bookings for a team job.
  * `POST /api/bookings` payload supports optional `requiredWorkerCount: number`.

---

## 6. Architecture Decisions Verification Matrix

| Decision | Integrity Check | Security Check | Scalability Check | Cooperative Alignment Check |
|---|---|---|---|---|
| **ADR-01 (Punjab Pilot)** | Verified against `worker-frontend` localization & tehsils. | Complies with Indian state cooperative legal frameworks. | GeoJSON polygons allow seamless multi-state expansion. | Direct support for Punjab PACS & Labor Cooperatives. |
| **ADR-02 (Material Costs)** | Prevents unrecorded cash transactions. | Customer must explicitly authorize quote with photo receipt. | Real-time WebSocket notifications + async MongoDB updates. | Transparent pricing; protects workers from out-of-pocket loss. |
| **ADR-03 (OTP on Arrive)** | Enforces physical doorstep arrival before work starts. | Plaintext PIN never stored; salted HMAC hash; rate limited. | Instant UI trigger via WebSocket/SSE or polling fallback. | Zero ghost jobs; validates artisan diligence. |
| **ADR-04 (Team Pooling)** | Normalized MongoDB documents; zero version lock conflicts. | Individual accountability and biometric/photo proof per worker. | Horizontal scale with independent write locks per artisan. | Enables multi-society cooperative pooling without friction. |

---

*End of Architecture Decision Records (`architecture-decisions.md`)*
