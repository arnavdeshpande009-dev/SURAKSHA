import type { LocationNode, ExtendedRoadSegment } from '../types/road';
import type { WeightedGraph, GraphNode, GraphEdge, RoutingMode, RiskRoutingConfig } from './types';

export const DEFAULT_RISK_ROUTING_CONFIG: RiskRoutingConfig = {
  riskWeightMin: 300,                  // 100% disruption probability adds 300 min penalty
  riskyStatusPenaltyMin: 45,           // RISKY road status adds 45 min penalty
  maxAcceptableExtraTimePercent: 50.0, // Accept up to 50% longer travel time for safety
  minRequiredRiskReduction: 0.15,      // Require at least 15% lower risk to recommend SAFEST
  defaultFallbackRisk: 0.15            // Conservative fallback risk if AI data missing
};

/**
 * Builds an undirected graph representation from locations and road segments.
 */
export class NetworkGraph {
  static buildGraph(locations: LocationNode[], roads: ExtendedRoadSegment[]): WeightedGraph {
    const nodesMap = new Map<string, GraphNode>();

    locations.forEach((loc) => {
      nodesMap.set(loc.id, {
        id: loc.id,
        edges: []
      });
    });

    roads.forEach((road) => {
      const startNode = nodesMap.get(road.start_node);
      const endNode = nodesMap.get(road.end_node);

      if (startNode && endNode) {
        startNode.edges.push({
          targetNodeId: road.end_node,
          roadId: road.road_id,
          distanceKm: road.distance_km,
          travelTimeMin: road.travel_time_min,
          status: road.status,
          segment: road
        });

        endNode.edges.push({
          targetNodeId: road.start_node,
          roadId: road.road_id,
          distanceKm: road.distance_km,
          travelTimeMin: road.travel_time_min,
          status: road.status,
          segment: road
        });
      }
    });

    return { nodes: nodesMap };
  }

  /**
   * Risk-Aware Cost Calculator Function:
   *
   * 1. If status === 'BLOCKED' -> return Infinity (Never traversable)
   * 2. If mode === 'FASTEST'  -> return travelTimeMin
   * 3. If mode === 'SAFEST'   ->
   *       cost = travelTimeMin + (disruption_probability * riskWeightMin) + statusPenalty
   */
  static calculateRoadCost(
    edge: GraphEdge,
    mode: RoutingMode,
    config: RiskRoutingConfig = DEFAULT_RISK_ROUTING_CONFIG
  ): number {
    if (edge.status === 'BLOCKED') {
      return Infinity;
    }

    if (mode === 'FASTEST') {
      return edge.travelTimeMin;
    }

    // Safest mode: travel time + AI risk penalty + status penalty
    const riskProb = edge.segment.ai_risk?.disruption_probability ?? config.defaultFallbackRisk;
    const riskPenalty = riskProb * config.riskWeightMin;
    const statusPenalty = edge.status === 'RISKY' ? config.riskyStatusPenaltyMin : 0;

    return edge.travelTimeMin + riskPenalty + statusPenalty;
  }
}
