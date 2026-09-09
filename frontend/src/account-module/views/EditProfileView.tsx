import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAccount } from "../context/AccountContext";

export const EditProfileView: React.FC = () => {
  const { t } = useTranslation();
  const { worker, updateWorker, navigateTo, openModal, showToast } = useAccount();

  const [formData, setFormData] = useState({
    name: worker.name || "",
    phone: worker.phone || "",
    avatar: worker.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
    currentAddress: worker.currentAddress || "",
    city: worker.city || "",
    pincode: worker.pincode || "",
    preferredWorkingAreas: [...(worker.preferredWorkingAreas || [])],
    primarySkill: worker.primarySkill || "Electrician",
    yearsOfExperience: worker.yearsOfExperience || "5",
    skillLevel: worker.skillLevel || "Intermediate",
    servicesOffered: [...(worker.servicesOffered || [])],
    toolsAndEquipment: [...(worker.toolsAndEquipment || [])],
    availableDays: [...(worker.availableDays || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"])],
    workingHoursStart: worker.workingHoursStart || "09:00",
    workingHoursEnd: worker.workingHoursEnd || "18:00",
    workType: worker.workType || "Full-time",
    aboutMe: worker.aboutMe || "",
    previousWorkExperience: worker.previousWorkExperience || "",
    certifications: [...(worker.certifications || [])],
    trainingCompleted: [...(worker.trainingCompleted || [])],
    portfolio: [...(worker.portfolio || [])]
  });

  // Inputs for adding simple chips
  const [newService, setNewService] = useState("");
  const [newTool, setNewTool] = useState("");
  const [newCert, setNewCert] = useState("");
  const [newTraining, setNewTraining] = useState("");

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData(prev => ({ ...prev, avatar: event.target!.result as string }));
          showToast("Profile photo updated");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePortfolioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newPhoto = {
            id: `p-${Date.now()}`,
            url: event.target!.result as string,
            title: "Work Sample"
          };
          setFormData(prev => ({ ...prev, portfolio: [...prev.portfolio, newPhoto] }));
          showToast("Portfolio photo added");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removePortfolioPhoto = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      portfolio: prev.portfolio.filter((_, i) => i !== idx)
    }));
  };

  const toggleDay = (day: string) => {
    setFormData(prev => {
      const exists = prev.availableDays.includes(day);
      if (exists) {
        if (prev.availableDays.length <= 1) {
          showToast("At least 1 working day must be selected.");
          return prev;
        }
        return { ...prev, availableDays: prev.availableDays.filter(d => d !== day) };
      }
      return { ...prev, availableDays: [...prev.availableDays, day] };
    });
  };

  const removeWorkingArea = (area: string) => {
    const updated = formData.preferredWorkingAreas.filter(a => a !== area);
    setFormData(prev => ({ ...prev, preferredWorkingAreas: updated }));
    updateWorker({ preferredWorkingAreas: updated });
  };

  const addChip = (key: "servicesOffered" | "toolsAndEquipment" | "certifications" | "trainingCompleted", value: string, setter: (v: string) => void) => {
    if (!value.trim()) return;
    setFormData(prev => ({ ...prev, [key]: [...prev[key], value.trim()] }));
    setter("");
  };

  const removeChip = (key: "servicesOffered" | "toolsAndEquipment" | "certifications" | "trainingCompleted", idx: number) => {
    setFormData(prev => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== idx)
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast("Full name is required.");
      return;
    }

    const pincode = formData.pincode.trim();
    if (pincode && !/^[1-9][0-9]{5}$/.test(pincode)) {
      showToast("Please enter a valid 6-digit Indian pincode.");
      return;
    }

    const areas = worker.preferredWorkingAreas || formData.preferredWorkingAreas;
    if (areas.length === 0) {
      showToast("Please select at least one preferred working area.");
      openModal("services-picker");
      return;
    }

    const updated = {
      ...formData,
      name: worker.name,
      preferredWorkingAreas: areas
    };

    updateWorker(updated);
    showToast("Profile updated successfully.");
    setTimeout(() => {
      navigateTo("main");
    }, 400);
  };

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const currentAreas = worker.preferredWorkingAreas || formData.preferredWorkingAreas;

  return (
    <main id="view-edit-profile" className="active" style={{ display: "block" }}>
      {/* Edit Profile Header with Back Arrow */}
      <header className="edit-profile-header">
        <div className="edit-header-left">
          <button
            id="btn-edit-profile-back"
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
          <h1 className="edit-header-title">{t("account.editProfile", "Edit Profile")}</h1>
        </div>
        <div className="brand-logo" style={{ fontSize: 20 }}>
          <span className="brand-gig">Gig</span>
          <span className="brand-sevak">Sevak</span>
        </div>
      </header>

      <div className="edit-profile-container">
        <form onSubmit={handleSave} noValidate>
          {/* 1. PERSONAL INFORMATION */}
          <section className="edit-section-card">
            <h2 className="edit-section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Personal Information</span>
            </h2>

            {/* Profile Photo Upload */}
            <div className="avatar-edit-wrapper">
              <div className="avatar-preview-box">
                <img
                  id="edit-avatar-preview"
                  className="avatar-preview-img"
                  src={formData.avatar}
                  alt={formData.name}
                />
              </div>
              <div className="avatar-upload-actions">
                <label className="btn-change-photo">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                  <span>Change Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleAvatarChange}
                  />
                </label>
                <span className="avatar-hint-text">JPG, PNG or WEBP (Max 2MB)</span>
              </div>
            </div>

            {/* Full Name (Aadhaar Verified - LOCKED / READ-ONLY) */}
            <div className="form-group">
              <label className="form-label" htmlFor="edit-input-name">
                <span>Full Name</span>
                <span style={{ fontSize: 11, color: "var(--status-success)", fontWeight: 700, marginLeft: 4 }}>
                  (Aadhaar Verified)
                </span>
              </label>
              <div className="form-input form-input-locked">
                <input
                  id="edit-input-name"
                  type="text"
                  readOnly
                  disabled
                  tabIndex={-1}
                  style={{ background: "transparent", border: "none", outline: "none", width: "100%", color: "inherit", fontWeight: 600, cursor: "not-allowed" }}
                  value={worker.name}
                />
              </div>
              <span className="locked-badge-msg">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Verified through Aadhaar</span>
              </span>
            </div>

            {/* Date of Birth & Gender (Aadhaar Verified - LOCKED / READ-ONLY) */}
            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label" htmlFor="edit-input-dob">
                  <span>Date of Birth</span>
                  <span style={{ fontSize: 11, color: "var(--status-success)", fontWeight: 700, marginLeft: 4 }}>
                    (Aadhaar Verified)
                  </span>
                </label>
                <div className="form-input form-input-locked">
                  <input
                    id="edit-input-dob"
                    type="text"
                    readOnly
                    disabled
                    tabIndex={-1}
                    style={{ background: "transparent", border: "none", outline: "none", width: "100%", color: "inherit", fontWeight: 600, cursor: "not-allowed" }}
                    value={worker.dateOfBirth}
                  />
                </div>
                <span className="locked-badge-msg">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Verified through Aadhaar</span>
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-input-gender">
                  <span>Gender</span>
                  <span style={{ fontSize: 11, color: "var(--status-success)", fontWeight: 700, marginLeft: 4 }}>
                    (Aadhaar Verified)
                  </span>
                </label>
                <div className="form-input form-input-locked">
                  <input
                    id="edit-input-gender"
                    type="text"
                    readOnly
                    disabled
                    tabIndex={-1}
                    style={{ background: "transparent", border: "none", outline: "none", width: "100%", color: "inherit", fontWeight: 600, cursor: "not-allowed" }}
                    value={worker.gender}
                  />
                </div>
                <span className="locked-badge-msg">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Verified through Aadhaar</span>
                </span>
              </div>
            </div>

            {/* Mobile Number */}
            <div className="form-group">
              <label className="form-label" htmlFor="edit-input-phone">
                Mobile Number
              </label>
              <input
                id="edit-input-phone"
                className="form-input"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <span style={{ fontSize: 11.5, color: "var(--status-success)", fontWeight: 600, marginTop: 2, display: "block" }}>
                ● OTP Authentication Verified
              </span>
            </div>
          </section>

          {/* 2. LOCATION & SERVICE AREA */}
          <section className="edit-section-card">
            <h2 className="edit-section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 21s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 7.2c0 7.3-8 11.8-8 11.8z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>Location & Service Area</span>
            </h2>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-input-address">
                Current Address
              </label>
              <textarea
                id="edit-input-address"
                className="form-textarea"
                rows={2}
                placeholder="House/Street, Locality"
                value={formData.currentAddress}
                onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })}
              ></textarea>
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label" htmlFor="edit-input-city">
                  City / Locality
                </label>
                <input
                  id="edit-input-city"
                  className="form-input"
                  type="text"
                  placeholder="Jalandhar, Kapurthala..."
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-input-pincode">
                  Pincode (6-digit)
                </label>
                <input
                  id="edit-input-pincode"
                  className="form-input"
                  type="text"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  placeholder="144001"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                />
              </div>
            </div>

            {/* Preferred Working Areas Multi-Select */}
            <div className="form-group">
              <label className="form-label">
                <span>Preferred Working Areas *</span>
                <span style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginLeft: 6 }}>
                  (Select multiple gig-services)
                </span>
              </label>
              <div id="working-areas-chips" className="chips-container">
                {currentAreas.length === 0 ? (
                  <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>No working areas selected yet.</span>
                ) : (
                  currentAreas.map((area) => (
                    <span key={area} className="service-chip">
                      <span>{area}</span>
                      <span
                        className="chip-remove-btn"
                        onClick={() => removeWorkingArea(area)}
                        title="Remove"
                      >
                        ✕
                      </span>
                    </span>
                  ))
                )}
                <button
                  type="button"
                  className="btn-open-services-modal"
                  onClick={() => openModal("services-picker")}
                >
                  + Select Working Areas
                </button>
              </div>
            </div>
          </section>

          {/* 3. SKILLS & EXPERTISE */}
          <section className="edit-section-card">
            <h2 className="edit-section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
              </svg>
              <span>Skills & Expertise</span>
            </h2>

            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label" htmlFor="edit-select-primary-skill">
                  Primary Skill
                </label>
                <select
                  id="edit-select-primary-skill"
                  className="form-select"
                  value={formData.primarySkill}
                  onChange={(e) => setFormData({ ...formData, primarySkill: e.target.value })}
                >
                  <option value="Electrician">Electrician</option>
                  <option value="Plumber">Plumber</option>
                  <option value="Carpenter">Carpenter</option>
                  <option value="Painter">Painter</option>
                  <option value="AC Technician">AC Technician</option>
                  <option value="Mason">Mason</option>
                  <option value="Welder">Welder</option>
                  <option value="Cleaner">Cleaner</option>
                  <option value="Gardener">Gardener</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-input-experience">
                  Years of Experience
                </label>
                <input
                  id="edit-input-experience"
                  className="form-input"
                  type="text"
                  placeholder="e.g. 5 years"
                  value={formData.yearsOfExperience}
                  onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                />
              </div>
            </div>

            {/* Skill Level Radio Control */}
            <div className="form-group">
              <label className="form-label">Skill Level</label>
              <div id="skill-level-radios" className="radio-options-row">
                {(["Beginner", "Intermediate", "Expert"] as const).map((lvl) => (
                  <label key={lvl} className={`radio-card-label ${formData.skillLevel === lvl ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="skillLevel"
                      value={lvl}
                      checked={formData.skillLevel === lvl}
                      onChange={() => setFormData({ ...formData, skillLevel: lvl })}
                    />
                    <span>{lvl}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Services Offered Chips */}
            <div className="form-group">
              <label className="form-label">Services Offered</label>
              <div id="services-offered-chips" className="chips-container">
                {formData.servicesOffered.map((srv, idx) => (
                  <span key={srv} className="service-chip">
                    <span>{srv}</span>
                    <span className="chip-remove-btn" onClick={() => removeChip("servicesOffered", idx)}>✕</span>
                  </span>
                ))}
                <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <input
                    type="text"
                    placeholder="+ Add"
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addChip("servicesOffered", newService, setNewService);
                      }
                    }}
                    style={{ border: "1px dashed var(--border-light)", borderRadius: "var(--radius-pill)", padding: "4px 10px", fontSize: 12, outline: "none", background: "transparent", color: "var(--text-primary)", width: 80 }}
                  />
                  <button
                    type="button"
                    onClick={() => addChip("servicesOffered", newService, setNewService)}
                    style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)", padding: "2px 6px" }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Tools & Equipment Available */}
            <div className="form-group">
              <label className="form-label">Tools & Equipment Available</label>
              <div id="tools-equipment-chips" className="chips-container">
                {formData.toolsAndEquipment.map((tool, idx) => (
                  <span key={tool} className="service-chip">
                    <span>{tool}</span>
                    <span className="chip-remove-btn" onClick={() => removeChip("toolsAndEquipment", idx)}>✕</span>
                  </span>
                ))}
                <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <input
                    type="text"
                    placeholder="+ Add"
                    value={newTool}
                    onChange={(e) => setNewTool(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addChip("toolsAndEquipment", newTool, setNewTool);
                      }
                    }}
                    style={{ border: "1px dashed var(--border-light)", borderRadius: "var(--radius-pill)", padding: "4px 10px", fontSize: 12, outline: "none", background: "transparent", color: "var(--text-primary)", width: 80 }}
                  />
                  <button
                    type="button"
                    onClick={() => addChip("toolsAndEquipment", newTool, setNewTool)}
                    style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)", padding: "2px 6px" }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 4. WORK PREFERENCES */}
          <section className="edit-section-card">
            <h2 className="edit-section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>Work Preferences</span>
            </h2>

            {/* Available Days */}
            <div className="form-group">
              <label className="form-label">Available Days (Click to toggle)</label>
              <div id="available-days-picker" className="days-picker-row">
                {daysOfWeek.map((day) => {
                  const isSelected = formData.availableDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      className={`day-pill-btn ${isSelected ? "selected" : ""}`}
                      onClick={() => toggleDay(day)}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Working Hours */}
            <div className="form-group">
              <label className="form-label">Working Hours</label>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  id="edit-time-start"
                  className="form-input"
                  type="time"
                  style={{ flex: 1 }}
                  value={formData.workingHoursStart}
                  onChange={(e) => setFormData({ ...formData, workingHoursStart: e.target.value })}
                />
                <span style={{ fontWeight: 700, color: "var(--text-tertiary)" }}>—</span>
                <input
                  id="edit-time-end"
                  className="form-input"
                  type="time"
                  style={{ flex: 1 }}
                  value={formData.workingHoursEnd}
                  onChange={(e) => setFormData({ ...formData, workingHoursEnd: e.target.value })}
                />
              </div>
            </div>

            {/* Work Type */}
            <div className="form-group">
              <label className="form-label">Work Type</label>
              <div id="work-type-radios" className="radio-options-row">
                {(["Full-time", "Part-time"] as const).map((wt) => (
                  <label key={wt} className={`radio-card-label ${formData.workType === wt ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="workType"
                      value={wt}
                      checked={formData.workType === wt}
                      onChange={() => setFormData({ ...formData, workType: wt })}
                    />
                    <span>{wt}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>

          {/* 5. PROFESSIONAL PROFILE */}
          <section className="edit-section-card">
            <h2 className="edit-section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
              <span>Professional Profile</span>
            </h2>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-input-about">
                About Me
              </label>
              <textarea
                id="edit-input-about"
                className="form-textarea"
                rows={3}
                placeholder="Tell customers about yourself, your experience and the type of work you specialize in."
                value={formData.aboutMe}
                onChange={(e) => setFormData({ ...formData, aboutMe: e.target.value })}
              ></textarea>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-input-prev-exp">
                Previous Work Experience
              </label>
              <textarea
                id="edit-input-prev-exp"
                className="form-textarea"
                rows={3}
                placeholder="Describe past repair work, contracts, or cooperative projects."
                value={formData.previousWorkExperience}
                onChange={(e) => setFormData({ ...formData, previousWorkExperience: e.target.value })}
              ></textarea>
            </div>

            <div className="form-group">
              <label className="form-label">Certifications</label>
              <div id="certifications-chips" className="chips-container">
                {formData.certifications.map((cert, idx) => (
                  <span key={cert} className="service-chip">
                    <span>{cert}</span>
                    <span className="chip-remove-btn" onClick={() => removeChip("certifications", idx)}>✕</span>
                  </span>
                ))}
                <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <input
                    type="text"
                    placeholder="+ Add"
                    value={newCert}
                    onChange={(e) => setNewCert(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addChip("certifications", newCert, setNewCert);
                      }
                    }}
                    style={{ border: "1px dashed var(--border-light)", borderRadius: "var(--radius-pill)", padding: "4px 10px", fontSize: 12, outline: "none", background: "transparent", color: "var(--text-primary)", width: 80 }}
                  />
                  <button
                    type="button"
                    onClick={() => addChip("certifications", newCert, setNewCert)}
                    style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)", padding: "2px 6px" }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Training Completed</label>
              <div id="training-chips" className="chips-container">
                {formData.trainingCompleted.map((tr, idx) => (
                  <span key={tr} className="service-chip">
                    <span>{tr}</span>
                    <span className="chip-remove-btn" onClick={() => removeChip("trainingCompleted", idx)}>✕</span>
                  </span>
                ))}
                <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <input
                    type="text"
                    placeholder="+ Add"
                    value={newTraining}
                    onChange={(e) => setNewTraining(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addChip("trainingCompleted", newTraining, setNewTraining);
                      }
                    }}
                    style={{ border: "1px dashed var(--border-light)", borderRadius: "var(--radius-pill)", padding: "4px 10px", fontSize: 12, outline: "none", background: "transparent", color: "var(--text-primary)", width: 80 }}
                  />
                  <button
                    type="button"
                    onClick={() => addChip("trainingCompleted", newTraining, setNewTraining)}
                    style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)", padding: "2px 6px" }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Proof of Work / Portfolio */}
            <div className="form-group">
              <label className="form-label">Proof of Work / Portfolio</label>
              <div id="portfolio-grid-container" className="portfolio-grid">
                {formData.portfolio.map((item, idx) => (
                  <div key={item.id || idx} className="portfolio-item">
                    <img src={item.url} alt={item.title || "Work sample"} loading="lazy" />
                    <button
                      type="button"
                      className="portfolio-remove-btn"
                      onClick={() => removePortfolioPhoto(idx)}
                      title="Remove photo"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <label className="btn-add-portfolio" title="Add Work Photo">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  <span>+ Add Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handlePortfolioUpload}
                  />
                </label>
              </div>
            </div>
          </section>

          {/* Save Changes Action */}
          <div className="save-changes-bar">
            <button id="btn-save-profile-action" className="btn-save-profile" type="submit">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>{t("account.saveChanges", "Save Changes")}</span>
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};
