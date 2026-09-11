import React from 'react';
import type { LocationNode } from '../../types/road';
import type { RouteComparisonResult, RoutingMode } from '../../routing/types';
import type { Alert } from '../../types/alert';
import type { DemoStep } from '../../data/demoScenario';
import { RouteSelector } from '../RouteSelector/RouteSelector';
import { DemoScenarioPanel } from '../Demo/DemoScenarioPanel';
import { DemoWalkthroughPanel } from '../Demo/DemoWalkthroughPanel';
import { RoleWorkspacePanel } from '../RoleWorkspacePanel';
import { DriverWorkspacePanel } from '../DriverWorkspacePanel';
import type { FleetRole } from '../../data/fleet';
import type { SimulatedTruck } from '../../data/fleet';
import { Activity, ShieldCheck, Zap, Star, Bell, ShieldAlert, AlertTriangle, Info, Globe, Package, PlusCircle, Brain } from 'lucide-react';
import { theme } from '../../theme';
import type { Language } from '../../data/translations';
import { TRANSLATIONS } from '../../data/translations';

const { color, radius, shadow } = theme;

interface SidebarProps {
  role: FleetRole;
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
  onTruckUpdated: (truck: SimulatedTruck) => void;
  cargoType: string;
  onCargoTypeChange: (cargo: string) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenFieldReport: () => void;
  incidents?: import('../../types/alert').DemoIncident[];
}

