import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAccount } from "../context/AccountContext";
import { LANGUAGES } from "../../data/languages";

export const AccountView: React.FC = () => {
  const { t, i18n } = useTranslation();
  const {
    worker,
    theme,
    setTheme,
    navigateTo,
    openModal,
    showToast,
    setInsuranceSessionChoice,
    onBack
  } = useAccount();

  const [themeDropdownOpen, setThemeDropdownOpen] = useState<boolean>(false);
  const ins = worker.insurance || {};

  const currentLangCode = i18n.language || localStorage.getItem("workerLanguage") || "en";
  const currentLang = LANGUAGES.find((l) => l.id === currentLangCode) || LANGUAGES[0];

  const handleSelectTheme = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    setThemeDropdownOpen(false);
    showToast(`Theme switched to ${newTheme === "dark" ? "Dark" : "Light"}`);
  };

  return (
    <main id="view-account" className="account-view-container active">
      {/* Account Page Content Wrapper */}
      <div className="account-page-wrap">
        {/* Account Header */}
        <header className="account-top-header">
          <div className="account-header-left">
            {onBack ? (
              <button
                className="back-btn"
                onClick={onBack}
                aria-label="Back"
                type="button"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </button>
            ) : null}
            <h1 className="account-header-title">{t("account.title", "Worker Account")}</h1>
          </div>
        </header>

        {/* 1. WORKER PROFILE HEADER */}
        <section className="worker-profile-card">
          <div className="profile-avatar-container">
            <img
              id="account-worker-avatar"
              className="profile-avatar-img"
              src={worker.avatar}
              alt={worker.name}
            />
            <div className="profile-verified-badge" title="Verified Worker">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
          <h2 id="account-worker-name" className="profile-worker-name">
            {worker.name}
          </h2>
          <p id="account-worker-phone" className="profile-phone-number">
            {worker.phone}
          </p>
          <button
            className="btn-edit-profile"
            type="button"
            onClick={() => navigateTo("edit-profile")}
            aria-label="Edit Profile"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span>{t("account.editProfile", "Edit Profile")}</span>
          </button>
        </section>

        {/* TOTAL REVENUE */}
        <section className="work-stats-card">
          <div className="stats-item-row">
            <span className="stats-item-label">{t("account.totalRevenue", "Total Revenue")}</span>
            <span id="account-stat-revenue" className="stats-item-value">
              ₹{worker.totalRevenue.toLocaleString("en-IN")}
            </span>
          </div>
        </section>

        {/* 2, 3, 4: PROFILE, SETTINGS & THEME GROUP */}
        <section className="account-group-card">
          {/* View Profile */}
          <button
            className="account-row"
            type="button"
            onClick={() => openModal("profile")}
            aria-label="View Profile"
          >
            <div className="account-row-left">
              <div className="account-row-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <span className="account-row-label">{t("account.viewProfile", "View Profile")}</span>
            </div>
            <div className="account-row-right">
              <span className="account-chevron">›</span>
            </div>
          </button>

          {/* Change Your Location */}
          <button
            id="account-row-change-location"
            className="account-row"
            type="button"
            onClick={() => navigateTo("change-location")}
            aria-label="Change Your Location"
          >
            <div className="account-row-left">
              <div className="account-row-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <span className="account-row-label">{t("account.changeLocation", "Change Your Location")}</span>
            </div>
            <div className="account-row-right">
              <span className="account-chevron">›</span>
            </div>
          </button>

          {/* Settings */}
          <button
            className="account-row"
            type="button"
            onClick={() => openModal("settings")}
            aria-label="Settings"
          >
            <div className="account-row-left">
              <div className="account-row-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </div>
              <span className="account-row-label">{t("account.settings", "Settings")}</span>
            </div>
            <div className="account-row-right">
              <span className="account-chevron">›</span>
            </div>
          </button>

          {/* Language Preference Row */}
          <button
            id="account-row-language"
            className="account-row"
            type="button"
            onClick={() => openModal("language")}
            aria-label="Change Language"
          >
            <div className="account-row-left">
              <div className="account-row-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              </div>
              <div style={{ textAlign: "left" }}>
                <span className="account-row-label">{t("account.language", "Language Preference")}</span>
                <div style={{ fontSize: 12, color: "var(--primary)", fontWeight: 700, marginTop: 1 }}>
                  {currentLang.nativeName} <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>({currentLang.englishName})</span>
                </div>
              </div>
            </div>
            <div className="account-row-right">
              <span className="account-chevron">›</span>
            </div>
          </button>

          {/* Theme Row & Dropdown */}
          <div className="theme-row-wrapper">
            <button
              id="theme-select-row"
              className="account-row"
              type="button"
              onClick={() => setThemeDropdownOpen(prev => !prev)}
              aria-label="Select Application Theme"
            >
              <div className="account-row-left">
                <div className="account-row-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                </div>
                <span id="current-theme-label" className="account-row-label">
                  {t("account.theme", "Theme")}: {theme === "dark" ? t("account.themeDark", "Dark") : t("account.themeLight", "Light")}
                </span>
              </div>
              <div className="account-row-right">
                <span id="theme-dropdown-chevron" className="account-chevron" style={{ fontSize: 11 }}>
                  {themeDropdownOpen ? "▲" : "▼"}
                </span>
              </div>
            </button>

            {/* Theme Dropdown Menu */}
            <div id="theme-dropdown-menu" className={`theme-dropdown-menu ${themeDropdownOpen ? "open" : ""}`}>
              <button
                id="theme-opt-light"
                className={`theme-option-btn ${theme === "light" ? "selected" : ""}`}
                type="button"
                onClick={() => handleSelectTheme("light")}
              >
                <span className="theme-radio-dot"></span>
                <span>{t("account.themeLight", "Light")}</span>
              </button>
              <button
                id="theme-opt-dark"
                className={`theme-option-btn ${theme === "dark" ? "selected" : ""}`}
                type="button"
                onClick={() => handleSelectTheme("dark")}
              >
                <span className="theme-radio-dot"></span>
                <span>{t("account.themeDark", "Dark")}</span>
              </button>
            </div>
          </div>
        </section>

        {/* TOTAL JOBS */}
        <section className="work-stats-card">
          <div
            className="stats-item-row"
            role="button"
            tabIndex={0}
            onClick={() => navigateTo("completed-jobs")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigateTo("completed-jobs");
              }
            }}
            style={{ cursor: "pointer" }}
            aria-label="View Completed Jobs"
          >
            <span className="stats-item-label">{t("account.totalJobs", "Total Jobs")}</span>
            <span id="account-stat-jobs" className="stats-item-value">
              {worker.totalJobs}
            </span>
          </div>
        </section>

        {/* BANK ACCOUNT */}
        <section className="account-group-card">
          <button
            className="account-row"
            type="button"
            onClick={() => openModal("bank-account")}
            aria-label="Bank Account"
          >
            <div className="account-row-left">
              <div className="account-row-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                  <line x1="2" y1="10" x2="22" y2="10"></line>
                </svg>
              </div>
              <span className="account-row-label">{t("account.bankAccount", "Bank Account")}</span>
            </div>
            <div className="account-row-right">
              <span className="account-chevron">›</span>
            </div>
          </button>
        </section>

        {/* INSURANCE STATUS & KYC VERIFICATION */}
        <section className="account-group-card">
          {/* Insurance Status */}
          <div
            className="status-row-block"
            onClick={() => {
              setInsuranceSessionChoice(null);
              navigateTo("insurance");
            }}
            role="button"
            tabIndex={0}
          >
            <div className="status-row-header">
              <div className="account-row-left">
                <div className="account-row-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </div>
                <span className="account-row-label">{t("account.insuranceStatus", "Insurance Status")}</span>
              </div>
              <span className="account-chevron">›</span>
            </div>
            <div
              id="account-insurance-badge-row"
              className="status-indicator-subrow insurance"
            >
              <span id="account-insurance-dot" className="status-dot-indicator insurance"></span>
              <span id="account-insurance-status-text">
                {!ins.hasInsurance ? t("account.inactive", "Inactive") : ins.verificationStatus === "verified" ? t("account.verified", "Verified") : t("account.selfDeclared", "Self-Declared")}
              </span>
            </div>
          </div>

          {/* KYC Verification (Verified in GREEN) */}
          <div
            className="status-row-block"
            onClick={() => navigateTo("kyc")}
            role="button"
            tabIndex={0}
          >
            <div className="status-row-header">
              <div className="account-row-left">
                <div className="account-row-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                </div>
                <span className="account-row-label">{t("account.kycVerification", "KYC Verification")}</span>
              </div>
              <span className="account-chevron">›</span>
            </div>
            <div className="status-indicator-subrow kyc">
              <span className="status-dot-indicator kyc"></span>
              <span>{t("account.verified", "Verified")}</span>
            </div>
          </div>
        </section>

        {/* LOGOUT */}
        <section>
          <button
            className="logout-row"
            type="button"
            onClick={() => openModal("logout")}
            aria-label="Logout"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>{t("account.logout", "Logout")}</span>
          </button>
        </section>
      </div>
    </main>
  );
};
