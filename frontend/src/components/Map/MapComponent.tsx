import React, { useEffect, useRef, useState } from 'react';
import { Maximize, RotateCcw } from 'lucide-react';
import type { ExtendedRoadSegment, LocationNode } from '../../types/road';
import type { RouteResult, RouteComparisonResult } from '../../routing/types';
import type { DemoIncident } from '../../types/alert';
import type { SimulatedTruck } from '../../data/fleet';
import { DEMO_INCIDENTS } from '../../data/demoIncidents';
import { googleMapsService } from '../../services/googleMapsService';
import type { GoogleRouteStep } from '../../services/googleMapsService';
import { LocalFallbackMap } from './LocalFallbackMap';

interface MapProps {
  roads: ExtendedRoadSegment[];
  locations: LocationNode[];
  onRoadClick: (road: ExtendedRoadSegment) => void;
  trucks?: SimulatedTruck[];
  selectedOrigin?: string;
  selectedDestination?: string;
  activeRoute?: RouteResult | null;
  comparisonResult?: RouteComparisonResult | null;
  incidents?: DemoIncident[];
  onIncidentClick?: (incident: DemoIncident) => void;
}

const NER_CENTER: [number, number] = [92.5, 25.8];
const toLatLng = ([lng, lat]: [number, number]): google.maps.LatLngLiteral => ({ lat, lng });

const getTruckPosition = (
  truck: SimulatedTruck,
  activeRoute?: RouteResult | null,
  googleRoutePath: google.maps.LatLngLiteral[] = []
): google.maps.LatLngLiteral => {
  const isEmergencyTruck = truck.id === 'TRK-101' || truck.label.includes('204') || truck.label.includes('SURAKSHA');
  const path: [number, number][] = (activeRoute && activeRoute.status === 'SUCCESS' && isEmergencyTruck)
    ? (googleRoutePath.length > 0
        ? googleRoutePath.map((p) => [p.lng, p.lat] as [number, number])
        : activeRoute.roadSegments.flatMap((s) => s.coordinates))
    : truck.path;

  if (path.length === 0) return toLatLng(NER_CENTER);
  if (path.length === 1) return toLatLng(path[0]);

  const distances = path.slice(1).map((point, index) => {
    const previous = path[index];
    return Math.hypot(point[0] - previous[0], point[1] - previous[1]);
  });
  const totalDistance = distances.reduce((total, distance) => total + distance, 0);
  let remaining = totalDistance * truck.progress;

  for (let index = 0; index < distances.length; index += 1) {
    if (remaining <= distances[index]) {
      const start = path[index];
      const end = path[index + 1];
      const ratio = distances[index] === 0 ? 0 : remaining / distances[index];
      return toLatLng([
        start[0] + (end[0] - start[0]) * ratio,
        start[1] + (end[1] - start[1]) * ratio
      ]);
    }
    remaining -= distances[index];
  }

  return toLatLng(path[path.length - 1]);
};

