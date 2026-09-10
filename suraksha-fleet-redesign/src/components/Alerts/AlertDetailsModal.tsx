import React from 'react';
import type { Alert, AlertStatus } from '../../types/alert';
import { X, Navigation } from 'lucide-react';
import { theme } from '../../theme';

const { color, radius, shadow } = theme;

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
    const base: React.CSSProperties = { padding: '2px 9px', borderRadius: radius.pill, fontWeight: 700, fontSize: '0.72rem' };
    switch (severity) {
      case 'CRITICAL':
        return <span style={{ ...base, backgroundColor: color.dangerSoft, color: color.danger }}>CRITICAL</span>;
      case 'HIGH':
        return <span style={{ ...base, backgroundColor: 'rgba(234,122,26,0.12)', color: '#B4560A' }}>HIGH</span>;
      case 'MEDIUM':
        return <span style={{ ...base, backgroundColor: color.warningSoft, color: color.warning }}>MEDIUM</span>;
      default:
        return <span style={{ ...base, backgroundColor: color.accentSoft, color: color.accent }}>LOW</span>;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(11, 27, 52, 0.55)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100
    }}>
      <div style={{
        backgroundColor: color.surface,
        border: `1px solid ${color.border}`,
        borderRadius: radius.xl,
        width: '460px',
        padding: '24px',
        color: color.textPrimary,
        boxShadow: shadow.lg
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              {getSeverityBadge(alert.severity)}
              <span style={{ fontSize: '0.75rem', color: color.textMuted, fontWeight: 600 }}>{alert.alert_id}</span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: color.navy }}>
              {alert.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: color.textMuted, cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem', borderTop: `1px solid ${color.border}`, paddingTop: '16px' }}>
          {alert.road_id && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: color.textMuted }}>Affected road:</span>
              <span style={{ fontWeight: 600, color: color.accent }}>{alert.road_id}</span>
            </div>
          )}
          {alert.risk_probability !== undefined && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: color.textMuted }}>Risk probability:</span>
              <span style={{ fontWeight: 700, color: alert.risk_probability > 0.7 ? color.danger : color.warning }}>
                {Math.round(alert.risk_probability * 100)}%
              </span>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ color: color.textMuted }}>Cause:</span>
            <span style={{ fontWeight: 500, color: color.textSecondary }}>{alert.cause}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ color: color.textMuted }}>Description:</span>
            <span style={{ fontWeight: 500, color: color.textSecondary }}>{alert.message}</span>
          </div>

          <div style={{
            backgroundColor: color.accentSoft,
            border: `1px solid ${color.accentBorder}`,
            borderRadius: radius.md,
            padding: '12px',
            marginTop: '8px'
          }}>
            <div style={{ fontSize: '0.72rem', color: color.accent, fontWeight: 700, marginBottom: '4px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Recommended action
            </div>
            <div style={{ fontSize: '0.85rem', color: color.navy, fontWeight: 600 }}>
              {alert.recommended_action}
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${color.border}` }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {alert.status === 'ACTIVE' && (
              <button
                onClick={() => onUpdateStatus(alert.alert_id, 'ACKNOWLEDGED')}
                style={{
                  backgroundColor: color.surfaceAlt,
                  border: `1px solid ${color.border}`,
                  borderRadius: radius.sm,
                  color: color.textPrimary,
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
                  backgroundColor: color.success,
                  border: 'none',
                  borderRadius: radius.sm,
                  color: '#ffffff',
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Resolve alert
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
                backgroundColor: color.accent,
                border: 'none',
                borderRadius: radius.sm,
                color: '#ffffff',
                padding: '8px 14px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Navigation size={14} /> Switch to safest route
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
