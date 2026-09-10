import React from 'react';
import { theme } from '../../theme';

const { color, radius, shadow } = theme;

export const Legend: React.FC = () => {
  return (
    <div style={{
      position: 'absolute',
      bottom: '24px',
      left: '24px',
      backgroundColor: 'rgba(11, 27, 52, 0.92)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: radius.lg,
      padding: '12px 16px',
      color: color.onDark,
      zIndex: 10,
      fontSize: '0.875rem',
      boxShadow: shadow.lg
    }}>
      <div style={{ fontWeight: 700, marginBottom: '8px', color: color.onDarkMuted, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>
        Road Accessibility
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color.success }}></span>
          <span>Open</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color.warning }}></span>
          <span>Risky</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color.danger }}></span>
          <span>Blocked</span>
        </div>
      </div>
    </div>
  );
};
