export const GOOGLE_MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) || '';

export function isGoogleMapsConfigured(): boolean {
  return Boolean(GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY.trim().length > 0);
}

declare global {
  interface Window {
    google?: any;
    __googleMapsLoadedPromise?: Promise<any>;
  }
}

/**
 * Dynamically loads the Google Maps JavaScript API script.
 */
export function loadGoogleMaps(): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is undefined'));
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google);
  }

  if (window.__googleMapsLoadedPromise) {
    return window.__googleMapsLoadedPromise;
  }

  if (!isGoogleMapsConfigured()) {
    return Promise.reject(
      new Error('Google Maps API key is not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file.')
    );
  }

  window.__googleMapsLoadedPromise = new Promise<any>((resolve, reject) => {
    const callbackName = `__gmap_init_${Date.now()}`;
    (window as any)[callbackName] = () => {
      delete (window as any)[callbackName];
      resolve(window.google);
    };

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      GOOGLE_MAPS_API_KEY
    )}&libraries=places,geometry&callback=${callbackName}&loading=async`;
    script.async = true;
    script.defer = true;

    script.onerror = (err) => {
      delete (window as any)[callbackName];
      reject(new Error(`Failed to load Google Maps script: ${err}`));
    };

    document.head.appendChild(script);
  });

  return window.__googleMapsLoadedPromise;
}

export interface PlacePrediction {
  id: string;
  title: string;
  subtitle: string;
  placeId: string;
}

/**
 * Fetches place suggestions using Google Places AutocompleteService
 */
export async function getGooglePlacePredictions(
  query: string,
  country?: string
): Promise<PlacePrediction[]> {
  if (!query.trim()) return [];

  try {
    const google = await loadGoogleMaps();
    const service = new google.maps.places.AutocompleteService();

    return new Promise((resolve) => {
      service.getPlacePredictions(
        {
          input: query,
          componentRestrictions: country ? { country } : undefined,
        },
        (predictions: any[], status: any) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            predictions &&
            Array.isArray(predictions)
          ) {
            const formatted: PlacePrediction[] = predictions.map((p) => ({
              id: p.place_id,
              placeId: p.place_id,
              title: p.structured_formatting?.main_text || p.description,
              subtitle: p.structured_formatting?.secondary_text || '',
            }));
            resolve(formatted);
          } else {
            resolve([]);
          }
        }
      );
    });
  } catch (error) {
    console.warn('Autocomplete error:', error);
    return [];
  }
}

/**
 * Geocodes a free-form address string into coordinates and formatted address
 */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number; address: string } | null> {
  if (!address.trim()) return null;

  try {
    const google = await loadGoogleMaps();
    const geocoder = new google.maps.Geocoder();

    return new Promise((resolve) => {
      geocoder.geocode({ address }, (results: any[], status: any) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: typeof location.lat === 'function' ? location.lat() : location.lat,
            lng: typeof location.lng === 'function' ? location.lng() : location.lng,
            address: results[0].formatted_address,
          });
        } else {
          resolve(null);
        }
      });
    });
  } catch (error) {
    console.warn('Geocode address error:', error);
    return null;
  }
}

/**
 * Fetches place geometry / coordinates from Place ID using Geocoder
 */
export async function getPlaceCoordinates(
  placeId: string
): Promise<{ lat: number; lng: number; address: string } | null> {
  try {
    const google = await loadGoogleMaps();
    const geocoder = new google.maps.Geocoder();

    return new Promise((resolve) => {
      geocoder.geocode({ placeId }, (results: any[], status: any) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: typeof location.lat === 'function' ? location.lat() : location.lat,
            lng: typeof location.lng === 'function' ? location.lng() : location.lng,
            address: results[0].formatted_address,
          });
        } else {
          resolve(null);
        }
      });
    });
  } catch (error) {
    console.warn('Place coordinate error:', error);
    return null;
  }
}

/**
 * Performs reverse geocoding on coordinates (lat, lng) to get formatted address
 */
export async function reverseGeocodeLatLng(
  lat: number,
  lng: number
): Promise<{ address: string; city?: string; state?: string } | null> {
  try {
    const google = await loadGoogleMaps();
    const geocoder = new google.maps.Geocoder();

    return new Promise((resolve) => {
      geocoder.geocode({ location: { lat, lng } }, (results: any[], status: any) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const address = results[0].formatted_address;
          let city: string | undefined;
          let state: string | undefined;

          results[0].address_components?.forEach((comp: any) => {
            if (comp.types?.includes('locality')) city = comp.long_name;
            if (comp.types?.includes('administrative_area_level_1')) state = comp.long_name;
          });

          resolve({ address, city, state });
        } else {
          resolve(null);
        }
      });
    });
  } catch (error) {
    console.warn('Reverse geocode error:', error);
    return null;
  }
}
