# GigSevak — Role-Based Access Control (RBAC) & Scope Matrix

## 1. Role Hierarchy & Definitions

```
                     ┌───────────────────────────┐
                     │   PLATFORM_SUPER_ADMIN    │
                     │   Global System Scope     │
                     └─────────────┬─────────────┘
                                   │
                     ┌─────────────▼─────────────┐
                     │     FEDERATION_ADMIN      │
                     │   Federation-wide Scope   │
                     └─────────────┬─────────────┘
                                   │
                     ┌─────────────▼─────────────┐
                     │       SOCIETY_ADMIN       │
                     │    Single Society Scope   │
                     └─────────────┬─────────────┘
                                   │
                ┌──────────────────┴──────────────────┐
                │                                     │
     ┌──────────▼──────────┐               ┌──────────▼──────────┐
     │       WORKER        │               │      CUSTOMER       │
     │ Own Profile & Jobs  │               │ Own Bookings & Revs │
     └─────────────────────┘               └─────────────────────┘
```

---

## 2. Server-Side Scoping Rules

| Role | Scope Boundary | Database Filter Applied | Cross-Tenant Behavior |
|---|---|---|---|
| **`CUSTOMER`** | Own Resources | `{ userId: req.user._id }` | HTTP 403 Access Denied |
| **`WORKER`** | Assigned / Offered Jobs | `{ workerId: worker._id }` | HTTP 403 Access Denied |
| **`SOCIETY_ADMIN`** | Single Cooperative Society | `{ societyId: req.user.societyId }` | HTTP 403 Access Denied |
| **`FEDERATION_ADMIN`** | Member Societies in Federation | `{ federationId: req.user.federationId }` | HTTP 403 Access Denied |
| **`PLATFORM_SUPER_ADMIN`** | Entire Platform | Unrestricted (`{}`) | Full Read / Write |

---

## 3. Detailed Permission Matrix

| Resource / Action | Customer | Worker | Society Admin | Federation Admin | Super Admin |
|---|:---:|:---:|:---:|:---:|:---:|
| `POST /api/bookings` (Create) | ✅ | ❌ (403) | ✅ | ✅ | ✅ |
| `GET /api/bookings/:id` | ✅ (Own only) | ✅ (Assigned only) | ✅ (Society scope) | ✅ (Federation scope) | ✅ |
| `POST /api/bookings/:id/accept` | ❌ (403) | ✅ (Assigned only) | ❌ (403) | ❌ (403) | ❌ (403) |
| `POST /api/bookings/:id/start-job` | ❌ (403) | ✅ (Assigned only) | ❌ (403) | ❌ (403) | ❌ (403) |
| `POST /api/bookings/:id/material-request` | ❌ (403) | ✅ (Assigned only) | ❌ (403) | ❌ (403) | ❌ (403) |
| `POST .../material-request/:id/resolve` | ✅ (Own only) | ❌ (403) | ✅ (Society scope) | ✅ (Federation scope) | ✅ |
| `POST /api/bookings/:id/complete` | ❌ (403) | ✅ (Assigned only) | ❌ (403) | ❌ (403) | ❌ (403) |
| `POST /api/reviews` | ✅ (Completed own) | ❌ (403) | ❌ (403) | ❌ (403) | ❌ (403) |
| `GET /api/admin/analytics` | ❌ (403) | ❌ (403) | ✅ (Society counts) | ✅ (Federation counts) | ✅ (Global) |
| `GET /api/admin/workers` | ❌ (403) | ❌ (403) | ✅ (Society workers) | ✅ (Federation workers) | ✅ (Global) |
| `PUT /api/admin/workers/:id/kyc` | ❌ (403) | ❌ (403) | ✅ (Own society only) | ✅ (Own federation only) | ✅ (Global) |
| `GET /api/admin/societies` | ❌ (403) | ❌ (403) | ✅ (Own society) | ✅ (Federation societies) | ✅ (Global) |
| `GET /api/notifications` | ✅ (Own only) | ✅ (Own only) | ✅ (Own only) | ✅ (Own only) | ✅ (Own only) |