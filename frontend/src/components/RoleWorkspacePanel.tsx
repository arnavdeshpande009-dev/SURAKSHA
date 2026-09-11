import React, { useState } from 'react';
import { AlertTriangle, ClipboardList, MapPinned, ShieldCheck, Truck, Users, Activity } from 'lucide-react';
import type { FleetRole } from '../data/fleet';
import type { DemoIncident } from '../types/alert';
import { theme } from '../theme';
import { backendService } from '../services/backendService';

const { color, radius, shadow } = theme;

interface RoleWorkspacePanelProps {
  role: FleetRole;
  incidents?: DemoIncident[];
  onOpenFieldReport?: () => void;
}

const roleCopy: Record<FleetRole, { title: string; summary: string }> = {
  ADMINISTRATOR: { title: 'Admin workspace', summary: 'Manage fleet access, system settings, and organization activity.' },
  DISPATCHER: { title: 'Dispatcher workspace', summary: 'Plan deliveries, assign trucks, and monitor active routes.' },
  DRIVER: { title: 'Driver workspace', summary: 'Follow assigned deliveries and keep trip status current.' },
  RISK_ANALYST: { title: 'Risk analyst workspace', summary: 'Review route hazards, weather signals, and AI recommendations.' },
};

const roleActions: Record<FleetRole, { label: string; icon: React.ReactNode }[]> = {
  ADMINISTRATOR: [
    { label: 'Manage users', icon: <Users size={15} /> },
    { label: 'System settings', icon: <ShieldCheck size={15} /> },
  ],
  DISPATCHER: [
    { label: 'Assign delivery', icon: <ClipboardList size={15} /> },
    { label: 'Monitor live fleet', icon: <MapPinned size={15} /> },
  ],
  DRIVER: [
    { label: 'Start assigned trip', icon: <Truck size={15} /> },
    { label: 'Report road incident', icon: <AlertTriangle size={15} /> },
  ],
  RISK_ANALYST: [
    { label: 'Review high-risk roads', icon: <AlertTriangle size={15} /> },
    { label: 'Approve safe route', icon: <ShieldCheck size={15} /> },
  ],
};

export const RoleWorkspacePanel: React.FC<RoleWorkspacePanelProps> = ({ role, incidents = [], onOpenFieldReport }) => {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string>('');
  const copy = roleCopy[role];
  const latestIncident = incidents[0];

  const handleAction = async (label: string) => {
    if (label === 'Report road incident' && onOpenFieldReport) {
      onOpenFieldReport();
      return;
    }

    setActiveAction(label);
    setActionStatus('Connecting...');
    try {
      if (label === 'Manage users') await backendService.getUsers();
      if (label === 'System settings') await backendService.checkHealth();
      if (label === 'Assign delivery') await backendService.getDeliveries();
      if (label === 'Monitor live fleet') await backendService.getFleetTrucks();
      if (label === 'Start assigned trip') await backendService.sendDriverAction('TRK-101', 'START_NAVIGATION');
      if (label === 'Report road incident') await backendService.getIncidents();
      if (label === 'Review high-risk roads') await backendService.getAuditLogs();
      if (label === 'Approve safe route') await backendService.calculateEmergencyRoute('LOC-GAU', 'LOC-AIZ', 'GENERAL');
      setActionStatus('Connected and ready');
    } catch {
      setActionStatus('Backend unavailable — local demo remains active');
    }
  };

  return (
    <section style={{
      backgroundColor: color.navy,
      borderRadius: radius.lg,
      padding: '14px',
      boxShadow: shadow.md,
      color: color.onDark,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div>
          <div style={{ color: '#7DD3FC', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.06em' }}>
            ROLE-BASED ACCESS
          </div>
          <h3 style={{ margin: '3px 0 0', fontSize: '0.92rem', color: '#FFFFFF' }}>{copy.title}</h3>
        </div>
        <span style={{ fontSize: '0.65rem', color: '#4ADE80', fontWeight: 800, backgroundColor: 'rgba(74,222,128,0.14)', padding: '4px 7px', borderRadius: radius.pill }}>
          CONNECTED
        </span>
      </div>
      <p style={{ margin: 0, color: color.onDarkMuted, fontSize: '0.75rem', lineHeight: 1.35 }}>{copy.summary}</p>

      {/* SHARED CENTRAL INCIDENT SYNC VIEW */}
      {latestIncident && (
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.06)',
          borderLeft: `3px solid ${latestIncident.severity === 'CRITICAL' ? '#EF4444' : '#F59E0B'}`,
          borderRadius: radius.sm,
          padding: '8px 10px',
          fontSize: '0.73rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Activity size={12} color="#FBBF24" /> SHARED INCIDENT ({incidents.length})
            </span>
            <span style={{
              fontSize: '0.62rem',
              fontWeight: 800,
              color: '#4ADE80',
              backgroundColor: 'rgba(74,222,128,0.18)',
              padding: '2px 6px',
              borderRadius: radius.pill
            }}>
              {latestIncident.status ?? 'SUBMITTED'}
            </span>
          </div>
          <div style={{ color: '#E2E8F0', fontWeight: 700 }}>
            {latestIncident.title} — {latestIncident.location}
          </div>
          <div style={{ color: '#94A3B8', fontSize: '0.68rem' }}>
            {role === 'ADMINISTRATOR' && `Admin View: Fleet truck NER-204 tracking active incident on ${latestIncident.road_id}`}
            {role === 'DISPATCHER' && `Dispatcher View: Reroute recommended for ${latestIncident.road_id}`}
            {role === 'RISK_ANALYST' && `Risk Analyst View: Disruption probability spike on corridor ${latestIncident.road_id}`}
            {role === 'DRIVER' && `Driver View: Incident synced to Central Command. Follow updated navigation.`}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
        {roleActions[role].map((action) => (
          <button
            key={action.label}
            onClick={() => void handleAction(action.label)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              minHeight: '34px',
              border: `1px solid ${activeAction === action.label ? '#7DD3FC' : 'rgba(255,255,255,0.14)'}`,
              borderRadius: radius.sm,
              backgroundColor: activeAction === action.label ? 'rgba(125,211,252,0.16)' : 'rgba(255,255,255,0.06)',
              color: '#FFFFFF',
              fontSize: '0.7rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {action.icon} {action.label}
          </button>
        ))}
      </div>
      {activeAction && (
        <div style={{ color: '#7DD3FC', fontSize: '0.7rem', fontWeight: 700 }}>
          {activeAction}: {actionStatus}
        </div>
      )}
    </section>
  );
};