export const MapComponent: React.FC<MapProps> = (props) => {
  const {
    roads = [],
    locations,
    onRoadClick = () => undefined,
    trucks = [],
    selectedOrigin,
    selectedDestination,
    activeRoute,
    comparisonResult,
    incidents = DEMO_INCIDENTS,
    onIncidentClick,
  } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const mapsRef = useRef<typeof google.maps | null>(null);
  const alternativeRouteRefs = useRef<google.maps.Polyline[]>([]);
  const routeCasingRef = useRef<google.maps.Polyline | null>(null);
  const routeLineRef = useRef<google.maps.Polyline | null>(null);
  const turnMarkersRef = useRef<google.maps.Marker[]>([]);
  const truckMarkersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const locationMarkersRef = useRef<google.maps.Marker[]>([]);
  const incidentMarkersRef = useRef<google.maps.Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [googleRoutePath, setGoogleRoutePath] = useState<google.maps.LatLngLiteral[]>([]);
  const [routeDirections, setRouteDirections] = useState<GoogleRouteStep[]>([]);

  useEffect(() => {
    let cancelled = false;
    const initializeMap = async () => {
      const maps = await googleMapsService.loadGoogleMaps();
      if (cancelled) return;
      if (!maps || !containerRef.current) {
        setLoadError(true);
        return;
      }
      mapsRef.current = maps;
      mapRef.current = new maps.Map(containerRef.current, {
        center: toLatLng(NER_CENTER),
        zoom: 6,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [{ featureType: 'poi.business', stylers: [{ visibility: 'off' }] }]
      });
      setMapReady(true);
    };
    initializeMap();
    return () => {
      cancelled = true;
      routeCasingRef.current?.setMap(null);
      routeLineRef.current?.setMap(null);
      alternativeRouteRefs.current.forEach((line) => line.setMap(null));
      turnMarkersRef.current.forEach((marker) => marker.setMap(null));
      locationMarkersRef.current.forEach((marker) => marker.setMap(null));
      incidentMarkersRef.current.forEach((marker) => marker.setMap(null));
      truckMarkersRef.current.forEach((marker) => marker.setMap(null));
      truckMarkersRef.current.clear();
      mapRef.current = null;
      mapsRef.current = null;
    };
  }, []);

  const routeCacheRef = useRef<Map<string, { polylinePath: google.maps.LatLngLiteral[]; directions: GoogleRouteStep[] }>>(new Map());
  const activeRequestIdRef = useRef<number>(0);

  useEffect(() => {
    let cancelled = false;
    const origin = locations.find((location) => location.id === selectedOrigin);
    const destination = locations.find((location) => location.id === selectedDestination);

    if (!mapReady || !origin || !destination || activeRoute?.status !== 'SUCCESS') {
      setGoogleRoutePath([]);
      setRouteDirections([]);
      return () => { cancelled = true; };
    }

    const localPath = activeRoute.roadSegments.flatMap((segment, segmentIndex) => (
      segmentIndex === 0 ? segment.coordinates : segment.coordinates.slice(1)
    )).map(toLatLng);

    // Compute route cache key based on route path
    const routeSegmentsKey = `${selectedOrigin}->${selectedDestination}:${activeRoute.roadSegments.map(s => s.road_id).join(',')}`;
    const cached = routeCacheRef.current.get(routeSegmentsKey);
    if (cached) {
      setGoogleRoutePath(cached.polylinePath);
      setRouteDirections(cached.directions);
      return () => { cancelled = true; };
    }

    // Set fallback local OSM path immediately
    setGoogleRoutePath(localPath);

    const requestId = ++activeRequestIdRef.current;

    // Compute route through waypoints using Google Maps Directions API
    const intermediateCoords = activeRoute.roadSegments
      .slice(0, -1)
      .map((segment) => locations.find((l) => l.id === segment.end_node)?.coordinates)
      .filter((coordinates): coordinates is [number, number] => Boolean(coordinates));

    googleMapsService.computeTrafficAwareRoute(origin.coordinates, destination.coordinates, intermediateCoords)
      .then((result) => {
        if (!cancelled && requestId === activeRequestIdRef.current && result.status === 'SUCCESS' && (result.polylinePath?.length ?? 0) > 1) {
          const entry = { polylinePath: result.polylinePath!, directions: result.directions ?? [] };
          routeCacheRef.current.set(routeSegmentsKey, entry);
          setGoogleRoutePath(entry.polylinePath);
          setRouteDirections(entry.directions);
        }
      })
      .catch(() => undefined);

    return () => { cancelled = true; };
  }, [mapReady, activeRoute, selectedOrigin, selectedDestination, locations]);

  useEffect(() => {
    const map = mapRef.current;
    const maps = mapsRef.current;
    if (!map || !maps || !mapReady) return;

    locationMarkersRef.current.forEach((marker) => marker.setMap(null));
    locationMarkersRef.current = locations.map((location) => {
      const isOrigin = location.id === selectedOrigin;
      const isDestination = location.id === selectedDestination;
      return new maps.Marker({
        map,
        position: toLatLng(location.coordinates),
        title: `${location.name} (${location.state})`,
        label: isOrigin ? 'A' : isDestination ? 'B' : undefined,
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: isOrigin || isDestination ? 9 : 6,
          fillColor: isOrigin ? '#16A34A' : isDestination ? '#DC2626' : '#2563EB',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2
        },
        zIndex: isOrigin || isDestination ? 10 : 4
      });
    });

    incidentMarkersRef.current.forEach((marker) => marker.setMap(null));
    incidentMarkersRef.current = incidents.map((incident) => {
      const lat = incident.latitude ?? (incident.coordinates ? incident.coordinates[1] : 26.0);
      const lng = incident.longitude ?? (incident.coordinates ? incident.coordinates[0] : 92.0);
      const marker = new maps.Marker({
        map,
        position: { lat, lng },
        title: incident.description,
        label: { text: '!', color: '#FFFFFF', fontWeight: 'bold' },
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: incident.severity === 'CRITICAL' ? '#DC2626' : '#D97706',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2
        },
        zIndex: 8
      });
      marker.addListener('click', () => onIncidentClick?.(incident));
      return marker;
    });

    return () => {
      locationMarkersRef.current.forEach((marker) => marker.setMap(null));
      incidentMarkersRef.current.forEach((marker) => marker.setMap(null));
    };
  }, [mapReady, locations, incidents, selectedOrigin, selectedDestination, onIncidentClick]);

  useEffect(() => {
    const map = mapRef.current;
    const maps = mapsRef.current;
    if (!map || !maps || !mapReady) return;

    const activeTruckIds = new Set(trucks.map((truck) => truck.id));
    trucks.forEach((truck) => {
      const position = getTruckPosition(truck, activeRoute, googleRoutePath);
      const existingMarker = truckMarkersRef.current.get(truck.id);
      if (existingMarker) {
        existingMarker.setPosition(position);
        existingMarker.setTitle(`${truck.label} · ${truck.driver} · ${truck.status}`);
        return;
      }

      const marker = new maps.Marker({
        map,
        position,
        title: `${truck.label} · ${truck.driver} · ${truck.status}`,
        label: { text: '▰', color: '#FFFFFF', fontWeight: 'bold' },
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: 11,
          fillColor: truck.color,
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3
        },
        zIndex: 30
      });
      truckMarkersRef.current.set(truck.id, marker);
    });

    truckMarkersRef.current.forEach((marker, truckId) => {
      if (!activeTruckIds.has(truckId)) {
        marker.setMap(null);
        truckMarkersRef.current.delete(truckId);
      }
    });
  }, [mapReady, trucks, activeRoute, googleRoutePath]);

  useEffect(() => {
    const map = mapRef.current;
    const maps = mapsRef.current;
    if (!map || !maps || !mapReady) return;

    routeCasingRef.current?.setMap(null);
    routeLineRef.current?.setMap(null);
    alternativeRouteRefs.current.forEach((line) => line.setMap(null));
    alternativeRouteRefs.current = [];
    turnMarkersRef.current.forEach((marker) => marker.setMap(null));
    turnMarkersRef.current = [];
    const path = googleRoutePath;
    if (path.length > 1) {
      const routeColor = activeRoute?.mode === 'SAFEST' ? '#16A34A' : '#1A73E8';
      routeCasingRef.current = new maps.Polyline({
        map,
        path,
        geodesic: true,
        strokeColor: '#185ABC',
        strokeOpacity: 0.95,
        strokeWeight: 10,
        zIndex: 9
      });
      routeLineRef.current = new maps.Polyline({
        map,
        path,
        geodesic: true,
        strokeColor: routeColor,
        strokeOpacity: 1,
        strokeWeight: 6,
        zIndex: 10
      });
      const bounds = new maps.LatLngBounds();
      path.forEach((coordinate) => bounds.extend(coordinate));
      map.fitBounds(bounds, 60);
    } else {
      routeCasingRef.current = null;
      routeLineRef.current = null;
    }

    return () => {
      alternativeRouteRefs.current.forEach((line) => line.setMap(null));
      routeCasingRef.current?.setMap(null);
      routeLineRef.current?.setMap(null);
    };
  }, [mapReady, activeRoute, googleRoutePath]);

  const fitSelectedRoute = () => {
    const map = mapRef.current;
    const maps = mapsRef.current;
    if (!map || !maps || activeRoute?.status !== 'SUCCESS') return;
    const bounds = new maps.LatLngBounds();
    if (googleRoutePath.length > 1) {
      googleRoutePath.forEach((coordinate) => bounds.extend(coordinate));
    } else {
      activeRoute.roadSegments.forEach((segment) => segment.coordinates.forEach((coordinate) => bounds.extend(toLatLng(coordinate))));
    }
    map.fitBounds(bounds, 60);
  };

  const resetView = () => {
    mapRef.current?.setCenter(toLatLng(NER_CENTER));
    mapRef.current?.setZoom(6);
  };

  const formatStepDistance = (meters: number) => meters >= 1000
    ? `${(meters / 1000).toFixed(1)} km`
    : `${Math.max(50, Math.round(meters / 10) * 10)} m`;

  if (loadError) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <LocalFallbackMap
          roads={roads}
          locations={locations}
          onRoadClick={onRoadClick}
          trucks={trucks}
          selectedOrigin={selectedOrigin}
          selectedDestination={selectedDestination}
          activeRoute={activeRoute}
          comparisonResult={comparisonResult}
          incidents={incidents}
          onIncidentClick={onIncidentClick}
        />
        <div style={{
          position: 'absolute',
          bottom: '16px',
          right: '18px',
          zIndex: 30,
          backgroundColor: 'rgba(15, 23, 42, 0.90)',
          backdropFilter: 'blur(8px)',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '8px 12px',
          color: '#FBBF24',
          fontSize: '0.72rem',
          fontWeight: 700,
          boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
          maxWidth: '300px'
        }}>
          ⚠ Google Maps unavailable — SURAKSHA Local Map active
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#E8F0FE' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', top: '20px', right: '54px', display: 'flex', gap: '8px', zIndex: 10 }}>
        <button onClick={fitSelectedRoute} title="Fit selected route" style={{ background: '#0F2747', color: '#FFFFFF', border: 0, borderRadius: '6px', padding: '8px 10px', cursor: 'pointer', display: 'flex', gap: '5px', alignItems: 'center' }}>
          <Maximize size={14} /> Fit Route
        </button>
        <button onClick={resetView} title="Reset map view" style={{ background: '#0F2747', color: '#FFFFFF', border: 0, borderRadius: '6px', padding: '8px 10px', cursor: 'pointer', display: 'flex', gap: '5px', alignItems: 'center' }}>
          <RotateCcw size={14} /> Reset View
        </button>
      </div>
      {routeDirections.length > 0 && (
        <div style={{
          position: 'absolute',
          left: '18px',
          top: '18px',
          width: 'min(310px, calc(100% - 36px))',
          maxHeight: 'min(430px, calc(100% - 36px))',
          overflow: 'hidden',
          borderRadius: '10px',
          background: 'rgba(255,255,255,0.97)',
          boxShadow: '0 3px 14px rgba(15,39,71,0.24)',
          color: '#0B1B34',
          zIndex: 11
        }}>
          <div style={{ padding: '12px 14px', background: '#2954FF', color: '#FFFFFF' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.06em', opacity: 0.8 }}>NEXT DIRECTION</div>
            <div style={{ marginTop: '4px', fontSize: '0.9rem', lineHeight: 1.3, fontWeight: 800 }}>{routeDirections[0].instruction}</div>
            <div style={{ marginTop: '4px', fontSize: '0.72rem', opacity: 0.9 }}>{formatStepDistance(routeDirections[0].distanceMeters)}</div>
          </div>
          <div style={{ maxHeight: '280px', overflowY: 'auto', padding: '4px 0' }}>
            {routeDirections.slice(1).map((step, index) => (
              <div key={`${step.instruction}-${index}`} style={{ display: 'flex', gap: '10px', padding: '9px 14px', borderBottom: '1px solid #E3E8EF', fontSize: '0.72rem', lineHeight: 1.35 }}>
                <span style={{ minWidth: '18px', height: '18px', display: 'grid', placeItems: 'center', borderRadius: '50%', background: '#E8EEFF', color: '#2954FF', fontWeight: 800 }}>{index + 2}</span>
                <span style={{ flex: 1 }}>{step.instruction}</span>
                <span style={{ color: '#8794A6', whiteSpace: 'nowrap' }}>{formatStepDistance(step.distanceMeters)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
