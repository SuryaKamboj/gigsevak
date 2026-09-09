import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAccount } from "../context/AccountContext";
import type { InsuranceChoice, InsurancePolicy } from "../types";

export const InsuranceView: React.FC = () => {
  const { t } = useTranslation();
  const {
    worker,
    updateInsurance,
    navigateTo,
    showToast,
    insuranceSessionChoice,
    setInsuranceSessionChoice
  } = useAccount();

  const currentIns = worker.insurance || {
    hasInsurance: true,
    type: "Personal Accident Insurance",
    provider: "National Insurance Co. Ltd.",
    policyNumber: "NIC-GIG-2025-4587",
    holderName: "Rajesh Kumar",
    coverageAmount: 200000,
    startDate: "2025-01-15",
    expiryDate: "2026-01-14",
    coverageItems: ["Accidental Injury", "Hospitalisation", "Disability"],
    otherCoverageText: "",
    documentName: "Policy_Schedule_2025.pdf",
    verificationStatus: "self-declared" as const,
    status: "Self-Declared",
    application: null
  };

  const [hasInsurance, setHasInsurance] = useState<InsuranceChoice>(insuranceSessionChoice);
  const [formData, setFormData] = useState<InsurancePolicy>({ ...currentIns });
  const [showOtherCoverage, setShowOtherCoverage] = useState<boolean>(
    currentIns.coverageItems?.includes("Other") || false
  );

  useEffect(() => {
    setHasInsurance(insuranceSessionChoice);
  }, [insuranceSessionChoice]);

  const maskPolicyNumber = (num: string): string => {
    if (!num) return "—";
    const clean = num.replace(/\s+/g, "");
    if (clean.length <= 4) return `XXXXXX${clean}`;
    const last4 = clean.slice(-4);
    return `XXXXXX${last4}`;
  };

  const handleChoiceChange = (choice: InsuranceChoice) => {
    setHasInsurance(choice);
    setInsuranceSessionChoice(choice);
  };

  const handleCoverageToggle = (item: string) => {
    setFormData(prev => {
      const items = prev.coverageItems || [];
      const exists = items.includes(item);
      const newItems = exists ? items.filter(i => i !== item) : [...items, item];
      if (item === "Other") {
        setShowOtherCoverage(!exists);
      }
      return { ...prev, coverageItems: newItems };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        documentName: file.name
      }));
      showToast(`Document uploaded successfully.`);
    }
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({
      ...prev,
      documentName: ""
    }));
    showToast("Document removed.");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (hasInsurance === "yes") {
      if (!formData.type || !formData.provider.trim() || !formData.policyNumber.trim() || !formData.holderName.trim()) {
        showToast("Please fill in all required policy fields.");
        return;
      }

      const coverageNum = Number(formData.coverageAmount);
      if (!coverageNum || coverageNum <= 0) {
        showToast("Coverage amount must be a positive number.");
        return;
      }

      if (!formData.startDate || !formData.expiryDate) {
        showToast("Please provide both policy start and expiry dates.");
        return;
      }

      if (formData.expiryDate < formData.startDate) {
        showToast("Policy expiry date cannot be earlier than start date.");
        return;
      }

      if (!formData.coverageItems || formData.coverageItems.length === 0) {
        showToast("Please select at least one coverage option.");
        return;
      }

      if (formData.coverageItems.includes("Other") && !formData.otherCoverageText?.trim()) {
        showToast("Please enter the other coverage type.");
        return;
      }

      updateInsurance({
        ...formData,
        hasInsurance: true,
        verificationStatus: formData.verificationStatus || "self-declared",
        status: formData.verificationStatus === "verified" ? "Verified" : "Self-Declared"
      });
      showToast("Insurance details updated successfully.");
    }
  };

  return (
    <main id="view-insurance" className="active" style={{ display: "block" }}>
      {/* Sticky Header with Back Arrow to Worker Account */}
      <header className="insurance-header">
        <div className="insurance-header-left">
          <button
            className="back-btn"
            onClick={() => {
              setInsuranceSessionChoice(null);
              navigateTo("main");
            }}
            aria-label="Back to Account"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <h1 className="insurance-header-title">{t("account.insuranceStatus", "Insurance Status")}</h1>
        </div>
        <div className="brand-logo" style={{ fontSize: 20 }}>
          <span className="brand-gig">Gig</span>
          <span className="brand-sevak">Sevak</span>
        </div>
      </header>

      <div className="insurance-container">
        {/* Header Info Card */}
        <section className="insurance-intro-card">
          <h2 className="insurance-page-heading">{t("account.insuranceStatus", "Insurance Status")}</h2>
          <p className="insurance-page-desc">Keep your insurance information updated to help protect you while working.</p>
        </section>

        {/* Question Card: Do you currently have any insurance? */}
        <section className="insurance-question-card">
          <h3 className="insurance-question-title">Do you currently have any insurance?</h3>
          <div className="insurance-radio-group">
            <label id="label-radio-yes" className={`insurance-radio-label ${hasInsurance === "yes" ? "is-selected" : ""}`}>
              <input
                id="radio-insurance-yes"
                className="insurance-radio-input"
                type="radio"
                name="has-insurance"
                checked={hasInsurance === "yes"}
                onChange={() => handleChoiceChange("yes")}
              />
              <span>Yes</span>
            </label>
            <label id="label-radio-no" className={`insurance-radio-label ${hasInsurance === "no" ? "is-selected" : ""}`}>
              <input
                id="radio-insurance-no"
                className="insurance-radio-input"
                type="radio"
                name="has-insurance"
                checked={hasInsurance === "no"}
                onChange={() => handleChoiceChange("no")}
              />
              <span>No</span>
            </label>
          </div>
        </section>

        {/* IF WORKER SELECTS NO: Card with CTA to Apply for Insurance */}
        {hasInsurance === "no" && (
          <section id="no-insurance-card" className="no-insurance-card">
            <h3 className="no-insurance-title">You don't currently have insurance.</h3>
            <p className="no-insurance-desc">
              Protect yourself with suitable insurance coverage for unexpected medical, accident or work-related expenses.
            </p>
            <button
              id="btn-apply-insurance-cta"
              type="button"
              className="btn-primary-brand"
              onClick={() => {
                setInsuranceSessionChoice("no");
                navigateTo("apply-insurance");
              }}
            >
              Apply for Insurance
            </button>
          </section>
        )}

        {/* IF WORKER SELECTS YES: Insurance Details Form Card */}
        {hasInsurance === "yes" && (
          <section id="insurance-form-card" className="insurance-form-card">
            <h3 className="insurance-section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <span>Insurance Details</span>
            </h3>

            <form id="insurance-details-form" className="insurance-form-grid" onSubmit={handleSubmit}>
              {/* 1. Insurance Type & 2. Insurance Provider */}
              <div className="insurance-grid-2col">
                <div className="form-field-group">
                  <label htmlFor="ins-type-select" className="form-field-label">
                    <span>Insurance Type</span>
                    <span className="required-star">*</span>
                  </label>
                  <select
                    id="ins-type-select"
                    className="form-field-select"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    <option value="Health Insurance">Health Insurance</option>
                    <option value="Personal Accident Insurance">Personal Accident Insurance</option>
                    <option value="Life Insurance">Life Insurance</option>
                    <option value="Disability Insurance">Disability Insurance</option>
                    <option value="Vehicle Insurance">Vehicle Insurance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-field-group">
                  <label htmlFor="ins-provider-input" className="form-field-label">
                    <span>Insurance Provider</span>
                    <span className="required-star">*</span>
                  </label>
                  <input
                    id="ins-provider-input"
                    type="text"
                    className="form-field-input"
                    placeholder="Enter insurance company name"
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* 3. Policy Number & 4. Policy Holder Name */}
              <div className="insurance-grid-2col">
                <div className="form-field-group">
                  <label htmlFor="ins-policy-number" className="form-field-label">
                    <span>Policy Number</span>
                    <span className="required-star">*</span>
                  </label>
                  <input
                    id="ins-policy-number"
                    type="text"
                    className="form-field-input"
                    placeholder="Enter policy number"
                    value={formData.policyNumber}
                    onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                    required
                  />
                  <div className="policy-mask-row">
                    <span className="mask-label">Public Profile Preview:</span>
                    <span id="ins-mask-preview" className="mask-preview">
                      {maskPolicyNumber(formData.policyNumber)}
                    </span>
                  </div>
                </div>

                <div className="form-field-group">
                  <label htmlFor="ins-holder-name" className="form-field-label">
                    <span>Policy Holder Name</span>
                    <span className="required-star">*</span>
                  </label>
                  <input
                    id="ins-holder-name"
                    type="text"
                    className="form-field-input"
                    placeholder="Enter name"
                    value={formData.holderName}
                    onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* 5. Coverage Amount & 6. Policy Start Date */}
              <div className="insurance-grid-2col">
                <div className="form-field-group">
                  <label htmlFor="ins-coverage-amount" className="form-field-label">
                    <span>Coverage Amount</span>
                    <span className="required-star">*</span>
                  </label>
                  <input
                    id="ins-coverage-amount"
                    type="number"
                    min="1"
                    step="1000"
                    className="form-field-input"
                    placeholder="₹ Enter coverage amount"
                    value={formData.coverageAmount || ""}
                    onChange={(e) => setFormData({ ...formData, coverageAmount: Number(e.target.value) })}
                    required
                  />
                  <span className="field-helper-note">Enter amount in Indian Rupees (₹)</span>
                </div>

                <div className="form-field-group">
                  <label htmlFor="ins-start-date" className="form-field-label">
                    <span>Policy Start Date</span>
                    <span className="required-star">*</span>
                  </label>
                  <input
                    id="ins-start-date"
                    type="date"
                    className="form-field-input"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                  <span className="field-helper-note">Format: DD/MM/YYYY</span>
                </div>
              </div>

              {/* 7. Policy Expiry Date */}
              <div className="insurance-grid-2col">
                <div className="form-field-group">
                  <label htmlFor="ins-expiry-date" className="form-field-label">
                    <span>Policy Expiry Date</span>
                    <span className="required-star">*</span>
                  </label>
                  <input
                    id="ins-expiry-date"
                    type="date"
                    className="form-field-input"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    required
                  />
                  <span className="field-helper-note">Expiry date cannot be earlier than start date</span>
                </div>
                <div></div>
              </div>

              {/* 8. What does it cover? */}
              <div className="form-field-group">
                <label className="form-field-label">
                  <span>What does it cover?</span>
                  <span className="required-star">*</span>
                </label>
                <div className="coverage-checkbox-grid">
                  {[
                    "Accidental Injury",
                    "Hospitalisation",
                    "Disability",
                    "Critical Illness",
                    "Death Benefit",
                    "Other"
                  ].map((coverageOption) => (
                    <label key={coverageOption} className="coverage-checkbox-label">
                      <input
                        className="coverage-checkbox-input"
                        type="checkbox"
                        checked={formData.coverageItems?.includes(coverageOption) || false}
                        onChange={() => handleCoverageToggle(coverageOption)}
                      />
                      <span>{coverageOption}</span>
                    </label>
                  ))}
                </div>
                {showOtherCoverage && (
                  <div id="coverage-other-input-wrap" className="coverage-other-input-wrap">
                    <input
                      id="ins-other-coverage-input"
                      type="text"
                      className="form-field-input"
                      placeholder="Enter coverage type"
                      value={formData.otherCoverageText || ""}
                      onChange={(e) => setFormData({ ...formData, otherCoverageText: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/* 9. Upload Policy Document */}
              <div className="form-field-group">
                <label className="form-field-label">
                  <span>Upload Policy Document</span>
                </label>

                {!formData.documentName ? (
                  <label id="ins-upload-dropzone" className="upload-dropzone">
                    <input
                      id="ins-file-input"
                      type="file"
                      accept=".pdf,image/jpeg,image/png"
                      style={{ display: "none" }}
                      onChange={handleFileUpload}
                    />
                    <div className="upload-icon-circle">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                    </div>
                    <span className="upload-text-cta">+ Upload Insurance Document</span>
                    <span className="upload-hint-types">Supported formats: PDF, JPG, JPEG, PNG (Max 5MB)</span>
                  </label>
                ) : (
                  <div id="ins-uploaded-file-card" className="uploaded-file-card">
                    <div className="file-info-left">
                      <svg className="file-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                      </svg>
                      <span id="ins-file-name-text" className="file-name-text">
                        {formData.documentName}
                      </span>
                    </div>
                    <button
                      id="btn-remove-ins-file"
                      className="btn-remove-file"
                      type="button"
                      onClick={handleRemoveFile}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* VERIFICATION STATUS CARD */}
              <div
                id="ins-verification-status-box"
                className={`verification-status-box ${
                  formData.verificationStatus === "verified" ? "state-verified" : "state-self-declared"
                }`}
              >
                <div className="status-header-row">
                  <span
                    id="ins-status-badge-text"
                    className={`status-badge-indicator ${
                      formData.verificationStatus === "verified" ? "text-verified" : "text-self-declared"
                    }`}
                  >
                    <span
                      id="ins-status-dot"
                      className={`status-dot-circle ${
                        formData.verificationStatus === "verified" ? "bg-verified" : "bg-self-declared"
                      }`}
                    ></span>
                    {formData.verificationStatus === "verified" ? "Insurance Details Verified" : "Self-Declared"}
                  </span>
                </div>
                <p id="ins-status-desc-text" className="status-desc-text">
                  {formData.verificationStatus === "verified"
                    ? "Insurance policy has been verified by the cooperative administration and UIDAI verification system."
                    : "Insurance information was entered by the worker and is pending document verification by the cooperative administration."}
                </p>
              </div>

              {/* SAVE BUTTON */}
              <div className="insurance-actions-wrap">
                <button type="submit" id="btn-save-insurance-changes" className="btn-save-insurance">
                  Save Changes
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </main>
  );
};
