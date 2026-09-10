/**
 * THUNAI Real-Time Geolocation & Telemetry Service
 * 
 * Acquires high-accuracy GPS coordinates, generates verified Google Maps URLs,
 * and maintains resilient fallback caching.
 */

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  timestamp: string;
  isLastKnownLocation: boolean;
  mapsUrl: string;
}

const STORAGE_KEY_LAST_LOCATION = 'THUNAI_LAST_KNOWN_LOCATION';

// Default assistive hub landmark fallback: IIT Madras Research Park / Accessibility Center
const DEFAULT_FALLBACK_LOCATION: LocationCoordinates = {
  latitude: 12.9915,
  longitude: 80.2418,
  accuracyMeters: 15,
  timestamp: new Date().toISOString(),
  isLastKnownLocation: true,
  mapsUrl: 'https://www.google.com/maps?q=12.9915,80.2418',
};

export class LocationService {
  private lastKnownLocation: LocationCoordinates | null = null;

  constructor() {
    this.loadCachedLocation();
  }

  private loadCachedLocation(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(STORAGE_KEY_LAST_LOCATION);
        if (raw) {
          this.lastKnownLocation = JSON.parse(raw);
        }
      }
    } catch (e) {
      console.warn('[LocationService] Could not read cached location:', e);
    }
  }

  private saveCachedLocation(loc: LocationCoordinates): void {
    try {
      this.lastKnownLocation = loc;
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY_LAST_LOCATION, JSON.stringify(loc));
      }
    } catch (e) {
      console.warn('[LocationService] Could not cache location:', e);
    }
  }

  /**
   * Acquire live GPS position or fallback cleanly
   */
  public async getCurrentLocation(timeoutMs = 6000): Promise<LocationCoordinates> {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      console.warn('[LocationService] Geolocation API not supported on this device/environment.');
      return this.getLastKnownOrFallback();
    }

    return new Promise((resolve) => {
      let resolved = false;

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.warn('[LocationService] Geolocation timed out, using fallback cache.');
          resolve(this.getLastKnownOrFallback());
        }
      }, timeoutMs);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (resolved) return;
          resolved = true;
          clearTimeout(timer);

          const lat = Number(pos.coords.latitude.toFixed(6));
          const lng = Number(pos.coords.longitude.toFixed(6));
          const accuracy = Math.round(pos.coords.accuracy);
          const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

          const result: LocationCoordinates = {
            latitude: lat,
            longitude: lng,
            accuracyMeters: accuracy,
            timestamp: new Date(pos.timestamp || Date.now()).toISOString(),
            isLastKnownLocation: false,
            mapsUrl,
          };

          this.saveCachedLocation(result);
          resolve(result);
        },
        (err) => {
          if (resolved) return;
          resolved = true;
          clearTimeout(timer);
          console.warn(`[LocationService] Geolocation error (${err.code}): ${err.message}`);
          resolve(this.getLastKnownOrFallback());
        },
        {
          enableHighAccuracy: true,
          timeout: timeoutMs,
          maximumAge: 30000,
        }
      );
    });
  }

  public getLastKnownOrFallback(): LocationCoordinates {
    if (this.lastKnownLocation) {
      return {
        ...this.lastKnownLocation,
        isLastKnownLocation: true,
      };
    }
    return {
      ...DEFAULT_FALLBACK_LOCATION,
      timestamp: new Date().toISOString(),
    };
  }

  public generateMapsUrl(latitude: number, longitude: number): string {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  }
}

export const locationService = new LocationService();
