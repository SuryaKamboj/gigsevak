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
  workerLocation?: { latitude: number; longitude: number; name?: string };
}

export const GoogleJobMap: React.FC<GoogleJobMapProps> = ({
  latitude,
  longitude,
  address,
  clientName,
  serviceName,
  className = 'h-52 sm:h-60 w-full',
  workerLocation = { latitude: 28.5300, longitude: 77.2090, name: 'You (Worker)' },
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState<boolean>(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  const workerLat = workerLocation?.latitude || 28.5300;
  const workerLng = workerLocation?.longitude || 77.2090;

  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${workerLat},${workerLng}&destination=${latitude},${longitude}`;

  useEffect(() => {
    let isMounted = true;

    if (!isGoogleMapsConfigured() || (window as any).__googleMapsAuthFailed) {
      setMapError(true);
      return;
    }

    (window as any).__onGoogleMapsAuthFailed = () => {
      if (isMounted) setMapError(true);
    };

    if (isGoogleMapsConfigured()) {
      loadGoogleMaps()
        .then((google) => {
          if (!isMounted || !mapContainerRef.current) return;
          if ((window as any).__googleMapsAuthFailed) {
            setMapError(true);
            return;
          }

          const customerLatLng = new google.maps.LatLng(latitude, longitude);
          const workerLatLng = new google.maps.LatLng(workerLat, workerLng);

          const mapOptions: any = {
            center: customerLatLng,
            zoom: 14,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            gestureHandling: 'cooperative',
          };

          if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
            mapOptions.mapId = 'DEMO_MAP_ID';
          } else {
            mapOptions.styles = [
              {
                featureType: 'poi.business',
                stylers: [{ visibility: 'on' }],
              },
              {
                featureType: 'transit',
                elementType: 'labels.icon',
                stylers: [{ visibility: 'on' }],
              },
            ];
          }

          const map = new google.maps.Map(mapContainerRef.current, mapOptions);

          // 1 & 2. Customer & Worker Markers (Modern AdvancedMarkerElement when available)
          let customerMarker: any = null;

          if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
            const customerPin = document.createElement('div');
            customerPin.className = 'w-6 h-6 rounded-full bg-[#702963] border-2 border-white shadow-md flex items-center justify-center text-[11px] text-white font-bold cursor-pointer';
            customerPin.innerText = 'C';

            customerMarker = new google.maps.marker.AdvancedMarkerElement({
              position: customerLatLng,
              map,
              title: `${clientName || 'Customer'}: ${address}`,
              content: customerPin,
            });

            const workerPin = document.createElement('div');
            workerPin.className = 'w-6 h-6 rounded-full bg-[#0ea5e9] border-2 border-white shadow-md flex items-center justify-center text-[11px] text-white font-bold cursor-pointer';
            workerPin.innerText = 'W';

            new google.maps.marker.AdvancedMarkerElement({
              position: workerLatLng,
              map,
              title: workerLocation?.name || 'Your Location',
              content: workerPin,
            });
          } else {
            // Fallback to legacy Marker
            customerMarker = new google.maps.Marker({
              position: customerLatLng,
              map,
              title: `${clientName || 'Customer'}: ${address}`,
              animation: google.maps.Animation.DROP,
              icon: {
                path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                scale: 6,
                fillColor: '#702963',
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: '#FFFFFF',
              },
            });

            new google.maps.Marker({
              position: workerLatLng,
              map,
              title: workerLocation?.name || 'Your Location',
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#0ea5e9',
                fillOpacity: 1,
                strokeWeight: 2.5,
                strokeColor: '#FFFFFF',
              },
            });
          }

          // 3. Directions & Route Path (Safe execution)
          try {
            const directionsService = new google.maps.DirectionsService();
            const directionsRenderer = new google.maps.DirectionsRenderer({
              map,
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#702963',
                strokeWeight: 4.5,
                strokeOpacity: 0.85,
              },
            });

            directionsService.route(
              {
                origin: workerLatLng,
                destination: customerLatLng,
                travelMode: google.maps.TravelMode.DRIVING,
              },
              (result: any, status: any) => {
                if (status === google.maps.DirectionsStatus.OK && result) {
                  directionsRenderer.setDirections(result);
                  const leg = result.routes[0]?.legs[0];
                  if (leg && isMounted) {
                    setRouteInfo({
                      distance: leg.distance?.text || '1.8 km',
                      duration: leg.duration?.text || '12 mins',
                    });
                  }
                } else {
                  const bounds = new google.maps.LatLngBounds();
                  bounds.extend(customerLatLng);
                  bounds.extend(workerLatLng);
                  map.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
                }
              }
            );
          } catch (routeErr) {
            console.warn('[GoogleJobMap] Directions error fallback notice:', routeErr);
          }

          // Customer InfoWindow
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
            if (customerMarker) {
              infoWindow.open({
                anchor: customerMarker,
                map,
              });
              customerMarker.addListener('click', () => {
                infoWindow.open({
                  anchor: customerMarker,
                  map,
                });
              });
            }
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
  }, [latitude, longitude, address, clientName, serviceName, workerLat, workerLng]);

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100 shadow-2xs ${className}`}>
      {/* Google Maps Canvas - Kept always mounted in DOM to prevent getRootNode() errors during async tear down */}
      <div
        ref={mapContainerRef}
        className="w-full h-full"
        style={{ display: isGoogleMapsConfigured() && !mapError ? 'block' : 'none' }}
      />

      {(!isGoogleMapsConfigured() || mapError) && (
        GOOGLE_MAPS_API_KEY ? (
          // Google Maps Embed Iframe with API Key
          <iframe
            title={`Google Maps for ${address}`}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps/embed/v1/directions?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&origin=${workerLat},${workerLng}&destination=${encodeURIComponent(address || `${latitude},${longitude}`)}`}
          />
        ) : (
          // Interactive Fallback Map with both coordinates
          <div className="relative w-full h-full">
            <iframe
              title={`Map for ${address}`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${Math.min(workerLng, longitude) - 0.02}%2C${Math.min(workerLat, latitude) - 0.02}%2C${Math.max(workerLng, longitude) + 0.02}%2C${Math.max(workerLat, latitude) + 0.02}&layer=mapnik&marker=${latitude}%2C${longitude}`}
            />
          </div>
        )
      )}

      {/* Floating Google Maps Address & Navigate Bar */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none z-10">
        <div className="bg-white/95 backdrop-blur-xs rounded-xl px-2.5 py-1.5 shadow-sm border border-neutral-200/80 flex items-center gap-1.5 max-w-[70%] sm:max-w-xs">
          <MapPin className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" />
          <span className="text-[11px] font-bold text-neutral-800 truncate">
            {address} {routeInfo ? `(${routeInfo.distance})` : ''}
          </span>
        </div>

        <a
          href={googleMapsDirectionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto bg-brand-primary hover:bg-brand-hover text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 transition cursor-pointer active:scale-95"
          title="Open Directions in Google Maps"
        >
          <Navigation className="w-3 h-3" />
          <span>Navigate</span>
        </a>
      </div>

      {/* Google Maps Brand & Route Badge */}
      <div className="absolute bottom-2 left-2 z-10 pointer-events-none bg-white/90 backdrop-blur-2xs px-2 py-1 rounded-md border border-neutral-200 shadow-2xs flex items-center gap-1.5">
        <Compass className="w-3.5 h-3.5 text-red-500" />
        <span className="text-[9px] font-bold text-neutral-700">
          {routeInfo ? `${routeInfo.duration} travel • Google Maps` : 'Google Maps Live Tracking'}
        </span>
      </div>
    </div>
  );
};
