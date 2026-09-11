import type { LocationNode, ExtendedRoadSegment } from '../types/road';
import { DEMO_LOCATIONS } from '../data/demoRoads';
import osmGraphRaw from '../data/osm_ner_graph.json';

// Export type explicitly for verbatimModuleSyntax compliance
export type { LocationNode, RoadSegment, ExtendedRoadSegment, AIRiskPrediction, RoadStatus, MapViewState } from '../types/road';

export interface OSMGraphNode {
  id: string;
  lat: number;
  lon: number;
}

export interface OSMGraphEdge extends Omit<ExtendedRoadSegment, 'coordinates'> {
  coordinates: [number, number][];
}

export interface OSMGraphData {
  nodes: OSMGraphNode[];
  edges: ExtendedRoadSegment[];
}

const osmGraph = osmGraphRaw as unknown as OSMGraphData;

export class RoadNetworkService {
  static getLocations(): LocationNode[] {
    return DEMO_LOCATIONS;
  }

  static getOsmGraph(): OSMGraphData {
    return osmGraph;
  }

  static getRoadSegments(): ExtendedRoadSegment[] {
    return osmGraph.edges;
  }

  /**
   * Helper to find nearest OSM node to given lat/lon coordinates
   */
  static findNearestOsmNode(longitude: number, latitude: number): OSMGraphNode {
    let nearestNode: OSMGraphNode = osmGraph.nodes[0];
    let minDistanceSq = Infinity;

    for (let i = 0; i < osmGraph.nodes.length; i++) {
      const node = osmGraph.nodes[i];
      const dLon = node.lon - longitude;
      const dLat = node.lat - latitude;
      const distSq = dLon * dLon + dLat * dLat;
      if (distSq < minDistanceSq) {
        minDistanceSq = distSq;
        nearestNode = node;
      }
    }

    return nearestNode;
  }

  /**
   * Snaps a location ID (e.g. LOC-GAU) or coordinate pair to nearest valid OSM node ID
   */
  static snapToNearestNodeId(locationIdOrCoords: string | [number, number]): string {
    if (typeof locationIdOrCoords === 'string') {
      const matchedLoc = DEMO_LOCATIONS.find(l => l.id === locationIdOrCoords);
      if (matchedLoc) {
        const nearest = this.findNearestOsmNode(matchedLoc.coordinates[0], matchedLoc.coordinates[1]);
        return nearest.id;
      }
      // If already an OSM node ID
      if (osmGraph.nodes.some(n => n.id === locationIdOrCoords)) {
        return locationIdOrCoords;
      }
    } else if (Array.isArray(locationIdOrCoords) && locationIdOrCoords.length === 2) {
      const nearest = this.findNearestOsmNode(locationIdOrCoords[0], locationIdOrCoords[1]);
      return nearest.id;
    }

    // Default Guwahati snapped OSM node
    return 'osm_26.1416_91.7419';
  }

  static getRoadAsGeoJSON(): GeoJSON.FeatureCollection<GeoJSON.LineString> {
    const roads = this.getRoadSegments();
    return {
      type: 'FeatureCollection',
      features: roads.map((road) => ({
        type: 'Feature',
        id: road.road_id,
        geometry: {
          type: 'LineString',
          coordinates: road.coordinates
        },
        properties: {
          road_id: road.road_id,
          name: road.name,
          start_node: road.start_node,
          end_node: road.end_node,
          distance_km: road.distance_km,
          travel_time_min: road.travel_time_min,
          status: road.status,
          disruption_probability: road.ai_risk?.disruption_probability,
          risk_level: road.ai_risk?.risk_level
        }
      }))
    };
  }

  static getLocationsAsGeoJSON(): GeoJSON.FeatureCollection<GeoJSON.Point> {
    return {
      type: 'FeatureCollection',
      features: DEMO_LOCATIONS.map((loc) => ({
        type: 'Feature',
        id: loc.id,
        geometry: {
          type: 'Point',
          coordinates: loc.coordinates
        },
        properties: {
          id: loc.id,
          name: loc.name,
          state: loc.state
        }
      }))
    };
  }
}

