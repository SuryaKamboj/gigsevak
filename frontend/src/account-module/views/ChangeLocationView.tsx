import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAccount } from "../context/AccountContext";
import type { LocationData } from "../types";
import { SERVICE_CATALOG } from "../data/serviceCatalog";
import {
  loadGoogleMaps,
  isGoogleMapsConfigured,
  reverseGeocodeLatLng,
  geocodeAddress,
  getGooglePlacePredictions,
} from "../../services/googleMapsService";

interface PlaceSuggestion {
  id: string;
  title: string;
  subtitle: string;
}

export const ChangeLocationView: React.FC = () => {
  const { t } = useTranslation();
  const { worker, updateWorker, navigateTo, openModal, showToast } = useAccount();

  const [location, setLocation] = useState<LocationData>({
    currentAddress: worker.currentAddress || "",
    city: worker.city || "",
    pincode: worker.pincode || "",
    preferredWorkingAreas: worker.preferredWorkingAreas || [],
    coordinates: worker.coordinates || { lat: 31.326, lng: 75.5762 },
  });

  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>(() => {
    if (worker.coordinates?.lat && worker.coordinates?.lng) {
      return worker.coordinates;
    }
    return { lat: 31.326, lng: 75.5762 }; // Default: Jalandhar, Punjab
  });

  const [searchText, setSearchText] = useState<string>("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [autoFilled, setAutoFilled] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);
  const [mapError, setMapError] = useState<string | null>(() =>
    !isGoogleMapsConfigured() ? "Google Maps API key is not configured." : null
  );

  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const googleMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const coordinatesRef = useRef<{ lat: number; lng: number }>(coordinates);
  const searchDebounceRef = useRef<any>(null);

  // Keep coordinatesRef synchronized
  useEffect(() => {
    coordinatesRef.current = coordinates;
  }, [coordinates]);

  // Update address and pin when coordinates change
  const updateLocationFromCoords = useCallback(
    async (lat: number, lng: number) => {
      setCoordinates({ lat, lng });
      coordinatesRef.current = { lat, lng };

      if (markerRef.current) {
        markerRef.current.setPosition({ lat, lng });
      }

      if (googleMapRef.current) {
        googleMapRef.current.panTo({ lat, lng });
      }

      try {
        const geoResult = await reverseGeocodeLatLng(lat, lng);
        if (geoResult) {
          const newAddress = geoResult.address || `Location at (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
          const newCity = geoResult.city || "Jalandhar";
          const newPincode = geoResult.pincode || "144001";

          setSearchText(newAddress);
          if (searchInputRef.current) {
            searchInputRef.current.value = newAddress;
          }

          // Automatically populate all form fields
          setLocation((prev) => ({
            ...prev,
            currentAddress: newAddress,
            city: newCity,
            pincode: newPincode,
            coordinates: { lat, lng },
          }));

          setAutoFilled(true);
          return geoResult;
        }
      } catch (err) {
        console.warn("Reverse geocode error:", err);
      }
      return null;
    },
    []
  );

  // Initialize Google Maps instance ONCE on mount
  useEffect(() => {
    let isMounted = true;

    if (!isGoogleMapsConfigured()) {
      return;
    }

    loadGoogleMaps()
      .then((google) => {
        if (!isMounted || !mapElementRef.current) return;

        const initialCenter = coordinatesRef.current;

        const map = new google.maps.Map(mapElementRef.current, {
          center: { lat: initialCenter.lat, lng: initialCenter.lng },
          zoom: 15,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: "greedy",
        });

        const marker = new google.maps.Marker({
          position: { lat: initialCenter.lat, lng: initialCenter.lng },
          map,
          draggable: true,
          animation: google.maps.Animation.DROP,
          title: "Drag to pinpoint location",
        });

        // Map Click Listener
        map.addListener("click", (e: any) => {
          if (e.latLng) {
            const lat = typeof e.latLng.lat === "function" ? e.latLng.lat() : e.latLng.lat;
            const lng = typeof e.latLng.lng === "function" ? e.latLng.lng() : e.latLng.lng;
            marker.setPosition({ lat, lng });
            updateLocationFromCoords(lat, lng);
          }
        });

        // Marker Drag End Listener
        marker.addListener("dragend", (e: any) => {
          if (e.latLng) {
            const lat = typeof e.latLng.lat === "function" ? e.latLng.lat() : e.latLng.lat;
            const lng = typeof e.latLng.lng === "function" ? e.latLng.lng() : e.latLng.lng;
            updateLocationFromCoords(lat, lng);
          }
        });

        // Attach Google Places Autocomplete to the search input if available
        if (searchInputRef.current && google.maps?.places) {
          try {
            const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
              fields: ["address_components", "formatted_address", "geometry", "name"],
            });
            autocomplete.bindTo("bounds", map);

            autocomplete.addListener("place_changed", () => {
              const place = autocomplete.getPlace();
              if (!place) return;

              if (place.geometry && place.geometry.location) {
                const lat =
                  typeof place.geometry.location.lat === "function"
                    ? place.geometry.location.lat()
                    : place.geometry.location.lat;
                const lng =
                  typeof place.geometry.location.lng === "function"
                    ? place.geometry.location.lng()
                    : place.geometry.location.lng;

                map.panTo({ lat, lng });
                map.setZoom(16);
                marker.setPosition({ lat, lng });
                updateLocationFromCoords(lat, lng);
              } else if (place.name) {
                // If geometry missing from places, geocode the name
                geocodeAddress(place.name).then((res) => {
                  if (res) {
                    map.panTo({ lat: res.lat, lng: res.lng });
                    map.setZoom(16);
                    marker.setPosition({ lat: res.lat, lng: res.lng });
                    updateLocationFromCoords(res.lat, res.lng);
                  }
                });
              }
            });
          } catch (e) {
            console.warn("Places autocomplete attach notice:", e);
          }
        }

        googleMapRef.current = map;
        markerRef.current = marker;
        setIsMapReady(true);
      })
      .catch((err) => {
        if (isMounted) {
          console.warn("Google Maps load failed:", err);
          setMapError("Unable to load Google Maps.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [updateLocationFromCoords]);

  // Debounced search predictions for in-app suggestions list
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!value.trim() || value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      // 1. Try Google Place Predictions
      const googleResults = await getGooglePlacePredictions(value);
      if (googleResults && googleResults.length > 0) {
        setSuggestions(googleResults);
        setShowSuggestions(true);
        return;
      }

      // 2. Fallback to OpenStreetMap Nominatim Suggestions
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            value
          )}&limit=5&countrycodes=in`,
          { headers: { Accept: "application/json" } }
        );
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            setSuggestions(
              list.map((item: any) => ({
                id: String(item.place_id),
                title: item.name || item.display_name.split(",")[0],
                subtitle: item.display_name,
              }))
            );
            setShowSuggestions(true);
            return;
          }
        }
      } catch (err) {
        console.warn("Nominatim search error:", err);
      }

      setSuggestions([]);
      setShowSuggestions(false);
    }, 350);
  };

  // Select suggestion item
  const handleSelectSuggestion = async (suggestion: PlaceSuggestion) => {
    setShowSuggestions(false);
    setSearchText(suggestion.subtitle || suggestion.title);
    if (searchInputRef.current) {
      searchInputRef.current.value = suggestion.subtitle || suggestion.title;
    }

    setIsSearching(true);
    const query = suggestion.subtitle || suggestion.title;
    const result = await geocodeAddress(query);
    setIsSearching(false);

    if (result) {
      const { lat, lng } = result;
      if (googleMapRef.current && markerRef.current) {
        googleMapRef.current.panTo({ lat, lng });
        googleMapRef.current.setZoom(16);
        markerRef.current.setPosition({ lat, lng });
      }
      await updateLocationFromCoords(lat, lng);
      showToast(`${t("account.locationSelectedToast", "Location selected: ")}${result.address || query}`);
    } else {
      showToast(t("account.searchNotFound", "Address could not be located."));
    }
  };

  // Perform search on query string (when clicking Search button or pressing Enter)
  const performSearch = async () => {
    if (!searchText.trim()) return;
    setShowSuggestions(false);
    setIsSearching(true);

    try {
      const result = await geocodeAddress(searchText.trim());
      setIsSearching(false);

      if (result) {
        const { lat, lng } = result;
        if (googleMapRef.current && markerRef.current) {
          googleMapRef.current.panTo({ lat, lng });
          googleMapRef.current.setZoom(16);
          markerRef.current.setPosition({ lat, lng });
          if (window.google?.maps?.Animation) {
            markerRef.current.setAnimation(window.google.maps.Animation.DROP);
          }
        }
        await updateLocationFromCoords(lat, lng);
        showToast(`${t("account.locationSelectedToast", "Location found: ")}${result.address || searchText}`);
      } else {
        showToast(t("account.searchNotFound", "Address not found. Please try a different search term."));
      }
    } catch (err) {
      setIsSearching(false);
      console.warn("Search geocode error:", err);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      performSearch();
    }
  };

  // Handle "Use Current Location" button (GPS)
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast(t("account.geoNotSupported", "Geolocation is not supported by your browser."));
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setCoordinates({ lat, lng });

        if (googleMapRef.current && markerRef.current) {
          googleMapRef.current.panTo({ lat, lng });
          googleMapRef.current.setZoom(16);
          markerRef.current.setPosition({ lat, lng });
          if (window.google?.maps?.Animation) {
            markerRef.current.setAnimation(window.google.maps.Animation.DROP);
          }
        }

        const geoResult = await updateLocationFromCoords(lat, lng);
        setIsLocating(false);

        if (geoResult?.address) {
          showToast(
            `${t("account.locationDetected", "Current location detected: ")}${geoResult.city || geoResult.address}`
          );
        } else {
          showToast(t("account.locationDetected", "Current location detected successfully."));
        }
      },
      (error) => {
        setIsLocating(false);
        console.warn("Geolocation error:", error);
        showToast(
          t(
            "account.locationError",
            "Could not detect current location. Please grant GPS permission or choose on map."
          )
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const removeWorkingArea = (area: string) => {
    const updated = location.preferredWorkingAreas.filter((a) => a !== area);
    setLocation((prev) => ({ ...prev, preferredWorkingAreas: updated }));
    updateWorker({ preferredWorkingAreas: updated });
  };

  const toggleWorkingArea = (areaName: string) => {
    const current = location.preferredWorkingAreas || [];
    const exists = current.includes(areaName);
    const updated = exists
      ? current.filter((a) => a !== areaName)
      : [...current, areaName];
    setLocation((prev) => ({ ...prev, preferredWorkingAreas: updated }));
    updateWorker({ preferredWorkingAreas: updated });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedPincode = location.pincode.trim();
    if (trimmedPincode && !/^[1-9][0-9]{5}$/.test(trimmedPincode)) {
      showToast("Please enter a valid 6-digit Indian pincode.");
      return;
    }

    setSaving(true);
    updateWorker({
      currentAddress: location.currentAddress.trim(),
      city: location.city.trim(),
      pincode: trimmedPincode,
      preferredWorkingAreas: location.preferredWorkingAreas,
      coordinates,
    });

    showToast("Location updated successfully.");

    setTimeout(() => {
      setSaving(false);
      navigateTo("main");
    }, 400);
  };

  const allServices = SERVICE_CATALOG.flatMap((cat) => cat.services);

  return (
    <main id="view-change-location" className="active" style={{ display: "block" }}>
      {/* Main Content */}
      <div className="change-location-container">
        {/* Header Bar with Back Button & Title */}
        <header className="change-location-header">
          <div className="change-location-header-left">
            <button
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
            <h1 className="change-location-header-title">{t("account.changeLocation", "Change Your Location")}</h1>
          </div>
        </header>
        {/* Card 1: Current Registered Location Summary */}
        <section className="change-location-card" aria-labelledby="heading-current-loc">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 id="heading-current-loc" className="change-location-card-title" style={{ borderBottom: "none", paddingBottom: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>{t("account.registeredLocation", "Current Registered Location")}</span>
            </h2>

            {autoFilled && (
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "#15803d",
                  backgroundColor: "rgba(34, 197, 94, 0.12)",
                  padding: "3px 8px",
                  borderRadius: 12,
                  border: "1px solid rgba(34, 197, 94, 0.25)",
                }}
              >
                ✓ Selected on Map
              </span>
            )}
          </div>

          <div className="current-location-summary">
            <div className="current-loc-row">
              <span className="current-loc-label">Address:</span>
              <span className="current-loc-value">{location.currentAddress || worker.currentAddress || "Not specified"}</span>
            </div>
            <div className="current-loc-row">
              <span className="current-loc-label">City / Locality:</span>
              <span className="current-loc-value">{location.city || worker.city || "Jalandhar"}</span>
            </div>
            <div className="current-loc-row">
              <span className="current-loc-label">Pincode:</span>
              <span className="current-loc-value">{location.pincode || worker.pincode || "144001"}</span>
            </div>
            <div className="current-loc-row">
              <span className="current-loc-label">Active Areas:</span>
              <span className="current-loc-value">
                {location.preferredWorkingAreas && location.preferredWorkingAreas.length > 0
                  ? location.preferredWorkingAreas.join(", ")
                  : "None"}
              </span>
            </div>
            {coordinates && (
              <div className="current-loc-row">
                <span className="current-loc-label">GPS Coordinates:</span>
                <span className="current-loc-value" style={{ fontFamily: "monospace", fontSize: "12px" }}>
                  {coordinates.lat.toFixed(4)}° N, {coordinates.lng.toFixed(4)}° E
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Card 2: Interactive Google Map, Places Search & GPS Action */}
        <section className="change-location-card" aria-labelledby="heading-map-loc">
          <div className="change-location-map-header">
            <h2 id="heading-map-loc" className="change-location-card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                <line x1="8" y1="2" x2="8" y2="18"></line>
                <line x1="16" y1="6" x2="16" y2="22"></line>
              </svg>
              <span>{t("account.pinpointOnMap", "Pinpoint on Google Map")}</span>
            </h2>

            {/* "Use Current Location" (GPS) Button */}
            <button
              type="button"
              id="btn-use-current-location"
              className="btn-use-current-location"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              aria-label="Use Current Location"
            >
              {isLocating ? (
                <>
                  <svg className="spin-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="2" x2="12" y2="6"></line>
                    <line x1="12" y1="18" x2="12" y2="22"></line>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                    <line x1="2" y1="12" x2="6" y2="12"></line>
                    <line x1="18" y1="12" x2="22" y2="12"></line>
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                  </svg>
                  <span>{t("account.locating", "Detecting GPS...")}</span>
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                  </svg>
                  <span>{t("account.useCurrentLocation", "Use Current Location")}</span>
                </>
              )}
            </button>
          </div>

          {/* Search Bar with Autocomplete Suggestions */}
          <div className="change-location-search-box">
            <div className="change-location-search-input-wrapper">
              <svg
                className="change-location-search-icon"
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                ref={searchInputRef}
                id="input-map-places-search"
                type="text"
                className="change-location-search-input"
                placeholder={t(
                  "account.searchMapPlaceholder",
                  "Search area, street, landmark, or city in Google Maps..."
                )}
                value={searchText}
                onChange={handleSearchInputChange}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                autoComplete="off"
              />
              {searchText && (
                <button
                  type="button"
                  className="change-location-search-clear"
                  onClick={() => {
                    setSearchText("");
                    setSuggestions([]);
                    setShowSuggestions(false);
                    if (searchInputRef.current) {
                      searchInputRef.current.value = "";
                    }
                  }}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
              <button
                type="button"
                className="btn-submit-search"
                onClick={performSearch}
                disabled={isSearching}
                aria-label="Search location"
              >
                {isSearching ? "..." : "Search"}
              </button>
            </div>

            {/* Custom Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="change-location-suggestions-dropdown">
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="change-location-suggestion-item"
                    onClick={() => handleSelectSuggestion(item)}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="rgb(166, 102, 102)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ flexShrink: 0, marginTop: 2 }}
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                      <span className="suggestion-text-main">{item.title}</span>
                      <span className="suggestion-text-sub">{item.subtitle}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Map canvas wrapper */}
          <div className="change-location-map-wrapper">
            <div
              ref={mapElementRef}
              id="google-map-container"
              className="change-location-map-canvas"
            />

            {!isMapReady && !mapError && (
              <div className="change-location-map-loading">
                <svg className="spin-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="2" x2="12" y2="6"></line>
                  <line x1="12" y1="18" x2="12" y2="22"></line>
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                  <line x1="2" y1="12" x2="6" y2="12"></line>
                  <line x1="18" y1="12" x2="22" y2="12"></line>
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                  <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                </svg>
                <span>Loading Google Maps...</span>
              </div>
            )}

            {mapError && (
              <div className="change-location-map-fallback">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <p>{mapError}</p>
                <span style={{ fontSize: "11.5px" }}>You can still update your location manually in the fields below.</span>
              </div>
            )}
          </div>

          {/* Map Footer Info */}
          <div className="change-location-map-footer">
            <span className="change-location-map-hint">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <span>{t("account.mapHint", "Tap map or drag the pin to set your location.")}</span>
            </span>

            <span className="change-location-coords-badge" title="Selected Coordinates">
              <span>📍</span>
              <span>{coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}</span>
            </span>
          </div>
        </section>

        {/* Card 3: Edit Location Form - Auto-Filled from Map selection */}
        <form onSubmit={handleSave} className="change-location-card" aria-labelledby="heading-edit-loc">
          <h2 id="heading-edit-loc" className="change-location-card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span>{t("account.updateLocationDetails", "Update Location Details")}</span>
          </h2>

          {/* Auto-filled Notification Banner */}
          {autoFilled && (
            <div className="location-autofill-banner">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>
                {t(
                  "account.autoFilledNotice",
                  "Details auto-filled from map selection. Review or modify before saving."
                )}
              </span>
            </div>
          )}

          {/* Current Address */}
          <div className="form-group">
            <label className="form-label" htmlFor="input-change-address">
              Current Address
            </label>
            <textarea
              id="input-change-address"
              className="form-textarea"
              rows={2}
              placeholder="House/Street, Locality"
              value={location.currentAddress}
              onChange={(e) => setLocation({ ...location, currentAddress: e.target.value })}
            ></textarea>
          </div>

          {/* City & Pincode 2-col */}
          <div className="change-location-row-2col">
            <div className="form-group">
              <label className="form-label" htmlFor="input-change-city">
                City / Locality
              </label>
              <input
                id="input-change-city"
                className="form-input"
                type="text"
                placeholder="Jalandhar, Kapurthala..."
                value={location.city}
                onChange={(e) => setLocation({ ...location, city: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="input-change-pincode">
                Pincode (6-digit)
              </label>
              <input
                id="input-change-pincode"
                className="form-input"
                type="text"
                maxLength={6}
                pattern="[0-9]{6}"
                placeholder="144001"
                value={location.pincode}
                onChange={(e) => setLocation({ ...location, pincode: e.target.value })}
              />
            </div>
          </div>

          {/* Preferred Working Areas Multi-Select */}
          <div className="form-group">
            <label className="form-label">
              <span>Preferred Working Areas</span>
              <span style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginLeft: 6 }}>
                (Select multiple working areas)
              </span>
            </label>

            {/* Chips of currently selected areas */}
            <div id="change-working-areas-chips" className="chips-container">
              {location.preferredWorkingAreas.length === 0 ? (
                <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
                  No working areas selected yet.
                </span>
              ) : (
                location.preferredWorkingAreas.map((area) => (
                  <span key={area} className="service-chip">
                    <span>{area}</span>
                    <span
                      className="chip-remove-btn"
                      onClick={() => removeWorkingArea(area)}
                      title={`Remove ${area}`}
                      role="button"
                      tabIndex={0}
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

            {/* In-page multi-select dropdown */}
            <div className="quick-area-selector">
              <button
                type="button"
                className="quick-area-toggle-btn"
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-expanded={dropdownOpen}
              >
                <span>Browse All Working Areas Dropdown</span>
                <span style={{ fontSize: 11 }}>{dropdownOpen ? "▲" : "▼"}</span>
              </button>

              {dropdownOpen && (
                <div className="quick-area-list">
                  {allServices.map((srv) => {
                    const isSelected = location.preferredWorkingAreas.includes(srv.name);
                    return (
                      <button
                        key={srv.id}
                        type="button"
                        className={`quick-area-pill ${isSelected ? "selected" : ""}`}
                        onClick={() => toggleWorkingArea(srv.name)}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {srv.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Save Location Button */}
          <button
            type="submit"
            className="btn-save-location"
            disabled={saving}
            aria-label="Save Location"
          >
            {saving ? (
              <span>Saving...</span>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                <span>{t("account.saveLocation", "Save Location")}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
};
