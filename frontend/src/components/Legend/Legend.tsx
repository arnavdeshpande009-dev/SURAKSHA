import React from 'react';

export const Legend: React.FC = () => {
  return (
    <div style={{
      position: 'absolute',
      bottom: '24px',
      left: '24px',
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      backdropFilter: 'blur(8px)',
      border: '1px solid #334155',
      borderRadius: '8px',
      padding: '12px 16px',
      color: '#f8fafc',
      zIndex: 10,
      fontSize: '0.875rem',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
    }}>
      <div style={{ fontWeight: 600, marginBottom: '8px', color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
        Road Accessibility
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
          <span>OPEN</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#eab308' }}></span>
          <span>RISKY</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
          <span>BLOCKED</span>
        </div>
      </div>
    </div>
  );
};
