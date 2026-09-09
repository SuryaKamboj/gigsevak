import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Compass } from 'lucide-react';
import { loadGoogleMaps, isGoogleMapsConfigured, GOOGLE_MAPS_API_KEY } from '../../services/googleMapsService';

interface GoogleJobMapProps {
  latitude: number;
  longitude: number;
  address: string;
  clientName?: string;
  serviceName?: string;
  className?: string;
}

export const GoogleJobMap: React.FC<GoogleJobMapProps> = ({
  latitude,
  longitude,
  address,
  clientName,
  serviceName,
  className = 'h-52 sm:h-60 w-full',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState<boolean>(false);

  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  useEffect(() => {
    let isMounted = true;

    if (isGoogleMapsConfigured()) {
      loadGoogleMaps()
        .then((google) => {
          if (!isMounted || !mapContainerRef.current) return;

          const latLng = { lat: latitude, lng: longitude };

          const map = new google.maps.Map(mapContainerRef.current, {
            center: latLng,
            zoom: 15,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            gestureHandling: 'cooperative',
            styles: [
              {
                featureType: 'poi.business',
                stylers: [{ visibility: 'on' }],
              },
              {
                featureType: 'transit',
                elementType: 'labels.icon',
                stylers: [{ visibility: 'on' }],
              },
            ],
          });

          // Custom Google Marker
          const marker = new google.maps.Marker({
            position: latLng,
            map,
            title: address,
            animation: google.maps.Animation.DROP,
          });

          // Google InfoWindow
          if (clientName || serviceName) {
            const contentString = `
              <div style="padding: 6px 8px; font-family: system-ui, sans-serif; max-width: 200px;">
                <div style="font-weight: 700; font-size: 13px; color: #111;">${clientName || 'Customer'}</div>
                <div style="font-size: 11px; color: #702963; font-weight: 600; margin-top: 2px;">${serviceName || 'Service Location'}</div>
                <div style="font-size: 10px; color: #666; margin-top: 4px; line-height: 1.3;">${address}</div>
              </div>
            `;
            const infoWindow = new google.maps.InfoWindow({
              content: contentString,
            });
            infoWindow.open(map, marker);
            marker.addListener('click', () => {
              infoWindow.open(map, marker);
            });
          }
        })
        .catch((err) => {
          console.warn('Google Maps API load error:', err);
          if (isMounted) setMapError(true);
        });
    } else {
      setMapError(true);
    }

    return () => {
      isMounted = false;
    };
  }, [latitude, longitude, address, clientName, serviceName]);

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100 shadow-2xs ${className}`}>
      {/* Google Maps Canvas */}
      {isGoogleMapsConfigured() && !mapError ? (
        <div ref={mapContainerRef} className="w-full h-full" />
      ) : GOOGLE_MAPS_API_KEY ? (
        // Google Maps Embed Iframe with API Key
        <iframe
          title={`Google Maps for ${address}`}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&q=${encodeURIComponent(address || `${latitude},${longitude}`)}&zoom=15`}
        />
      ) : (
        // Interactive Google Maps / OpenStreetMap fallback with Google Maps styling and Directions
        <iframe
          title={`Map for ${address}`}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.012}%2C${latitude - 0.012}%2C${longitude + 0.012}%2C${latitude + 0.012}&layer=mapnik&marker=${latitude}%2C${longitude}`}
        />
      )}

      {/* Floating Google Maps Address & Navigate Bar */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-xs rounded-xl px-2.5 py-1.5 shadow-sm border border-neutral-200/80 flex items-center gap-1.5 max-w-[70%] sm:max-w-xs">
          <MapPin className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" />
          <span className="text-[11px] font-bold text-neutral-800 truncate">{address}</span>
        </div>

        <a
          href={googleMapsDirectionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto bg-brand-primary hover:bg-brand-hover text-white text-[11px] font-bold px-2.5 py-1.5 rounded-xl shadow-sm flex items-center gap-1 transition cursor-pointer active:scale-95"
          title="Open Directions in Google Maps"
        >
          <Navigation className="w-3 h-3" />
          <span className="hidden xs:inline">Navigate</span>
        </a>
      </div>

      {/* Google Maps Brand Badge */}
      <div className="absolute bottom-2 left-2 pointer-events-none bg-white/90 backdrop-blur-2xs px-2 py-0.5 rounded-md border border-neutral-200 shadow-2xs flex items-center gap-1">
        <Compass className="w-3 h-3 text-red-500" />
        <span className="text-[9px] font-bold text-neutral-700">Google Maps</span>
      </div>
    </div>
  );
};
