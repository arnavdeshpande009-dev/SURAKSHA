import type { Alert, AlertSeverity, AlertRuleConfig } from '../types/alert';
import type { ExtendedRoadSegment } from '../types/road';
import type { RouteComparisonResult } from '../routing/types';

export const DEFAULT_ALERT_CONFIG: AlertRuleConfig = {
  lowMax: 0.30,
  mediumMax: 0.60,
  highMax: 0.80,
  criticalMin: 0.80
};

export class AlertEngine {
  static evaluateRoadAlert(road: ExtendedRoadSegment, config: AlertRuleConfig = DEFAULT_ALERT_CONFIG): Alert | null {
    if (road.status === 'BLOCKED') {
      return {
        alert_id: `ALT-BLK-${road.road_id}`,
        road_id: road.road_id,
        type: 'BLOCKED_ROAD',
        severity: 'CRITICAL',
        title: 'Road Blocked Warning',
        message: `${road.name} is completely blocked and impassable.`,
        cause: 'Severe structural damage / active hazard',
        risk_probability: road.ai_risk?.disruption_probability ?? 0.95,
        timestamp: 'Just now',
        recommended_action: 'Avoid blocked road immediately and take alternate route.',
        status: 'ACTIVE'
      };
    }

    const prob = road.ai_risk?.disruption_probability ?? 0.0;

    if (prob >= config.mediumMax) {
      const severity: AlertSeverity = prob >= config.criticalMin ? 'CRITICAL' : 'HIGH';
      return {
        alert_id: `ALT-RSK-${road.road_id}`,
        road_id: road.road_id,
        type: 'HIGH_DISRUPTION_RISK',
        severity,
        title: `${severity} Disruption Risk`,
        message: `Road disruption probability on ${road.name} has reached ${Math.round(prob * 100)}%.`,
        cause: 'Heavy rainfall and steep terrain hazard',
        risk_probability: prob,
        timestamp: '5 mins ago',
        recommended_action: 'Review route and consider safer alternate bypass.',
        status: 'ACTIVE'
      };
    }

    if (prob >= config.lowMax) {
      return {
        alert_id: `ALT-MED-${road.road_id}`,
        road_id: road.road_id,
        type: 'HIGH_DISRUPTION_RISK',
        severity: 'MEDIUM',
        title: 'Medium Disruption Risk',
        message: `Moderate risk detected on ${road.name} (${Math.round(prob * 100)}%).`,
        cause: 'Unfavorable weather conditions',
        risk_probability: prob,
        timestamp: '15 mins ago',
        recommended_action: 'Monitor road conditions closely.',
        status: 'ACTIVE'
      };
    }

    return null;
  }

  static evaluateRouteAlerts(
    comparison: RouteComparisonResult | null,
    config: AlertRuleConfig = DEFAULT_ALERT_CONFIG
  ): Alert[] {
    const alerts: Alert[] = [];
    if (!comparison || !comparison.fastestRoute || comparison.fastestRoute.status !== 'SUCCESS') {
      return alerts;
    }

    const fastest = comparison.fastestRoute;

    // Check if selected route contains high risk or blocked segments
    const highRiskSegment = fastest.roadSegments.find(
      (s) => (s.ai_risk?.disruption_probability ?? 0) >= config.mediumMax || s.status === 'BLOCKED'
    );

    if (highRiskSegment) {
      const prob = highRiskSegment.ai_risk?.disruption_probability ?? 0.85;
      alerts.push({
        alert_id: `ALT-RTE-${highRiskSegment.road_id}`,
        road_id: highRiskSegment.road_id,
        type: 'ROUTE_RISK_INCREASE',
        severity: prob >= config.criticalMin ? 'CRITICAL' : 'HIGH',
        title: 'Route Risk Detected',
        message: `Selected route traverses ${highRiskSegment.name} with ${Math.round(prob * 100)}% disruption risk.`,
        cause: 'High hazard segment along path',
        risk_probability: prob,
        timestamp: 'Just now',
        recommended_action: 'Review safer alternate route options.',
        status: 'ACTIVE'
      });
    }

    // Generate rerouting recommendation alert if SAFEST route provides significant safety gains
    if (comparison.recommendedMode === 'SAFEST' && comparison.safestRoute) {
      alerts.push({
        alert_id: 'ALT-REROUTE-REC',
        type: 'REROUTING_RECOMMENDATION',
        severity: 'HIGH',
        title: 'Safer Route Available',
        message: comparison.recommendationReason,
        cause: 'AI Risk Engine detected high hazard on primary route',
        risk_probability: comparison.safestRoute.riskMetrics.maximumRisk,
        timestamp: 'Just now',
        recommended_action: 'Switch to recommended SAFEST ROUTE to reduce risk.',
        status: 'ACTIVE'
      });
    }

    return alerts;
  }
}
