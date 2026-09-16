# GigSevak — Security & Vulnerability Hardening Audit

## 1. Security Architecture Summary

The GigSevak platform implements defense-in-depth security practices across network, application, identity, and database layers:

```
┌────────────────────────────────────────────────────────────┐
│                    Client Applications                     │
└─────────────────────────────┬──────────────────────────────┘
                              │ HTTPS / WSS
┌─────────────────────────────▼──────────────────────────────┐
│  Security Perimeter (Helmet Headers, CORS, Rate Limiters) │
└─────────────────────────────┬──────────────────────────────┘
                              │ JWT Bearer Authentication
┌─────────────────────────────▼──────────────────────────────┐
│     Identity & RBAC Middleware (Ownership & Tenancy)       │
└─────────────────────────────┬──────────────────────────────┘
                              │
┌─────────────────────────────▼──────────────────────────────┐
│ Business Domain Layer (HMAC OTP Verification, State Guard) │
└─────────────────────────────┬──────────────────────────────┘
                              │ Mongoose ORM Parameterization
┌─────────────────────────────▼──────────────────────────────┐
│                    MongoDB Single Store                    │
└────────────────────────────────────────────────────────────┘
```

---

## 2. Hardened Security Controls

### A. Authentication & Secret Management
- **JWT Signing:** Access tokens signed with `HS256` using secure high-entropy secrets (`JWT_SECRET`). Expiration enforced; expired tokens rejected with `401 Token expired`.
- **Password Protection:** Admin passwords salted and hashed using `bcryptjs` with 10 salt rounds. Plaintext passwords never stored.
- **Client Identity Non-Trust:** Client-supplied `userId`, `workerId`, `role`, or `societyId` in request bodies are ignored. Authorization is derived strictly from verified JWT tokens.

### B. OTP Security & Timing Attack Mitigation
- **Cryptographic Hash Verification:** Worker-entered OTPs are evaluated using Node's `crypto.timingSafeEqual` over HMAC-SHA256 digests, eliminating side-channel timing attack vectors.
- **Zero Plaintext Persistence:** OTPs are never saved to database fields, memory heaps, or application logs.
- **Strict Revelation Timing:** OTP is revealed to customers exclusively when worker status is `ARRIVED`.
- **Brute Force Lockout:** 5 consecutive failed OTP entries triggers an automatic 15-minute lock (`HTTP 429 Too Many Requests`).

### C. Insecure Direct Object Reference (IDOR) Defense
- Customers attempting to view or alter another customer's booking are blocked with `HTTP 403 ACCESS_DENIED`.
- Workers attempting to complete or modify another worker's booking are blocked with `HTTP 403 ACCESS_DENIED`.
- Society Admins attempting to query or alter workers/bookings outside their society jurisdiction are blocked with `HTTP 403 ACCESS_DENIED`.

### D. Network & Header Security
- `helmet`: Enforces XSS filter, DNS prefetch control, frameguard (anti-clickjacking), and hidePoweredBy.
- Parameterized MongoDB queries via Mongoose prevent NoSQL injection.
- CORS restricted to known frontends in production environments.