import type {
  WeightedGraph,
  RouteResult,
  RoutingMode,
  RiskRoutingConfig,
  RouteRiskMetrics,
  GraphEdge
} from './types';
import type { ExtendedRoadSegment, PredictedETA } from '../types/road';
import { NetworkGraph, DEFAULT_RISK_ROUTING_CONFIG } from './graph';
import { calculatePredictedETA } from './etaEngine';

export function calculateRouteRiskMetrics(
  segments: ExtendedRoadSegment[],
  defaultFallbackRisk: number = DEFAULT_RISK_ROUTING_CONFIG.defaultFallbackRisk
): RouteRiskMetrics {
  if (segments.length === 0) {
    return { averageRisk: 0, maximumRisk: 0, routeRiskLevel: 'LOW' };
  }

  const risks = segments.map(
    (s) => s.ai_risk?.disruption_probability ?? defaultFallbackRisk
  );

  const sumRisk = risks.reduce((acc, r) => acc + r, 0);
  const averageRisk = Math.round((sumRisk / risks.length) * 100) / 100;
  const maximumRisk = Math.round(Math.max(...risks) * 100) / 100;

  let routeRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (maximumRisk > 0.70 || averageRisk > 0.50) {
    routeRiskLevel = 'HIGH';
  } else if (maximumRisk > 0.35 || averageRisk > 0.25) {
    routeRiskLevel = 'MEDIUM';
  }

  return {
    averageRisk,
    maximumRisk,
    routeRiskLevel
  };
}

export function findShortestPath(
  originId: string,
  destinationId: string,
  graph: WeightedGraph,
  mode: RoutingMode = 'FASTEST',
  config: RiskRoutingConfig = DEFAULT_RISK_ROUTING_CONFIG
): RouteResult {
  const emptyMetrics: RouteRiskMetrics = { averageRisk: 0, maximumRisk: 0, routeRiskLevel: 'LOW' };
  const emptyETA: PredictedETA = { baseline_travel_time_min: 0, predicted_delay_min: 0, predicted_eta_min: 0 };

  if (!originId || !destinationId) {
    return {
      mode,
      path: [],
      roadSegments: [],
      totalDistanceKm: 0,
      totalTravelTimeMin: 0,
      segmentCount: 0,
      riskMetrics: emptyMetrics,
      etaPrediction: emptyETA,
      totalCost: 0,
      status: 'INVALID_INPUT',
      message: 'Please select both origin and destination.'
    };
  }

  if (originId === destinationId) {
    return {
      mode,
      path: [originId],
      roadSegments: [],
      totalDistanceKm: 0,
      totalTravelTimeMin: 0,
      segmentCount: 0,
      riskMetrics: emptyMetrics,
      etaPrediction: emptyETA,
      totalCost: 0,
      status: 'INVALID_INPUT',
      message: 'Origin and destination are identical.'
    };
  }

  const originNode = graph.nodes.get(originId);
  const destNode = graph.nodes.get(destinationId);

  if (!originNode || !destNode) {
    return {
      mode,
      path: [],
      roadSegments: [],
      totalDistanceKm: 0,
      totalTravelTimeMin: 0,
      segmentCount: 0,
      riskMetrics: emptyMetrics,
      etaPrediction: emptyETA,
      totalCost: 0,
      status: 'INVALID_INPUT',
      message: 'Selected origin or destination location does not exist in network.'
    };
  }

  const distances = new Map<string, number>();
  const previousNodes = new Map<string, { nodeId: string; edge: GraphEdge } | null>();
  const unvisited = new Set<string>();

  graph.nodes.forEach((_, nodeId) => {
    distances.set(nodeId, Infinity);
    previousNodes.set(nodeId, null);
    unvisited.add(nodeId);
  });

  distances.set(originId, 0);

  while (unvisited.size > 0) {
    let currentId: string | null = null;
    let smallestDist = Infinity;

    unvisited.forEach((nodeId) => {
      const dist = distances.get(nodeId) ?? Infinity;
      if (dist < smallestDist) {
        smallestDist = dist;
        currentId = nodeId;
      }
    });

    if (!currentId || smallestDist === Infinity) {
      break;
    }

    if (currentId === destinationId) {
      break;
    }

    unvisited.delete(currentId);
    const currentNode = graph.nodes.get(currentId);

    if (currentNode) {
      for (const edge of currentNode.edges) {
        if (!unvisited.has(edge.targetNodeId)) continue;

        const edgeCost = NetworkGraph.calculateRoadCost(edge, mode, config);
        if (edgeCost === Infinity) continue;

        const altDistance = (distances.get(currentId) ?? Infinity) + edgeCost;

        if (altDistance < (distances.get(edge.targetNodeId) ?? Infinity)) {
          distances.set(edge.targetNodeId, altDistance);
          previousNodes.set(edge.targetNodeId, { nodeId: currentId, edge });
        }
      }
    }
  }

  if (distances.get(destinationId) === Infinity) {
    return {
      mode,
      path: [],
      roadSegments: [],
      totalDistanceKm: 0,
      totalTravelTimeMin: 0,
      segmentCount: 0,
      riskMetrics: emptyMetrics,
      etaPrediction: emptyETA,
      totalCost: 0,
      status: 'NO_ROUTE_FOUND',
      message: 'NO VIABLE ROUTE FOUND'
    };
  }

  const path: string[] = [];
  const roadSegments: ExtendedRoadSegment[] = [];
  let curr: string | null = destinationId;
  let totalDistanceKm = 0;
  let totalTravelTimeMin = 0;

  while (curr) {
    path.unshift(curr);
    const prev = previousNodes.get(curr);
    if (prev) {
      roadSegments.unshift(prev.edge.segment);
      totalDistanceKm += prev.edge.distanceKm;
      totalTravelTimeMin += prev.edge.travelTimeMin;
      curr = prev.nodeId;
    } else {
      curr = null;
    }
  }

  const roundedDistance = Math.round(totalDistanceKm * 10) / 10;
  const riskMetrics = calculateRouteRiskMetrics(roadSegments, config.defaultFallbackRisk);
  const etaPrediction = calculatePredictedETA(totalTravelTimeMin, roundedDistance, riskMetrics, roadSegments);
  const totalCost = distances.get(destinationId) ?? 0;

  return {
    mode,
    path,
    roadSegments,
    totalDistanceKm: roundedDistance,
    totalTravelTimeMin,
    segmentCount: roadSegments.length,
    riskMetrics,
    etaPrediction,
    totalCost: Math.round(totalCost * 10) / 10,
    status: 'SUCCESS'
  };
}
