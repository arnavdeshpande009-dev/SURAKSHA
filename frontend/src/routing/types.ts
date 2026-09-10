import type { RoadStatus, ExtendedRoadSegment, PredictedETA } from '../types/road';

export type RoutingMode = 'FASTEST' | 'SAFEST';

export interface GraphEdge {
  targetNodeId: string;
  roadId: string;
  distanceKm: number;
  travelTimeMin: number;
  status: RoadStatus;
  segment: ExtendedRoadSegment;
}

export interface GraphNode {
  id: string;
  edges: GraphEdge[];
}

export interface WeightedGraph {
  nodes: Map<string, GraphNode>;
}

export interface RouteRiskMetrics {
  averageRisk: number;
  maximumRisk: number;
  routeRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface RouteResult {
  mode: RoutingMode;
  path: string[];
  roadSegments: ExtendedRoadSegment[];
  totalDistanceKm: number;
  totalTravelTimeMin: number;
  segmentCount: number;
  riskMetrics: RouteRiskMetrics;
  etaPrediction: PredictedETA;
  totalCost: number;
  status: 'SUCCESS' | 'NO_ROUTE_FOUND' | 'INVALID_INPUT';
  message?: string;
}

export interface RiskRoutingConfig {
  riskWeightMin: number;
  riskyStatusPenaltyMin: number;
  maxAcceptableExtraTimePercent: number;
  minRequiredRiskReduction: number;
  defaultFallbackRisk: number;
}

export interface RouteComparisonResult {
  fastestRoute: RouteResult | null;
  safestRoute: RouteResult | null;
  recommendedMode: RoutingMode;
  recommendationReason: string;
  timeDifferenceMin: number;
  riskReduction: number;
}

export type EdgeCostCalculator = (edge: GraphEdge, mode: RoutingMode, config?: Partial<RiskRoutingConfig>) => number;
