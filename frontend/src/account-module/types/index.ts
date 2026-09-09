/* ==========================================================================
   Account Module - Domain Types & Interfaces
   ========================================================================== */

export type ThemeMode = "light" | "dark";

export type AccountSubView =
  | "main"
  | "edit-profile"
  | "change-location"
  | "insurance"
  | "apply-insurance"
  | "kyc"
  | "completed-jobs"
  | "completed-job-detail";

export type AccountModalId =
  | "profile"
  | "settings"
  | "bank-account"
  | "logout"
  | "services-picker"
  | "lightbox"
  | "language";

export interface ServiceItem {
  id: string;
  name: string;
  image: string;
}

export interface ServiceCategory {
  category: string;
  services: ServiceItem[];
}

export interface BankAccount {
  bankName: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  holderName: string;
  status: string;
}

export interface LocationData {
  currentAddress: string;
  city: string;
  pincode: string;
  preferredWorkingAreas: string[];
  coordinates?: { lat: number; lng: number };
}

export type InsuranceChoice = "yes" | "no" | null;
export type InsuranceVerificationStatus = "Verified" | "Self-Declared";

export interface InsurancePolicy {
  hasInsurance: boolean;
  type: string;
  provider: string;
  policyNumber: string;
  holderName: string;
  coverageAmount: number;
  startDate: string;
  expiryDate: string;
  coverageItems: string[];
  otherCoverageText: string;
  documentName: string;
  verificationStatus: "self-declared" | "verified";
  status: string;
  application: InsuranceApplication | null;
}

export interface InsuranceApplication {
  fullName: string;
  dob: string;
  mobile: string;
  address: string;
  city: string;
  pincode: string;
  gender: string;
  preferredType: string;
  nomineeName: string;
  nomineeRel: string;
  coveragePref: string;
  appliedDate: string;
  status: string;
}

export interface KycInfo {
  status: "Verified" | "Under Review";
  document: string;
  verifiedDate: string;
  verificationOfficer: string;
  badge: string;
}

export interface PortfolioItem {
  id: string;
  url: string;
  title: string;
}

export interface WorkerProfile {
  name: string;
  phone: string;
  phoneVerified: boolean;
  email: string;
  avatar: string;
  role: string;
  coopBranch: string;
  memberId: string;
  rating: number;
  totalJobsToday: number;
  estimatedEarnings: number;
  isAvailable: boolean;

  dateOfBirth: string;
  dobVerified: boolean;
  gender: string;
  genderVerified: boolean;
  preferredLanguage: string;

  currentAddress: string;
  city: string;
  pincode: string;
  preferredWorkingAreas: string[];
  coordinates?: { lat: number; lng: number };

  primarySkill: string;
  yearsOfExperience: string;
  skillLevel: "Beginner" | "Intermediate" | "Expert";
  servicesOffered: string[];
  toolsAndEquipment: string[];

  availableDays: string[];
  workingHoursStart: string;
  workingHoursEnd: string;
  workType: "Full-time" | "Part-time";

  aboutMe: string;
  previousWorkExperience: string;
  certifications: string[];
  trainingCompleted: string[];
  portfolio: PortfolioItem[];

  totalJobs: number;
  totalRevenue: number;
  bankAccount: BankAccount;
  insurance: InsurancePolicy;
  kyc: KycInfo;
}

export interface WorkPhoto {
  url: string;
  title: string;
  desc: string;
}

export interface CompletedJob {
  id: string;
  jobId: string;
  serviceName: string;
  serviceCategory: string;
  customerName: string;
  customerImage: string;
  locality: string;
  description: string;
  date: string;
  dateIso: string;
  time: string;
  duration: string;
  status: "Completed";
  completionTime: string;

  distanceTravelled: string;
  arrivalTime: string;
  departureTime: string;

  workPerformed: string;
  additionalWork: string;

  baseServiceCharge: number;
  materialCost: number;
  additionalCharges: number;
  totalAmount: number;

  paymentStatus: "Paid";
  paymentMethod: string;

  customerRating: number;
  customerReview: string;

  beforeWorkPhotos: WorkPhoto[];
  afterWorkPhotos: WorkPhoto[];
}
