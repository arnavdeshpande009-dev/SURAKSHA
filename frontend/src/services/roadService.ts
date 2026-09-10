import type { LocationNode, ExtendedRoadSegment } from '../types/road';
import { DEMO_LOCATIONS, DEMO_ROADS } from '../data/demoRoads';

// Export type explicitly for verbatimModuleSyntax compliance
export type { LocationNode, RoadSegment, ExtendedRoadSegment, AIRiskPrediction, RoadStatus, MapViewState } from '../types/road';

export class RoadNetworkService {
  static getLocations(): LocationNode[] {
    return DEMO_LOCATIONS;
  }

  static getRoadSegments(): ExtendedRoadSegment[] {
    return DEMO_ROADS;
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
