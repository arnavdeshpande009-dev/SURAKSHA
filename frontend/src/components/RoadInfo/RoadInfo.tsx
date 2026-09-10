import React from 'react';
import type { ExtendedRoadSegment } from '../../types/road';
import { X, AlertTriangle, CheckCircle, ShieldAlert, Cpu } from 'lucide-react';

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
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#22c55e', fontWeight: 600 }}>
            <CheckCircle size={16} /> OPEN
          </span>
        );
      case 'RISKY':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#eab308', fontWeight: 600 }}>
            <AlertTriangle size={16} /> RISKY
          </span>
        );
      case 'BLOCKED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontWeight: 600 }}>
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
        return <span style={{ color: '#22c55e', fontWeight: 700 }}>LOW</span>;
      case 'MEDIUM':
        return <span style={{ color: '#eab308', fontWeight: 700 }}>MEDIUM</span>;
      case 'HIGH':
        return <span style={{ color: '#ef4444', fontWeight: 700 }}>HIGH</span>;
      default:
        return <span style={{ color: '#94a3b8' }}>N/A</span>;
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
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(12px)',
      border: '1px solid #334155',
      borderRadius: '8px',
      padding: '16px',
      color: '#f8fafc',
      zIndex: 20,
      width: '320px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600, letterSpacing: '0.05em' }}>
            {road.road_id}
          </span>
          <h3 style={{ margin: '2px 0 0 0', fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>
            {road.name}
          </h3>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px'
          }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem', borderTop: '1px solid #334155', paddingTop: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Distance:</span>
          <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{road.distance_km} km</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Estimated Time:</span>
          <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{road.travel_time_min} mins</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#94a3b8' }}>Current Status:</span>
          {getStatusBadge(road.status)}
        </div>

        {/* AI Disruption Risk Section */}
        <div style={{
          marginTop: '6px',
          padding: '12px',
          borderRadius: '6px',
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#38bdf8', marginBottom: '8px' }}>
            <Cpu size={14} /> AI DISRUPTION RISK
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: '#94a3b8' }}>Disruption Risk:</span>
            <span style={{ fontWeight: 700, color: '#f8fafc' }}>
              {probPercent !== null ? `${probPercent}%` : 'N/A'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>Risk Level:</span>
            {getRiskLevelBadge(road.ai_risk?.risk_level)}
          </div>
        </div>
      </div>
    </div>
  );
};
