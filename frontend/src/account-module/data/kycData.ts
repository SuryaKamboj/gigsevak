export interface VerificationItem {
  id: string;
  label: string;
  status: "Verified" | "Under Review";
  detail?: string;
}

export const KYC_VERIFICATION_ITEMS: VerificationItem[] = [
  { id: "aadhaar", label: "Aadhaar", status: "Verified", detail: "UIDAI e-Aadhaar Verified (•••• 9912)" },
  { id: "face", label: "Face", status: "Verified", detail: "Biometric Live Face Match: 98.4%" },
  { id: "mobile", label: "Mobile", status: "Verified", detail: "OTP Authenticated (+91 98765 43210)" },
  { id: "address", label: "Address", status: "Verified", detail: "GPS Geofenced & Address Proof Document" },
  { id: "skills", label: "Skills", status: "Verified", detail: "Skill India Certified Electrician & Plumber" },
  { id: "certificates", label: "Certificates", status: "Verified", detail: "National Trade Certificate (ITI Punjab 2020)" },
  { id: "experience", label: "Experience", status: "Under Review", detail: "Past cooperative service logbook under registrar review" },
  { id: "emergency-contact", label: "Emergency Contact", status: "Verified", detail: "Primary next-of-kin contact confirmed" }
];
