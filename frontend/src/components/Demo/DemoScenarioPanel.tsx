import React, { useState } from 'react';
import { Users, ShieldCheck, Circle } from 'lucide-react';
import { theme } from '../../theme';
import { FLEET_USERS } from '../../data/fleet';

const { color, radius, shadow } = theme;

export const DemoScenarioPanel: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState(FLEET_USERS[0].name);

  return (
    <div style={{
      backgroundColor: color.surface,
      borderRadius: radius.lg,
      padding: '16px',
      border: `1px solid ${color.border}`,
      boxShadow: shadow.md,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={17} color={color.accent} />
          <span style={{ fontSize: '0.76rem', fontWeight: 800, color: color.navy, letterSpacing: '0.04em' }}>
            FLEET USERS
          </span>
        </div>
        <span style={{ fontSize: '0.7rem', color: color.textMuted, fontWeight: 700 }}>4 ACTIVE</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {FLEET_USERS.map((user) => {
          const isSelected = selectedUser === user.name;
          const roleLabel = user.role.replace('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
          return (
            <button
              key={user.name}
              onClick={() => setSelectedUser(user.name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '8px',
                borderRadius: radius.sm,
                border: `1px solid ${isSelected ? color.accentBorder : 'transparent'}`,
                backgroundColor: isSelected ? color.accentSoft : 'transparent',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              <span style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: user.color,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.68rem',
                fontWeight: 800,
                flexShrink: 0
              }}>
                {user.initials}
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                <span style={{ color: color.textPrimary, fontSize: '0.8rem', fontWeight: 700 }}>{user.name}</span>
                <span style={{ color: color.textMuted, fontSize: '0.7rem' }}>{user.title} · {roleLabel}</span>
              </span>
              {isSelected ? <ShieldCheck size={16} color={color.accent} /> : <Circle size={9} fill={user.status === 'ON_ROUTE' ? color.warning : color.success} color={user.status === 'ON_ROUTE' ? color.warning : color.success} />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
