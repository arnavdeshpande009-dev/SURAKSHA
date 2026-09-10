import type { LocationNode, RoadSegment, RoadStatus } from './types/road';

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

export type { LocationNode, RoadSegment, RoadStatus, MapViewState } from './types/road';
