import React, { useMemo, useState } from 'react';
import { RotateCcw, ShieldAlert, Layers, Navigation, Locate } from 'lucide-react';
import type { ExtendedRoadSegment, LocationNode } from '../../types/road';
import type { RouteResult, RouteComparisonResult } from '../../routing/types';
import type { DemoIncident } from '../../types/alert';
import type { SimulatedTruck } from '../../data/fleet';

export interface MapProps {
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

export const LocalFallbackMap: React.FC<MapProps> = ({
  roads,
  locations,
  trucks = [],
  selectedOrigin,
  selectedDestination,
  activeRoute,
  comparisonResult,
  incidents = [],
  onIncidentClick,
}) => {
  const [showRisks, setShowRisks] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [userZoom, setUserZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [followVehicle, setFollowVehicle] = useState(false);

  const originLocation = useMemo(() => locations.find((l) => l.id === selectedOrigin), [locations, selectedOrigin]);
  const destLocation = useMemo(() => locations.find((l) => l.id === selectedDestination), [locations, selectedDestination]);

  // Compute dynamic route-focused bounding box for active mission corridor with padding
  const viewportBounds = useMemo(() => {
    const coords: [number, number][] = [];

    if (activeRoute && activeRoute.status === 'SUCCESS' && activeRoute.roadSegments.length > 0) {
      activeRoute.roadSegments.forEach((s) => s.coordinates.forEach((c) => coords.push(c)));
    }
    if (comparisonResult?.fastestRoute?.status === 'SUCCESS') {
      comparisonResult.fastestRoute.roadSegments.forEach((s) => s.coordinates.forEach((c) => coords.push(c)));
    }
    if (comparisonResult?.safestRoute?.status === 'SUCCESS') {
      comparisonResult.safestRoute.roadSegments.forEach((s) => s.coordinates.forEach((c) => coords.push(c)));
    }
    if (originLocation) coords.push(originLocation.coordinates);
    if (destLocation) coords.push(destLocation.coordinates);

    if (coords.length === 0) {
      return { minLng: 88.0, maxLng: 96.0, minLat: 23.0, maxLat: 28.5 };
    }

    let minLng = Math.min(...coords.map((c) => c[0]));
    let maxLng = Math.max(...coords.map((c) => c[0]));
    let minLat = Math.min(...coords.map((c) => c[1]));
    let maxLat = Math.max(...coords.map((c) => c[1]));

    // Add 25% padding buffer around route corridor
    const lngPad = Math.max(0.4, (maxLng - minLng) * 0.25);
    const latPad = Math.max(0.3, (maxLat - minLat) * 0.25);

    // Account for right sidebar offset by pushing maxLng right padding
    return {
      minLng: minLng - lngPad * 0.8,
      maxLng: maxLng + lngPad * 1.4,
      minLat: minLat - latPad,
      maxLat: maxLat + latPad
    };
  }, [activeRoute, comparisonResult, originLocation, destLocation]);

  // Dynamic projection from lat/lng to SVG viewport (1000 x 600)
  const projectCoord = ([lng, lat]: [number, number]): { x: number; y: number } => {
    const normX = (lng - viewportBounds.minLng) / (viewportBounds.maxLng - viewportBounds.minLng || 1);
    const normY = (viewportBounds.maxLat - lat) / (viewportBounds.maxLat - viewportBounds.minLat || 1);
    return {
      x: normX * 1000,
      y: normY * 600
    };
  };

  const toPathString = (coords: [number, number][]): string => {
    return coords.map((c, i) => {
      const p = projectCoord(c);
      return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    }).join(' ');
  };

  // Filter roads within corridor viewport for maximum SVG performance
  const corridorRoads = useMemo(() => {
    return roads.filter((r) => {
      return r.coordinates.some(([lng, lat]) => (
        lng >= viewportBounds.minLng - 1 && lng <= viewportBounds.maxLng + 1 &&
        lat >= viewportBounds.minLat - 1 && lat <= viewportBounds.maxLat + 1
      ));
    });
  }, [roads, viewportBounds]);

  const activeRoadIds = useMemo(() => {
    if (!activeRoute || activeRoute.status !== 'SUCCESS') return new Set<string>();
    return new Set(activeRoute.roadSegments.map((s) => s.road_id));
  }, [activeRoute]);

  const alternateRoadIds = useMemo(() => {
    if (!comparisonResult) return new Set<string>();
    const altRoute = activeRoute?.mode === 'SAFEST' ? comparisonResult.fastestRoute : comparisonResult.safestRoute;
    if (!altRoute || altRoute.status !== 'SUCCESS') return new Set<string>();
    return new Set(altRoute.roadSegments.map((s) => s.road_id));
  }, [comparisonResult, activeRoute]);

  const getTruckPos = (truck: SimulatedTruck): { x: number; y: number } => {
    const isEmergencyTruck = truck.id === 'TRK-101' || truck.label.includes('204') || truck.label.includes('SURAKSHA');
    const path: [number, number][] = (activeRoute && activeRoute.status === 'SUCCESS' && isEmergencyTruck)
      ? activeRoute.roadSegments.flatMap((s) => s.coordinates)
      : truck.path;

    if (path.length === 0) return projectCoord([92.5, 25.8]);
    if (path.length === 1) return projectCoord(path[0]);

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
        return projectCoord([
          start[0] + (end[0] - start[0]) * ratio,
          start[1] + (end[1] - start[1]) * ratio
        ]);
      }
      remaining -= distances[index];
    }
    return projectCoord(path[path.length - 1]);
  };

