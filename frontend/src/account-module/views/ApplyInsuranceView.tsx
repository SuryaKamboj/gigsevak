import React, { useState } from "react";
import { useAccount } from "../context/AccountContext";

export const ApplyInsuranceView: React.FC = () => {
  const { worker, submitInsuranceApplication, navigateTo, showToast } = useAccount();

  const existingApp = worker.insurance?.application;

  const [fullName, setFullName] = useState(worker.name || "");
  const [mobile, setMobile] = useState(worker.phone || "");
  const [address, setAddress] = useState(worker.currentAddress || "");
  const [city, setCity] = useState(worker.city || "");
  const [pincode, setPincode] = useState(worker.pincode || "");
  const [preferredType, setPreferredType] = useState(existingApp?.preferredType || "Health Insurance");
  const [nomineeName, setNomineeName] = useState(existingApp?.nomineeName || "");
  const [nomineeRel, setNomineeRel] = useState(existingApp?.nomineeRel || "Father");
  const [coveragePref, setCoveragePref] = useState(existingApp?.coveragePref || "₹ 5,00,000");

  const [submitted, setSubmitted] = useState<boolean>(!!existingApp);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !mobile.trim() || !address.trim() || !city.trim() || !pincode.trim() || !preferredType || !nomineeName.trim() || !nomineeRel || !coveragePref.trim()) {
      showToast("Please fill in all required fields.");
      return;
    }

    const applicationData = {
      fullName: fullName.trim(),
      dob: worker.dateOfBirth,
      mobile: mobile.trim(),
      address: address.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
      gender: worker.gender,
      preferredType,
      nomineeName: nomineeName.trim(),
      nomineeRel,
      coveragePref,
      appliedDate: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      status: "Application Under Review"
    };

    submitInsuranceApplication(applicationData);
    setSubmitted(true);
    showToast("Insurance application submitted successfully.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main id="view-apply-insurance" className="active" style={{ display: "block" }}>
      {/* Sticky Header with Back Arrow to Insurance Page */}
      <header className="insurance-header">
        <div className="insurance-header-left">
          <button
            className="back-btn"
            onClick={() => navigateTo("insurance")}
            aria-label="Back to Insurance Status"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <h1 className="insurance-header-title">Apply for Insurance</h1>
        </div>
        <div className="brand-logo" style={{ fontSize: 20 }}>
          <span className="brand-gig">Gig</span>
          <span className="brand-sevak">Sevak</span>
        </div>
      </header>

      <div className="insurance-container">
        {/* Application Under Review Status Banner (when submitted) */}
        {submitted && (
          <section id="apply-status-banner" className="application-status-banner">
            <h3 className="application-status-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>Application Under Review</span>
            </h3>
            <p className="application-status-desc">
              Your insurance application has been submitted and is currently being processed by the cooperative insurance welfare committee.
            </p>
            <span id="apply-status-date" style={{ fontSize: 11.5, fontWeight: 700, color: "#1565C0" }}>
              Applied: {existingApp?.appliedDate || "Today"}
            </span>
          </section>
        )}

        {/* Application Form Card */}
        <section className="insurance-form-card">
          <h3 className="insurance-section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <span>Worker Insurance Scheme Application</span>
          </h3>

          <form id="apply-insurance-form" className="insurance-form-grid" onSubmit={handleSubmit}>
            {/* 1. Full Name & 2. Date of Birth */}
            <div className="insurance-grid-2col">
              <div className="form-field-group">
                <label htmlFor="apply-fullname" className="form-field-label">
                  <span>Full Name</span>
                  <span className="required-star">*</span>
                </label>
                <input
                  id="apply-fullname"
                  type="text"
                  className="form-field-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-field-group">
                <label className="form-field-label">
                  <span>Date of Birth</span>
                  <span style={{ fontSize: 11, color: "var(--status-success)", fontWeight: 700, marginLeft: 4 }}>
                    (Aadhaar Verified)
                  </span>
                </label>
                <input
                  type="text"
                  className="form-field-input"
                  readOnly
                  disabled
                  value={worker.dateOfBirth}
                  style={{ background: "var(--bg-subtle)", cursor: "not-allowed" }}
                />
              </div>
            </div>

            {/* 3. Mobile Number & 4. Gender */}
            <div className="insurance-grid-2col">
              <div className="form-field-group">
                <label htmlFor="apply-mobile" className="form-field-label">
                  <span>Mobile Number</span>
                  <span className="required-star">*</span>
                </label>
                <input
                  id="apply-mobile"
                  type="tel"
                  className="form-field-input"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                />
              </div>

              <div className="form-field-group">
                <label className="form-field-label">
                  <span>Gender</span>
                  <span style={{ fontSize: 11, color: "var(--status-success)", fontWeight: 700, marginLeft: 4 }}>
                    (Aadhaar Verified)
                  </span>
                </label>
                <input
                  type="text"
                  className="form-field-input"
                  readOnly
                  disabled
                  value={worker.gender}
                  style={{ background: "var(--bg-subtle)", cursor: "not-allowed" }}
                />
              </div>
            </div>

            {/* 5. Address */}
            <div className="form-field-group">
              <label htmlFor="apply-address" className="form-field-label">
                <span>Current Residential Address</span>
                <span className="required-star">*</span>
              </label>
              <textarea
                id="apply-address"
                className="form-field-textarea"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              ></textarea>
            </div>

            {/* 6. City & Pincode */}
            <div className="insurance-grid-2col">
              <div className="form-field-group">
                <label htmlFor="apply-city" className="form-field-label">
                  <span>City / Locality</span>
                  <span className="required-star">*</span>
                </label>
                <input
                  id="apply-city"
                  type="text"
                  className="form-field-input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>

              <div className="form-field-group">
                <label htmlFor="apply-pincode" className="form-field-label">
                  <span>Pincode</span>
                  <span className="required-star">*</span>
                </label>
                <input
                  id="apply-pincode"
                  type="text"
                  maxLength={6}
                  className="form-field-input"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* 7. Preferred Insurance Type & 8. Nominee Name */}
            <div className="insurance-grid-2col">
              <div className="form-field-group">
                <label htmlFor="apply-preferred-type" className="form-field-label">
                  <span>Preferred Insurance Type</span>
                  <span className="required-star">*</span>
                </label>
                <select
                  id="apply-preferred-type"
                  className="form-field-select"
                  value={preferredType}
                  onChange={(e) => setPreferredType(e.target.value)}
                  required
                >
                  <option value="Health Insurance">Health Insurance</option>
                  <option value="Personal Accident Insurance">Personal Accident Insurance</option>
                  <option value="Critical Illness Insurance">Critical Illness Insurance</option>
                  <option value="Family Floater Coverage">Family Floater Coverage</option>
                </select>
              </div>

              <div className="form-field-group">
                <label htmlFor="apply-nominee-name" className="form-field-label">
                  <span>Nominee Full Name</span>
                  <span className="required-star">*</span>
                </label>
                <input
                  id="apply-nominee-name"
                  type="text"
                  className="form-field-input"
                  placeholder="Enter nominee full name"
                  value={nomineeName}
                  onChange={(e) => setNomineeName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* 9. Nominee Relationship & 10. Coverage Amount Preference */}
            <div className="insurance-grid-2col">
              <div className="form-field-group">
                <label htmlFor="apply-nominee-rel" className="form-field-label">
                  <span>Nominee Relationship</span>
                  <span className="required-star">*</span>
                </label>
                <select
                  id="apply-nominee-rel"
                  className="form-field-select"
                  value={nomineeRel}
                  onChange={(e) => setNomineeRel(e.target.value)}
                  required
                >
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-field-group">
                <label htmlFor="apply-coverage-pref" className="form-field-label">
                  <span>Coverage Amount Preference</span>
                  <span className="required-star">*</span>
                </label>
                <select
                  id="apply-coverage-pref"
                  className="form-field-select"
                  value={coveragePref}
                  onChange={(e) => setCoveragePref(e.target.value)}
                  required
                >
                  <option value="₹ 2,00,000">₹ 2,00,000</option>
                  <option value="₹ 3,00,000">₹ 3,00,000</option>
                  <option value="₹ 5,00,000">₹ 5,00,000</option>
                  <option value="₹ 10,00,000">₹ 10,00,000</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="insurance-actions-wrap">
              <button type="submit" id="btn-submit-apply-ins" className="btn-save-insurance">
                Apply for Insurance
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
};
