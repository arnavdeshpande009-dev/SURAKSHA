import React, { useEffect, useRef } from 'react';
import type { ExtendedRoadSegment, LocationNode } from '../../types/road';
import type { RouteResult, RouteComparisonResult } from '../../routing/types';
import type { DemoIncident } from '../../types/alert';
import { DEMO_INCIDENTS } from '../../data/demoIncidents';
import { RotateCcw, Maximize } from 'lucide-react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { RoadNetworkService } from '../../services/roadService';
import { RouteService } from '../../routing/routeService';

interface MapProps {
  roads: ExtendedRoadSegment[];
  locations: LocationNode[];
  onRoadClick: (road: ExtendedRoadSegment) => void;
  selectedOrigin?: string;
  selectedDestination?: string;
  activeRoute?: RouteResult | null;
  comparisonResult?: RouteComparisonResult | null;
  incidents?: DemoIncident[];
  onIncidentClick?: (incident: DemoIncident) => void;
}

const NER_CENTER: [number, number] = [92.5, 25.8];
const NER_ZOOM = 6.5;

export const MapComponent: React.FC<MapProps> = ({
  roads,
  locations,
  onRoadClick,
  selectedOrigin,
  selectedDestination,
  activeRoute,
  comparisonResult,
  incidents = DEMO_INCIDENTS,
  onIncidentClick,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Use standard free OpenStreetMap raster tiles (no API key required)
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm-tiles-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: NER_CENTER,
      zoom: NER_ZOOM,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', () => {
      // 1. Baseline Road Network
      map.addSource('ner-roads', {
        type: 'geojson',
        data: RoadNetworkService.getRoadAsGeoJSON()
      });

      map.addLayer({
        id: 'ner-roads-casing',
        type: 'line',
        source: 'ner-roads',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#0f172a', 'line-width': 8 }
      });

      map.addLayer({
        id: 'ner-roads-line',
        type: 'line',
        source: 'ner-roads',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-width': 5,
          'line-color': [
            'match',
            ['get', 'status'],
            'OPEN', '#22c55e',
            'RISKY', '#eab308',
            'BLOCKED', '#ef4444',
            '#94a3b8'
          ]
        }
      });

      // 2. Alternative Route Overlay (Dashed)
      map.addSource('alt-route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      map.addLayer({
        id: 'alt-route-line',
        type: 'line',
        source: 'alt-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#64748b',
          'line-width': 5,
          'line-dasharray': [2, 2]
        }
      });

      // 3. Active Route Highlight (Glowing)
      map.addSource('active-route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      map.addLayer({
        id: 'active-route-glow',
        type: 'line',
        source: 'active-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'mode'], 'SAFEST'], '#22c55e',
            '#eab308'
          ],
          'line-width': 14,
          'line-opacity': 0.4
        }
      });

      map.addLayer({
        id: 'active-route-line',
        type: 'line',
        source: 'active-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'mode'], 'SAFEST'], '#16a34a',
            '#ca8a04'
          ],
          'line-width': 7
        }
      });

      // 4. Incident Markers Source
      const incidentGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Point> = {
        type: 'FeatureCollection',
        features: incidents.map((inc) => ({
          type: 'Feature',
          id: inc.incident_id,
          geometry: {
            type: 'Point',
            coordinates: [inc.longitude, inc.latitude]
          },
          properties: { ...inc }
        }))
      };

      map.addSource('demo-incidents', {
        type: 'geojson',
        data: incidentGeoJSON
      });

      map.addLayer({
        id: 'demo-incidents-circle',
        type: 'circle',
        source: 'demo-incidents',
        paint: {
          'circle-radius': 9,
          'circle-color': [
            'match',
            ['get', 'severity'],
            'CRITICAL', '#ef4444',
            'HIGH', '#f97316',
            'MEDIUM', '#eab308',
            '#38bdf8'
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      // 5. Locations Source
      map.addSource('ner-locations', {
        type: 'geojson',
        data: RoadNetworkService.getLocationsAsGeoJSON()
      });

      map.addLayer({
        id: 'ner-locations-circle',
        type: 'circle',
        source: 'ner-locations',
        paint: {
          'circle-radius': 7,
          'circle-color': '#0284c7',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      map.addLayer({
        id: 'ner-locations-label',
        type: 'symbol',
        source: 'ner-locations',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 12,
          'text-offset': [0, 1.2],
          'text-anchor': 'top'
        },
        paint: {
          'text-color': '#0f172a',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2
        }
      });

      map.on('click', 'ner-roads-line', (e) => {
        if (e.features && e.features.length > 0) {
          const featureProps = e.features[0].properties;
          const matchedRoad = roads.find((r) => r.road_id === featureProps?.road_id);
          if (matchedRoad) {
            onRoadClick(matchedRoad);
          }
        }
      });

      map.on('click', 'demo-incidents-circle', (e) => {
        if (e.features && e.features.length > 0 && onIncidentClick) {
          const incProps = e.features[0].properties as DemoIncident;
          onIncidentClick(incProps);
        }
      });

      map.on('mouseenter', 'ner-roads-line', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'ner-roads-line', () => { map.getCanvas().style.cursor = ''; });
      map.on('mouseenter', 'demo-incidents-circle', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'demo-incidents-circle', () => { map.getCanvas().style.cursor = ''; });
    });

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, []);

  // Fit map bounds automatically to active route
  const handleFitRouteBounds = () => {
    const map = mapRef.current;
    if (!map || !activeRoute || activeRoute.roadSegments.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();
    activeRoute.roadSegments.forEach((segment) => {
      segment.coordinates.forEach((coord) => {
        bounds.extend(coord as [number, number]);
      });
    });

    map.fitBounds(bounds, {
      padding: { top: 60, bottom: 60, left: 60, right: 60 },
      maxZoom: 9,
      duration: 1000
    });
  };

  // Auto-fit bounds when activeRoute updates
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const activeSource = map.getSource('active-route') as maplibregl.GeoJSONSource;
    const altSource = map.getSource('alt-route') as maplibregl.GeoJSONSource;

    if (activeSource && activeRoute) {
      activeSource.setData(RouteService.getRouteAsGeoJSON(activeRoute));
      handleFitRouteBounds();
    } else if (activeSource) {
      activeSource.setData({ type: 'FeatureCollection', features: [] });
    }

    if (altSource && comparisonResult) {
      const altRoute = activeRoute?.mode === 'SAFEST' ? comparisonResult.fastestRoute : comparisonResult.safestRoute;
      if (altRoute && altRoute.path.join('-') !== activeRoute?.path.join('-')) {
        altSource.setData(RouteService.getRouteAsGeoJSON(altRoute));
      } else {
        altSource.setData({ type: 'FeatureCollection', features: [] });
      }
    } else if (altSource) {
      altSource.setData({ type: 'FeatureCollection', features: [] });
    }
  }, [activeRoute, comparisonResult]);

  // Update node highlight colors
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (map.getLayer('ner-locations-circle')) {
      map.setPaintProperty('ner-locations-circle', 'circle-color', [
        'case',
        ['==', ['get', 'id'], selectedOrigin || ''], '#22c55e',
        ['==', ['get', 'id'], selectedDestination || ''], '#ef4444',
        '#0284c7'
      ]);

      map.setPaintProperty('ner-locations-circle', 'circle-radius', [
        'case',
        ['in', ['get', 'id'], ['literal', [selectedOrigin || '', selectedDestination || '']]], 10,
        7
      ]);
    }
  }, [selectedOrigin, selectedDestination]);

  const handleResetView = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: NER_CENTER,
        zoom: NER_ZOOM,
        essential: true
      });
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      <div style={{
        position: 'absolute',
        top: '20px',
        right: '54px',
        display: 'flex',
        gap: '8px',
        zIndex: 10
      }}>
        {activeRoute && activeRoute.status === 'SUCCESS' && (
          <button
            onClick={handleFitRouteBounds}
            title="Zoom to Route Bounds"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#38bdf8',
              padding: '6px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}
          >
            <Maximize size={14} /> Fit Route
          </button>
        )}

        <button
          onClick={handleResetView}
          title="Reset Map to Northeast Region"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid #334155',
            borderRadius: '6px',
            color: '#f8fafc',
            padding: '6px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}
        >
          <RotateCcw size={14} /> Reset View
        </button>
      </div>
    </div>
  );
};
