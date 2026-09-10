import React from 'react';
import type { Alert, AlertStatus } from '../../types/alert';
import { X, AlertTriangle, ShieldAlert, Info, CheckCircle2, Navigation } from 'lucide-react';

interface AlertDetailsProps {
  alert: Alert | null;
  onClose: () => void;
  onUpdateStatus: (alertId: string, newStatus: AlertStatus) => void;
  onSwitchToSafestRoute?: () => void;
}

export const AlertDetailsModal: React.FC<AlertDetailsProps> = ({
  alert,
  onClose,
  onUpdateStatus,
  onSwitchToSafestRoute,
}) => {
  if (!alert) return null;

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <span style={{ backgroundColor: '#ef4444', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>CRITICAL</span>;
      case 'HIGH':
        return <span style={{ backgroundColor: '#f97316', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>HIGH</span>;
      case 'MEDIUM':
        return <span style={{ backgroundColor: '#eab308', color: '#0f172a', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>MEDIUM</span>;
      default:
        return <span style={{ backgroundColor: '#38bdf8', color: '#0f172a', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>LOW</span>;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100
    }}>
      <div style={{
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '12px',
        width: '460px',
        padding: '24px',
        color: '#f8fafc',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              {getSeverityBadge(alert.severity)}
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{alert.alert_id}</span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
              {alert.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem', borderTop: '1px solid #334155', paddingTop: '16px' }}>
          {alert.road_id && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Affected Road:</span>
              <span style={{ fontWeight: 600, color: '#38bdf8' }}>{alert.road_id}</span>
            </div>
          )}
          {alert.risk_probability !== undefined && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Risk Probability:</span>
              <span style={{ fontWeight: 700, color: alert.risk_probability > 0.7 ? '#ef4444' : '#eab308' }}>
                {Math.round(alert.risk_probability * 100)}%
              </span>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ color: '#94a3b8' }}>Cause:</span>
            <span style={{ fontWeight: 500, color: '#cbd5e1' }}>{alert.cause}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ color: '#94a3b8' }}>Description:</span>
            <span style={{ fontWeight: 500, color: '#cbd5e1' }}>{alert.message}</span>
          </div>

          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #0284c7',
            borderRadius: '8px',
            padding: '12px',
            marginTop: '8px'
          }}>
            <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700, marginBottom: '4px', letterSpacing: '0.05em' }}>
              RECOMMENDED ACTION
            </div>
            <div style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 600 }}>
              {alert.recommended_action}
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #334155' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {alert.status === 'ACTIVE' && (
              <button
                onClick={() => onUpdateStatus(alert.alert_id, 'ACKNOWLEDGED')}
                style={{
                  backgroundColor: '#334155',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Acknowledge
              </button>
            )}
            {alert.status !== 'RESOLVED' && (
              <button
                onClick={() => onUpdateStatus(alert.alert_id, 'RESOLVED')}
                style={{
                  backgroundColor: '#059669',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Resolve Alert
              </button>
            )}
          </div>

          {alert.type === 'REROUTING_RECOMMENDATION' && onSwitchToSafestRoute && (
            <button
              onClick={() => {
                onSwitchToSafestRoute();
                onClose();
              }}
              style={{
                backgroundColor: '#22c55e',
                border: 'none',
                borderRadius: '6px',
                color: '#0f172a',
                padding: '8px 14px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Navigation size={14} /> Switch to Safest Route
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
