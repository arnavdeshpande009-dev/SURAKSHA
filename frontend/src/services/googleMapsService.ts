import { importLibrary, setOptions } from '@googlemaps/js-api-loader';

export interface GoogleTrafficRouteResult {
  status: 'SUCCESS' | 'FAILED';
  trafficAwareDurationMin?: number;
  staticDurationMin?: number;
  trafficDelayMin?: number;
  distanceKm?: number;
  polylinePath?: Array<{ lat: number; lng: number }>;
  alternativePaths?: Array<Array<{ lat: number; lng: number }>>;
  directions?: GoogleRouteStep[];
  errorMessage?: string;
}

export interface GoogleRouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  position?: { lat: number; lng: number };
  maneuver?: string;
}

class GoogleMapsService {
  private isLoaded = false;
  private apiKey: string = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  constructor() {
    if (this.apiKey) {
      setOptions({ key: this.apiKey, v: 'weekly' });
    }
  }

  public getApiKey(): string {
    return this.apiKey;
  }

  public hasApiKey(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim() !== '' && this.apiKey !== 'YOUR_KEY_HERE');
  }

  public async loadGoogleMaps(): Promise<typeof google.maps | null> {
    if (!this.hasApiKey()) {
      return null;
    }

    if (this.isLoaded && window.google?.maps) {
      return window.google.maps;
    }

    try {
      await Promise.all([
        importLibrary('maps'),
        importLibrary('places'),
        importLibrary('routes'),
        importLibrary('geometry')
      ]);
      this.isLoaded = true;
      return window.google.maps;
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
    destCoord: [number, number],   // [lng, lat]
    intermediateCoords: Array<[number, number]> = []
  ): Promise<GoogleTrafficRouteResult> {
    const maps = await this.loadGoogleMaps();
    if (!maps) {
      return { status: 'FAILED', errorMessage: 'Google Maps API unavailable or key missing' };
    }

    try {
      const { Route } = await importLibrary('routes');
      const response = await Route.computeRoutes({
        origin: { lat: originCoord[1], lng: originCoord[0] },
        destination: { lat: destCoord[1], lng: destCoord[0] },
        intermediates: intermediateCoords.map(([lng, lat]) => ({ location: { lat, lng } })),
        computeAlternativeRoutes: intermediateCoords.length === 0,
        travelMode: 'DRIVING',
        routingPreference: 'TRAFFIC_AWARE',
        polylineQuality: 'HIGH_QUALITY',
        departureTime: new Date(Date.now() + 60_000),
        fields: [
          'path', 'durationMillis', 'staticDurationMillis', 'distanceMeters',
          'legs.steps.navigationInstruction', 'legs.steps.distanceMeters', 'legs.steps.durationMillis',
          'legs.steps.startLocation'
        ]
      });
      const route = response.routes?.[0];
      if (!route?.path || route.path.length < 2) {
        return this.computeDirectionsFallback(originCoord, destCoord, intermediateCoords);
      }

      const trafficAwareDurationMin = Math.round((route.durationMillis ?? 0) / 60000);
      const staticDurationMin = Math.round((route.staticDurationMillis ?? route.durationMillis ?? 0) / 60000);
      const routeWithSteps = route as unknown as {
        legs?: Array<{ steps?: Array<{ navigationInstruction?: { instructions?: string; maneuver?: string }; startLocation?: { lat: number; lng: number }; distanceMeters?: number; durationMillis?: number }> }>;
      };
      const directions = routeWithSteps.legs?.flatMap((leg) => leg.steps ?? [])
        .map((step) => ({
          instruction: step.navigationInstruction?.instructions ?? 'Continue on the selected route',
          distanceMeters: step.distanceMeters ?? 0,
          durationSeconds: Math.round((step.durationMillis ?? 0) / 1000),
          position: step.startLocation
            ? { lat: step.startLocation.lat, lng: step.startLocation.lng }
            : undefined,
          maneuver: step.navigationInstruction?.maneuver
        }))
        .filter((step) => step.instruction.length > 0) ?? [];
      return {
        status: 'SUCCESS',
        trafficAwareDurationMin,
        staticDurationMin,
        trafficDelayMin: Math.max(0, trafficAwareDurationMin - staticDurationMin),
        distanceKm: Math.round(((route.distanceMeters ?? 0) / 1000) * 10) / 10,
        polylinePath: route.path.map((point) => ({ lat: point.lat, lng: point.lng })),
        alternativePaths: (response.routes ?? []).slice(1).map((alternative) => (
          (alternative.path ?? []).map((point) => ({ lat: point.lat, lng: point.lng }))
        )).filter((path) => path.length > 1),
        directions
      };
    } catch (error) {
      return this.computeDirectionsFallback(originCoord, destCoord, intermediateCoords, error instanceof Error ? error.message : undefined);
    }
  }

  private async computeDirectionsFallback(
    originCoord: [number, number],
    destCoord: [number, number],
    intermediateCoords: Array<[number, number]>,
    routeError?: string
  ): Promise<GoogleTrafficRouteResult> {
    const maps = await this.loadGoogleMaps();
    if (!maps?.DirectionsService) {
      return { status: 'FAILED', errorMessage: routeError ?? 'Google Directions API unavailable' };
    }

    return new Promise((resolve) => {
      const service = new maps.DirectionsService();
      service.route({
        origin: { lat: originCoord[1], lng: originCoord[0] },
        destination: { lat: destCoord[1], lng: destCoord[0] },
        waypoints: intermediateCoords.map(([lng, lat]) => ({ location: { lat, lng }, stopover: true })),
        optimizeWaypoints: false,
        provideRouteAlternatives: intermediateCoords.length === 0,
        travelMode: maps.TravelMode.DRIVING,
        drivingOptions: { departureTime: new Date(Date.now() + 60_000), trafficModel: maps.TrafficModel.BEST_GUESS }
      }, (response, status) => {
        if (status !== 'OK' || !response?.routes?.[0]) {
          resolve({ status: 'FAILED', errorMessage: routeError ?? `Google Directions API returned ${status}` });
          return;
        }

        const toPath = (directionsRoute: google.maps.DirectionsRoute) => directionsRoute.overview_path.map((point) => ({ lat: point.lat(), lng: point.lng() }));
        const selectedRoute = response.routes[0];
        const directions = selectedRoute.legs.flatMap((leg) => leg.steps).map((step) => ({
          instruction: step.instructions.replace(/<[^>]*>/g, ''),
          distanceMeters: step.distance?.value ?? 0,
          durationSeconds: step.duration?.value ?? 0,
          position: step.start_location ? { lat: step.start_location.lat(), lng: step.start_location.lng() } : undefined
        }));
        const distanceMeters = selectedRoute.legs.reduce((total, leg) => total + (leg.distance?.value ?? 0), 0);
        const durationSeconds = selectedRoute.legs.reduce((total, leg) => total + (leg.duration_in_traffic?.value ?? leg.duration?.value ?? 0), 0);
        resolve({
          status: 'SUCCESS',
          distanceKm: Math.round((distanceMeters / 1000) * 10) / 10,
          trafficAwareDurationMin: Math.round(durationSeconds / 60),
          staticDurationMin: Math.round(selectedRoute.legs.reduce((total, leg) => total + (leg.duration?.value ?? 0), 0) / 60),
          polylinePath: toPath(selectedRoute),
          directions,
          alternativePaths: response.routes.slice(1).map(toPath).filter((path) => path.length > 1)
        });
      });
    });
  }

  public async computeAlternativeRoutes(
    originCoord: [number, number],
    destCoord: [number, number]
  ): Promise<GoogleTrafficRouteResult> {
    return this.computeTrafficAwareRoute(originCoord, destCoord, []);
  }
}

export const googleMapsService = new GoogleMapsService();
