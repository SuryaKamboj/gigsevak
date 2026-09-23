# GigSevak — Unified Cooperative Gig Platform

GigSevak is a cooperative gig platform integrating three distinct client applications with a single shared Node.js/Express backend and a single canonical MongoDB database.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       GigSevak Platform                     │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               │    gigsevak-backend (Port 5000)│
               │    Node.js + Express + MongoDB │
               └───────────────▲───────────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       │                       │                       │
┌──────┴─────────┐     ┌───────┴────────┐     ┌────────┴────────┐
│  user-frontend │     │ worker-frontend│     │  admin-frontend │
│  Customer Web  │     │ Cooperative    │     │ Apex & Society  │
│  (Port 5173)   │     │ Worker Portal  │     │ Admin Portal    │
│                │     │ (Port 5174)    │     │ (Port 5175)     │
└────────────────┘     └────────────────┘     └─────────────────┘
```

---

## Prerequisites
- **Node.js:** v18+ (Tested on v24.15.0)
- **npm:** v9+
- **MongoDB:** Optional (External MongoDB connection string via `MONGODB_URI` or automatic embedded in-memory MongoDB fallback in dev mode)

---

## Platform Repositories & Ports

| Application | Directory | Tech Stack | Default Port | Description |
|---|---|---|---|---|
| **Shared Backend** | `gigsevak-backend` | Node.js + Express + Mongoose | `5000` | Central REST API, RBAC, state machine, and pricing engine |
| **Customer Web** | `user-frontend/user-frontend` | React 18 + Vite | `5173` | Customer booking, tracking, and review portal |
| **Worker Portal** | `worker-frontend/frontend` | React 19 + Vite + TypeScript | `5174` | Cooperative artisan job dispatch, transit, and completion |
| **Admin Portal** | `admin-frontend/admin` | React 19 + Vite + TypeScript | `5175` | Federation & Society administrative oversight |

---
ate-machine.md` — Complete lifecycle state transitions and security guards.
- `docs/security-audit.md` — Security controls, HMAC OTP verification, and IDOR protection.
- `docs/e2e-test-report.md` — Full execution report of the 25 automated E2E tests.
