import type { WorkerProfile } from "../types";

export const DEFAULT_WORKER: WorkerProfile = {
  name: "Rajesh Kumar",
  phone: "+91 98765 43210",
  phoneVerified: true,
  email: "rajesh.kumar@gigsevak.coop",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
  role: "Multiskilled Technician",
  coopBranch: "Kapurthala Urban Cooperative",
  memberId: "GS-PUN-2026-089",
  rating: 4.9,
  totalJobsToday: 6,
  estimatedEarnings: 3950,
  isAvailable: true,

  dateOfBirth: "15 May 1998",
  dobVerified: true,
  gender: "Male",
  genderVerified: true,

  preferredLanguage: "English",

  currentAddress: "House 24, Street 4, Model Town",
  city: "Jalandhar",
  pincode: "144003",
  preferredWorkingAreas: [
    "Electrician",
    "Plumber",
    "AC Repair",
    "Switch & Socket Repair"
  ],

  primarySkill: "Electrician",
  yearsOfExperience: "5",
  skillLevel: "Intermediate",
  servicesOffered: [
    "Switchboard Repair",
    "Tap Leakage Fix",
    "AC Gas Refill",
    "Wiring Inspection",
    "Appliance Fitting"
  ],
  toolsAndEquipment: [
    "Pipe Wrench",
    "Screwdriver Set",
    "Drill Machine",
    "Digital Multimeter",
    "Safety Gloves"
  ],

  availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  workingHoursStart: "09:00",
  workingHoursEnd: "18:00",
  workType: "Full-time",

  aboutMe: "Certified cooperative technician with over 5 years of field experience in household electrical troubleshooting, domestic plumbing fixes, and split AC maintenance. Punctual, reliable, and committed to high quality work.",
  previousWorkExperience: "Worked as Senior Field Technician with Kapurthala City Cooperative maintenance wing for 3 years, resolving over 1,200 residential and commercial repair requests.",
  certifications: [
    "ITI Certificate in Electrical (2020)",
    "Skill India Plumber Level 4 (2022)"
  ],
  trainingCompleted: [
    "Electrical Safety & High Voltage Training",
    "First Aid & Disaster Response 2025"
  ],
  portfolio: [
    { id: "p1", url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80", title: "Distribution Board Setup" },
    { id: "p2", url: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400&auto=format&fit=crop&q=80", title: "Kitchen Sink Plumbing" },
    { id: "p3", url: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&auto=format&fit=crop&q=80", title: "Split AC Compressor Servicing" }
  ],

  totalJobs: 128,
  totalRevenue: 51200,

  bankAccount: {
    bankName: "State Bank of India",
    accountNumber: "•••• •••• 4892",
    ifsc: "SBIN0001234",
    branch: "Main Market Branch, Kapurthala",
    holderName: "Rajesh Kumar",
    status: "Verified & Active"
  },

  insurance: {
    hasInsurance: true,
    type: "Personal Accident Insurance",
    provider: "National Insurance Co. Ltd.",
    policyNumber: "NIC-GIG-2025-4587",
    holderName: "Rajesh Kumar",
    coverageAmount: 200000,
    startDate: "2025-01-15",
    expiryDate: "2026-01-14",
    coverageItems: [
      "Accidental Injury",
      "Hospitalisation",
      "Disability"
    ],
    otherCoverageText: "",
    documentName: "Policy_Schedule_2025.pdf",
    verificationStatus: "self-declared",
    status: "Self-Declared",
    application: null
  },

  kyc: {
    status: "Verified",
    document: "Aadhaar Card & Trade Certificate",
    verifiedDate: "12 May 2026",
    verificationOfficer: "Cooperative Registrar Office, Jalandhar",
    badge: "Fully Verified Member"
  }
};
