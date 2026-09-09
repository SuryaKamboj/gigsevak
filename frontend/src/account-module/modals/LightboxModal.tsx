import React, { useState, useEffect } from "react";
import { useAccount } from "../context/AccountContext";
import type { WorkPhoto } from "../types";

export const LightboxModal: React.FC = () => {
  const { activeModal, modalData, closeModal } = useAccount();
  const [currentIndex, setCurrentIndex] = useState(0);

  const data = modalData as { photos: WorkPhoto[]; index: number } | undefined;
  const photos = data?.photos || [];

  useEffect(() => {
    if (data?.index !== undefined) {
      setCurrentIndex(data.index);
    }
  }, [data]);

  if (activeModal !== "lightbox" || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];

  const prevPhoto = () => {
    setCurrentIndex(prev => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const nextPhoto = () => {
    setCurrentIndex(prev => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  return (
    <div id="lightbox-modal" className="lightbox-modal active" role="dialog" aria-modal="true" aria-label="Work Photos Gallery">
      <div className="lightbox-top-bar">
        <span id="lightbox-counter" className="lightbox-counter">
          Photo {currentIndex + 1} of {photos.length}
        </span>
        <button className="lightbox-close-btn" onClick={closeModal} aria-label="Close Lightbox">✕</button>
      </div>

      <div className="lightbox-stage">
        <button className="lightbox-nav-btn lightbox-prev" onClick={prevPhoto} aria-label="Previous Photo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <img
          id="lightbox-img"
          className="lightbox-img"
          src={currentPhoto.url}
          alt={currentPhoto.title}
        />

        <button className="lightbox-nav-btn lightbox-next" onClick={nextPhoto} aria-label="Next Photo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>

      <div className="lightbox-bottom-bar">
        <div id="lightbox-caption" className="lightbox-caption">
          <strong>{currentPhoto.title}</strong>
          {currentPhoto.desc && <span> — {currentPhoto.desc}</span>}
        </div>
        <div id="lightbox-thumbs-strip" className="lightbox-thumbs-strip">
          {photos.map((p, idx) => (
            <img
              key={idx}
              className={`lightbox-thumb ${idx === currentIndex ? "active" : ""}`}
              src={p.url}
              alt={p.title}
              onClick={() => setCurrentIndex(idx)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
