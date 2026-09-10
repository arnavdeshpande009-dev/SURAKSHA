import React from 'react';
import type { LocationNode } from '../../types/road';
import type { RouteComparisonResult, RoutingMode } from '../../routing/types';
import type { Alert } from '../../types/alert';
import type { DemoStep } from '../../data/demoScenario';
import { RouteSelector } from '../RouteSelector/RouteSelector';
import { DemoScenarioPanel } from '../Demo/DemoScenarioPanel';
import { Activity, ShieldCheck, Zap, Star, Bell, ShieldAlert, AlertTriangle, Info } from 'lucide-react';

interface SidebarProps {
  locations: LocationNode[];
  origin: string;
  destination: string;
  onOriginChange: (id: string) => void;
  onDestinationChange: (id: string) => void;
  comparisonResult: RouteComparisonResult | null;
  selectedMode: RoutingMode;
  onSelectMode: (mode: RoutingMode) => void;
  alerts: Alert[];
  onSelectAlert: (alert: Alert) => void;
  demoStep: DemoStep;
  onNextDemoStep: () => void;
  onResetDemo: () => void;
  rainfallSimulated: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  locations,
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  comparisonResult,
  selectedMode,
  onSelectMode,
  alerts,
  onSelectAlert,
  demoStep,
  onNextDemoStep,
  onResetDemo,
  rainfallSimulated,
}) => {
  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins} mins`;
    return `${hrs}h ${mins}m`;
  };

  const fastest = comparisonResult?.fastestRoute;
  const safest = comparisonResult?.safestRoute;
  const activeAlertsCount = alerts.filter((a) => a.status === 'ACTIVE').length;

  const activeRoute = selectedMode === 'SAFEST' ? safest : fastest;

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <ShieldAlert size={16} color="#ef4444" />;
      case 'HIGH':
        return <AlertTriangle size={16} color="#f97316" />;
      case 'MEDIUM':
        return <AlertTriangle size={16} color="#eab308" />;
      default:
        return <Bell size={16} color="#38bdf8" />;
    }
  };

  return (
    <aside style={{
      width: '400px',
      height: '100%',
      backgroundColor: '#1e293b',
      borderLeft: '1px solid #334155',
      display: 'flex',
      flexDirection: 'column',
      color: '#f8fafc',
      boxSizing: 'border-box'
    }}>
      {/* Control Tower Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #334155',
        backgroundColor: '#0f172a'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
          <Activity size={18} color="#38bdf8" />
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, letterSpacing: '0.04em', color: '#f8fafc' }}>
            CONTROL TOWER INTELLIGENCE
          </h2>
        </div>
        <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
          Predict → Assess → Reroute → Alert → Deliver
        </p>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
        
        {/* DEMO SCENARIO INTERACTIVE PANEL */}
        <DemoScenarioPanel
          currentStep={demoStep}
          onNextStep={onNextDemoStep}
          onResetDemo={onResetDemo}
          rainfallSimulated={rainfallSimulated}
        />

        {/* 1. ROUTE SELECTION PANEL */}
        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: '8px',
          padding: '14px',
          border: '1px solid #334155'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: '10px', letterSpacing: '0.05em' }}>
            1. SHIPMENT ROUTE SELECTION
          </div>
          <RouteSelector
            locations={locations}
            origin={origin}
            destination={destination}
            onOriginChange={onOriginChange}
            onDestinationChange={onDestinationChange}
          />
        </div>

        {/* EMPTY STATE WARNING */}
        {(!origin || !destination) && (
          <div style={{
            backgroundColor: '#0f172a',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid #0284c7',
            color: '#38bdf8',
            fontSize: '0.85rem',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <Info size={18} /> Select origin and destination to begin intelligence analysis.
          </div>
        )}

        {/* 2. RISK INTELLIGENCE PANEL */}
        {activeRoute && activeRoute.status === 'SUCCESS' && (
          <div style={{
            backgroundColor: '#0f172a',
            borderRadius: '8px',
            padding: '14px',
            border: '1px solid #334155'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: '10px', letterSpacing: '0.05em' }}>
              2. ACTIVE ROUTE RISK INTELLIGENCE
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.825rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Overall Route Risk:</span>
                <span style={{
                  fontWeight: 700,
                  color: activeRoute.riskMetrics.routeRiskLevel === 'HIGH' ? '#ef4444' :
                         activeRoute.riskMetrics.routeRiskLevel === 'MEDIUM' ? '#eab308' : '#22c55e'
                }}>
                  {activeRoute.riskMetrics.routeRiskLevel} ({Math.round(activeRoute.riskMetrics.averageRisk * 100)}% avg)
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Highest Hazard Segment:</span>
                <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                  {activeRoute.roadSegments.reduce((max, s) => (s.ai_risk?.disruption_probability ?? 0) > (max.ai_risk?.disruption_probability ?? 0) ? s : max, activeRoute.roadSegments[0])?.road_id}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Max Segment Disruption Prob:</span>
                <span style={{
                  fontWeight: 700,
                  color: activeRoute.riskMetrics.maximumRisk > 0.7 ? '#ef4444' : '#eab308'
                }}>
                  {Math.round(activeRoute.riskMetrics.maximumRisk * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 3. ROUTE OPTIONS & COMPARISON CARDS */}
        {comparisonResult && fastest && safest && fastest.status === 'SUCCESS' && safest.status === 'SUCCESS' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>
              3. ROUTE COMPARISON &amp; PREDICTED ETA
            </div>

            {/* FASTEST Option Card */}
            <div
              onClick={() => onSelectMode('FASTEST')}
              style={{
                backgroundColor: selectedMode === 'FASTEST' ? '#0f172a' : '#1e293b',
                border: selectedMode === 'FASTEST' ? '2px solid #eab308' : '1px solid #334155',
                borderRadius: '8px',
                padding: '12px 14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.875rem', color: '#eab308' }}>
                  <Zap size={16} /> FASTEST ROUTE
                </div>
                {comparisonResult.recommendedMode === 'FASTEST' && (
                  <span style={{ fontSize: '0.7rem', backgroundColor: '#eab308', color: '#0f172a', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    RECOMMENDED
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '0.75rem', borderTop: '1px solid #334155', paddingTop: '8px', textAlign: 'center' }}>
                <div>
                  <div style={{ color: '#94a3b8' }}>Baseline</div>
                  <div style={{ fontWeight: 600, color: '#f8fafc', marginTop: '2px' }}>{formatTime(fastest.totalTravelTimeMin)}</div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8' }}>Delay</div>
                  <div style={{ fontWeight: 600, color: '#f87171', marginTop: '2px' }}>+{fastest.etaPrediction.predicted_delay_min}m</div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8' }}>ETA</div>
                  <div style={{ fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>{formatTime(fastest.etaPrediction.predicted_eta_min)}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #334155' }}>
                <span style={{ color: '#94a3b8' }}>Max Risk:</span>
                <span style={{ color: fastest.riskMetrics.maximumRisk > 0.7 ? '#ef4444' : '#eab308', fontWeight: 700 }}>
                  {Math.round(fastest.riskMetrics.maximumRisk * 100)}% ({fastest.riskMetrics.routeRiskLevel})
                </span>
              </div>
            </div>

            {/* SAFEST Option Card */}
            <div
              onClick={() => onSelectMode('SAFEST')}
              style={{
                backgroundColor: selectedMode === 'SAFEST' ? '#0f172a' : '#1e293b',
                border: selectedMode === 'SAFEST' ? '2px solid #22c55e' : '1px solid #334155',
                borderRadius: '8px',
                padding: '12px 14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.875rem', color: '#22c55e' }}>
                  <ShieldCheck size={16} /> SAFEST ROUTE {comparisonResult.recommendedMode === 'SAFEST' && <Star size={14} fill="#22c55e" />}
                </div>
                {comparisonResult.recommendedMode === 'SAFEST' && (
                  <span style={{ fontSize: '0.7rem', backgroundColor: '#22c55e', color: '#0f172a', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    RECOMMENDED
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '0.75rem', borderTop: '1px solid #334155', paddingTop: '8px', textAlign: 'center' }}>
                <div>
                  <div style={{ color: '#94a3b8' }}>Baseline</div>
                  <div style={{ fontWeight: 600, color: '#f8fafc', marginTop: '2px' }}>{formatTime(safest.totalTravelTimeMin)}</div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8' }}>Delay</div>
                  <div style={{ fontWeight: 600, color: '#4ade80', marginTop: '2px' }}>+{safest.etaPrediction.predicted_delay_min}m</div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8' }}>ETA</div>
                  <div style={{ fontWeight: 700, color: '#4ade80', marginTop: '2px' }}>{formatTime(safest.etaPrediction.predicted_eta_min)}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #334155' }}>
                <span style={{ color: '#94a3b8' }}>Max Risk:</span>
                <span style={{ color: '#22c55e', fontWeight: 700 }}>
                  {Math.round(safest.riskMetrics.maximumRisk * 100)}% ({safest.riskMetrics.routeRiskLevel})
                </span>
              </div>
            </div>

            {/* 4. RECOMMENDATION BANNER */}
            <div style={{
              backgroundColor: '#0f172a',
              border: '1px solid #0284c7',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '0.8rem',
              color: '#38bdf8'
            }}>
              <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                💡 4. SYSTEM RECOMMENDATION: {comparisonResult.recommendedMode} ROUTE
              </div>
              <div style={{ color: '#94a3b8' }}>
                {comparisonResult.recommendationReason}
              </div>
            </div>
          </div>
        ) : comparisonResult?.fastestRoute?.status === 'NO_ROUTE_FOUND' ? (
          <div style={{
            backgroundColor: '#0f172a',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid #ef4444',
            color: '#f87171',
            fontSize: '0.875rem',
            fontWeight: 600,
            textAlign: 'center'
          }}>
            🚫 NO VIABLE ROUTE FOUND (Roads blocked)
          </div>
        ) : null}

        {/* 5. OPERATIONAL ALERTS PANEL */}
        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: '8px',
          padding: '14px',
          border: '1px solid #334155'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bell size={14} /> 5. OPERATIONAL ALERTS
            </span>
            <span style={{
              fontSize: '0.7rem',
              backgroundColor: activeAlertsCount > 0 ? '#ef4444' : '#334155',
              color: '#ffffff',
              padding: '2px 8px',
              borderRadius: '10px',
              fontWeight: 700
            }}>
              ALERTS [{activeAlertsCount}]
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <div
                  key={alert.alert_id}
                  onClick={() => onSelectAlert(alert)}
                  style={{
                    backgroundColor: alert.status === 'RESOLVED' ? '#1e293b' : '#1e293b',
                    borderLeft: `4px solid ${
                      alert.severity === 'CRITICAL' ? '#ef4444' :
                      alert.severity === 'HIGH' ? '#f97316' :
                      alert.severity === 'MEDIUM' ? '#eab308' : '#38bdf8'
                    }`,
                    opacity: alert.status === 'RESOLVED' ? 0.5 : 1,
                    borderRadius: '4px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '0.775rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {getAlertIcon(alert.severity)} {alert.title}
                    </span>
                    <span style={{ fontSize: '0.675rem', color: '#94a3b8' }}>{alert.timestamp}</span>
                  </div>
                  <div style={{ color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {alert.message}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', padding: '8px' }}>
                No active operational alerts.
              </div>
            )}
          </div>
        </div>

      </div>
    </aside>
  );
};
