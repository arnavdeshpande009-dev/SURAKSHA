import React from 'react';
import type { LocationNode } from '../../types/road';
import { MapPin, Navigation } from 'lucide-react';
import { theme } from '../../theme';

const { color, radius } = theme;

interface RouteSelectorProps {
  locations: LocationNode[];
  origin: string;
  destination: string;
  onOriginChange: (id: string) => void;
  onDestinationChange: (id: string) => void;
}

export const RouteSelector: React.FC<RouteSelectorProps> = ({
  locations,
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
}) => {
  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    backgroundColor: color.surfaceAlt,
    border: `1px solid ${color.border}`,
    borderRadius: radius.sm,
    color: color.textPrimary,
    fontSize: '0.875rem',
    outline: 'none',
    cursor: 'pointer'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: color.textMuted, marginBottom: '6px' }}>
          <MapPin size={14} color={color.success} /> Origin
        </label>
        <select
          value={origin}
          onChange={(e) => onOriginChange(e.target.value)}
          style={selectStyle}
        >
          <option value="">Select origin location</option>
          {locations.map((loc) => (
            <option key={`orig-${loc.id}`} value={loc.id}>
              {loc.name} ({loc.state})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: color.textMuted, marginBottom: '6px' }}>
          <Navigation size={14} color={color.danger} /> Destination
        </label>
        <select
          value={destination}
          onChange={(e) => onDestinationChange(e.target.value)}
          style={selectStyle}
        >
          <option value="">Select destination location</option>
          {locations.map((loc) => (
            <option key={`dest-${loc.id}`} value={loc.id}>
              {loc.name} ({loc.state})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
