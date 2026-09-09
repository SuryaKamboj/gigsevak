import React from "react";
import { useAccount } from "../context/AccountContext";
import { SERVICE_CATALOG } from "../data/serviceCatalog";

export const ServicesPickerModal: React.FC = () => {
  const { worker, updateWorker, activeModal, closeModal } = useAccount();

  if (activeModal !== "services-picker") return null;

  const toggleService = (serviceName: string) => {
    const currentAreas = worker.preferredWorkingAreas || [];
    const exists = currentAreas.includes(serviceName);
    const updated = exists
      ? currentAreas.filter((s) => s !== serviceName)
      : [...currentAreas, serviceName];
    updateWorker({ preferredWorkingAreas: updated });
  };

  return (
    <div
      id="services-picker-modal"
      className="services-picker-modal active"
      role="dialog"
      aria-modal="true"
      aria-label="Select Preferred Working Areas"
    >
      <div className="services-picker-sheet">
        <div className="services-picker-header">
          <h3 className="services-picker-title">Select Preferred Working Areas</h3>
          <button className="services-picker-close" onClick={closeModal} aria-label="Close">
            ✕
          </button>
        </div>

        <div id="services-picker-body" className="services-picker-body">
          {SERVICE_CATALOG.map((cat) => (
            <div key={cat.category} className="service-category-block">
              <div className="service-category-heading">{cat.category}</div>
              <div className="services-card-grid">
                {cat.services.map((srv) => {
                  const isSelected = (worker.preferredWorkingAreas || []).includes(srv.name);
                  return (
                    <div
                      key={srv.id}
                      className={`service-select-card ${isSelected ? "selected" : ""}`}
                      onClick={() => toggleService(srv.name)}
                    >
                      <div className="service-card-left">
                        <img
                          className="service-card-thumb"
                          src={srv.image}
                          alt={srv.name}
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=120&auto=format&fit=crop&q=80";
                          }}
                        />
                        <span className="service-card-name">{srv.name}</span>
                      </div>
                      <div className="service-card-checkbox">
                        {isSelected && (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="services-picker-footer">
          <button className="btn-services-continue" type="button" onClick={closeModal}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};
