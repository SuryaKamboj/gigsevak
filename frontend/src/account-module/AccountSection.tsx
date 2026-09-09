import React from "react";
import { AccountProvider, useAccount } from "./context/AccountContext";
import type { AccountProviderProps } from "./context/AccountContext";
import { AccountView } from "./views/AccountView";
import { EditProfileView } from "./views/EditProfileView";
import { ChangeLocationView } from "./views/ChangeLocationView";
import { InsuranceView } from "./views/InsuranceView";
import { ApplyInsuranceView } from "./views/ApplyInsuranceView";
import { KycVerificationView } from "./views/KycVerificationView";
import { CompletedJobsView } from "./views/CompletedJobsView";
import { CompletedJobDetailView } from "./views/CompletedJobDetailView";

import { ProfileModal } from "./modals/ProfileModal";
import { SettingsModal } from "./modals/SettingsModal";
import { BankAccountModal } from "./modals/BankAccountModal";
import { LogoutModal } from "./modals/LogoutModal";
import { ServicesPickerModal } from "./modals/ServicesPickerModal";
import { LightboxModal } from "./modals/LightboxModal";
import { LanguageModal } from "./modals/LanguageModal";
import { Toast } from "./components/common/Toast";

import "./styles/account-module.css";

export interface AccountSectionProps extends Omit<AccountProviderProps, "children"> {
  className?: string;
  style?: React.CSSProperties;
}

const AccountSectionContent: React.FC = () => {
  const { activeSubView, selectedCompletedJobId } = useAccount();

  const renderView = () => {
    switch (activeSubView) {
      case "edit-profile":
        return <EditProfileView />;
      case "change-location":
        return <ChangeLocationView />;
      case "insurance":
        return <InsuranceView />;
      case "apply-insurance":
        return <ApplyInsuranceView />;
      case "kyc":
        return <KycVerificationView />;
      case "completed-jobs":
        return <CompletedJobsView />;
      case "completed-job-detail":
        return <CompletedJobDetailView jobId={selectedCompletedJobId || ""} />;
      case "main":
      default:
        return <AccountView />;
    }
  };

  return (
    <>
      {renderView()}

      {/* Account Modals */}
      <ProfileModal />
      <SettingsModal />
      <BankAccountModal />
      <LogoutModal />
      <ServicesPickerModal />
      <LightboxModal />
      <LanguageModal />

      {/* Floating Alerts */}
      <Toast />
    </>
  );
};

export const AccountSection: React.FC<AccountSectionProps> = ({
  initialWorker,
  initialTheme,
  onLogout,
  onSaveProfile,
  onBack,
  syncHashRouting = true,
  className = "",
  style
}) => {
  return (
    <AccountProvider
      initialWorker={initialWorker}
      initialTheme={initialTheme}
      onLogout={onLogout}
      onSaveProfile={onSaveProfile}
      onBack={onBack}
      syncHashRouting={syncHashRouting}
    >
      <div className={`account-module-root ${className}`.trim()} style={style}>
        <AccountSectionContent />
      </div>
    </AccountProvider>
  );
};

export default AccountSection;
