import React from "react";
import { useTranslation } from "react-i18next";
import { useAccount } from "../context/AccountContext";

export const LogoutModal: React.FC = () => {
  const { t } = useTranslation();
  const { activeModal, closeModal, showToast, onLogout, navigateTo } = useAccount();

  if (activeModal !== "logout") return null;

  const performLogout = () => {
    closeModal();
    showToast(t("account.loggedOutToast", "Worker logged out. Session ended."));
    if (onLogout) {
      onLogout();
    } else {
      setTimeout(() => {
        navigateTo("main");
      }, 600);
    }
  };

  return (
    <div id="logout-modal" className="action-modal active" role="dialog" aria-modal="true">
      <div className="action-modal-card" style={{ maxWidth: 380 }}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ color: "var(--status-danger)" }}>{t("account.confirmLogout", "Confirm Logout")}</h3>
          <button className="modal-close" onClick={closeModal} aria-label="Close">✕</button>
        </div>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 18 }}>
          {t("account.logoutPrompt", "Are you sure you want to end your current session? Any pending updates will be safely preserved.")}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            style={{ flex: 1, padding: 11, borderRadius: "var(--radius-md)", background: "var(--bg-subtle)", color: "var(--text-secondary)", fontWeight: 700, border: "none", cursor: "pointer" }}
            onClick={closeModal}
          >
            {t("common.cancel", "Cancel")}
          </button>
          <button
            style={{ flex: 1, padding: 11, borderRadius: "var(--radius-md)", background: "var(--status-danger)", color: "#FFFFFF", fontWeight: 700, border: "none", cursor: "pointer" }}
            onClick={performLogout}
          >
            {t("account.yesLogout", "Yes, Logout")}
          </button>
        </div>
      </div>
    </div>
  );
};