const cardStyle: React.CSSProperties = {
  backgroundColor: color.surface,
  borderRadius: radius.lg,
  padding: '16px',
  border: `1px solid ${color.border}`,
  boxShadow: shadow.sm,
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  fontWeight: 700,
  color: color.textMuted,
  marginBottom: '12px',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

export const Sidebar: React.FC<SidebarProps> = ({
  role,
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
  onTruckUpdated,
  cargoType,
  onCargoTypeChange,
  language,
  onLanguageChange,
  onOpenFieldReport,
  incidents = [],
}) => {
  const t = TRANSLATIONS[language];

  const formatTime = (minutes: number) => {
    const totalMins = Math.round(minutes);
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
  };

  const fastest = comparisonResult?.fastestRoute;
  const safest = comparisonResult?.safestRoute;
  const activeAlertsCount = alerts.filter((a) => a.status === 'ACTIVE').length;

  const activeRoute = selectedMode === 'SAFEST' ? safest : fastest;

  // Derive feature factors for Explainable AI from active route segment inputs
  const highestRiskSegment = activeRoute?.roadSegments.reduce(
    (max, s) => (s.ai_risk?.disruption_probability ?? 0) > (max.ai_risk?.disruption_probability ?? 0) ? s : max,
    activeRoute.roadSegments[0]
  );

  const rainfallFactor = demoStep >= 2 || highestRiskSegment?.status === 'RISKY' ? 'HIGH (>40mm/24h)' : 'LOW (12mm/24h)';
  const slopeFactor = highestRiskSegment?.status === 'RISKY' ? 'HIGH (Steep Hill Pass 14°)' : 'MEDIUM (8°)';
  const floodExposure = highestRiskSegment?.status === 'RISKY' ? 'MEDIUM (Flood History 2 events)' : 'LOW';
  const landslideHistory = highestRiskSegment?.status === 'RISKY' ? 'HIGH (Frequent Monsoon Landslides)' : 'LOW';
  const roadCondition = highestRiskSegment?.status === 'BLOCKED' ? 'POOR / IMPASSABLE' : highestRiskSegment?.status === 'RISKY' ? 'MEDIUM (Damaged Surface)' : 'GOOD';

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <ShieldAlert size={16} color={color.danger} />;
      case 'HIGH':
        return <AlertTriangle size={16} color="#EA7A1A" />;
      case 'MEDIUM':
        return <AlertTriangle size={16} color={color.warning} />;
      default:
        return <Bell size={16} color={color.accent} />;
    }
  };

  return (
    <aside className="control-sidebar" style={{
      width: '400px',
      height: '100%',
      backgroundColor: color.bg,
      borderLeft: `1px solid ${color.border}`,
      display: 'flex',
      flexDirection: 'column',
      color: color.textPrimary,
      boxSizing: 'border-box'
    }}>
      {/* Control Tower Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: `1px solid ${color.border}`,
        backgroundColor: color.surface,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <Activity size={17} color={color.accent} />
            <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, letterSpacing: '-0.01em', color: color.navy }}>
              Control Tower Intelligence
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: color.textMuted }}>
            Predict → Assess → Reroute → Alert → Deliver
          </p>
        </div>

        {/* Language selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Globe size={13} color={color.accent} />
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as Language)}
            style={{
              backgroundColor: color.surfaceAlt,
              border: `1px solid ${color.border}`,
              borderRadius: radius.pill,
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '3px 6px',
              color: color.textPrimary,
              cursor: 'pointer'
            }}
          >
            <option value="en">EN</option>
            <option value="hi">हिंदी</option>
            <option value="as">অসমীয়া</option>
          </select>
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>

        {/* DEMO SCENARIO INTERACTIVE PANEL */}
        <DemoScenarioPanel />

        {/* DRIVER NAVIGATION PANEL */}
        {role === 'DRIVER' && <DriverWorkspacePanel assignedTruck="SURAKSHA-101" assignedTruckId="TRK-101" destinationLabel="Guwahati → Aizawl" onTruckUpdated={onTruckUpdated} />}

        <RoleWorkspacePanel role={role} incidents={incidents} onOpenFieldReport={onOpenFieldReport} />

        {/* FIELD INCIDENT REPORT BUTTON */}
        <button
          onClick={onOpenFieldReport}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 14px',
            backgroundColor: color.surface,
            border: `1px solid ${color.warning}`,
            borderRadius: radius.md,
            color: color.warning,
            fontSize: '0.8rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: shadow.sm
          }}
        >
          <PlusCircle size={16} /> Field Officer Incident Report
        </button>

        {/* 1. ROUTE & CARGO SELECTION PANEL */}
        <div style={cardStyle}>
          <div style={sectionLabelStyle}>1. Shipment route &amp; cargo policy</div>
          
          <RouteSelector
            locations={locations}
            origin={origin}
            destination={destination}
            onOriginChange={onOriginChange}
            onDestinationChange={onDestinationChange}
          />

          <div style={{ marginTop: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: color.textMuted, marginBottom: '6px' }}>
              <Package size={14} color={color.accent} /> Cargo Criticality Policy
            </label>
            <select
              value={cargoType}
              onChange={(e) => onCargoTypeChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                backgroundColor: color.surfaceAlt,
                border: `1px solid ${color.border}`,
                borderRadius: radius.sm,
                color: color.textPrimary,
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <option value="MEDICAL_SUPPLIES">{t.cargoMedical}</option>
              <option value="FOOD_ESSENTIALS">{t.cargoFood}</option>
              <option value="CONSTRUCTION_MATERIAL">{t.cargoConstruction}</option>
              <option value="GENERAL_CARGO">{t.cargoGeneral}</option>
            </select>
          </div>
        </div>

        {/* EMPTY STATE WARNING */}
        {(!origin || !destination) && (
          <div style={{
            backgroundColor: color.accentSoft,
            borderRadius: radius.lg,
            padding: '16px',
            border: `1px solid ${color.accentBorder}`,
            color: color.accent,
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

        {/* 2. EXPLAINABLE AI ASSESSMENT PANEL */}
        {activeRoute && activeRoute.status === 'SUCCESS' && (
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ ...sectionLabelStyle, marginBottom: 0, display: 'flex', alignItems: 'center', gap: '6px', color: color.navy }}>
                <Brain size={15} color={color.accent} /> {t.explainTitle}
              </span>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                color: activeRoute.riskMetrics.routeRiskLevel === 'HIGH' ? color.danger : activeRoute.riskMetrics.routeRiskLevel === 'MEDIUM' ? color.warning : color.success,
                backgroundColor: activeRoute.riskMetrics.routeRiskLevel === 'HIGH' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                padding: '2px 8px',
                borderRadius: radius.pill
              }}>
                {t.riskProbability}: {Math.round(activeRoute.riskMetrics.maximumRisk * 100)}% ({activeRoute.riskMetrics.routeRiskLevel})
              </span>
            </div>

            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: color.textMuted, marginBottom: '8px', letterSpacing: '0.03em' }}>
              {t.whyRisky}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', backgroundColor: color.surfaceAlt, padding: '10px', borderRadius: radius.md, marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: color.textMuted }}>Rainfall (24h):</span>
                <span style={{ fontWeight: 700, color: rainfallFactor.includes('HIGH') ? color.danger : color.textPrimary }}>{rainfallFactor}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: color.textMuted }}>Terrain / Slope:</span>
                <span style={{ fontWeight: 700, color: color.textPrimary }}>{slopeFactor}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: color.textMuted }}>Flood Exposure:</span>
                <span style={{ fontWeight: 700, color: color.textPrimary }}>{floodExposure}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: color.textMuted }}>Historical Landslides:</span>
                <span style={{ fontWeight: 700, color: landslideHistory.includes('HIGH') ? color.danger : color.textPrimary }}>{landslideHistory}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: color.textMuted }}>Road Condition:</span>
                <span style={{ fontWeight: 700, color: roadCondition.includes('POOR') ? color.danger : color.textPrimary }}>{roadCondition}</span>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: color.accent, backgroundColor: color.accentSoft, padding: '8px 10px', borderRadius: radius.sm }}>
              {t.recommendation}: {selectedMode === 'SAFEST' ? 'Utilizing SAFEST corridor bypass' : comparisonResult?.recommendedMode === 'SAFEST' ? 'Switch to SAFEST corridor' : 'FASTEST corridor meets risk threshold'}
            </div>
          </div>
        )}

        {/* 3. ROUTE OPTIONS & COMPARISON CARDS */}
        {comparisonResult && fastest && safest && fastest.status === 'SUCCESS' && safest.status === 'SUCCESS' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={sectionLabelStyle}>3. Route comparison &amp; predicted ETA</div>

            {/* FASTEST Option Card */}
            <div
              onClick={() => onSelectMode('FASTEST')}
              style={{
                ...cardStyle,
                cursor: 'pointer',
                border: selectedMode === 'FASTEST' ? `2px solid ${color.warning}` : `1px solid ${color.border}`,
                padding: '14px',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.875rem', color: color.warning }}>
                  <Zap size={16} /> Fastest route
                </div>
                {comparisonResult.recommendedMode === 'FASTEST' && (
                  <span style={{ fontSize: '0.68rem', backgroundColor: color.warning, color: '#ffffff', padding: '2px 8px', borderRadius: radius.pill, fontWeight: 700 }}>
                    RECOMMENDED
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '0.75rem', borderTop: `1px solid ${color.border}`, paddingTop: '8px', textAlign: 'center' }}>
                <div>
                  <div style={{ color: color.textMuted }}>Baseline</div>
                  <div style={{ fontWeight: 600, color: color.textPrimary, marginTop: '2px' }}>{formatTime(fastest.totalTravelTimeMin)}</div>
                </div>
                <div>
                  <div style={{ color: color.textMuted }}>Delay</div>
                  <div style={{ fontWeight: 600, color: color.danger, marginTop: '2px' }}>+{Math.round(fastest.etaPrediction.predicted_delay_min)}m</div>
                </div>
                <div>
                  <div style={{ color: color.textMuted }}>ETA</div>
                  <div style={{ fontWeight: 700, color: color.accent, marginTop: '2px' }}>{formatTime(fastest.etaPrediction.predicted_eta_min)}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '8px', paddingTop: '6px', borderTop: `1px dashed ${color.border}` }}>
                <span style={{ color: color.textMuted }}>Risk probability:</span>
                <span style={{ color: fastest.riskMetrics.maximumRisk > 0.7 ? color.danger : color.warning, fontWeight: 700 }}>
                  {Math.round(fastest.riskMetrics.maximumRisk * 100)}% ({fastest.riskMetrics.routeRiskLevel})
                </span>
              </div>
            </div>

            {/* SAFEST Option Card */}
            <div
              onClick={() => onSelectMode('SAFEST')}
              style={{
                ...cardStyle,
                cursor: 'pointer',
                border: selectedMode === 'SAFEST' ? `2px solid ${color.success}` : `1px solid ${color.border}`,
                padding: '14px',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.875rem', color: color.success }}>
                  <ShieldCheck size={16} /> Safest route {comparisonResult.recommendedMode === 'SAFEST' && <Star size={14} fill={color.success} color={color.success} />}
                </div>
                {comparisonResult.recommendedMode === 'SAFEST' && (
                  <span style={{ fontSize: '0.68rem', backgroundColor: color.success, color: '#ffffff', padding: '2px 8px', borderRadius: radius.pill, fontWeight: 700 }}>
                    RECOMMENDED
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '0.75rem', borderTop: `1px solid ${color.border}`, paddingTop: '8px', textAlign: 'center' }}>
                <div>
                  <div style={{ color: color.textMuted }}>Baseline</div>
                  <div style={{ fontWeight: 600, color: color.textPrimary, marginTop: '2px' }}>{formatTime(safest.totalTravelTimeMin)}</div>
                </div>
                <div>
                  <div style={{ color: color.textMuted }}>Delay</div>
                  <div style={{ fontWeight: 600, color: color.success, marginTop: '2px' }}>+{Math.round(safest.etaPrediction.predicted_delay_min)}m</div>
                </div>
                <div>
                  <div style={{ color: color.textMuted }}>ETA</div>
                  <div style={{ fontWeight: 700, color: color.success, marginTop: '2px' }}>{formatTime(safest.etaPrediction.predicted_eta_min)}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '8px', paddingTop: '6px', borderTop: `1px dashed ${color.border}` }}>
                <span style={{ color: color.textMuted }}>Risk probability:</span>
                <span style={{ color: color.success, fontWeight: 700 }}>
                  {Math.round(safest.riskMetrics.maximumRisk * 100)}% ({safest.riskMetrics.routeRiskLevel})
                </span>
              </div>
            </div>

            {/* 4. RECOMMENDATION BANNER */}
            <div style={{
              backgroundColor: color.accentSoft,
              border: `1px solid ${color.accentBorder}`,
              borderRadius: radius.lg,
              padding: '12px 14px',
              fontSize: '0.8rem',
              color: color.accent
            }}>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                System recommendation: {comparisonResult.recommendedMode} route
              </div>
              <div style={{ color: color.textSecondary }}>
                {comparisonResult.recommendationReason}
              </div>
            </div>
          </div>
        ) : comparisonResult?.fastestRoute?.status === 'NO_ROUTE_FOUND' ? (
          <div style={{
            backgroundColor: color.dangerSoft,
            borderRadius: radius.lg,
            padding: '16px',
            border: `1px solid ${color.danger}`,
            color: color.danger,
            fontSize: '0.875rem',
            fontWeight: 600,
            textAlign: 'center'
          }}>
            No viable route found — roads blocked
          </div>
        ) : null}

        {/* 5. OPERATIONAL ALERTS PANEL */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ ...sectionLabelStyle, marginBottom: 0, color: color.textMuted, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bell size={14} /> 5. Operational alerts ({language.toUpperCase()})
            </span>
            <span style={{
              fontSize: '0.7rem',
              backgroundColor: activeAlertsCount > 0 ? color.danger : color.surfaceAlt,
              color: activeAlertsCount > 0 ? '#ffffff' : color.textMuted,
              padding: '2px 9px',
              borderRadius: radius.pill,
              fontWeight: 700
            }}>
              {activeAlertsCount}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <div
                  key={alert.alert_id}
                  onClick={() => onSelectAlert(alert)}
                  style={{
                    backgroundColor: color.surfaceAlt,
                    borderLeft: `4px solid ${
                      alert.severity === 'CRITICAL' ? color.danger :
                      alert.severity === 'HIGH' ? '#EA7A1A' :
                      alert.severity === 'MEDIUM' ? color.warning : color.accent
                    }`,
                    opacity: alert.status === 'RESOLVED' ? 0.5 : 1,
                    borderRadius: radius.sm,
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '0.775rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 700, color: color.textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {getAlertIcon(alert.severity)} {language === 'hi' && alert.severity === 'HIGH' ? t.highRiskAlert.title : language === 'as' && alert.severity === 'HIGH' ? t.highRiskAlert.title : alert.title}
                    </span>
                    <span style={{ fontSize: '0.675rem', color: color.textMuted }}>{alert.timestamp}</span>
                  </div>
                  <div style={{ color: color.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {language === 'hi' && alert.severity === 'HIGH' ? t.highRiskAlert.message : language === 'as' && alert.severity === 'HIGH' ? t.highRiskAlert.message : alert.message}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.8rem', color: color.textMuted, textAlign: 'center', padding: '8px' }}>
                No active operational alerts.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 6. EMERGENCY DEMO WALKTHROUGH */}
      <div style={{ padding: '0 16px 16px', flexShrink: 0 }}>
        <DemoWalkthroughPanel
          currentStep={demoStep}
          onNextStep={onNextDemoStep}
          onResetDemo={onResetDemo}
        />
      </div>
    </aside>
  );
};

