export type RoadStatus = 'OPEN' | 'RISKY' | 'BLOCKED';

export interface LocationNode {
  id: string;
  name: string;
  state: string;
  coordinates: [number, number];
}

export interface RoadSegment {
  road_id: string;
  name: string;
  start_node: string;
  end_node: string;
  distance_km: number;
  travel_time_min: number;
  status: RoadStatus;
  coordinates: [number, number][];
}

export interface AIRiskPrediction {
  disruption_probability: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ExtendedRoadSegment extends RoadSegment {
  ai_risk?: AIRiskPrediction;
}

export interface PredictedETA {
  baseline_travel_time_min: number;
  predicted_delay_min: number;
  predicted_eta_min: number;
  is_fallback?: boolean;
}

export interface MapViewState {
  center: [number, number];
  zoom: number;
}
