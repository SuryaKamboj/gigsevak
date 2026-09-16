import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, MapPin, LocateFixed, Plus, Minus, AlertCircle, CheckCircle2, Loader2, Globe, ArrowRight, X } from 'lucide-react';
import { AuthLogo } from '../../components/auth/AuthLogo';
import { AuthButton } from '../../components/auth/AuthButton';
import { WorkerOnboardingProgress } from '../../components/auth/WorkerOnboardingProgress';
import { SpeakerButton } from '../../components/common/SpeakerButton';
import { onboardingService } from '../../services/onboardingService';
import { workerBackendService } from '../../services/workerBackendService';
import {
  loadGoogleMaps,
  isGoogleMapsConfigured,
  reverseGeocodeLatLng,
  geocodeAddress,
} from '../../services/googleMapsService';

interface LocationSuggestion {
  id: string;
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
}

const MOCK_SUGGESTIONS: LocationSuggestion[] = [
  { id: '1', title: 'Kapurthala', subtitle: 'Punjab, India', lat: 31.3802, lng: 75.3816 },
  { id: '2', title: 'Kapurthala Bus Stand', subtitle: 'Kapurthala, Punjab', lat: 31.3789, lng: 75.3852 },
  { id: '3', title: 'Jalandhar Road', subtitle: 'Kapurthala, Punjab', lat: 31.3855, lng: 75.3991 },
  { id: '4', title: 'Sultanpur Lodhi', subtitle: 'Kapurthala District, Punjab', lat: 31.2178, lng: 75.1978 },
  { id: '5', title: 'Model Town', subtitle: 'Jalandhar, Punjab', lat: 31.3129, lng: 75.5806 },
  { id: '6', title: 'Civil Lines', subtitle: 'Jalandhar, Punjab', lat: 31.3260, lng: 75.5762 },
  { id: '7', title: 'Sector 17', subtitle: 'Chandigarh, Punjab & Haryana', lat: 30.7398, lng: 76.7827 },
  { id: '8', title: 'Amritsar Cantt', subtitle: 'Amritsar, Punjab', lat: 31.6340, lng: 74.8723 },
  { id: '9', title: 'Ludhiana Central', subtitle: 'Ludhiana, Punjab', lat: 30.9010, lng: 75.8573 },
  { id: '10', title: 'Phagwara', subtitle: 'Kapurthala District, Punjab', lat: 31.2240, lng: 75.7708 },
];

