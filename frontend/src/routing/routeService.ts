import { RoadNetworkService } from '../services/roadService';
import { NetworkGraph, DEFAULT_RISK_ROUTING_CONFIG } from './graph';
import { findShortestPath } from './dijkstra';
import type {
  RouteResult,
  WeightedGraph,
  RoutingMode,
  RiskRoutingConfig,
  RouteComparisonResult
} from './types';
import type { ExtendedRoadSegment } from '../types/road';

export class RouteService {
  private static cachedGraph: WeightedGraph | null = null;
  private static cachedRoads: ExtendedRoadSegment[] | null = null;

  static getGraph(roads: ExtendedRoadSegment[] = RoadNetworkService.getRoadSegments()): WeightedGraph {
    if (!this.cachedGraph || this.cachedRoads !== roads) {
      const locations = RoadNetworkService.getLocations();
      this.cachedGraph = NetworkGraph.buildGraph(locations, roads);
      this.cachedRoads = roads;
    }
    return this.cachedGraph;
  }

  static resetGraphCache(): void {
    this.cachedGraph = null;
    this.cachedRoads = null;
  }

  static calculateRoute(
    originId: string,
    destinationId: string,
    mode: RoutingMode = 'FASTEST',
    config: RiskRoutingConfig = DEFAULT_RISK_ROUTING_CONFIG,
    roads?: ExtendedRoadSegment[]
  ): RouteResult {
    const snappedOrigin = RoadNetworkService.snapToNearestNodeId(originId);
    const snappedDest = RoadNetworkService.snapToNearestNodeId(destinationId);
    const graph = this.getGraph(roads);
    return findShortestPath(snappedOrigin, snappedDest, graph, mode, config);
  }

  static compareRoutes(
    originId: string,
    destinationId: string,
    config: RiskRoutingConfig = DEFAULT_RISK_ROUTING_CONFIG,
    roads?: ExtendedRoadSegment[]
  ): RouteComparisonResult {
    const fastest = this.calculateRoute(originId, destinationId, 'FASTEST', config, roads);
    const safest = this.calculateRoute(originId, destinationId, 'SAFEST', config, roads);

    if (fastest.status !== 'SUCCESS' || safest.status !== 'SUCCESS') {
      return {
        fastestRoute: fastest.status === 'SUCCESS' ? fastest : null,
        safestRoute: safest.status === 'SUCCESS' ? safest : null,
        recommendedMode: 'FASTEST',
        recommendationReason: fastest.message || safest.message || 'No route available',
        timeDifferenceMin: 0,
        riskReduction: 0
      };
    }

    const samePath = fastest.path.join('-') === safest.path.join('-');

    if (samePath) {
      return {
        fastestRoute: fastest,
        safestRoute: safest,
        recommendedMode: 'FASTEST',
        recommendationReason: 'The fastest route is already the safest available route.',
        timeDifferenceMin: 0,
        riskReduction: 0
      };
    }

    const timeDiffMin = safest.etaPrediction.predicted_eta_min - fastest.etaPrediction.predicted_eta_min;
    const extraTimePercent = (timeDiffMin / (fastest.etaPrediction.predicted_eta_min || 1)) * 100;
    const riskDiff = fastest.riskMetrics.maximumRisk - safest.riskMetrics.maximumRisk;

    const significantRiskReduction = riskDiff >= config.minRequiredRiskReduction;
    const acceptableExtraTime = extraTimePercent <= config.maxAcceptableExtraTimePercent;

    if (significantRiskReduction && acceptableExtraTime) {
      const formatHrs = (min: number) => {
        const h = Math.floor(Math.abs(min) / 60);
        const m = Math.abs(min) % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
      };

      const riskDropPercent = Math.round(riskDiff * 100);

      // If predicted ETA of SAFEST is lower than or equal to FASTEST after delay!
      let reasonText = '';
      if (timeDiffMin <= 0) {
        reasonText = `Lower predicted final ETA (${formatHrs(Math.abs(timeDiffMin))} faster overall) and lower disruption risk (${riskDropPercent}% risk drop).`;
      } else {
        reasonText = `${formatHrs(timeDiffMin)} longer baseline, but lowers disruption risk by ${riskDropPercent}%.`;
      }

      return {
        fastestRoute: fastest,
        safestRoute: safest,
        recommendedMode: 'SAFEST',
        recommendationReason: reasonText,
        timeDifferenceMin: timeDiffMin,
        riskReduction: Math.round(riskDiff * 100) / 100
      };
    }

    return {
      fastestRoute: fastest,
      safestRoute: safest,
      recommendedMode: 'FASTEST',
      recommendationReason: 'Extra travel time for safer route exceeds acceptable safety trade-off threshold.',
      timeDifferenceMin: timeDiffMin,
      riskReduction: Math.round(riskDiff * 100) / 100
    };
  }

  static getRouteAsGeoJSON(routeResult: RouteResult): GeoJSON.FeatureCollection<GeoJSON.LineString> {
    if (routeResult.status !== 'SUCCESS' || routeResult.roadSegments.length === 0) {
      return {
        type: 'FeatureCollection',
        features: []
      };
    }

    const mergedCoordinates: [number, number][] = [];

    routeResult.roadSegments.forEach((segment, idx) => {
      const coords = segment.coordinates;
      if (idx === 0) {
        mergedCoordinates.push(...coords);
      } else {
        const lastAdded = mergedCoordinates[mergedCoordinates.length - 1];
        const firstCoord = coords[0];
        if (lastAdded[0] === firstCoord[0] && lastAdded[1] === firstCoord[1]) {
          mergedCoordinates.push(...coords.slice(1));
        } else {
          mergedCoordinates.push(...[...coords].reverse());
        }
      }
    });

    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: mergedCoordinates
          },
          properties: {
            mode: routeResult.mode,
            totalDistanceKm: routeResult.totalDistanceKm,
            totalTravelTimeMin: routeResult.totalTravelTimeMin,
            predicted_eta_min: routeResult.etaPrediction.predicted_eta_min,
            maximumRisk: routeResult.riskMetrics.maximumRisk,
            routeRiskLevel: routeResult.riskMetrics.routeRiskLevel
          }
        }
      ]
    };
  }
}