  const handleZoomIn = () => setUserZoom((z) => Math.min(z + 0.25, 2.5));
  const handleZoomOut = () => setUserZoom((z) => Math.max(z - 0.25, 0.7));
  const handleResetView = () => { setUserZoom(1); setPanOffset({ x: 0, y: 0 }); setFollowVehicle(false); };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      backgroundColor: '#F1F5F9', // Clean light navigation basemap background
      color: '#0F172A',
      overflow: 'hidden',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Top Banner: Navigation status & mode indicator */}
      <div style={{
        position: 'absolute',
        top: '14px',
        left: '18px',
        zIndex: 25,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #CBD5E1',
        padding: '6px 14px',
        borderRadius: '20px',
        boxShadow: '0 4px 14px rgba(15, 23, 42, 0.08)',
        fontSize: '0.75rem',
        fontWeight: 700,
        color: '#0F172A'
      }}>
        <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#2563EB', boxShadow: '0 0 6px #2563EB' }} />
        SURAKSHA LOCAL MAP ENGINE
        <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.7rem' }}>
          • Corridors: {originLocation?.name || 'Origin'} → {destLocation?.name || 'Destination'}
        </span>
      </div>

      {/* Map Control Toolbar */}
      <div style={{ position: 'absolute', top: '14px', right: '18px', display: 'flex', gap: '8px', zIndex: 25 }}>
        <button
          onClick={() => setFollowVehicle((f) => !f)}
          style={{
            backgroundColor: followVehicle ? '#2563EB' : '#FFFFFF',
            color: followVehicle ? '#FFFFFF' : '#334155',
            border: '1px solid #CBD5E1',
            borderRadius: '6px',
            padding: '6px 10px',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
          }}
        >
          <Locate size={13} /> {followVehicle ? 'Following Truck' : 'Focus Vehicle'}
        </button>
        <button
          onClick={() => setShowRisks((r) => !r)}
          style={{
            backgroundColor: showRisks ? '#0284C7' : '#FFFFFF',
            color: showRisks ? '#FFFFFF' : '#334155',
            border: '1px solid #CBD5E1',
            borderRadius: '6px',
            padding: '6px 10px',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
          }}
        >
          <ShieldAlert size={13} /> {showRisks ? 'Risks On' : 'Risks Off'}
        </button>
        <button
          onClick={() => setShowIncidents((i) => !i)}
          style={{
            backgroundColor: showIncidents ? '#0284C7' : '#FFFFFF',
            color: showIncidents ? '#FFFFFF' : '#334155',
            border: '1px solid #CBD5E1',
            borderRadius: '6px',
            padding: '6px 10px',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
          }}
        >
          <Layers size={13} /> {showIncidents ? 'Incidents On' : 'Incidents Off'}
        </button>
        <button onClick={handleResetView} title="Fit Route Corridor" style={{ backgroundColor: '#FFFFFF', color: '#334155', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer' }}>
          <RotateCcw size={14} />
        </button>
        <button onClick={handleZoomIn} title="Zoom In" style={{ backgroundColor: '#FFFFFF', color: '#334155', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '6px 10px', fontWeight: 800, cursor: 'pointer' }}>
          +
        </button>
        <button onClick={handleZoomOut} title="Zoom Out" style={{ backgroundColor: '#FFFFFF', color: '#334155', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '6px 10px', fontWeight: 800, cursor: 'pointer' }}>
          -
        </button>
      </div>

      {/* Main Vector Map SVG Layer */}
      <div style={{
        width: '100%',
        height: '100%',
        transform: `scale(${userZoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
        transformOrigin: 'center center',
        transition: 'transform 0.2s ease-out'
      }}>
        <svg width="100%" height="100%" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" style={{ display: 'block' }}>
          <defs>
            <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Clean Light Basemap Background */}
          <rect width="1000" height="600" fill="#F8FAFC" />

          {/* 1. Base OSM Road Network */}
          {corridorRoads.map((road) => {
            const isActive = activeRoadIds.has(road.road_id);
            const isAlternate = alternateRoadIds.has(road.road_id);
            if (isActive || isAlternate) return null;

            const isBlocked = road.status === 'BLOCKED';
            const isRisky = road.status === 'RISKY';
            const strokeColor = isBlocked ? '#EF4444' : isRisky ? '#F59E0B' : '#CBD5E1';
            const strokeDash = isBlocked ? '6 4' : undefined;

            return (
              <path
                key={`road-${road.road_id}`}
                d={toPathString(road.coordinates)}
                fill="none"
                stroke={strokeColor}
                strokeWidth={isRisky ? 4 : 2}
                strokeDasharray={strokeDash}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}

          {/* 2. Alternate Route Polyline */}
          {corridorRoads.map((road) => {
            if (!alternateRoadIds.has(road.road_id)) return null;
            return (
              <path
                key={`alt-road-${road.road_id}`}
                d={toPathString(road.coordinates)}
                fill="none"
                stroke="#64748B"
                strokeWidth="6"
                strokeDasharray="8 6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.85"
              />
            );
          })}

          {/* 3. Primary Active Route Polyline (Google Blue or Safest Green) */}
          {corridorRoads.map((road) => {
            if (!activeRoadIds.has(road.road_id)) return null;
            const routeColor = activeRoute?.mode === 'SAFEST' ? '#16A34A' : '#1D4ED8';
            const casingColor = activeRoute?.mode === 'SAFEST' ? '#15803D' : '#1E40AF';

            return (
              <g key={`active-road-${road.road_id}`}>
                {/* Polyline Casing */}
                <path
                  d={toPathString(road.coordinates)}
                  fill="none"
                  stroke={casingColor}
                  strokeWidth="11"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.9"
                  filter="url(#routeGlow)"
                />
                {/* Polyline Inner */}
                <path
                  d={toPathString(road.coordinates)}
                  fill="none"
                  stroke={routeColor}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}

          {/* 4. Risk Zone Overlays */}
          {showRisks && corridorRoads.map((road) => {
            if (road.status !== 'RISKY' && road.status !== 'BLOCKED') return null;
            const centerIdx = Math.floor(road.coordinates.length / 2);
            const pt = projectCoord(road.coordinates[centerIdx] || [92, 25]);
            const isBlocked = road.status === 'BLOCKED';

            return (
              <g key={`risk-${road.road_id}`}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isBlocked ? "22" : "16"}
                  fill={isBlocked ? "rgba(239, 68, 68, 0.20)" : "rgba(245, 158, 11, 0.18)"}
                  stroke={isBlocked ? "#DC2626" : "#D97706"}
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
              </g>
            );
          })}

          {/* 5. Incident Hazards */}
          {showIncidents && incidents.map((incident) => {
            const lat = incident.latitude ?? (incident.coordinates ? incident.coordinates[1] : 25.5);
            const lng = incident.longitude ?? (incident.coordinates ? incident.coordinates[0] : 92.5);
            const pt = projectCoord([lng, lat]);
            const isCritical = incident.severity === 'CRITICAL';

            return (
              <g
                key={`inc-${incident.incident_id || incident.id || Math.random()}`}
                onClick={() => onIncidentClick?.(incident)}
                style={{ cursor: 'pointer' }}
              >
                <circle cx={pt.x} cy={pt.y} r="12" fill={isCritical ? "#DC2626" : "#D97706"} stroke="#FFFFFF" strokeWidth="2.5" />
                <text x={pt.x} y={pt.y + 4} textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="900">!</text>
              </g>
            );
          })}

          {/* 6. Corridor Locations (Origin & Destination Navigation Cards) */}
          {locations.map((loc) => {
            const pt = projectCoord(loc.coordinates);
            const isOrigin = loc.id === selectedOrigin;
            const isDest = loc.id === selectedDestination;
            if (!isOrigin && !isDest) return null; // Only render active mission Origin and Destination pins

            const pinColor = isOrigin ? '#16A34A' : '#DC2626';

            return (
              <g key={`loc-pin-${loc.id}`}>
                {/* Pin Shadow */}
                <ellipse cx={pt.x} cy={pt.y + 4} rx="8" ry="4" fill="rgba(0,0,0,0.2)" />
                {/* Pin Circle */}
                <circle cx={pt.x} cy={pt.y} r="10" fill={pinColor} stroke="#FFFFFF" strokeWidth="3" />
                <text x={pt.x} y={pt.y + 4} textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="900">
                  {isOrigin ? 'A' : 'B'}
                </text>
                {/* Navigation Location Label Box */}
                <g transform={`translate(${pt.x}, ${pt.y - 20})`}>
                  <rect x="-45" y="-14" width="90" height="20" rx="4" fill="#0F172A" opacity="0.9" />
                  <text x="0" y="0" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="800">
                    {loc.name}
                  </text>
                </g>
              </g>
            );
          })}

          {/* 7. Active Vehicle Marker (SURAKSHA Truck Telemetry) */}
          {trucks.map((truck) => {
            const pt = getTruckPos(truck);
            return (
              <g key={`truck-marker-${truck.id}`}>
                <circle cx={pt.x} cy={pt.y} r="14" fill={truck.color} stroke="#FFFFFF" strokeWidth="3" />
                <text x={pt.x} y={pt.y + 4} textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="900">
                  ▰
                </text>
                {/* Vehicle Pill */}
                <g transform={`translate(${pt.x}, ${pt.y + 24})`}>
                  <rect x="-40" y="-12" width="80" height="18" rx="9" fill="#1E293B" stroke="#FFFFFF" strokeWidth="1.5" />
                  <text x="0" y="1" textAnchor="middle" fill="#38BDF8" fontSize="9" fontWeight="800">
                    {truck.label}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Compact Route Navigation Overlay Panel */}
      <div style={{
        position: 'absolute',
        bottom: '18px',
        left: '18px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #CBD5E1',
        padding: '12px 16px',
        borderRadius: '12px',
        fontSize: '0.78rem',
        color: '#0F172A',
        boxShadow: '0 4px 18px rgba(15, 23, 42, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        minWidth: '260px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px' }}>
          <div style={{ fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Navigation size={15} color="#2563EB" />
            {originLocation?.name || 'Origin'} → {destLocation?.name || 'Destination'}
          </div>
          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#2563EB', backgroundColor: '#EFF6FF', padding: '2px 6px', borderRadius: '4px' }}>
            {activeRoute?.mode || 'FASTEST'}
          </span>
        </div>

        {activeRoute && activeRoute.status === 'SUCCESS' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>
            <span>ETA: {Math.floor(activeRoute.totalTravelTimeMin / 60)}h {activeRoute.totalTravelTimeMin % 60}m</span>
            <span>Distance: {activeRoute.totalDistanceKm.toFixed(1)} km</span>
            <span style={{ color: activeRoute.riskMetrics.routeRiskLevel === 'HIGH' ? '#DC2626' : '#16A34A' }}>
              Risk: {activeRoute.riskMetrics.routeRiskLevel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
