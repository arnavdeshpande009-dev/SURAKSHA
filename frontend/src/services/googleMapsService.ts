import { Loader } from '@googlemaps/js-api-loader';

export interface GoogleTrafficRouteResult {
  status: 'SUCCESS' | 'FAILED';
  trafficAwareDurationMin?: number;
  staticDurationMin?: number;
  trafficDelayMin?: number;
  distanceKm?: number;
  polylinePath?: Array<{ lat: number; lng: number }>;
  errorMessage?: string;
}

class GoogleMapsService {
  private loader: Loader | null = null;
  private isLoaded = false;
  private apiKey: string = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  constructor() {
    if (this.apiKey) {
      this.loader = new Loader({
        apiKey: this.apiKey,
        version: 'weekly',
        libraries: ['places', 'routes', 'geometry']
      });
    }
  }

  public getApiKey(): string {
    return this.apiKey;
  }

  public hasApiKey(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim() !== '' && this.apiKey !== 'YOUR_KEY_HERE');
  }

  public async loadGoogleMaps(): Promise<typeof google.maps | null> {
    if (!this.hasApiKey() || !this.loader) {
      return null;
    }

    if (this.isLoaded && window.google?.maps) {
      return window.google.maps;
    }

    try {
      const googleMaps = await this.loader.load();
      this.isLoaded = true;
      return googleMaps;
    } catch (error) {
      console.warn('Google Maps JS API failed to load, falling back to DEMO mode:', error);
      return null;
    }
  }

  /**
   * Request traffic-aware route information from Google Maps Directions API
   */
  public async computeTrafficAwareRoute(
    originCoord: [number, number], // [lng, lat]
    destCoord: [number, number]   // [lng, lat]
  ): Promise<GoogleTrafficRouteResult> {
    const maps = await this.loadGoogleMaps();
    if (!maps) {
      return { status: 'FAILED', errorMessage: 'Google Maps API unavailable or key missing' };
    }

    return new Promise((resolve) => {
      const directionsService = new maps.DirectionsService();

      directionsService.route(
        {
          origin: { lat: originCoord[1], lng: originCoord[0] },
          destination: { lat: destCoord[1], lng: destCoord[0] },
          travelMode: maps.TravelMode.DRIVING,
          drivingOptions: {
            departureTime: new Date(), // Required for traffic-aware routing
            trafficModel: maps.TrafficModel.BEST_GUESS
          }
        },
        (result, status) => {
          if (status === maps.DirectionsStatus.OK && result && result.routes.length > 0) {
            const leg = result.routes[0].legs[0];
            const staticDurationSec = leg.duration?.value || 0;
            const trafficDurationSec = leg.duration_in_traffic?.value || staticDurationSec;

            const staticDurationMin = Math.round(staticDurationSec / 60);
            const trafficAwareDurationMin = Math.round(trafficDurationSec / 60);
            const trafficDelayMin = Math.max(0, trafficAwareDurationMin - staticDurationMin);
            const distanceKm = Math.round(((leg.distance?.value || 0) / 1000) * 10) / 10;

            const path = result.routes[0].overview_path.map((latLng) => ({
              lat: latLng.lat(),
              lng: latLng.lng()
            }));

            resolve({
              status: 'SUCCESS',
              trafficAwareDurationMin,
              staticDurationMin,
              trafficDelayMin,
              distanceKm,
              polylinePath: path
            });
          } else {
            resolve({
              status: 'FAILED',
              errorMessage: `Google Directions status: ${status}`
            });
          }
        }
      );
    });
  }
}

export const googleMapsService = new GoogleMapsService();
