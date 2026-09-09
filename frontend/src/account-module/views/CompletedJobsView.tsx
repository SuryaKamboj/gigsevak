import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAccount } from "../context/AccountContext";

export const CompletedJobsView: React.FC = () => {
  const { t } = useTranslation();
  const { worker, completedJobs, navigateTo } = useAccount();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState("All Services");
  const [selectedDate, setSelectedDate] = useState("All Dates");

  const serviceOptions = useMemo(() => {
    const categories = Array.from(new Set(completedJobs.map(j => j.serviceCategory)));
    return ["All Services", ...categories.sort()];
  }, [completedJobs]);

  const filteredJobs = useMemo(() => {
    return completedJobs.filter(job => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesService = job.serviceName.toLowerCase().includes(query);
        const matchesCustomer = job.customerName.toLowerCase().includes(query);
        const matchesLocality = job.locality.toLowerCase().includes(query);
        const matchesJobId = job.jobId.toLowerCase().includes(query);
        const matchesCategory = job.serviceCategory.toLowerCase().includes(query);
        if (!matchesService && !matchesCustomer && !matchesLocality && !matchesJobId && !matchesCategory) {
          return false;
        }
      }

      if (selectedService !== "All Services") {
        if (job.serviceCategory !== selectedService && job.serviceName !== selectedService) {
          return false;
        }
      }

      if (selectedDate !== "All Dates") {
        if (selectedDate === "Today") {
          if (job.dateIso !== "2026-09-08") return false;
        } else if (selectedDate === "This Week") {
          if (job.dateIso < "2026-09-01" || job.dateIso > "2026-09-08") return false;
        } else if (selectedDate === "This Month") {
          if (!job.dateIso.startsWith("2026-09")) return false;
        } else if (selectedDate === "Older") {
          if (job.dateIso >= "2026-09-01") return false;
        }
      }

      return true;
    });
  }, [completedJobs, searchQuery, selectedService, selectedDate]);

  const handleCardClick = (jobId: string) => {
    navigateTo("completed-job-detail", jobId);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedService("All Services");
    setSelectedDate("All Dates");
  };

  return (
    <main id="view-completed-jobs" className="active" style={{ display: "block" }}>
      {/* Sticky Header with Back Arrow to Worker Account */}
      <header className="completed-header">
        <div className="completed-header-left">
          <button
            className="back-btn"
            onClick={() => navigateTo("main")}
            aria-label="Back to Worker Account"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <h1 className="completed-header-title">{t("account.completedJobs", "Completed Jobs")}</h1>
        </div>
        <div className="brand-logo" style={{ fontSize: 20 }}>
          <span className="brand-gig">Gig</span>
          <span className="brand-sevak">Sevak</span>
        </div>
      </header>

      <div className="completed-container">
        {/* Intro Card */}
        <section className="completed-intro-card">
          <h2 className="completed-page-heading">{t("account.completedJobs", "Completed Jobs")}</h2>
          <p className="completed-page-subtitle">
            {worker.totalJobs} jobs successfully completed
          </p>
        </section>

        {/* Search & Filters Toolbar */}
        <section className="completed-toolbar">
          {/* Search Box */}
          <div className="completed-search-wrap">
            <span className="completed-search-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input
              type="text"
              id="search-completed-jobs-input"
              className="completed-search-input"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search jobs"
            />
            {searchQuery && (
              <button
                type="button"
                className="completed-search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="completed-filters-row">
            <select
              id="filter-completed-service"
              className="completed-select"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              aria-label="Filter by Service"
            >
              {serviceOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <select
              id="filter-completed-date"
              className="completed-select"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              aria-label="Filter by Date"
            >
              <option value="All Dates">All Dates</option>
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="Older">Older</option>
            </select>
          </div>
        </section>

        {/* Completed Jobs List */}
        <section className="completed-jobs-list" aria-label="Completed Jobs List">
          {filteredJobs.length > 0 ? (
            filteredJobs.map(job => (
              <article
                key={job.id}
                className="completed-job-card"
                onClick={() => handleCardClick(job.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleCardClick(job.id);
                  }
                }}
              >
                <div className="completed-job-card-header">
                  <span className="completed-job-date">{job.date}</span>
                  <span className="completed-job-id-pill">#{job.jobId}</span>
                </div>

                <div className="completed-job-body">
                  <img
                    className="completed-customer-avatar"
                    src={job.customerImage}
                    alt={job.customerName}
                    loading="lazy"
                  />
                  <div className="completed-job-info">
                    <h3 className="completed-job-service-name">{job.serviceName}</h3>
                    <div className="completed-job-meta-line">
                      <span>{job.customerName}</span>
                      <span> · </span>
                      <span>{job.locality}</span>
                    </div>
                  </div>
                </div>

                <div className="completed-job-footer">
                  <div className="completed-job-amount-rating">
                    <span>₹{job.totalAmount}</span>
                    <span>·</span>
                    <span className="completed-rating-badge">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                      <span>{job.customerRating.toFixed(1)}</span>
                    </span>
                  </div>

                  <span className="completed-badge-pill">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Completed</span>
                  </span>
                </div>
              </article>
            ))
          ) : (
            <div className="completed-empty-state">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}>
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
              <h3 className="completed-empty-title">No completed jobs found</h3>
              <p className="completed-empty-desc">
                No records match your search criteria. Try modifying your search keywords or resetting the filters.
              </p>
              <button
                type="button"
                className="btn-primary-brand"
                style={{ padding: "8px 18px", fontSize: 13 }}
                onClick={handleClearFilters}
              >
                Clear Filters
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};
