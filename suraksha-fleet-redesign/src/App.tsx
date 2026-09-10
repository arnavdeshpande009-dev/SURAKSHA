import React, { useState, useMemo } from 'react';
import type { ExtendedRoadSegment } from './types/road';
import type { RoutingMode } from './routing/types';
import type { Alert, AlertStatus, DemoIncident } from './types/alert';
import type { DemoStep } from './data/demoScenario';
import { MapComponent } from './components/Map/MapComponent';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Legend } from './components/Legend/Legend';
import { RoadInfo } from './components/RoadInfo/RoadInfo';
import { AlertDetailsModal } from './components/Alerts/AlertDetailsModal';
import { RoadNetworkService } from './services/roadService';
import { RouteService } from './routing/routeService';
import { AlertEngine } from './services/alertEngine';
import { DEMO_INCIDENTS } from './data/demoIncidents';
import { Compass, Database, Server, RefreshCw } from 'lucide-react';
import { theme } from './theme';
import './App.css';

const { color, radius, shadow, font } = theme;

const statusChip = (accent: string): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  backgroundColor: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  padding: '5px 12px',
  borderRadius: radius.pill,
  color: accent,
  fontWeight: 600,
  fontSize: '0.72rem',
  letterSpacing: '0.02em',
});

export const App: React.FC = () => {
  const locations = RoadNetworkService.getLocations();

  // State for M9 Demo Walkthrough Sequence
  const [demoStep, setDemoStep] = useState<DemoStep>(0);
  const [rainfallSimulated, setRainfallSimulated] = useState<boolean>(false);

  // Dynamically update road risk based on rainfall simulation step
  const roads: ExtendedRoadSegment[] = useMemo(() => {
    const baseRoads = RoadNetworkService.getRoadSegments();
    if (rainfallSimulated || demoStep >= 1) {
      return baseRoads.map((r) => {
        if (r.road_id === 'NER-R002') {
          return {
            ...r,
            status: 'RISKY' as const,
            ai_risk: { disruption_probability: 0.92, risk_level: 'HIGH' as const }
          };
        }
        return r;
      });
    }
    return baseRoads;
  }, [rainfallSimulated, demoStep]);

  const [selectedRoad, setSelectedRoad] = useState<ExtendedRoadSegment | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [origin, setOrigin] = useState<string>('LOC-GAU'); // Guwahati
  const [destination, setDestination] = useState<string>('LOC-AIZ'); // Aizawl

  // Determine selected mode based on demo step progression
  const [userSelectedMode, setUserSelectedMode] = useState<RoutingMode | null>(null);

  const selectedMode: RoutingMode = useMemo(() => {
    if (userSelectedMode !== null) return userSelectedMode;
    if (demoStep >= 4) return 'SAFEST';
    return 'FASTEST';
  }, [userSelectedMode, demoStep]);

  // Compute both FASTEST and SAFEST routes and recommendation comparison
  const comparisonResult = useMemo(() => {
    if (!origin || !destination) return null;
    return RouteService.compareRoutes(origin, destination);
  }, [origin, destination]);

  // Determine active route based on selected mode
  const activeRoute = useMemo(() => {
    if (!comparisonResult) return null;
    return selectedMode === 'SAFEST' ? comparisonResult.safestRoute : comparisonResult.fastestRoute;
  }, [comparisonResult, selectedMode]);

  // Dynamic alert list state
  const [alertOverrides, setAlertOverrides] = useState<Record<string, AlertStatus>>({});

  const rawAlerts = useMemo(() => {
    const roadAlerts: Alert[] = [];
    roads.forEach((road) => {
      const alert = AlertEngine.evaluateRoadAlert(road);
      if (alert) roadAlerts.push(alert);
    });

    const routeAlerts = AlertEngine.evaluateRouteAlerts(comparisonResult);
    return [...routeAlerts, ...roadAlerts];
  }, [roads, comparisonResult]);

  const alerts = useMemo(() => {
    return rawAlerts.map((a) => ({
      ...a,
      status: alertOverrides[a.alert_id] || a.status
    }));
  }, [rawAlerts, alertOverrides]);

  const handleUpdateAlertStatus = (alertId: string, newStatus: AlertStatus) => {
    setAlertOverrides((prev) => ({ ...prev, [alertId]: newStatus }));
    if (selectedAlert?.alert_id === alertId) {
      setSelectedAlert((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleIncidentClick = (incident: DemoIncident) => {
    const matchedRoad = roads.find((r) => r.road_id === incident.road_id);
    if (matchedRoad) {
      setSelectedRoad(matchedRoad);
    }
  };

  // Demo Step advance handler
  const handleNextDemoStep = () => {
    if (demoStep === 0) {
      setOrigin('LOC-GAU');
      setDestination('LOC-AIZ');
      setUserSelectedMode('FASTEST');
      setDemoStep(1);
    } else if (demoStep === 1) {
      setRainfallSimulated(true);
      setDemoStep(2);
    } else if (demoStep === 2) {
      const highAlert = alerts.find((a) => a.severity === 'CRITICAL' || a.severity === 'HIGH');
      if (highAlert) setSelectedAlert(highAlert);
      setDemoStep(3);
    } else if (demoStep === 3) {
      setSelectedAlert(null);
      setDemoStep(4);
    } else if (demoStep === 4) {
      setUserSelectedMode('SAFEST');
      setDemoStep(5);
    }
  };

  const handleResetDemo = () => {
    setDemoStep(0);
    setRainfallSimulated(false);
    setUserSelectedMode(null);
    setSelectedAlert(null);
    setSelectedRoad(null);
    setAlertOverrides({});
    setOrigin('LOC-GAU');
    setDestination('LOC-AIZ');
    RouteService.resetGraphCache();
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100vw',
      height: '100vh',
      backgroundColor: color.bg,
      fontFamily: font.family,
      overflow: 'hidden'
    }}>
      {/* 1. TOP HEADER BAR */}
      <header style={{
        height: '60px',
        backgroundColor: color.navy,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        color: color.onDark,
        zIndex: 30,
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            backgroundColor: color.accent,
            color: '#ffffff',
            width: '34px',
            height: '34px',
            borderRadius: radius.md,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Compass size={19} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.01em', color: '#ffffff' }}>
                SURAKSHA
              </span>
              <span style={{ fontSize: '0.8rem', color: color.onDarkMuted, fontWeight: 500 }}>
                Logistics &amp; Accessibility Intelligence — Northeast Region
              </span>
            </div>
          </div>
        </div>

        {/* System Status Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={statusChip('#4ADE80')}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ADE80' }} />
            Map online
          </div>
          <div style={statusChip('#FBBF24')}>Traffic: demo</div>
          <div style={statusChip('#7DD3FC')}>
            <Server size={12} /> AI engine ready
          </div>

          <button
            onClick={handleResetDemo}
            title="Reset All Demo States"
            style={{
              backgroundColor: color.accent,
              border: 'none',
              borderRadius: radius.pill,
              color: '#ffffff',
              padding: '7px 16px',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginLeft: '4px'
            }}
          >
            <RefreshCw size={13} /> Reset demo
          </button>
        </div>
      </header>

      {/* 2. MAIN CONTROL TOWER CONTENT */}
      <div style={{
        display: 'flex',
        flex: 1,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Map Viewport Area */}
        <div style={{ flex: 1, position: 'relative', height: '100%', backgroundColor: color.navy }}>
          <MapComponent
            roads={roads}
            locations={locations}
            onRoadClick={(road) => setSelectedRoad(road)}
            selectedOrigin={origin}
            selectedDestination={destination}
            activeRoute={activeRoute}
            comparisonResult={comparisonResult}
            incidents={DEMO_INCIDENTS}
            onIncidentClick={handleIncidentClick}
          />
          <Legend />
          <RoadInfo road={selectedRoad} onClose={() => setSelectedRoad(null)} />
          <AlertDetailsModal
            alert={selectedAlert}
            onClose={() => setSelectedAlert(null)}
            onUpdateStatus={handleUpdateAlertStatus}
            onSwitchToSafestRoute={() => setUserSelectedMode('SAFEST')}
          />
        </div>

        {/* Control Tower Sidebar */}
        <Sidebar
          locations={locations}
          origin={origin}
          destination={destination}
          onOriginChange={(id) => { setOrigin(id); setUserSelectedMode(null); }}
          onDestinationChange={(id) => { setDestination(id); setUserSelectedMode(null); }}
          comparisonResult={comparisonResult}
          selectedMode={selectedMode}
          onSelectMode={(mode) => setUserSelectedMode(mode)}
          alerts={alerts}
          onSelectAlert={(alert) => setSelectedAlert(alert)}
          demoStep={demoStep}
          onNextDemoStep={handleNextDemoStep}
          onResetDemo={handleResetDemo}
          rainfallSimulated={rainfallSimulated}
        />
      </div>

      {/* 3. BOTTOM COMPACT STATUS BAR (DEMO DATA LABELLING) */}
      <footer style={{
        height: '30px',
        backgroundColor: color.surface,
        borderTop: `1px solid ${color.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        fontSize: '0.72rem',
        color: color.textMuted,
        zIndex: 30,
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={12} color={color.accent} />
          <span>Basemap: OpenStreetMap Raster Tiles · Telemetry: Synthetic XGBoost Risk &amp; ETA</span>
        </div>
        <div style={{
          backgroundColor: color.warningSoft,
          borderRadius: radius.sm,
          padding: '2px 10px',
          color: color.warning,
          fontWeight: 700
        }}>
          Demo / simulation mode — Internal Hackathon 2026
        </div>
      </footer>
    </div>
  );
};

export default App;
