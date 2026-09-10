import React from 'react';
import type { LocationNode } from '../../types/road';
import { MapPin, Navigation } from 'lucide-react';

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
    padding: '8px 12px',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '6px',
    color: '#f8fafc',
    fontSize: '0.875rem',
    outline: 'none',
    cursor: 'pointer'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
          <MapPin size={14} color="#22c55e" /> ORIGIN
        </label>
        <select
          value={origin}
          onChange={(e) => onOriginChange(e.target.value)}
          style={selectStyle}
        >
          <option value="">Select Origin Location</option>
          {locations.map((loc) => (
            <option key={`orig-${loc.id}`} value={loc.id}>
              {loc.name} ({loc.state})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
          <Navigation size={14} color="#ef4444" /> DESTINATION
        </label>
        <select
          value={destination}
          onChange={(e) => onDestinationChange(e.target.value)}
          style={selectStyle}
        >
          <option value="">Select Destination Location</option>
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
