import React from "react";
import { useTranslation } from "react-i18next";
import { useAccount } from "../context/AccountContext";
import { KYC_VERIFICATION_ITEMS } from "../data/kycData";

export const KycVerificationView: React.FC = () => {
  const { t } = useTranslation();
  const { navigateTo } = useAccount();

  return (
    <main id="view-kyc" className="active" style={{ display: "block" }}>
      {/* Top Header with Back Arrow to Account */}
      <header className="kyc-header">
        <div className="kyc-header-left">
          <button
            className="back-btn"
            onClick={() => navigateTo("main")}
            aria-label="Back to Account"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <h1 className="kyc-header-title">{t("account.kycVerification", "KYC Verification")}</h1>
        </div>
        <div className="brand-logo" style={{ fontSize: 20 }}>
          <span className="brand-gig">Gig</span>
          <span className="brand-sevak">Sevak</span>
        </div>
      </header>

      <div className="kyc-container">
        {/* Verification Progress Card */}
        <section className="kyc-progress-card">
          <div className="kyc-progress-header">
            <div className="kyc-progress-title">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--primary)" }}>
                <polyline points="9 11 12 14 22 4"></polyline>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
              </svg>
              <span>Overall Verification</span>
            </div>
            <span className="kyc-progress-percent">85% Complete</span>
          </div>

          {/* 85% Progress Bar */}
          <div className="kyc-progress-bar-track" aria-label="Verification Progress: 85%">
            <div
              className="kyc-progress-bar-fill"
              style={{ width: "85%", backgroundColor: "var(--primary)" }}
            ></div>
          </div>

          <p className="kyc-progress-desc">
            Identity and mandatory credentials authenticated. Experience verification currently undergoing registrar review.
          </p>
        </section>

        {/* Verification Items List rendered via .map() */}
        <section className="kyc-list-card" aria-label="Verification Stages">
          {KYC_VERIFICATION_ITEMS.map((item) => {
            const isVerified = item.status === "Verified";

            return (
              <div key={item.id} className="kyc-list-item">
                <div className="kyc-item-left">
                  <div
                    className={`kyc-item-icon-circle ${isVerified ? "verified" : "under-review"}`}
                    aria-hidden="true"
                  >
                    {isVerified ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                    )}
                  </div>

                  <div className="kyc-item-info">
                    <span className="kyc-item-label">{item.label}</span>
                    {item.detail && <span className="kyc-item-detail">{item.detail}</span>}
                  </div>
                </div>

                <div
                  className={`kyc-status-badge ${isVerified ? "verified" : "under-review"}`}
                  style={isVerified ? { color: "#01471F" } : undefined}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: isVerified ? "#01471F" : "#B45309"
                    }}
                  ></span>
                  <span>{item.status}</span>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
};
