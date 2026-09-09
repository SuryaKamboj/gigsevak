import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAccount } from "../context/AccountContext";
import { LANGUAGES } from "../../data/languages";

export const SettingsModal: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { activeModal, closeModal, openModal, showToast } = useAccount();
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [autoAcceptEmergency, setAutoAcceptEmergency] = useState(true);

  if (activeModal !== "settings") return null;

  const currentLangCode = i18n.language || localStorage.getItem("workerLanguage") || "en";
  const currentLang = LANGUAGES.find((l) => l.id === currentLangCode) || LANGUAGES[0];

  const handleSave = () => {
    closeModal();
    showToast(t("account.settingsSaved", "Settings saved successfully"));
  };

  return (
    <div id="settings-modal" className="action-modal active" role="dialog" aria-modal="true">
      <div className="action-modal-card" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h3 className="modal-title">{t("account.settings", "Settings")}</h3>
          <button className="modal-close" onClick={closeModal} aria-label="Close">✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{t("account.soundAlerts", "Booking Sound Alerts")}</span>
            <input
              type="checkbox"
              checked={soundAlerts}
              onChange={(e) => setSoundAlerts(e.target.checked)}
              style={{ accentColor: "var(--primary)", width: 18, height: 18 }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{t("account.autoAccept", "Auto-Accept Emergency Calls")}</span>
            <input
              type="checkbox"
              checked={autoAcceptEmergency}
              onChange={(e) => setAutoAcceptEmergency(e.target.checked)}
              style={{ accentColor: "var(--primary)", width: 18, height: 18 }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{t("account.dispatchRadius", "Dispatch Radius")}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)" }}>8 km</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{t("account.language", "App Language")}</span>
            <button
              type="button"
              onClick={() => {
                closeModal();
                openModal("language");
              }}
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--primary)",
                background: "var(--primary-light)",
                border: "1px solid var(--primary-border)",
                padding: "5px 12px",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4
              }}
            >
              <span>{currentLang.nativeName} ({currentLang.id.toUpperCase()})</span>
              <span style={{ fontSize: 14 }}>›</span>
            </button>
          </div>
        </div>
        <button
          style={{ width: "100%", padding: 11, borderRadius: "var(--radius-md)", background: "var(--primary)", color: "#FFFFFF", fontWeight: 700, border: "none", cursor: "pointer" }}
          onClick={handleSave}
        >
          {t("account.saveChanges", "Save Changes")}
        </button>
      </div>
    </div>
  );
};
