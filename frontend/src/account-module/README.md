# Standalone Worker Account Module for React & Next.js

A self-contained, drop-in **Worker Account & Profile Management** module extracted from GigSevak. It includes the complete account dashboard, full profile editing with skill picker, location management, insurance status & application, KYC verification, 128-job completed records with photo lightbox, bank account details, and light/dark theme switching — with **zero dependencies** on Home, Voice Assistance, or active bookings.

---

## 📦 What's Included

- ✅ **Profile Header:** Avatar with photo upload, Worker Name, Mobile Number (OTP Verified badge), and "Edit Profile" action button.
- ✅ **Edit Profile (Full Inside Options):**
  - Personal information with locked Aadhaar-verified fields (Name, DOB, Gender).
  - Mobile number editing with OTP verification status.
  - Location & Address with 6-digit Indian pincode validation.
  - Preferred working areas with searchable multi-category catalog modal.
  - Primary skill selector, years of experience, and skill level (Beginner / Intermediate / Expert).
  - Dynamic chip tags for services offered & tools/equipment.
  - Work preferences: Interactive 7-day selector, working hours, and work type (Full-time / Part-time).
  - Professional profile: "About Me" bio, previous work experience, certifications, and training completed chips.
  - Proof of work portfolio with client photo uploads and removal.
- ✅ **Total Revenue Stat Card:** ₹51,200 formatted with Indian currency formatting.
- ✅ **View Profile Modal:** Cooperative branch, worker rating (★ 4.9), verified reviews, and membership ID.
- ✅ **Change Your Location:** Current registered location summary, current address, city, pincode, interactive working area chips, and in-page dropdown selector.
- ✅ **Settings Modal:** Booking sound alerts toggle, auto-accept emergency calls toggle, dispatch radius (8 km), and app language selector.
- ✅ **Theme Switcher:** Light & Dark mode selector with radio buttons and HTML `data-theme` synchronization.
- ✅ **Total Jobs (128):** Clickable card leading to the complete Completed Jobs sub-feature:
  - Search jobs by customer name, service name, locality, or Job ID.
  - Filters by service category and date (Today, This Week, This Month, Older).
  - 128 job records with customer avatar, total amount, rating badge, and completion status.
  - **Job Details View:** Breakdown of Base charge + Material cost + Additional charges, customer review, distance travelled, arrival/departure timestamps.
  - **Photo Lightbox:** Full-screen high-resolution photo gallery modal with thumbnail strip, prev/next arrows, and caption for before/after work evidence.
- ✅ **Bank Account Details Modal:** Linked payout account card with masked number, account holder name, IFSC code, branch, and inline editing & saving.
- ✅ **Insurance Status:** "Self-Declared" status badge, active policy schedule details, coverage checklist, document preview, and "Apply for Insurance" application flow.
- ✅ **KYC Verification:** Verified status (in green), 85% progress bar, UIDAI Aadhaar, biometric face match (98.4%), and certificate verification list.
- ✅ **Logout Modal:** Confirmation modal with `onLogout` callback to handle user sign-out in your application.
- 🚫 **Excluded:** No Home dashboard, no Voice assistance, and no active client booking dispatch sections.

---

## 🚀 Quick Start (1 Minute)

### 1. Copy the Folder
Copy the `account-module/` folder directly into your project's `src/` (or `components/`) directory:

```bash
# Example
cp -r account-module /path/to/your-project/src/account-module
```

### 2. Basic Drop-in Usage (React / Vite / CRA)

```tsx
import React from "react";
import { AccountSection } from "./account-module";

export const ProfilePage: React.FC = () => {
  return (
    <AccountSection
      onLogout={() => {
        console.log("Worker logged out");
        // e.g., clear tokens, redirect to /login
      }}
    />
  );
};

export default ProfilePage;
```

---

## ⚡ Integration in Next.js

### Next.js App Router (`app/account/page.tsx`)

Because the component uses React state and browser APIs for modals and local storage, include `'use client';` at the top of the page:

```tsx
// app/account/page.tsx
"use client";

import React from "react";
import { AccountSection } from "@/account-module";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const router = useRouter();

  const handleLogout = () => {
    // Clear cookies/tokens
    router.push("/login");
  };

  const handleSaveProfile = (updatedWorker) => {
    // Send updated profile to your backend API
    // await fetch('/api/worker/profile', { method: 'PUT', body: JSON.stringify(updatedWorker) });
    console.log("Saved worker profile:", updatedWorker);
  };

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#F8F9FA" }}>
      <AccountSection
        onLogout={handleLogout}
        onSaveProfile={handleSaveProfile}
        onBack={() => router.back()}
      />
    </main>
  );
}
```

### Next.js Pages Router (`pages/account.tsx`)

