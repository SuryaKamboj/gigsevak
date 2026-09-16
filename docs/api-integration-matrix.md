# GigSevak — Complete API Integration Matrix

This matrix documents the end-to-end trace from Frontend callers to Database persistence.

| Frontend App | Frontend Service Method | HTTP Method | Endpoint | Auth Req | Required Role | Controller / Middleware | Backend Service | Mongoose Model | Status |
|---|---|---|---|---|---|---|---|---|---|
| `user-frontend` | `authApi.requestOtp` | `POST` | `/api/auth/login` | None | None | `auth.js` | Express Validator | `User` | Active |
| `user-frontend` / `worker-frontend` | `authApi.verifyOtp` / `workerBackendService.loginWorker` | `POST` | `/api/auth/verify-otp` | Optional (Firebase Token) | `CUSTOMER` / `WORKER` | `auth.js` -> Firebase Admin | `signTokens` | `User`, `Worker` | Active |
| `admin-frontend` | `adminService.login` | `POST` | `/api/auth/admin/login` | None | None | `auth.js` -> `handleAdminLogin` | `bcrypt.compare` + `signTokens` | `User` | Active |
| `all` | `api.post('/auth/refresh')` | `POST` | `/api/auth/refresh` | Refresh Token | All | `auth.js` | `jwt.verify` | `User` | Active |
| `user-frontend` | `servicesApi.fetchServices` | `GET` | `/api/services` | None | Public | `services.js` | Query filter | `Service` | Active |
| `user-frontend` | `servicesApi.fetchServiceById` | `GET` | `/api/services/:id` | None | Public | `services.js` | Service Detail | `Service` | Active |
| `user-frontend` | `workersApi.fetchWorkers` | `GET` | `/api/workers` | None | Public | `workers.js` | Query filter & sort | `Worker` | Active |
| `user-frontend` | `workersApi.fetchWorkerById` | `GET` | `/api/workers/:id` | None | Public | `workers.js` | Worker detail | `Worker` | Active |
| `user-frontend` | `workersApi.fetchWorkerReviews` | `GET` | `/api/workers/:id/reviews` | None | Public | `workers.js` | Review filter | `Review` | Active |
| `user-frontend` | `bookingApi.createBooking` | `POST` | `/api/bookings` | Bearer JWT | `CUSTOMER` | `bookings.js` -> `authenticateJwt` | `calculatePricing`, `getOtpForBooking` | `Booking`, `Service`, `Worker` | Active |
| `user-frontend` | `bookingApi.fetchBookings` | `GET` | `/api/bookings` | Bearer JWT | All (Scoped) | `bookings.js` -> `authenticateJwt` | Role filter | `Booking` | Active |
| `user-frontend` | `bookingApi.fetchBookingById` | `GET` | `/api/bookings/:id` | Bearer JWT | Resource Owner / Admin | `bookings.js` -> `authenticateJwt` | OTP visibility guard | `Booking` | Active |
| `worker-frontend` | `workerBackendService.acceptJob` | `POST` | `/api/bookings/:id/accept` | Bearer JWT | `WORKER` | `bookings.js` -> `authenticateJwt` | State machine transition | `Booking`, `Worker` | Active |
| `worker-frontend` | `workerBackendService.declineJob` | `POST` | `/api/bookings/:id/decline` | Bearer JWT | `WORKER` | `bookings.js` -> `authenticateJwt` | Dispatch log update | `Booking` | Active |
| `worker-frontend` | `workerBackendService.markInTransit`| `POST` | `/api/bookings/:id/in-transit` | Bearer JWT | Assigned `WORKER` | `bookings.js` -> `authenticateJwt` | Transition to `IN_TRANSIT` | `Booking` | Active |
| `worker-frontend` | `workerBackendService.markArrived` | `POST` | `/api/bookings/:id/arrived` | Bearer JWT | Assigned `WORKER` | `bookings.js` -> `authenticateJwt` | Transition to `ARRIVED` | `Booking` | Active |
| `worker-frontend` | `workerBackendService.startJobWithOtp`| `POST` | `/api/bookings/:id/start-job` | Bearer JWT | Assigned `WORKER` | `bookings.js` -> `authenticateJwt` | `verifyBookingOtp` HMAC check | `Booking` | Active |
| `worker-frontend` | `workerBackendService.submitMaterialRequest` | `POST` | `/api/bookings/:id/material-request` | Bearer JWT | Assigned `WORKER` | `bookings.js` -> `authenticateJwt` | Material Request append | `Booking` | Active |
| `user-frontend` | `bookingApi.resolveMaterialRequest` | `POST` | `/api/bookings/:id/material-request/:reqId/resolve` | Bearer JWT | Owning `CUSTOMER` | `bookings.js` -> `authenticateJwt` | `calculatePricing` update | `Booking` | Active |
| `worker-frontend` | `workerBackendService.completeJob` | `POST` | `/api/bookings/:id/complete` | Bearer JWT | Assigned `WORKER` | `bookings.js` -> `authenticateJwt` | Material check + metrics update | `Booking`, `Worker` | Active |
| `user-frontend` | `bookingApi.cancelBooking` | `POST` | `/api/bookings/:id/cancel` | Bearer JWT | Owner / Admin | `bookings.js` -> `authenticateJwt` | Transition to `CANCELLED` | `Booking`, `Worker` | Active |
| `user-frontend` | `reviewApi.submitReview` | `POST` | `/api/reviews` | Bearer JWT | Owning `CUSTOMER` | `reviews.js` -> `authenticateJwt` | Metric recalculation | `Review`, `Worker` | Active |
| `user-frontend` | `paymentApi.createOrder` | `POST` | `/api/payments/create-order` | Bearer JWT | Owning `CUSTOMER` | `payments.js` -> `authenticateJwt` | Gateway mapping | `Payment`, `Booking` | Active |
| `user-frontend` | `paymentApi.verifyPayment` | `POST` | `/api/payments/verify` | Bearer JWT | Owning `CUSTOMER` | `payments.js` -> `authenticateJwt` | Payment capture | `Payment` | Active |
| `worker-frontend` | `workerBackendService.getProfile` | `GET` | `/api/workers/me` | Bearer JWT | `WORKER` | `workers.js` -> `requireWorker` | Private data population | `Worker`, `WorkerPrivate`| Active |
| `worker-frontend` | `workerBackendService.updateAvailability` | `PUT` | `/api/workers/me/availability` | Bearer JWT | `WORKER` | `workers.js` -> `requireWorker` | Online status toggle | `Worker` | Active |
| `worker-frontend` | `workerBackendService.updateLocation` | `PUT` | `/api/workers/me/location` | Bearer JWT | `WORKER` | `workers.js` -> `requireWorker` | Geo coordinates update | `Worker` | Active |
| `worker-frontend` | `workerBackendService.submitKyc` | `POST` | `/api/workers/me/kyc` | Bearer JWT | `WORKER` | `workers.js` -> `requireWorker` | Private KYC doc update | `Worker`, `WorkerPrivate`| Active |
| `admin-frontend` | `adminService.getAnalytics` | `GET` | `/api/admin/analytics` | Bearer JWT | `ADMIN` Roles | `admin.js` -> `requireAdmin` | Tenant scoped counts | `Worker`, `Booking`, `User` | Active |
| `admin-frontend` | `adminService.getWorkers` | `GET` | `/api/admin/workers` | Bearer JWT | `ADMIN` Roles | `admin.js` -> `requireAdmin` | Tenant scoped list | `Worker`, `WorkerPrivate`| Active |
| `admin-frontend` | `adminService.updateWorkerKyc` | `PUT` | `/api/admin/workers/:id/kyc` | Bearer JWT | `ADMIN` Roles | `admin.js` -> `requireAdmin` | KYC audit verification | `Worker`, `WorkerPrivate`| Active |
| `admin-frontend` | `adminService.getBookings` | `GET` | `/api/admin/bookings` | Bearer JWT | `ADMIN` Roles | `admin.js` -> `requireAdmin` | Tenant scoped list | `Booking` | Active |
| `admin-frontend` | `adminService.getDisputes` | `GET` | `/api/complaints` | Bearer JWT | `ADMIN` Roles | `complaints.js` -> `requireAdmin` | Dispute listing | `Complaint` | Active |
| `admin-frontend` | `adminService.resolveDispute` | `PUT` | `/api/complaints/:id/resolve` | Bearer JWT | `ADMIN` Roles | `complaints.js` -> `requireAdmin` | Dispute resolution | `Complaint` | Active |