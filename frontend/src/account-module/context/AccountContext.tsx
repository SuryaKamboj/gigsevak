import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type {
  WorkerProfile,
  ThemeMode,
  AccountSubView,
  AccountModalId,
  InsurancePolicy,
  InsuranceApplication,
  InsuranceChoice,
  CompletedJob
} from "../types";
import { DEFAULT_WORKER } from "../data/defaultWorker";
import { COMPLETED_JOBS } from "../data/completedJobs";

export interface AccountContextType {
  worker: WorkerProfile;
  theme: ThemeMode;
  activeSubView: AccountSubView;
  selectedCompletedJobId: string | null;
  completedJobs: CompletedJob[];
  activeModal: AccountModalId | null;
  modalData: unknown;
  toastMessage: string | null;
  insuranceSessionChoice: InsuranceChoice;

  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  navigateTo: (subView: AccountSubView, detailId?: string) => void;
  openModal: (modalId: AccountModalId, data?: unknown) => void;
  closeModal: () => void;
  showToast: (msg: string) => void;
  updateWorker: (updates: Partial<WorkerProfile>) => void;
  updateInsurance: (insurance: InsurancePolicy) => void;
  submitInsuranceApplication: (app: InsuranceApplication) => void;
  setInsuranceSessionChoice: (choice: InsuranceChoice) => void;
  getCompletedJobById: (jobId: string) => CompletedJob | undefined;

  // Integration callbacks
  onLogout?: () => void;
  onSaveProfile?: (worker: WorkerProfile) => void;
  onBack?: () => void;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export interface AccountProviderProps {
  children: ReactNode;
  initialWorker?: Partial<WorkerProfile>;
  initialTheme?: ThemeMode;
  onLogout?: () => void;
  onSaveProfile?: (worker: WorkerProfile) => void;
  onBack?: () => void;
  syncHashRouting?: boolean;
}

export const AccountProvider: React.FC<AccountProviderProps> = ({
  children,
  initialWorker,
  initialTheme = "light",
  onLogout,
  onSaveProfile,
  onBack,
  syncHashRouting = true
}) => {
  const [worker, setWorker] = useState<WorkerProfile>(() => {
    const base = { ...DEFAULT_WORKER, ...initialWorker };
    try {
      const saved = localStorage.getItem("gigsevak_account_worker");
      if (saved) {
        return { ...base, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return base;
  });

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem("gigsevak_theme") as ThemeMode | null;
      if (saved === "light" || saved === "dark") return saved;
    } catch {
      // ignore
    }
    return initialTheme;
  });

  const [activeSubView, setActiveSubView] = useState<AccountSubView>("main");
  const [selectedCompletedJobId, setSelectedCompletedJobId] = useState<string | null>(null);
  const [completedJobs] = useState<CompletedJob[]>(COMPLETED_JOBS);
  const [activeModal, setActiveModal] = useState<AccountModalId | null>(null);
  const [modalData, setModalData] = useState<unknown>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [insuranceSessionChoice, setInsuranceSessionChoice] = useState<InsuranceChoice>(null);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("gigsevak_theme", theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Sync worker to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("gigsevak_account_worker", JSON.stringify(worker));
    } catch {
      // ignore
    }
  }, [worker]);

  // Sync initialWorker when fetched asynchronously from backend
  useEffect(() => {
    if (initialWorker && Object.keys(initialWorker).length > 0) {
      setWorker(prev => ({
        ...prev,
        ...initialWorker
      }));
    }
  }, [initialWorker]);

  // Optional hash synchronization
  useEffect(() => {
    if (!syncHashRouting) return;

    const handleHash = () => {
      const hash = window.location.hash || "";
      if (hash === "#/edit-profile" || hash === "#edit-profile") {
        setActiveSubView("edit-profile");
      } else if (hash === "#/change-location" || hash === "#change-location") {
        setActiveSubView("change-location");
      } else if (hash === "#/insurance" || hash === "#insurance") {
        setActiveSubView("insurance");
      } else if (hash === "#/apply-insurance" || hash === "#apply-insurance") {
        setActiveSubView("apply-insurance");
      } else if (hash === "#/kyc" || hash === "#kyc") {
        setActiveSubView("kyc");
      } else if (hash === "#/completed-jobs" || hash === "#completed-jobs") {
        setActiveSubView("completed-jobs");
      } else if (hash.startsWith("#/completed-job/") || hash.startsWith("#completed-job/")) {
        const id = hash.split("/").pop() || "";
        setSelectedCompletedJobId(id);
        setActiveSubView("completed-job-detail");
      } else if (hash === "#/account" || hash === "#account") {
        setActiveSubView("main");
      }
    };

    window.addEventListener("hashchange", handleHash);
    handleHash();
    return () => window.removeEventListener("hashchange", handleHash);
  }, [syncHashRouting]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(prev => (prev === "light" ? "dark" : "light"));
  };

  const navigateTo = (subView: AccountSubView, detailId?: string) => {
    setActiveSubView(subView);
    if (detailId) {
      setSelectedCompletedJobId(detailId);
    }
    if (syncHashRouting) {
      if (subView === "main") window.location.hash = "#/account";
      else if (subView === "completed-job-detail" && detailId) window.location.hash = `#/completed-job/${detailId}`;
      else window.location.hash = `#/${subView}`;
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const openModal = (modalId: AccountModalId, data?: unknown) => {
    setActiveModal(modalId);
    setModalData(data || null);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalData(null);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const updateWorker = (updates: Partial<WorkerProfile>) => {
    setWorker(prev => {
      const updated = { ...prev, ...updates };
      if (onSaveProfile) {
        onSaveProfile(updated);
      }
      return updated;
    });
  };

  const updateInsurance = (insurance: InsurancePolicy) => {
    setWorker(prev => ({ ...prev, insurance }));
  };

  const submitInsuranceApplication = (app: InsuranceApplication) => {
    setWorker(prev => ({
      ...prev,
      insurance: {
        ...prev.insurance,
        application: app,
        verificationStatus: "self-declared",
        status: "Application Under Review"
      }
    }));
  };

  const getCompletedJobById = (jobId: string) => {
    const cleanId = jobId.replace(/^#/, "").trim();
    return completedJobs.find(
      j => j.id === cleanId || j.jobId === cleanId || j.jobId === `#${cleanId}` || j.id === jobId
    );
  };

  return (
    <AccountContext.Provider
      value={{
        worker,
        theme,
        activeSubView,
        selectedCompletedJobId,
        completedJobs,
        activeModal,
        modalData,
        toastMessage,
        insuranceSessionChoice,
        setTheme,
        toggleTheme,
        navigateTo,
        openModal,
        closeModal,
        showToast,
        updateWorker,
        updateInsurance,
        submitInsuranceApplication,
        setInsuranceSessionChoice,
        getCompletedJobById,
        onLogout,
        onSaveProfile,
        onBack
      }}
    >
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = (): AccountContextType => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error("useAccount must be used within an AccountProvider");
  }
  return context;
};
