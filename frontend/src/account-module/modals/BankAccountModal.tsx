import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAccount } from "../context/AccountContext";

export const BankAccountModal: React.FC = () => {
  const { t } = useTranslation();
  const { worker, updateWorker, activeModal, closeModal, showToast } = useAccount();
  const bank = worker.bankAccount;

  const [isEditing, setIsEditing] = useState(false);
  const [bankName, setBankName] = useState(bank.bankName);
  const [accountNumber, setAccountNumber] = useState(bank.accountNumber);
  const [ifsc, setIfsc] = useState(bank.ifsc);
  const [holderName, setHolderName] = useState(bank.holderName);
  const [branch, setBranch] = useState(bank.branch);

  if (activeModal !== "bank-account") return null;

  const handleSave = () => {
    updateWorker({
      bankAccount: {
        ...bank,
        bankName,
        accountNumber,
        ifsc,
        holderName,
        branch
      }
    });
    setIsEditing(false);
    showToast(t("account.bankUpdated", "Bank details updated successfully"));
  };

  return (
    <div id="bank-account-modal" className="action-modal active" role="dialog" aria-modal="true">
      <div className="action-modal-card" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h3 className="modal-title">{t("account.bankAccountDetails", "Bank Account Details")}</h3>
          <button className="modal-close" onClick={closeModal} aria-label="Close">✕</button>
        </div>

        <div style={{ background: "linear-gradient(135deg, #1A1F26 0%, #2A3341 100%)", color: "#FFFFFF", borderRadius: "var(--radius-lg)", padding: 18, marginBottom: 16, boxShadow: "0 4px 14px rgba(0,0,0,0.15)" }}>
          <p style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", opacity: 0.7 }}>{t("account.linkedPayoutAccount", "Linked Payout Account")}</p>
          <p style={{ fontSize: 18, fontWeight: 800, letterSpacing: 1.5, margin: "12px 0" }}>{bank.accountNumber}</p>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.85 }}>
            <span>{t("account.holder", "HOLDER")}: {bank.holderName}</span>
            <span>{bank.bankName.toUpperCase()}</span>
          </div>
        </div>

        {isEditing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>{t("account.bankName", "Bank Name")}</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-medium)", marginTop: 4 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>{t("account.holderName", "Account Holder Name")}</label>
              <input
                type="text"
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-medium)", marginTop: 4 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>{t("account.accountNumber", "Account Number")}</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-medium)", marginTop: 4 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>{t("account.ifscCode", "IFSC Code")}</label>
              <input
                type="text"
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-medium)", marginTop: 4 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>{t("account.branchName", "Branch Name")}</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-medium)", marginTop: 4 }}
              />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{ flex: 1, padding: 10, borderRadius: "var(--radius-md)", background: "var(--bg-subtle)", color: "var(--text-secondary)", fontWeight: 700, border: "none", cursor: "pointer" }}
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={handleSave}
                style={{ flex: 1, padding: 10, borderRadius: "var(--radius-md)", background: "var(--primary)", color: "#FFFFFF", fontWeight: 700, border: "none", cursor: "pointer" }}
              >
                {t("common.save", "Save")}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ background: "var(--bg-subtle)", padding: 12, borderRadius: "var(--radius-md)", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
              <p><strong>{t("account.bankName", "Bank")}:</strong> {bank.bankName}</p>
              <p><strong>{t("account.branchName", "Branch")}:</strong> {bank.branch}</p>
              <p><strong>{t("account.ifscCode", "IFSC Code")}:</strong> {bank.ifsc}</p>
              <p><strong>{t("account.depositStatus", "Direct Deposit Status")}:</strong> <span style={{ color: "var(--status-success)", fontWeight: 700 }}>● {bank.status}</span></p>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                style={{ flex: 1, padding: 11, borderRadius: "var(--radius-md)", background: "var(--bg-subtle)", color: "var(--text-primary)", fontWeight: 700, border: "none", cursor: "pointer" }}
                onClick={() => setIsEditing(true)}
              >
                {t("account.editDetails", "Edit Details")}
              </button>
              <button
                style={{ flex: 1, padding: 11, borderRadius: "var(--radius-md)", background: "var(--primary)", color: "#FFFFFF", fontWeight: 700, border: "none", cursor: "pointer" }}
                onClick={closeModal}
              >
                {t("common.done", "Done")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
