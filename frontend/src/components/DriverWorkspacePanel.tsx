import React, { useState } from 'react';
import { MapPin, Navigation, Pause, Play, CheckCircle, AlertCircle, Clock, Truck } from 'lucide-react';
import { theme } from '../theme';
import { backendService } from '../services/backendService';

const { color, radius, shadow } = theme;

interface DriverWorkspacePanelProps {
  assignedTruck?: string;
  assignedTruckId?: string;
  destinationLabel?: string;
  onTruckUpdated?: (truck: import('../data/fleet').SimulatedTruck) => void;
}

type DeliveryStatus = 'NOT_STARTED' | 'NAVIGATING' | 'AT_PICKUP' | 'IN_TRANSIT' | 'AT_DESTINATION' | 'DELAYED';

export const DriverWorkspacePanel: React.FC<DriverWorkspacePanelProps> = ({
  assignedTruck = 'SURAKSHA-101',
  assignedTruckId = 'TRK-101',
  destinationLabel = 'Guwahati → Aizawl',
  onTruckUpdated
}) => {
  const [tripStatus, setTripStatus] = useState<DeliveryStatus>('NOT_STARTED');
  const [isNavigating, setIsNavigating] = useState(false);

  const statusInfo: Record<DeliveryStatus, { label: string; color: string; icon: React.ReactNode }> = {
    NOT_STARTED: { label: 'Ready for assignment', color: color.accent, icon: <Truck size={16} /> },
    NAVIGATING: { label: 'Navigating to pickup', color: color.warning, icon: <Navigation size={16} /> },
    AT_PICKUP: { label: 'At pickup location', color: color.warning, icon: <MapPin size={16} /> },
    IN_TRANSIT: { label: 'Delivery in transit', color: color.accent, icon: <Truck size={16} /> },
    AT_DESTINATION: { label: 'At destination', color: color.success, icon: <MapPin size={16} /> },
    DELAYED: { label: 'Delayed — awaiting route update', color: color.danger, icon: <AlertCircle size={16} /> }
  };

  const info = statusInfo[tripStatus];

  const sendAction = async (action: string, status: DeliveryStatus, navigating = isNavigating) => {
    setTripStatus(status);
    setIsNavigating(navigating);
    try {
      const updatedTruck = await backendService.sendDriverAction(assignedTruckId, action);
      onTruckUpdated?.(updatedTruck);
    } catch {
      // Keep the local interaction usable when the API is temporarily offline.
    }
  };

  const handleStartDirections = () => {
    void sendAction('START_NAVIGATION', 'NAVIGATING', true);
  };

  const handleStopNavigation = () => {
    void sendAction('STOP_NAVIGATION', tripStatus, false);
  };

  return (
    <section style={{
      backgroundColor: color.surface,
      borderRadius: radius.lg,
      padding: '14px',
      border: `1px solid ${color.border}`,
      boxShadow: shadow.md,
      color: color.textPrimary,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
        <Truck size={17} color={color.accent} />
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: color.textMuted, letterSpacing: '0.04em' }}>
            YOUR ASSIGNMENT
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: color.textPrimary }}>{assignedTruck}</div>
        </div>
      </div>

      <div style={{
        backgroundColor: color.surfaceAlt,
        borderRadius: radius.md,
        padding: '10px',
        fontSize: '0.78rem',
        color: color.textSecondary,
        borderLeft: `4px solid ${info.color}`
      }}>
        <div style={{ fontWeight: 700, color: color.textPrimary, marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {info.icon} {info.label}
        </div>
        <div style={{ fontSize: '0.72rem' }}>Route: {destinationLabel}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {!isNavigating ? (
          <button
            onClick={handleStartDirections}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              minHeight: '36px',
              border: `1px solid ${color.accentBorder}`,
              borderRadius: radius.sm,
              backgroundColor: color.accent,
              color: '#FFFFFF',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Navigation size={14} /> Start directions
          </button>
        ) : (
          <button
            onClick={handleStopNavigation}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              minHeight: '36px',
              border: `1px solid ${color.danger}`,
              borderRadius: radius.sm,
              backgroundColor: 'rgba(220,38,38,0.1)',
              color: color.danger,
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Pause size={14} /> Stop navigation
          </button>
        )}

        <button
          onClick={() => void sendAction('REPORT_DELAY', 'DELAYED', false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            minHeight: '36px',
            border: `1px solid ${color.warning}`,
            borderRadius: radius.sm,
            backgroundColor: 'rgba(217,123,10,0.1)',
            color: color.warning,
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <Clock size={14} /> Report delay
        </button>
      </div>

      <div style={{
        backgroundColor: color.surfaceAlt,
        borderRadius: radius.md,
        padding: '10px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px'
      }}>
        <button
          onClick={() => void sendAction('PICKUP_DONE', 'AT_PICKUP')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            minHeight: '32px',
            border: `1px solid ${color.accent}`,
            borderRadius: radius.sm,
            backgroundColor: tripStatus === 'AT_PICKUP' ? color.accentSoft : 'transparent',
            color: color.accent,
            fontSize: '0.7rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <CheckCircle size={12} /> Pickup done
        </button>

        <button
          onClick={() => void sendAction('IN_TRANSIT', 'IN_TRANSIT', true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            minHeight: '32px',
            border: `1px solid ${color.accent}`,
            borderRadius: radius.sm,
            backgroundColor: tripStatus === 'IN_TRANSIT' ? color.accentSoft : 'transparent',
            color: color.accent,
            fontSize: '0.7rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <Play size={12} /> On way
        </button>

        <button
          onClick={() => void sendAction('DELIVERED', 'AT_DESTINATION', false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            minHeight: '32px',
            border: `1px solid ${color.success}`,
            borderRadius: radius.sm,
            backgroundColor: tripStatus === 'AT_DESTINATION' ? color.successSoft : 'transparent',
            color: color.success,
            fontSize: '0.7rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <CheckCircle size={12} /> Delivered
        </button>

        <button
          onClick={() => void sendAction('RESET', 'NOT_STARTED', false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            minHeight: '32px',
            border: `1px solid ${color.textMuted}`,
            borderRadius: radius.sm,
            backgroundColor: 'transparent',
            color: color.textMuted,
            fontSize: '0.7rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <MapPin size={12} /> Reset
        </button>
      </div>

      {isNavigating && (
        <div style={{
          backgroundColor: color.accentSoft,
          borderRadius: radius.sm,
          padding: '8px 10px',
          fontSize: '0.7rem',
          color: color.accent,
          fontWeight: 700,
          textAlign: 'center'
        }}>
          🗺️ Live navigation active — follow the route on the map
        </div>
      )}
    </section>
  );
};
