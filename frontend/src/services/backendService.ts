import type { ExtendedRoadSegment, PredictedETA } from '../types/road';
import type { SimulatedTruck } from '../data/fleet';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api';

interface RoadRiskResponse {
  road_id: string;
  disruption_probability: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface RoadRiskRequest {
  road_id: string;
  rainfall_24h: number;
  rainfall_7d: number;
  elevation: number;
  slope: number;
  road_length_km: number;
  traffic_level: number;
  historical_flood_count: number;
  historical_landslide_count: number;
  road_condition: number;
}

interface ETARequest {
  baseline_travel_time_min: number;
  route_distance_km: number;
  average_risk: number;
  maximum_risk: number;
  traffic_level: number;
  road_condition: number;
  risky_segment_count: number;
  blocked_segment_count: number;
  rainfall_24h: number;
  rainfall_7d: number;
}

export interface WeatherSnapshot {
  location?: { latitude: number; longitude: number };
  latitude?: number;
  longitude?: number;
  temperature_c?: number;
  rainfall_mm?: number;
  precipitation_probability?: number;
  weather_code?: number;
  wind_speed_kmh?: number;
  wind_kph?: number;
  source?: string;
  observed_at?: string;
  timestamp?: string;
  status?: string;
}

export interface DashboardSummary {
  districts_monitored: number;
  active_trucks: number;
  incidents_reported: number;
  deliveries_tracked: number;
  telemetry_points: number;
  emergency_mode: boolean;
}

export interface OperationalUser {
  id: string;
  username: string;
  role: string;
  display_name: string;
  active: number;
}

const getRoleToken = async (role = 'DRIVER'): Promise<string> => {
  const storageKey = `suraksha_${role.toLowerCase()}_token`;
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;
  const response = await request<{ access_token: string }>(`/auth/demo-token?role=${role}`);
  window.localStorage.setItem(storageKey, response.access_token);
  return response.access_token;
};

const authorizedRequest = async <T>(path: string, options?: RequestInit, role = 'DRIVER'): Promise<T> => {
  const token = await getRoleToken(role);
  return request<T>(path, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...options?.headers }
  });
};

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const isFormData = options?.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { ...(isFormData ? {} : { 'Content-Type': 'application/json' }), ...options?.headers }
  });

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
};

const toRiskRequest = (road: ExtendedRoadSegment): RoadRiskRequest => ({
  road_id: road.road_id,
  rainfall_24h: road.status === 'RISKY' ? 40 : 25,
  rainfall_7d: road.status === 'RISKY' ? 110 : 80,
  elevation: 450,
  slope: 12,
  road_length_km: road.distance_km,
  traffic_level: road.status === 'RISKY' ? 2 : 1,
  historical_flood_count: road.status === 'RISKY' ? 2 : 1,
  historical_landslide_count: road.status === 'RISKY' ? 1 : 0,
  road_condition: road.status === 'BLOCKED' ? 3 : road.status === 'RISKY' ? 2 : 1
});

export const backendService = {
  async getFleetTrucks(): Promise<SimulatedTruck[]> {
    return request<SimulatedTruck[]>('/fleet/trucks');
  },

  async sendDriverAction(truckId: string, action: string): Promise<SimulatedTruck> {
    return authorizedRequest<SimulatedTruck>(`/fleet/trucks/${truckId}/actions`, {
      method: 'POST',
      body: JSON.stringify({ action })
    });
  },

  async getWeather(latitude: number, longitude: number): Promise<WeatherSnapshot> {
    return request<WeatherSnapshot>(`/weather?latitude=${latitude}&longitude=${longitude}`);
  },

  async recordTelemetry(truckId: string, latitude: number, longitude: number, speedKph = 0): Promise<void> {
    await authorizedRequest(`/fleet/trucks/${truckId}/telemetry`, {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude, speed_kph: speedKph })
    });
  },

  async getDashboardSummary(): Promise<DashboardSummary> {
    return authorizedRequest<DashboardSummary>('/dashboard/summary');
  },

  async getUsers(): Promise<OperationalUser[]> {
    return authorizedRequest<OperationalUser[]>('/users', undefined, 'ADMINISTRATOR');
  },

  async getIncidents(): Promise<unknown[]> {
    return authorizedRequest<unknown[]>('/incidents');
  },

  async getDeliveries(): Promise<unknown[]> {
    return authorizedRequest<unknown[]>('/deliveries');
  },

  async getAuditLogs(): Promise<unknown[]> {
    return authorizedRequest<unknown[]>('/audit', undefined, 'RISK_ANALYST');
  },

  async calculateEmergencyRoute(origin: string, destination: string, emergencyType: string): Promise<unknown> {
    return authorizedRequest('/routes/emergency', {
      method: 'POST',
      body: JSON.stringify({ origin, destination, emergency_type: emergencyType })
    });
  },

  async queueIncident(incident: { road_id: string; type: string; severity: string; latitude: number; longitude: number; description: string }): Promise<void> {
    const queueKey = 'suraksha_pending_incidents';
    const pending = JSON.parse(window.localStorage.getItem(queueKey) ?? '[]') as unknown[];
    pending.push({ ...incident, queued_at: new Date().toISOString() });
    window.localStorage.setItem(queueKey, JSON.stringify(pending));
  },

  async syncPendingIncidents(): Promise<void> {
    const queueKey = 'suraksha_pending_incidents';
    const pending = JSON.parse(window.localStorage.getItem(queueKey) ?? '[]') as Array<Record<string, unknown>>;
    if (pending.length === 0) return;
    const remaining: Array<Record<string, unknown>> = [];
    for (const incident of pending) {
      try {
        const form = new FormData();
        Object.entries(incident).forEach(([key, value]) => form.append(key, String(value)));
        await authorizedRequest('/incidents', { method: 'POST', body: form });
      } catch {
        remaining.push(incident);
      }
    }
    window.localStorage.setItem(queueKey, JSON.stringify(remaining));
  },

  async checkHealth(): Promise<boolean> {
    try {
      await request<{ status: string }>('/health');
      return true;
    } catch {
      return false;
    }
  },

  async predictRoadRisk(road: ExtendedRoadSegment): Promise<RoadRiskResponse> {
    return request<RoadRiskResponse>('/predict-risk', {
      method: 'POST',
      body: JSON.stringify(toRiskRequest(road))
    });
  },

  async predictRouteEta(route: {
    totalTravelTimeMin: number;
    totalDistanceKm: number;
    averageRisk: number;
    maximumRisk: number;
    roadSegments: ExtendedRoadSegment[];
  }): Promise<PredictedETA> {
    const riskySegmentCount = route.roadSegments.filter((segment) => segment.status === 'RISKY').length;
    const blockedSegmentCount = route.roadSegments.filter((segment) => segment.status === 'BLOCKED').length;

    return request<PredictedETA>('/predict-eta', {
      method: 'POST',
      body: JSON.stringify({
        baseline_travel_time_min: route.totalTravelTimeMin,
        route_distance_km: route.totalDistanceKm,
        average_risk: route.averageRisk,
        maximum_risk: route.maximumRisk,
        traffic_level: riskySegmentCount > 0 ? 2 : 1,
        road_condition: blockedSegmentCount > 0 ? 3 : riskySegmentCount > 0 ? 2 : 1,
        risky_segment_count: riskySegmentCount,
        blocked_segment_count: blockedSegmentCount,
        rainfall_24h: riskySegmentCount > 0 ? 40 : 25,
        rainfall_7d: riskySegmentCount > 0 ? 110 : 80
      } satisfies ETARequest)
    });
  }
};