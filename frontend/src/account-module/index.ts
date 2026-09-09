/* ==========================================================================
   Account Module - Public API
   Drop-in standalone module for React / Next.js projects
   ========================================================================== */

export { AccountSection, default } from "./AccountSection";
export type { AccountSectionProps } from "./AccountSection";

export { AccountProvider, useAccount } from "./context/AccountContext";
export type { AccountContextType, AccountProviderProps } from "./context/AccountContext";

export * from "./types";
export { DEFAULT_WORKER } from "./data/defaultWorker";
export { SERVICE_CATALOG } from "./data/serviceCatalog";
export { COMPLETED_JOBS } from "./data/completedJobs";
export { KYC_VERIFICATION_ITEMS } from "./data/kycData";

// Individual views for custom composition
export { AccountView } from "./views/AccountView";
export { EditProfileView } from "./views/EditProfileView";
export { ChangeLocationView } from "./views/ChangeLocationView";
export { InsuranceView } from "./views/InsuranceView";
export { ApplyInsuranceView } from "./views/ApplyInsuranceView";
export { KycVerificationView } from "./views/KycVerificationView";
export { CompletedJobsView } from "./views/CompletedJobsView";
export { CompletedJobDetailView } from "./views/CompletedJobDetailView";

// Modals
export { ProfileModal } from "./modals/ProfileModal";
export { SettingsModal } from "./modals/SettingsModal";
export { BankAccountModal } from "./modals/BankAccountModal";
export { LogoutModal } from "./modals/LogoutModal";
export { ServicesPickerModal } from "./modals/ServicesPickerModal";
export { LightboxModal } from "./modals/LightboxModal";
export { LanguageModal } from "./modals/LanguageModal";
