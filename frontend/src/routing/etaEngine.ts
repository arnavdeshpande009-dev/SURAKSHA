import type { RouteResult, RouteRiskMetrics } from './types';
import type { ExtendedRoadSegment, PredictedETA } from '../types/road';

/**
 * Heuristic ETA delay prediction calculation for frontend / client-side execution.
 * Mirrors the trained XGBoost Regressor formula for offline/client fallback:
 *
 * delay_min = (maximum_risk * 45) + (average_risk * 30) + (risky_count * 12) + 5
 */
export function calculatePredictedETA(
  baselineTravelTimeMin: number,
  routeDistanceKm: number,
  riskMetrics: RouteRiskMetrics,
  segments: ExtendedRoadSegment[]
): PredictedETA {
  if (baselineTravelTimeMin <= 0 || segments.length === 0) {
    return {
      baseline_travel_time_min: baselineTravelTimeMin,
      predicted_delay_min: 0,
      predicted_eta_min: baselineTravelTimeMin,
      is_fallback: false
    };
  }

  const riskyCount = segments.filter((s) => s.status === 'RISKY' || (s.ai_risk?.risk_level === 'HIGH')).length;

  const delayRaw = (riskMetrics.maximumRisk * 45) + (riskMetrics.averageRisk * 30) + (riskyCount * 12);
  const predictedDelay = Math.max(0, Math.round(delayRaw));
  const predictedEta = baselineTravelTimeMin + predictedDelay;

  return {
    baseline_travel_time_min: baselineTravelTimeMin,
    predicted_delay_min: predictedDelay,
    predicted_eta_min: predictedEta,
    is_fallback: false
  };
}
