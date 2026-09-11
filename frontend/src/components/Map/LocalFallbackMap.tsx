import React, { useMemo, useState } from 'react';
import { RotateCcw, ShieldAlert, Layers } from 'lucide-react';
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

// Bounding box for North Eastern Region map canvas projections
// Lng: 88.0 to 96.0, Lat: 23.0 to 28.5
const MAP_BOUNDS = {
  minLng: 88.0,
  maxLng: 96.0,
  minLat: 23.0,
  maxLat: 28.5
};

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
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Convert longitude / latitude coordinates to SVG percentage coordinates (0-1000 width, 0-600 height)
  const projectCoord = ([lng, lat]: [number, number]): { x: number; y: number } => {
    const normX = (lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng);
    const normY = (MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat); // Flip Y for SVG
    return {
      x: normX * 1000,
      y: normY * 600
    };
  };

  // Convert array of coordinates to SVG polyline path data string
  const toPathString = (coords: [number, number][]): string => {
    return coords.map((c, i) => {
      const p = projectCoord(c);
      return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    }).join(' ');
  };

  // Active route road ID set for quick highlighting
  const activeRoadIds = useMemo(() => {
    if (!activeRoute || activeRoute.status !== 'SUCCESS') return new Set<string>();
    return new Set(activeRoute.roadSegments.map((s) => s.road_id));
  }, [activeRoute]);

  // Alternate route road IDs
  const alternateRoadIds = useMemo(() => {
    if (!comparisonResult) return new Set<string>();
    const altRoute = activeRoute?.mode === 'SAFEST' ? comparisonResult.fastestRoute : comparisonResult.safestRoute;
    if (!altRoute || altRoute.status !== 'SUCCESS') return new Set<string>();
    return new Set(altRoute.roadSegments.map((s) => s.road_id));
  }, [comparisonResult, activeRoute]);

  // Calculate truck position along active route geometry
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
        const lng = start[0] + (end[0] - start[0]) * ratio;
        const lat = start[1] + (end[1] - start[1]) * ratio;
        return projectCoord([lng, lat]);
      }
      remaining -= distances[index];
    }
    return projectCoord(path[path.length - 1]);
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.25, 0.8));
  const handleResetView = () => { setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); };

  const originLocation = locations.find((l) => l.id === selectedOrigin);
  const destLocation = locations.find((l) => l.id === selectedDestination);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      backgroundColor: '#0B132B',
      color: '#F8FAFC',
      overflow: 'hidden',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Top Banner indicating SURAKSHA Local Map active */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '18px',
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        border: '1px solid #1E293B',
        padding: '6px 14px',
        borderRadius: '20px',
        boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
        fontSize: '0.72rem',
        fontWeight: 700,
        color: '#38BDF8'
      }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38BDF8', boxShadow: '0 0 8px #38BDF8' }} />
        SURAKSHA LOCAL DEMO MAP
        <span style={{ color: '#64748B', fontWeight: 500, fontSize: '0.68rem', marginLeft: '4px' }}>
          (OSM Vector Engine · Offline Capable)
        </span>
      </div>

      {/* Map Control Buttons */}
      <div style={{ position: 'absolute', top: '12px', right: '18px', display: 'flex', gap: '8px', zIndex: 20 }}>
        <button
          onClick={() => setShowRisks((r) => !r)}
          style={{
            backgroundColor: showRisks ? '#0369A1' : '#1E293B',
            color: '#FFFFFF',
            border: '1px solid #334155',
            borderRadius: '6px',
            padding: '6px 10px',
            fontSize: '0.72rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <ShieldAlert size={13} /> {showRisks ? 'Hide Risk Overlays' : 'Show Risk Overlays'}
        </button>
        <button
          onClick={() => setShowIncidents((i) => !i)}
          style={{
            backgroundColor: showIncidents ? '#0369A1' : '#1E293B',
            color: '#FFFFFF',
            border: '1px solid #334155',
            borderRadius: '6px',
            padding: '6px 10px',
            fontSize: '0.72rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Layers size={13} /> {showIncidents ? 'Hide Incidents' : 'Show Incidents'}
        </button>
        <button onClick={handleResetView} title="Reset View" style={{ backgroundColor: '#1E293B', color: '#FFFFFF', border: '1px solid #334155', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer' }}>
          <RotateCcw size={14} />
        </button>
        <button onClick={handleZoomIn} title="Zoom In" style={{ backgroundColor: '#1E293B', color: '#FFFFFF', border: '1px solid #334155', borderRadius: '6px', padding: '6px 10px', fontWeight: 800, cursor: 'pointer' }}>
          +
        </button>
        <button onClick={handleZoomOut} title="Zoom Out" style={{ backgroundColor: '#1E293B', color: '#FFFFFF', border: '1px solid #334155', borderRadius: '6px', padding: '6px 10px', fontWeight: 800, cursor: 'pointer' }}>
          -
        </button>
      </div>

      {/* SVG Canvas Map Layer */}
      <div style={{
        width: '100%',
        height: '100%',
        transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
        transformOrigin: 'center center',
        transition: 'transform 0.15s ease-out'
      }}>
        <svg width="100%" height="100%" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" style={{ display: 'block' }}>
          <defs>
            {/* Grid background pattern */}
            <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
            </pattern>
            {/* Glow filters */}
            <filter id="glowRoute" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background & Grid */}
          <rect width="1000" height="600" fill="#0B132B" />
          <rect width="1000" height="600" fill="url(#gridPattern)" />

          {/* State / Region Outlines & Water features representation */}
          <path d="M 120 180 Q 250 150 450 190 T 850 160" fill="none" stroke="rgba(56, 189, 248, 0.08)" strokeWidth="12" />
          <text x="140" y="140" fill="rgba(255,255,255,0.12)" fontSize="18" fontWeight="800" letterSpacing="0.1em">ASSAM</text>
          <text x="350" y="320" fill="rgba(255,255,255,0.10)" fontSize="16" fontWeight="800" letterSpacing="0.1em">MEGHALAYA</text>
          <text x="600" y="460" fill="rgba(255,255,255,0.10)" fontSize="16" fontWeight="800" letterSpacing="0.1em">MIZORAM</text>
          <text x="750" y="360" fill="rgba(255,255,255,0.10)" fontSize="16" fontWeight="800" letterSpacing="0.1em">MANIPUR</text>
          <text x="780" y="240" fill="rgba(255,255,255,0.10)" fontSize="16" fontWeight="800" letterSpacing="0.1em">NAGALAND</text>
          <text x="420" y="520" fill="rgba(255,255,255,0.10)" fontSize="16" fontWeight="800" letterSpacing="0.1em">TRIPURA</text>

          {/* 1. Base Inactive Road Network */}
          {roads.map((road) => {
            const isActive = activeRoadIds.has(road.road_id);
            const isAlternate = alternateRoadIds.has(road.road_id);
            if (isActive || isAlternate) return null; // Render active/alternate routes on top

            const isBlocked = road.status === 'BLOCKED';
            const isRisky = road.status === 'RISKY';
            const strokeColor = isBlocked ? '#EF4444' : isRisky ? '#F59E0B' : 'rgba(148, 163, 184, 0.22)';
            const strokeDash = isBlocked ? '6 4' : undefined;

            return (
              <g key={`road-${road.road_id}`}>
                <path
                  d={toPathString(road.coordinates)}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isRisky ? 3 : 2}
                  strokeDasharray={strokeDash}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}

          {/* 2. Alternate Route Layer */}
          {roads.map((road) => {
            if (!alternateRoadIds.has(road.road_id)) return null;
            return (
              <path
                key={`alt-road-${road.road_id}`}
                d={toPathString(road.coordinates)}
                fill="none"
                stroke="#64748B"
                strokeWidth="5"
                strokeDasharray="8 6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.85"
              />
            );
          })}

          {/* 3. Active Selected Route Layer */}
          {roads.map((road) => {
            if (!activeRoadIds.has(road.road_id)) return null;
            const routeColor = activeRoute?.mode === 'SAFEST' ? '#10B981' : '#3B82F6';
            const casingColor = activeRoute?.mode === 'SAFEST' ? '#047857' : '#1D4ED8';

            return (
              <g key={`active-road-${road.road_id}`}>
                {/* Route Casing / Outer Glow */}
                <path
                  d={toPathString(road.coordinates)}
                  fill="none"
                  stroke={casingColor}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.9"
                  filter="url(#glowRoute)"
                />
                {/* Inner Core Polyline */}
                <path
                  d={toPathString(road.coordinates)}
                  fill="none"
                  stroke={routeColor}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}

          {/* 4. Risk Overlays */}
          {showRisks && roads.map((road) => {
            if (road.status !== 'RISKY' && road.status !== 'BLOCKED') return null;
            const centerIdx = Math.floor(road.coordinates.length / 2);
            const pt = projectCoord(road.coordinates[centerIdx] || [92, 25]);
            const isBlocked = road.status === 'BLOCKED';

            return (
              <g key={`risk-overlay-${road.road_id}`}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isBlocked ? "24" : "18"}
                  fill={isBlocked ? "rgba(239, 68, 68, 0.25)" : "rgba(245, 158, 11, 0.22)"}
                  stroke={isBlocked ? "#EF4444" : "#F59E0B"}
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
              </g>
            );
          })}

          {/* 5. Incidents Markers */}
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
                <circle cx={pt.x} cy={pt.y} r="10" fill={isCritical ? "#DC2626" : "#D97706"} stroke="#FFFFFF" strokeWidth="2" />
                <text x={pt.x} y={pt.y + 4} textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="900">!</text>
              </g>
            );
          })}

          {/* 6. Location Nodes */}
          {locations.map((loc) => {
            const pt = projectCoord(loc.coordinates);
            const isOrigin = loc.id === selectedOrigin;
            const isDest = loc.id === selectedDestination;
            const fill = isOrigin ? '#16A34A' : isDest ? '#DC2626' : '#2563EB';

            return (
              <g key={`loc-${loc.id}`}>
                <circle cx={pt.x} cy={pt.y} r={isOrigin || isDest ? "8" : "5"} fill={fill} stroke="#FFFFFF" strokeWidth="2" />
                <text
                  x={pt.x}
                  y={pt.y - 12}
                  textAnchor="middle"
                  fill="#F8FAFC"
                  fontSize={isOrigin || isDest ? "12" : "10"}
                  fontWeight={isOrigin || isDest ? "800" : "600"}
                  style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
                >
                  {loc.name} {isOrigin ? '(Origin)' : isDest ? '(Dest)' : ''}
                </text>
              </g>
            );
          })}

          {/* 7. Live Vehicle Markers */}
          {trucks.map((truck) => {
            const pt = getTruckPos(truck);
            return (
              <g key={`truck-${truck.id}`}>
                <circle cx={pt.x} cy={pt.y} r="12" fill={truck.color} stroke="#FFFFFF" strokeWidth="3" />
                <text x={pt.x} y={pt.y + 3} textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="900">
                  {truck.label.includes('204') ? '204' : '▰'}
                </text>
                <text
                  x={pt.x}
                  y={pt.y + 24}
                  textAnchor="middle"
                  fill="#38BDF8"
                  fontSize="10"
                  fontWeight="800"
                  style={{ textShadow: '0 2px 4px rgba(0,0,0,0.9)' }}
                >
                  {truck.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend & Summary Info Box */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '18px',
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(8px)',
        border: '1px solid #1E293B',
        padding: '10px 14px',
        borderRadius: '10px',
        fontSize: '0.72rem',
        color: '#94A3B8',
        boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <div style={{ fontWeight: 800, color: '#F8FAFC', marginBottom: '2px' }}>
          MISSION CORRIDOR: {originLocation?.name || selectedOrigin} → {destLocation?.name || selectedDestination}
        </div>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '12px', height: '4px', borderRadius: '2px', backgroundColor: activeRoute?.mode === 'SAFEST' ? '#10B981' : '#3B82F6' }} />
            Active ({activeRoute?.mode || 'FASTEST'})
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '12px', height: '4px', borderRadius: '2px', backgroundColor: '#64748B' }} />
            Alternate
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
            Blocked Hazard
          </span>
        </div>
      </div>
    </div>
  );
};
