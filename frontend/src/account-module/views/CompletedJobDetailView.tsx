import React from "react";
import { useAccount } from "../context/AccountContext";

interface CompletedJobDetailViewProps {
  jobId: string;
}

export const CompletedJobDetailView: React.FC<CompletedJobDetailViewProps> = ({ jobId }) => {
  const { getCompletedJobById, navigateTo, openModal } = useAccount();

  const job = getCompletedJobById(jobId);

  if (!job) {
    return (
      <main id="view-completed-job-detail" className="active" style={{ display: "block" }}>
        <header className="completed-header">
          <div className="completed-header-left">
            <button
              className="back-btn"
              onClick={() => navigateTo("completed-jobs")}
              aria-label="Back to Completed Jobs"
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
            <h1 className="completed-header-title">Job Details</h1>
          </div>
          <div className="brand-logo" style={{ fontSize: 20 }}>
            <span className="brand-gig">Gig</span>
            <span className="brand-sevak">Sevak</span>
          </div>
        </header>

        <div className="completed-container" style={{ textAlign: "center", paddingTop: 40 }}>
          <h2 style={{ fontSize: 18, color: "var(--text-primary)" }}>Job not found</h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6 }}>
            The requested job could not be located in your completed records.
          </p>
          <button
            type="button"
            className="btn-primary-brand"
            style={{ marginTop: 16, alignSelf: "center" }}
            onClick={() => navigateTo("completed-jobs")}
          >
            Back to Completed Jobs
          </button>
        </div>
      </main>
    );
  }

  const computedTotal = job.baseServiceCharge + job.materialCost + job.additionalCharges;

  const handleOpenPhoto = (photos: typeof job.beforeWorkPhotos, index: number) => {
    openModal("lightbox", { photos, index });
  };

  return (
    <main id="view-completed-job-detail" className="active" style={{ display: "block" }}>
      {/* Sticky Header with Back Arrow to Completed Jobs List */}
      <header className="completed-header">
        <div className="completed-header-left">
          <button
            className="back-btn"
            onClick={() => navigateTo("completed-jobs")}
            aria-label="Back to Completed Jobs"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <h1 className="completed-header-title">Job Details</h1>
        </div>
        <div className="brand-logo" style={{ fontSize: 20 }}>
          <span className="brand-gig">Gig</span>
          <span className="brand-sevak">Sevak</span>
        </div>
      </header>

      <div className="completed-container">
        <div className="job-detail-grid">
          {/* Top Row / 2-Column: Sections 1 & 2 */}
          <div className="job-detail-2col">
            {/* SECTION 1 — JOB INFORMATION */}
            <section className="job-detail-card" aria-labelledby="heading-job-info">
              <h2 id="heading-job-info" className="job-detail-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <span>Job Information</span>
              </h2>

              <div className="job-detail-rows">
                <div className="job-detail-row inline">
                  <span className="job-detail-label">Job ID</span>
                  <span className="job-detail-value highlight">#{job.jobId}</span>
                </div>

                <div className="job-detail-row inline">
                  <span className="job-detail-label">Service Name</span>
                  <span className="job-detail-value">{job.serviceName}</span>
                </div>

                <div className="job-detail-row inline">
                  <span className="job-detail-label">Service Category</span>
                  <span className="job-detail-value">{job.serviceCategory}</span>
                </div>

                <div className="job-detail-row">
                  <span className="job-detail-label">Job Description</span>
                  <div className="job-detail-desc-box">{job.description}</div>
                </div>

                <div className="job-detail-row inline">
                  <span className="job-detail-label">Date & Time</span>
                  <span className="job-detail-value">
                    {job.date} · {job.time}
                  </span>
                </div>

                <div className="job-detail-row inline">
                  <span className="job-detail-label">Job Duration</span>
                  <span className="job-detail-value">{job.duration}</span>
                </div>

                <div className="job-detail-row inline">
                  <span className="job-detail-label">Status</span>
                  <span className="completed-badge-pill">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>{job.status}</span>
                  </span>
                </div>

                <div className="job-detail-row inline">
                  <span className="job-detail-label">Completion Time</span>
                  <span className="job-detail-value">{job.completionTime}</span>
                </div>
              </div>
            </section>

            {/* SECTION 2 — CUSTOMER & LOCATION */}
            <section className="job-detail-card" aria-labelledby="heading-customer-location">
              <h2 id="heading-customer-location" className="job-detail-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>Customer & Location</span>
              </h2>

              <div className="customer-detail-header">
                <img
                  className="customer-detail-avatar"
                  src={job.customerImage}
                  alt={job.customerName}
                />
                <div>
                  <h3 className="customer-detail-name">{job.customerName}</h3>
                  <p className="customer-detail-sub">Citizen Client · Verified</p>
                </div>
              </div>

              <div className="job-detail-rows">
                <div className="job-detail-row inline">
                  <span className="job-detail-label">Service Location</span>
                  <span className="job-detail-value">{job.locality}</span>
                </div>

                <div className="job-detail-row inline">
                  <span className="job-detail-label">Distance Travelled</span>
                  <span className="job-detail-value">{job.distanceTravelled}</span>
                </div>

                <div className="job-detail-row inline">
                  <span className="job-detail-label">Arrival Time</span>
                  <span className="job-detail-value">{job.arrivalTime}</span>
                </div>

                <div className="job-detail-row inline">
                  <span className="job-detail-label">Departure Time</span>
                  <span className="job-detail-value">{job.departureTime}</span>
                </div>
              </div>
            </section>
          </div>

          {/* Bottom Row / 2-Column: Sections 3 & 4 */}
          <div className="job-detail-2col">
            {/* SECTION 3 — WORK & PAYMENT */}
            <section className="job-detail-card" aria-labelledby="heading-work-payment">
              <h2 id="heading-work-payment" className="job-detail-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                <span>Work & Payment</span>
              </h2>

              <div className="job-detail-rows">
                <div className="job-detail-row">
                  <span className="job-detail-label">Work Performed</span>
                  <div className="job-detail-desc-box">{job.workPerformed}</div>
                </div>

                {job.additionalWork && (
                  <div className="job-detail-row">
                    <span className="job-detail-label">Additional Work</span>
                    <div className="job-detail-desc-box" style={{ borderLeftColor: "var(--border-dark)" }}>
                      {job.additionalWork}
                    </div>
                  </div>
                )}

                <div className="payment-breakdown-list">
                  <div className="payment-breakdown-row">
                    <span>Base Service Charge</span>
                    <span>₹{job.baseServiceCharge}</span>
                  </div>

                  <div className="payment-breakdown-row">
                    <span>Material Cost</span>
                    <span>₹{job.materialCost}</span>
                  </div>

                  <div className="payment-breakdown-row">
                    <span>Additional Charges</span>
                    <span>₹{job.additionalCharges}</span>
                  </div>

                  <div className="payment-breakdown-row total">
                    <span>Total Amount</span>
                    <span style={{ color: "var(--primary)" }}>₹{computedTotal}</span>
                  </div>
                </div>

                <div className="job-detail-row inline">
                  <span className="job-detail-label">Payment Status</span>
                  <span className="payment-status-pill">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>{job.paymentStatus}</span>
                  </span>
                </div>

                <div className="job-detail-row inline">
                  <span className="job-detail-label">Payment Method</span>
                  <span className="job-detail-value">{job.paymentMethod}</span>
                </div>
              </div>
            </section>

            {/* SECTION 4 — SERVICE RECORD */}
            <section className="job-detail-card" aria-labelledby="heading-service-record">
              <h2 id="heading-service-record" className="job-detail-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                <span>Service Record</span>
              </h2>

              <div className="job-detail-rows">
                <div className="job-detail-row inline">
                  <span className="job-detail-label">Customer Rating</span>
                  <span className="completed-rating-badge">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    <span>{job.customerRating.toFixed(1)} / 5.0</span>
                  </span>
                </div>

                <div className="job-detail-row">
                  <span className="job-detail-label">Customer Review</span>
                  <div className="review-quote-box">"{job.customerReview}"</div>
                </div>

                {/* Before Work Photos Gallery */}
                <div className="photos-gallery-section">
                  <h3 className="photos-gallery-title">Before Work Photos</h3>
                  <div className="photos-grid">
                    {job.beforeWorkPhotos.map((photo, idx) => (
                      <div
                        key={idx}
                        className="photo-thumb-card"
                        onClick={() => handleOpenPhoto(job.beforeWorkPhotos, idx)}
                        role="button"
                        tabIndex={0}
                        aria-label={`View photo: ${photo.title}`}
                      >
                        <img className="photo-thumb-img" src={photo.url} alt={photo.title} loading="lazy" />
                        <div className="photo-thumb-overlay">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            <line x1="11" y1="8" x2="11" y2="14"></line>
                            <line x1="8" y1="11" x2="14" y2="11"></line>
                          </svg>
                        </div>
                        <span className="photo-thumb-caption">{photo.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* After Work Photos Gallery */}
                <div className="photos-gallery-section">
                  <h3 className="photos-gallery-title">After Work Photos</h3>
                  <div className="photos-grid">
                    {job.afterWorkPhotos.map((photo, idx) => (
                      <div
                        key={idx}
                        className="photo-thumb-card"
                        onClick={() => handleOpenPhoto(job.afterWorkPhotos, idx)}
                        role="button"
                        tabIndex={0}
                        aria-label={`View photo: ${photo.title}`}
                      >
                        <img className="photo-thumb-img" src={photo.url} alt={photo.title} loading="lazy" />
                        <div className="photo-thumb-overlay">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            <line x1="11" y1="8" x2="11" y2="14"></line>
                            <line x1="8" y1="11" x2="14" y2="11"></line>
                          </svg>
                        </div>
                        <span className="photo-thumb-caption">{photo.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
};
