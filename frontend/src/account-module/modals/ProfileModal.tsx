import React from "react";
import { useTranslation } from "react-i18next";
import { useAccount } from "../context/AccountContext";

export const ProfileModal: React.FC = () => {
  const { t } = useTranslation();
  const { worker, activeModal, closeModal } = useAccount();

  if (activeModal !== "profile") return null;

  return (
    <div id="profile-details-modal" className="action-modal active" role="dialog" aria-modal="true">
      <div className="action-modal-card" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <h3 className="modal-title">{t("account.workerProfile", "Worker Profile")}</h3>
          <button className="modal-close" onClick={closeModal} aria-label="Close">✕</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <img
            src={worker.avatar}
            style={{ width: 58, height: 58, borderRadius: "50%", objectFit: "cover" }}
            alt={worker.name}
          />
          <div>
            <h4 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)" }}>{worker.name}</h4>
            <p style={{ fontSize: 12.5, color: "var(--primary)", fontWeight: 600 }}>{worker.role}</p>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Member ID: {worker.memberId}</p>
          </div>
        </div>
        <div style={{ background: "var(--bg-subtle)", borderRadius: "var(--radius-md)", padding: 12, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
          <p><strong>Branch:</strong> {worker.coopBranch}</p>
          <p><strong>Primary Skills:</strong> {worker.primarySkill}, Plumbing, Appliance Servicing</p>
          <p><strong>Worker Rating:</strong> ★ {worker.rating} (184 Verified Reviews)</p>
          <p><strong>Cooperative Membership:</strong> Active since May 2024</p>
        </div>
        <button
          style={{ width: "100%", padding: 11, borderRadius: "var(--radius-md)", background: "var(--primary)", color: "#FFFFFF", fontWeight: 700, border: "none", cursor: "pointer" }}
          onClick={closeModal}
        >
          {t("common.close", "Close")}
        </button>
      </div>
    </div>
  );
};