export const WorkerLocation: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const activeLangCode = i18n.language || localStorage.getItem('workerLanguage') || 'en';

  // Location State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocationName, setSelectedLocationName] = useState<string>('');
  const [locationSource, setLocationSource] = useState<'searched_location' | 'current_location' | 'map_pin' | null>(null);
  const [coordinates, setCoordinates] = useState({ lat: 31.3802, lng: 75.3816 });

  // UI state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [zoomLevel, setZoomLevel] = useState(14);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, initialOffsetX: 0, initialOffsetY: 0 });

  // Google Maps State
  const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const googleMapInstanceRef = useRef<any>(null);
  const googleMarkerInstanceRef = useRef<any>(null);
  const autocompleteInstanceRef = useRef<any>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  const headingText = t('location.title', { lng: activeLangCode }) || 'Where do you provide your services?';
  const subtitleText = t('location.subtitle', { lng: activeLangCode }) || 'Choose your location so customers near you can find you.';
  const enterLocationText = t('location.enterLocation', { lng: activeLangCode }) || 'Enter your location';
  const orText = t('location.or', { lng: activeLangCode }) || 'OR';
  const useCurrentLocationText = t('location.useCurrentLocation', { lng: activeLangCode }) || 'Use Current Location';
  const locatingText = t('location.locating', { lng: activeLangCode }) || 'Locating...';
  const pinpointTitleText = t('location.pinpointTitle', { lng: activeLangCode }) || 'Pinpoint your exact service location on the map.';
  const selectedBadgeText = t('location.selectedBadge', { lng: activeLangCode }) || 'Selected';
  const dragHintText = t('location.dragHint', { lng: activeLangCode }) || 'Drag map to pinpoint';
  const findBtnText = t('location.find', { lng: activeLangCode }) || 'Find';
  const selectErrorText = t('location.selectError', { lng: activeLangCode }) || 'Please select your service location.';
  const continueText = t('common.continue', { lng: activeLangCode }) || 'Continue';
  const fullText = `${headingText}. ${subtitleText}`;

  // Reverse geocode and update coordinates
  const updateFromCoordinates = useCallback(async (lat: number, lng: number, source: 'current_location' | 'map_pin' = 'map_pin') => {
    setCoordinates({ lat, lng });
    setLocationSource(source);

    if (isGoogleMapsConfigured()) {
      try {
        const geoResult = await reverseGeocodeLatLng(lat, lng);
        if (geoResult?.address) {
          setSelectedLocationName(geoResult.address);
          setSearchQuery(geoResult.address);
          return;
        }
      } catch (e) {
        console.warn('Google reverse geocode error:', e);
      }
    }

    const fallbackName = `Service Area (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    setSelectedLocationName(fallbackName);
    setSearchQuery(fallbackName);
  }, []);

  // Initialize Google Maps instance & Autocomplete on input
  useEffect(() => {
    let isMounted = true;

    if (isGoogleMapsConfigured()) {
      loadGoogleMaps()
        .then((google) => {
          if (!isMounted || !mapElementRef.current) return;

          const map = new google.maps.Map(mapElementRef.current, {
            center: { lat: coordinates.lat, lng: coordinates.lng },
            zoom: zoomLevel,
            disableDefaultUI: true,
            zoomControl: false,
            gestureHandling: 'greedy',
            mapTypeControl: false,
            streetViewControl: false,
          });

          const marker = new google.maps.Marker({
            position: { lat: coordinates.lat, lng: coordinates.lng },
            map,
            draggable: true,
            animation: google.maps.Animation.DROP,
          });

          // Map Click Listener
          map.addListener('click', (e: any) => {
            if (e.latLng) {
              const lat = typeof e.latLng.lat === 'function' ? e.latLng.lat() : e.latLng.lat;
              const lng = typeof e.latLng.lng === 'function' ? e.latLng.lng() : e.latLng.lng;
              marker.setPosition({ lat, lng });
              updateFromCoordinates(lat, lng, 'map_pin');
            }
          });

          // Marker Drag End Listener
          marker.addListener('dragend', (e: any) => {
            if (e.latLng) {
              const lat = typeof e.latLng.lat === 'function' ? e.latLng.lat() : e.latLng.lat;
              const lng = typeof e.latLng.lng === 'function' ? e.latLng.lng() : e.latLng.lng;
              updateFromCoordinates(lat, lng, 'map_pin');
            }
          });

          googleMapInstanceRef.current = map;
          googleMarkerInstanceRef.current = marker;

          // Attach Google Places Autocomplete directly to the input element
          if (searchInputRef.current) {
            const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
              fields: ['address_components', 'formatted_address', 'geometry', 'name'],
            });
            autocomplete.bindTo('bounds', map);

            autocomplete.addListener('place_changed', () => {
              const place = autocomplete.getPlace();
              if (!place || !place.geometry || !place.geometry.location) {
                return;
              }

              const lat = typeof place.geometry.location.lat === 'function' ? place.geometry.location.lat() : place.geometry.location.lat;
              const lng = typeof place.geometry.location.lng === 'function' ? place.geometry.location.lng() : place.geometry.location.lng;
              const addressName = place.formatted_address || place.name || `${lat}, ${lng}`;

              setCoordinates({ lat, lng });
              setSelectedLocationName(addressName);
              setSearchQuery(addressName);
              setLocationSource('searched_location');

              map.panTo({ lat, lng });
              map.setZoom(16);
              marker.setPosition({ lat, lng });

              if (errorMessage) setErrorMessage(undefined);
            });

            autocompleteInstanceRef.current = autocomplete;
          }

          setIsGoogleMapsReady(true);
        })
        .catch((err) => {
          console.warn('Google Maps initialization failed, using vector fallback:', err);
          setIsGoogleMapsReady(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Close fallback dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fallback suggestions for non-google mode
  const fallbackSuggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return MOCK_SUGGESTIONS.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.subtitle.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Direct address search / geocode handler on Enter or Search button
  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsDropdownOpen(false);
    setIsSearchingPlaces(true);

    if (isGoogleMapsConfigured()) {
      try {
        const result = await geocodeAddress(query);
        if (result) {
          setSelectedLocationName(result.address);
          setSearchQuery(result.address);
          setLocationSource('searched_location');
          setCoordinates({ lat: result.lat, lng: result.lng });

          if (googleMapInstanceRef.current && googleMarkerInstanceRef.current) {
            googleMapInstanceRef.current.panTo({ lat: result.lat, lng: result.lng });
            googleMapInstanceRef.current.setZoom(16);
            googleMarkerInstanceRef.current.setPosition({ lat: result.lat, lng: result.lng });
          }
          if (errorMessage) setErrorMessage(undefined);
          setIsSearchingPlaces(false);
          return;
        }
      } catch (err) {
        console.warn('Geocoding search query failed:', err);
      }
    }

    // Fallback match from mock suggestions
    const matched = MOCK_SUGGESTIONS.find(
      (m) => m.title.toLowerCase().includes(query.toLowerCase()) || m.subtitle.toLowerCase().includes(query.toLowerCase())
    );
    if (matched) {
      handleSelectSuggestion(matched);
    }
    setIsSearchingPlaces(false);
  };

  // Handle fallback suggestion selection
  const handleSelectSuggestion = (item: LocationSuggestion) => {
    const fullName = `${item.title}, ${item.subtitle}`;
    setSelectedLocationName(fullName);
    setSearchQuery(fullName);
    setLocationSource('searched_location');
    setCoordinates({ lat: item.lat, lng: item.lng });
    setMapOffset({ x: 0, y: 0 });
    setIsDropdownOpen(false);

    if (googleMapInstanceRef.current && googleMarkerInstanceRef.current) {
      googleMapInstanceRef.current.panTo({ lat: item.lat, lng: item.lng });
      googleMapInstanceRef.current.setZoom(15);
      googleMarkerInstanceRef.current.setPosition({ lat: item.lat, lng: item.lng });
    }
    if (errorMessage) setErrorMessage(undefined);
  };

  // Handle "Use Current Location" button
  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    if (errorMessage) setErrorMessage(undefined);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCoordinates({ lat, lng });

          if (googleMapInstanceRef.current && googleMarkerInstanceRef.current) {
            googleMapInstanceRef.current.panTo({ lat, lng });
            googleMapInstanceRef.current.setZoom(16);
            googleMarkerInstanceRef.current.setPosition({ lat, lng });
          }

          await updateFromCoordinates(lat, lng, 'current_location');
          setIsLocating(false);
        },
        () => {
          setTimeout(() => {
            const fallbackName = 'Current Location (Kapurthala, Punjab)';
            setSelectedLocationName(fallbackName);
            setSearchQuery(fallbackName);
            setLocationSource('current_location');
            setCoordinates({ lat: 31.3802, lng: 75.3816 });
            setMapOffset({ x: 0, y: 0 });
            setIsLocating(false);
          }, 600);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      setTimeout(() => {
        const fallbackName = 'Current Location (Kapurthala, Punjab)';
        setSelectedLocationName(fallbackName);
        setSearchQuery(fallbackName);
        setLocationSource('current_location');
        setCoordinates({ lat: 31.3802, lng: 75.3816 });
        setMapOffset({ x: 0, y: 0 });
        setIsLocating(false);
      }, 500);
    }
  };

  // Map pan/drag interactions for fallback vector map
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialOffsetX: mapOffset.x,
      initialOffsetY: mapOffset.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    setMapOffset({
      x: dragStartRef.current.initialOffsetX + deltaX,
      y: dragStartRef.current.initialOffsetY + deltaY,
    });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setLocationSource('map_pin');
      if (!selectedLocationName) {
        setSelectedLocationName('Pinned Location (Kapurthala Service Area)');
      }
      if (errorMessage) setErrorMessage(undefined);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        initialOffsetX: mapOffset.x,
        initialOffsetY: mapOffset.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - dragStartRef.current.x;
    const deltaY = e.touches[0].clientY - dragStartRef.current.y;
    setMapOffset({
      x: dragStartRef.current.initialOffsetX + deltaX,
      y: dragStartRef.current.initialOffsetY + deltaY,
    });
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      setLocationSource('map_pin');
      if (!selectedLocationName) {
        setSelectedLocationName('Pinned Location (Kapurthala Service Area)');
      }
      if (errorMessage) setErrorMessage(undefined);
    }
  };

  const handleZoomIn = () => {
    if (googleMapInstanceRef.current) {
      googleMapInstanceRef.current.setZoom((googleMapInstanceRef.current.getZoom() || 14) + 1);
    } else {
      setZoomLevel((prev) => Math.min(prev + 1, 18));
    }
  };

  const handleZoomOut = () => {
    if (googleMapInstanceRef.current) {
      googleMapInstanceRef.current.setZoom((googleMapInstanceRef.current.getZoom() || 14) - 1);
    } else {
      setZoomLevel((prev) => Math.max(prev - 1, 10));
    }
  };

  // Continue to next onboarding / dashboard
  const handleContinue = async () => {
    if (!selectedLocationName.trim() && !locationSource) {
      setErrorMessage(selectErrorText);
      return;
    }

    const locationData = {
      name: selectedLocationName || 'Kapurthala Service Area',
      source: locationSource || 'map_pin',
      coordinates,
    };

    sessionStorage.setItem('gigsevak_worker_location', JSON.stringify(locationData));
    onboardingService.updateState({ isLocationCompleted: true });

    // Retrieve full registration details
    const aadhaarNumber = sessionStorage.getItem('gigsevak_worker_aadhaar') || '5489 6789 0124';
    const selfieUrl = sessionStorage.getItem('gigsevak_worker_selfie') || '';
    let skills: string[] = [];
    try {
      const storedSkills = sessionStorage.getItem('gigsevak_worker_categories');
      if (storedSkills) skills = JSON.parse(storedSkills);
    } catch {
      skills = ['electrical-repair'];
    }

    const sessionUser = (() => {
      try {
        const raw = localStorage.getItem('gigsevak_worker_user') || localStorage.getItem('gharsaathi_worker_session');
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    })();

    setIsSubmitting(true);
    try {
      const savedPhone = localStorage.getItem('user_mobile_number') || sessionUser?.phoneNumber;
      if (!savedPhone) {
        throw new Error('No verified mobile number found. Please verify your phone number.');
      }
      const cleanDigits = savedPhone.replace(/\D/g, '').slice(-10);
      const formattedPhone = `+91${cleanDigits}`;

      if (!localStorage.getItem('gigsevak_token')) {
        await workerBackendService.loginWorker(formattedPhone);
      }

      await workerBackendService.submitOnboardingApplication({
        aadhaarNumber,
        aadhaarVerified: true,
        selfieUrl,
        skills,
        primaryServiceCategory: skills[0] || 'ELECTRICAL',
        location: {
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          name: selectedLocationName || 'Primary Service Area'
        },
        serviceArea: selectedLocationName || 'Primary Service Area',
        addressLine: selectedLocationName || 'Primary Service Area'
      });
    } catch (err) {
      console.warn('Backend onboarding sync notice:', err);
    } finally {
      setIsSubmitting(false);
      localStorage.setItem('worker_application_status', 'pending');
      navigate('/worker/pending-request');
    }
  };

  return (
    <main className="min-h-[100dvh] w-full bg-slate-50/60 sm:bg-slate-50/50 flex flex-col items-center p-4 sm:p-6 py-4 sm:py-6 antialiased">
      <div className="w-full max-w-[560px] mx-auto flex flex-col items-center">
        {/* Brand Logo & Progress Strip */}
        <header className="mb-2 sm:mb-3 flex flex-col items-center gap-1 w-full">
          <AuthLogo />
          <div className="w-full -mt-2 sm:-mt-3">
            <WorkerOnboardingProgress
              currentStep={3}
              step1Progress={100}
              step2Progress={100}
              step3Progress={50}
            />
          </div>
        </header>

        {/* Location Box Container */}
        <div className="w-full bg-white rounded-2xl border border-slate-200/80 sm:border-slate-100 shadow-card p-5 sm:p-8 space-y-5">
          {/* Header Section */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#17212B]">
                {headingText}
              </h1>
              <SpeakerButton
                text={fullText}
                langCode={activeLangCode}
                size="sm"
                label="Listen instructions"
              />
            </div>
            <p className="text-sm sm:text-[15px] text-[#66737D] leading-relaxed max-w-[380px] mx-auto">
              {subtitleText}
            </p>
          </div>

          {/* OPTION 1: SEARCH LOCATION INPUT & DROPDOWN */}
          <div ref={searchContainerRef} className="relative w-full space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#17212B]">
                {enterLocationText}
              </label>
              {isGoogleMapsConfigured() && (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                  <Globe className="w-2.5 h-2.5" />
                  Google Places Autocomplete
                </span>
              )}
            </div>

            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-5 h-5 text-[#66737D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!isGoogleMapsReady) {
                    setIsDropdownOpen(true);
                  }
                  if (errorMessage) setErrorMessage(undefined);
                }}
                onFocus={() => {
                  if (!isGoogleMapsReady && searchQuery.trim().length > 0) {
                    setIsDropdownOpen(true);
                  }
                }}
                placeholder={enterLocationText}
                className="w-full h-12 sm:h-13 pl-11 pr-24 rounded-xl border border-[#D9D9D9] bg-white text-sm sm:text-[15px] text-[#17212B] placeholder:text-[#66737D]/60 focus:outline-none focus:border-[#1C516C] focus:ring-2 focus:ring-[#1C516C]/20 transition-all"
              />

              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery.trim().length > 0 && !isSearchingPlaces && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedLocationName('');
                      if (searchInputRef.current) searchInputRef.current.value = '';
                    }}
                    title="Clear input"
                    className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors mr-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {isSearchingPlaces ? (
                  <Loader2 className="w-4 h-4 text-[#1C516C] animate-spin mr-1.5" />
                ) : (
                  searchQuery.trim().length > 0 && (
                    <button
                      type="submit"
                      title={findBtnText}
                      className="h-8 px-2.5 rounded-lg bg-[#1C516C] text-white text-xs font-medium flex items-center gap-1 hover:bg-[#133B50] active:scale-95 transition-all cursor-pointer shadow-xs"
                    >
                      <span>{findBtnText}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )
                )}
              </div>
            </form>

            {/* Fallback Suggestions Dropdown for non-Google Maps mode */}
            {!isGoogleMapsReady && isDropdownOpen && searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#D9D9D9] rounded-xl shadow-lg z-30 max-h-56 overflow-y-auto divide-y divide-slate-100">
                {fallbackSuggestions.length > 0 ? (
                  fallbackSuggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(item)}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-start gap-3 transition-colors group cursor-pointer"
                    >
                      <MapPin className="w-4 h-4 text-[#1C516C] flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#17212B] truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-[#66737D] truncate">
                          {item.subtitle}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-[#66737D]">
                    No locations matching "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* OR DIVIDER */}
          <div className="relative flex items-center justify-center py-1">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-xs font-bold text-[#66737D] uppercase tracking-wider absolute">
              {orText}
            </span>
          </div>

          {/* OPTION 2: USE CURRENT LOCATION BUTTON */}
          <div>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="w-full h-13 sm:h-14 rounded-xl font-semibold text-[15px] sm:text-base border border-[#1C516C] text-[#1C516C] bg-white hover:bg-[#F5F0DD]/50 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 shadow-sm disabled:opacity-60 cursor-pointer"
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-[#1C516C]" />
                  <span>{locatingText}</span>
                </>
              ) : (
                <>
                  <LocateFixed className="w-5 h-5 text-[#1C516C]" />
                  <span>{useCurrentLocationText}</span>
                </>
              )}
            </button>
          </div>

          {/* INTERACTIVE MAP COMPONENT */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm font-semibold text-[#17212B]">
                {pinpointTitleText}
              </p>
              {selectedLocationName && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1C516C] bg-[#F5F0DD] px-2 py-0.5 rounded-full border border-[#E9E2C6]">
                  <CheckCircle2 className="w-3 h-3 text-[#1C516C]" />
                  {selectedBadgeText}
                </span>
              )}
            </div>

            {/* Google Map Container / Fallback Canvas */}
            <div className="relative w-full h-[220px] sm:h-[260px] rounded-xl overflow-hidden border border-[#D9D9D9] bg-[#E5E9EC] shadow-inner">
              {/* Actual Google Map DOM Container */}
              <div
                ref={mapElementRef}
                className={`w-full h-full ${isGoogleMapsReady ? 'block' : 'hidden'}`}
              />

              {/* Vector SVG Fallback when Google Maps is not configured or loading */}
              {!isGoogleMapsReady && (
                <div
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className="relative w-full h-full select-none cursor-grab active:cursor-grabbing"
                >
                  <svg
                    className="w-full h-full absolute inset-0 pointer-events-none"
                    style={{
                      transform: `translate(${mapOffset.x}px, ${mapOffset.y}px) scale(${zoomLevel / 14})`,
                      transformOrigin: 'center center',
                      transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                    }}
                    viewBox="0 0 600 400"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect width="600" height="400" fill="#F4F3F0" />
                    <path d="M 50 40 Q 120 20 180 60 T 220 160 T 120 220 T 40 120 Z" fill="#E2EED9" />
                    <path d="M 400 240 Q 480 200 540 260 T 560 360 T 460 380 T 380 300 Z" fill="#E2EED9" />
                    <path d="M 0 320 C 150 300 250 370 420 330 C 500 310 550 340 600 320 L 600 400 L 0 400 Z" fill="#CDE3F5" />
                    <path d="M 0 80 L 600 80 M 0 200 L 600 200 M 0 290 L 600 290 M 120 0 L 120 400 M 340 0 L 340 400 M 480 0 L 480 400" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
                    <path d="M 0 80 L 600 80 M 0 200 L 600 200 M 0 290 L 600 290 M 120 0 L 120 400 M 340 0 L 340 400 M 480 0 L 480 400" stroke="#E6E3DB" strokeWidth="4" strokeLinecap="round" />
                    <path d="M 0 140 C 200 130 350 170 600 120" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round" fill="none" />
                    <path d="M 0 140 C 200 130 350 170 600 120" stroke="#FBD79F" strokeWidth="8" strokeLinecap="round" fill="none" />
                    <path d="M 260 0 C 270 150 250 250 280 400" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" fill="none" />
                    <path d="M 260 0 C 270 150 250 250 280 400" stroke="#FBD79F" strokeWidth="6" strokeLinecap="round" fill="none" />
                    <text x="210" y="115" fill="#888075" fontSize="11" fontWeight="600" fontFamily="sans-serif">Kapurthala City</text>
                    <text x="360" y="70" fill="#999187" fontSize="10" fontFamily="sans-serif">Shalimar Garden</text>
                    <text x="140" y="270" fill="#999187" fontSize="10" fontFamily="sans-serif">Sultanpur Rd</text>
                    <text x="410" y="230" fill="#999187" fontSize="10" fontFamily="sans-serif">Jalandhar Bypass</text>
                  </svg>

                  {/* Fallback Pin */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="relative flex flex-col items-center -translate-y-4">
                      <div className="w-10 h-10 rounded-full bg-[#1C516C] flex items-center justify-center text-white shadow-lg border-2 border-white animate-bounce-subtle">
                        <MapPin className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div className="w-3.5 h-1.5 bg-black/30 rounded-full blur-[1px] mt-0.5" />
                    </div>
                  </div>

                  {/* Pan Drag Indicator Hint */}
                  <div className="absolute left-3 bottom-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md text-[10px] font-medium text-[#66737D] border border-slate-200/80 pointer-events-none">
                    {dragHintText}
                  </div>
                </div>
              )}

              {/* Zoom Controls */}
              <div className="absolute right-3 bottom-3 flex flex-col bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden z-20">
                <button
                  type="button"
                  onClick={handleZoomIn}
                  aria-label="Zoom in"
                  className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 border-b border-slate-100 text-[#17212B] active:bg-slate-100 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  aria-label="Zoom out"
                  className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 text-[#17212B] active:bg-slate-100 cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Selected Location Summary Banner */}
            {selectedLocationName && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5 text-xs text-[#17212B]">
                <MapPin className="w-4 h-4 text-[#1C516C] flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{selectedLocationName}</p>
                  <p className="text-[11px] text-[#66737D]">
                    Coordinates: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-[#953638] font-medium pt-1 animate-fadeIn">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* CONTINUE BUTTON */}
          <div className="pt-2 border-t border-slate-100">
            <AuthButton
              type="button"
              variant="outline"
              isLoading={isSubmitting}
              onClick={handleContinue}
            >
              {continueText}
            </AuthButton>
          </div>
        </div>
      </div>
    </main>
  );
};
