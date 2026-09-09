import React from "react";
import { useTranslation } from "react-i18next";
import { useAccount } from "../context/AccountContext";
import { LANGUAGES } from "../../data/languages";
import { speakText } from "../../utils/textToSpeech";

export const LanguageModal: React.FC = () => {
  const { activeModal, closeModal, showToast } = useAccount();
  const { t, i18n } = useTranslation();

  if (activeModal !== "language") return null;

  const currentLangCode = i18n.language || localStorage.getItem("workerLanguage") || "en";

  const handleSelectLanguage = (langId: string) => {
    i18n.changeLanguage(langId);
    const selected = LANGUAGES.find((l) => l.id === langId);
    try {
      localStorage.setItem("workerLanguage", langId);
      if (selected) {
        localStorage.setItem("user_selected_language", JSON.stringify(selected));
        speakText(selected.nativeName, { langCode: langId });
      }
    } catch (e) {
      console.warn("Language save error:", e);
    }
    showToast(`${selected ? selected.nativeName : langId} selected`);
    closeModal();
  };

  return (
    <div id="language-modal" className="action-modal active" role="dialog" aria-modal="true">
      <div className="action-modal-card" style={{ maxWidth: 440, maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <h3 className="modal-title">{t("account.selectLanguage", "Select Application Language")}</h3>
          </div>
          <button className="modal-close" onClick={closeModal} aria-label="Close">✕</button>
        </div>

        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
          {t("account.selectLanguageSub", "Choose your preferred language for all worker dashboard views & voice alerts.")}
        </p>

        <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, paddingRight: 4, flex: 1, maxHeight: 380 }}>
          {LANGUAGES.map((lang) => {
            const isSelected = lang.id === currentLangCode;
            return (
              <button
                key={lang.id}
                type="button"
                onClick={() => handleSelectLanguage(lang.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: "var(--radius-md)",
                  border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border-light)",
                  backgroundColor: isSelected ? "var(--primary-light)" : "var(--bg-card)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "var(--transition-fast)"
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: isSelected ? "var(--primary)" : "var(--text-primary)" }}>
                    {lang.nativeName}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {lang.englishName} ({lang.id.toUpperCase()})
                  </div>
                </div>

                {isSelected ? (
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    backgroundColor: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFFFFF"
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                ) : (
                  <span style={{ fontSize: 18, color: "var(--text-tertiary)" }}>›</span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid var(--border-light)" }}>
          <button
            type="button"
            onClick={closeModal}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: "var(--radius-md)",
              background: "var(--bg-subtle)",
              color: "var(--text-secondary)",
              fontWeight: 700,
              border: "none",
              cursor: "pointer"
            }}
          >
            {t("common.cancel", "Cancel")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguageModal;
