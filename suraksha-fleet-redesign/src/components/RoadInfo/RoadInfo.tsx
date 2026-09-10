import React from 'react';
import type { ExtendedRoadSegment } from '../../types/road';
import { X, AlertTriangle, CheckCircle, ShieldAlert, Cpu } from 'lucide-react';
import { theme } from '../../theme';

const { color, radius, shadow } = theme;

interface RoadInfoProps {
  road: ExtendedRoadSegment | null;
  onClose: () => void;
}

export const RoadInfo: React.FC<RoadInfoProps> = ({ road, onClose }) => {
  if (!road) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#4ADE80', fontWeight: 600 }}>
            <CheckCircle size={16} /> OPEN
          </span>
        );
      case 'RISKY':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#FBBF24', fontWeight: 600 }}>
            <AlertTriangle size={16} /> RISKY
          </span>
        );
      case 'BLOCKED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#F87171', fontWeight: 600 }}>
            <ShieldAlert size={16} /> BLOCKED
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const getRiskLevelBadge = (level?: string) => {
    switch (level) {
      case 'LOW':
        return <span style={{ color: '#4ADE80', fontWeight: 700 }}>LOW</span>;
      case 'MEDIUM':
        return <span style={{ color: '#FBBF24', fontWeight: 700 }}>MEDIUM</span>;
      case 'HIGH':
        return <span style={{ color: '#F87171', fontWeight: 700 }}>HIGH</span>;
      default:
        return <span style={{ color: color.onDarkMuted }}>N/A</span>;
    }
  };

  const probPercent = road.ai_risk
    ? Math.round(road.ai_risk.disruption_probability * 100)
    : null;

  return (
    <div style={{
      position: 'absolute',
      top: '24px',
      left: '24px',
      backgroundColor: 'rgba(11, 27, 52, 0.96)',
      backdropFilter: 'blur(14px)',
      border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: radius.lg,
      padding: '16px',
      color: color.onDark,
      zIndex: 20,
      width: '320px',
      boxShadow: shadow.lg
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: '#7DD3FC', fontWeight: 600, letterSpacing: '0.05em' }}>
            {road.road_id}
          </span>
          <h3 style={{ margin: '2px 0 0 0', fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
            {road.name}
          </h3>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: color.onDarkMuted,
            cursor: 'pointer',
            padding: '4px',
            borderRadius: radius.sm
          }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem', borderTop: '1px solid rgba(255,255,255,0.10)', paddingTop: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: color.onDarkMuted }}>Distance:</span>
          <span style={{ fontWeight: 600, color: '#ffffff' }}>{road.distance_km} km</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: color.onDarkMuted }}>Estimated time:</span>
          <span style={{ fontWeight: 600, color: '#ffffff' }}>{road.travel_time_min} mins</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: color.onDarkMuted }}>Current status:</span>
          {getStatusBadge(road.status)}
        </div>

        {/* AI Disruption Risk Section */}
        <div style={{
          marginTop: '6px',
          padding: '12px',
          borderRadius: radius.md,
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#7DD3FC', marginBottom: '8px' }}>
            <Cpu size={14} /> AI disruption risk
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: color.onDarkMuted }}>Disruption risk:</span>
            <span style={{ fontWeight: 700, color: '#ffffff' }}>
              {probPercent !== null ? `${probPercent}%` : 'N/A'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: color.onDarkMuted }}>Risk level:</span>
            {getRiskLevelBadge(road.ai_risk?.risk_level)}
          </div>
        </div>
      </div>
    </div>
  );
};