```tsx
// pages/account.tsx
import React from "react";
import dynamic from "next/dynamic";

// Disable SSR if your Next.js project does not use localStorage on the server
const AccountSection = dynamic(
  () => import("../src/account-module").then((mod) => mod.AccountSection),
  { ssr: false }
);

export default function AccountPage() {
  return <AccountSection onLogout={() => alert("Logged out")} />;
}
```

---

## 🛠️ Props Reference

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `initialWorker` | `Partial<WorkerProfile>` | `DEFAULT_WORKER` | Custom initial worker data (name, phone, avatar, skills, bank, insurance, etc.). |
| `initialTheme` | `'light' \| 'dark'` | `'light'` | Default color theme. |
| `onLogout` | `() => void` | `undefined` | Callback invoked when the user confirms logout in the logout modal. |
| `onSaveProfile`| `(worker: WorkerProfile) => void` | `undefined` | Callback invoked whenever the worker profile is updated and saved. |
| `onBack` | `() => void` | `undefined` | Callback invoked when the back button on the main Account view is clicked. |
| `syncHashRouting` | `boolean` | `true` | If `true`, synchronizes internal views (`edit-profile`, `insurance`, `kyc`, etc.) with `window.location.hash`. Set to `false` for pure in-memory state routing without URL changes. |
| `className` | `string` | `""` | Optional CSS class name attached to the root container. |
| `style` | `React.CSSProperties` | `undefined` | Optional inline styles attached to the root container. |

---

## 🔌 Connecting to Your Backend API

You can easily pass real worker data from your database (Supabase, Firebase, Node.js, PostgreSQL):

```tsx
import React, { useEffect, useState } from "react";
import { AccountSection, WorkerProfile } from "@/account-module";

export const UserAccount = () => {
  const [workerData, setWorkerData] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/worker/me")
      .then((res) => res.json())
      .then((data) => {
        setWorkerData(data);
        setLoading(false);
      });
  }, []);

  const handleSave = async (updated: WorkerProfile) => {
    await fetch("/api/worker/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
  };

  if (loading) return <div>Loading profile...</div>;

  return (
    <AccountSection
      initialWorker={workerData || undefined}
      onSaveProfile={handleSave}
    />
  );
};
```

---

## 🎨 Customizing Styles & Colors

All styling is managed via CSS variables in `src/account-module/styles/variables.css`:

```css
:root {
  /* Change brand theme color (default is GigSevak terracotta #A66666) */
  --primary: #4F46E5; /* Indigo */
  --primary-hover: #4338CA;
  --primary-light: rgba(79, 70, 229, 0.08);

  /* Backgrounds */
  --bg-app: #F8F9FA;
  --bg-card: #FFFFFF;

  /* Fonts */
  --font-family: 'Inter', system-ui, sans-serif;
}
```

The module automatically sets `data-theme="dark"` on the `<html>` root when dark mode is chosen, instantly shifting all card colors, borders, and text colors.

---

## 📂 File Structure

```
account-module/
├── index.ts                      # Main public barrel export
├── AccountSection.tsx            # Main drop-in component
├── types/
│   └── index.ts                  # TypeScript types
├── context/
│   └── AccountContext.tsx        # Self-contained state & router
├── data/
│   ├── defaultWorker.ts          # Rajesh Kumar (128 jobs, ₹51,200 revenue)
│   ├── serviceCatalog.ts         # Multi-category services for skill selector
│   ├── completedJobs.ts          # 128-job dataset with photo evidence
│   └── kycData.ts                # KYC verification items
├── views/
│   ├── AccountView.tsx           # Main Account dashboard
│   ├── EditProfileView.tsx       # Comprehensive profile editor
│   ├── ChangeLocationView.tsx    # Location & working areas
│   ├── InsuranceView.tsx         # Insurance status
│   ├── ApplyInsuranceView.tsx    # Apply insurance flow
│   ├── KycVerificationView.tsx   # Verified KYC screen
│   ├── CompletedJobsView.tsx     # Completed jobs list & filters
│   └── CompletedJobDetailView.tsx # Completed job detail & breakdown
├── modals/
│   ├── ProfileModal.tsx          # View Profile modal
│   ├── SettingsModal.tsx         # Settings modal
│   ├── BankAccountModal.tsx      # Bank Account modal
│   ├── LogoutModal.tsx           # Logout confirmation modal
│   ├── ServicesPickerModal.tsx   # Service catalog selector
│   └── LightboxModal.tsx         # High-res photo gallery modal
├── components/
│   └── common/
│       └── Toast.tsx             # Floating notification toast
├── styles/
│   ├── account-module.css        # Unified master stylesheet
│   ├── variables.css             # Colors, theme tokens & typography
│   ├── modals.css                # Dialog & lightbox styles
│   ├── account.css               # Main account screen styles
│   ├── edit-profile.css          # Edit profile styles
│   ├── change-location.css       # Location styles
│   ├── insurance.css             # Insurance styles
│   ├── kyc.css                   # KYC styles
│   └── completed-jobs.css        # Completed jobs & details styles
└── README.md                     # This integration guide
```
