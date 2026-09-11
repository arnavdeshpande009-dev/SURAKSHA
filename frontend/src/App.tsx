import React, { useEffect, useState, useMemo } from 'react';
import type { ExtendedRoadSegment } from './types/road';
import type { RouteResult, RoutingMode, RiskRoutingConfig } from './routing/types';
import type { Alert, AlertStatus, DemoIncident } from './types/alert';
import type { DemoStep } from './data/demoScenario';
import type { FleetRole, SimulatedTruck } from './data/fleet';
import { INITIAL_TRUCKS } from './data/fleet';
import { MapComponent } from './components/Map/MapComponent';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Legend } from './components/Legend/Legend';
import { RoadInfo } from './components/RoadInfo/RoadInfo';
import { AlertDetailsModal } from './components/Alerts/AlertDetailsModal';
import { FieldIncidentModal } from './components/Incidents/FieldIncidentModal';
import { RoadNetworkService } from './services/roadService';
import { RouteService } from './routing/routeService';
import { AlertEngine } from './services/alertEngine';
import { backendService } from './services/backendService';
import { DEMO_INCIDENTS } from './data/demoIncidents';
import type { Language } from './data/translations';
import { DEFAULT_RISK_ROUTING_CONFIG } from './routing/graph';
import { Compass, Database, RefreshCw, Truck } from 'lucide-react';
import { theme } from './theme';
import './App.css';

const { color, radius, font } = theme;

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
  const [activeRole, setActiveRole] = useState<FleetRole>('DISPATCHER');
  const [trucks, setTrucks] = useState<SimulatedTruck[]>(INITIAL_TRUCKS);
  const [weatherSummary, setWeatherSummary] = useState<string>('Weather: loading');
  const [cargoType, setCargoType] = useState<string>('MEDICAL_SUPPLIES');
  const [language, setLanguage] = useState<Language>('en');
  const [isFieldReportOpen, setIsFieldReportOpen] = useState<boolean>(false);
  const [dynamicIncidents, setDynamicIncidents] = useState<DemoIncident[]>(DEMO_INCIDENTS);
  const [origin, setOrigin] = useState<string>('LOC-GAU'); // Guwahati
  const [destination, setDestination] = useState<string>('LOC-AIZ'); // Aizawl

  useEffect(() => {
    const timer = window.setInterval(() => {
      backendService.getFleetTrucks()
        .then(setTrucks)
        .catch(() => setTrucks((currentTrucks) => currentTrucks.map((truck) => ({
          ...truck,
          progress: truck.status === 'IDLE' ? truck.progress : (truck.progress + 0.008) % 1
        }))));
    }, 1000);

    backendService.getFleetTrucks().then(setTrucks).catch(() => undefined);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    void backendService.syncPendingIncidents();

    const originLoc = locations.find((l) => l.id === origin);
    const lat = originLoc ? originLoc.coordinates[1] : 26.1445;
    const lng = originLoc ? originLoc.coordinates[0] : 91.7362;

    const updateWeather = () => {
      backendService.getWeather(lat, lng)
        .then((weather) => {
          if (weather.status === 'online' && weather.temperature_c !== undefined) {
            const rainText = weather.rainfall_mm !== undefined && weather.rainfall_mm > 0 ? ` · Rain ${weather.rainfall_mm}mm` : ' · Clear';
            setWeatherSummary(`${weather.temperature_c}°C${rainText} (${weather.source || 'Open-Meteo'})`);
          } else {
            setWeatherSummary('Weather: offline');
          }
        })
        .catch(() => setWeatherSummary('Weather: offline'));
    };

    updateWeather();
    const weatherTimer = window.setInterval(updateWeather, 300000);
    return () => window.clearInterval(weatherTimer);
  }, [origin, locations]);

  useEffect(() => {
    if (activeRole !== 'DRIVER' || !navigator.geolocation) return undefined;
    const watchId = navigator.geolocation.watchPosition((position) => {
      void backendService.recordTelemetry(
        'TRK-101',
        position.coords.latitude,
        position.coords.longitude,
        position.coords.speed ? position.coords.speed * 3.6 : 0
      );
    }, () => undefined, { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 });
    return () => navigator.geolocation.clearWatch(watchId);
  }, [activeRole]);

  // State for M9 Demo Walkthrough Sequence
  const [demoStep, setDemoStep] = useState<DemoStep>(0);
  const [rainfallSimulated, setRainfallSimulated] = useState<boolean>(false);
  const [backendRoads, setBackendRoads] = useState<ExtendedRoadSegment[] | null>(null);
  const [backendEtas, setBackendEtas] = useState<Record<string, RouteResult['etaPrediction']>>({});

  // Dynamically update road risk based on rainfall simulation step or field incident
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

  useEffect(() => {
    let cancelled = false;

    const enrichRoadRisk = async () => {
      try {
        const enrichedRoads = await Promise.all(roads.map(async (road) => {
          const prediction = await backendService.predictRoadRisk(road);
          return {
            ...road,
            ai_risk: {
              disruption_probability: prediction.disruption_probability,
              risk_level: prediction.risk_level
            }
          };
        }));

        if (!cancelled) setBackendRoads(enrichedRoads);
      } catch {
        if (!cancelled) setBackendRoads(null);
      }
    };

    enrichRoadRisk();
    return () => { cancelled = true; };
  }, [roads]);

  const activeRoads = backendRoads ?? roads;

  const [selectedRoad, setSelectedRoad] = useState<ExtendedRoadSegment | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  // Determine selected mode based on demo step progression
  const [userSelectedMode, setUserSelectedMode] = useState<RoutingMode | null>(null);

  const handleOriginChange = (newOrigin: string) => {
    setOrigin(newOrigin);
    setUserSelectedMode(null);
    setBackendEtas({});
  };

  const handleDestinationChange = (newDest: string) => {
    setDestination(newDest);
    setUserSelectedMode(null);
    setBackendEtas({});
  };

  const selectedMode: RoutingMode = useMemo(() => {
    if (userSelectedMode !== null) return userSelectedMode;
    if (demoStep >= 4) return 'SAFEST';
    return 'FASTEST';
  }, [userSelectedMode, demoStep]);

  // Derive Cargo Criticality Risk Policy Config
  const riskRoutingConfig: RiskRoutingConfig = useMemo(() => {
    switch (cargoType) {
      case 'MEDICAL_SUPPLIES':
        return {
          ...DEFAULT_RISK_ROUTING_CONFIG,
          maxAcceptableExtraTimePercent: 80.0,
          minRequiredRiskReduction: 0.05,
          riskWeightMin: 500
        };
      case 'FOOD_ESSENTIALS':
        return {
          ...DEFAULT_RISK_ROUTING_CONFIG,
          maxAcceptableExtraTimePercent: 40.0,
          minRequiredRiskReduction: 0.10,
          riskWeightMin: 350
        };
      case 'CONSTRUCTION_MATERIAL':
        return {
          ...DEFAULT_RISK_ROUTING_CONFIG,
          maxAcceptableExtraTimePercent: 20.0,
          minRequiredRiskReduction: 0.20,
          riskWeightMin: 200
        };
      default:
        return DEFAULT_RISK_ROUTING_CONFIG;
    }
  }, [cargoType]);

  // Compute both FASTEST and SAFEST routes and recommendation comparison
  const localComparisonResult = useMemo(() => {
    if (!origin || !destination) return null;
    return RouteService.compareRoutes(origin, destination, riskRoutingConfig, activeRoads);
  }, [origin, destination, riskRoutingConfig, activeRoads]);

  useEffect(() => {
    let cancelled = false;

    const enrichRouteEta = async () => {
      if (!localComparisonResult) {
        setBackendEtas({});
        return;
      }

      try {
        const entries = await Promise.all(
          [localComparisonResult.fastestRoute, localComparisonResult.safestRoute]
            .filter((route): route is NonNullable<typeof route> => route !== null)
            .map(async (route) => {
              const eta = await backendService.predictRouteEta({
                totalTravelTimeMin: route.totalTravelTimeMin,
                totalDistanceKm: route.totalDistanceKm,
                averageRisk: route.riskMetrics.averageRisk,
                maximumRisk: route.riskMetrics.maximumRisk,
                roadSegments: route.roadSegments
              });
              return [route.mode, eta] as const;
            })
        );

        if (!cancelled) setBackendEtas(Object.fromEntries(entries));
      } catch {
        if (!cancelled) setBackendEtas({});
      }
    };

    enrichRouteEta();
    return () => { cancelled = true; };
  }, [localComparisonResult]);

  const comparisonResult = useMemo(() => {
    if (!localComparisonResult) return null;

    return {
      ...localComparisonResult,
      fastestRoute: localComparisonResult.fastestRoute
        ? { ...localComparisonResult.fastestRoute, etaPrediction: backendEtas.FASTEST ?? localComparisonResult.fastestRoute.etaPrediction }
        : null,
      safestRoute: localComparisonResult.safestRoute
        ? { ...localComparisonResult.safestRoute, etaPrediction: backendEtas.SAFEST ?? localComparisonResult.safestRoute.etaPrediction }
        : null
    };
  }, [localComparisonResult, backendEtas]);

  // Determine active route based on selected mode
  const activeRoute = useMemo(() => {
    if (!comparisonResult) return null;
    return selectedMode === 'SAFEST' ? comparisonResult.safestRoute : comparisonResult.fastestRoute;
  }, [comparisonResult, selectedMode]);

  // Dynamic alert list state
  const [alertOverrides, setAlertOverrides] = useState<Record<string, AlertStatus>>({});

  const rawAlerts = useMemo(() => {
    const roadAlerts: Alert[] = [];
    activeRoads.forEach((road) => {
      const alert = AlertEngine.evaluateRoadAlert(road);
      if (alert) roadAlerts.push(alert);
    });

    const routeAlerts = AlertEngine.evaluateRouteAlerts(comparisonResult);
    return [...routeAlerts, ...roadAlerts];
  }, [activeRoads, comparisonResult]);

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

  const handleFieldIncidentSubmitted = (newIncident: {
    id: string;
    road_id: string;
    type: string;
    severity: string;
    title: string;
    location: string;
    coordinates: [number, number];
    description: string;
    photo_url?: string;
  }) => {
    const formatted: DemoIncident = {
      id: newIncident.id,
      road_id: newIncident.road_id,
      type: newIncident.type as DemoIncident['type'],
      severity: newIncident.severity as DemoIncident['severity'],
      title: newIncident.title,
      location: newIncident.location,
      coordinates: newIncident.coordinates,
      description: newIncident.description
    };
    setDynamicIncidents((prev) => [formatted, ...prev]);
    setRainfallSimulated(true);
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
    setTrucks(INITIAL_TRUCKS);
    setBackendRoads(null);
    setBackendEtas({});
    setOrigin('LOC-GAU');
    setDestination('LOC-AIZ');
    setDynamicIncidents(DEMO_INCIDENTS);
    RouteService.resetGraphCache();
  };

  return (
    <div className="app-shell" style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100vw',
      height: '100vh',
      backgroundColor: color.bg,
      fontFamily: font.family,
      overflow: 'hidden'
    }}>
      {/* 1. TOP HEADER BAR */}
      <header className="app-header" style={{
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
          <div style={statusChip('#A7F3D0')}>{weatherSummary}</div>
          <div style={statusChip('#7DD3FC')}>
            <Truck size={12} /> {trucks.filter((truck) => truck.status === 'MOVING').length} trucks live
          </div>
          <select
            value={activeRole}
            onChange={(event) => setActiveRole(event.target.value as FleetRole)}
            aria-label="Active user role"
            style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.16)',
              borderRadius: radius.pill,
              color: '#FFFFFF',
              padding: '6px 10px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <option value="ADMINISTRATOR">Admin</option>
            <option value="DISPATCHER">Dispatcher</option>
            <option value="DRIVER">Driver</option>
            <option value="RISK_ANALYST">Risk analyst</option>
          </select>
          <button
            onClick={handleResetDemo}
            title="Reload dashboard"
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
            <RefreshCw size={13} /> Reload
          </button>
        </div>
      </header>

      {/* 2. MAIN CONTROL TOWER CONTENT */}
      <div className="app-main" style={{
        display: 'flex',
        flex: 1,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Map Viewport Area */}
        <div className="map-viewport" style={{ flex: 1, position: 'relative', height: '100%', backgroundColor: color.navy }}>
          <MapComponent
            roads={activeRoads}
            locations={locations}
            trucks={trucks}
            onRoadClick={(road) => setSelectedRoad(road)}
            selectedOrigin={origin}
            selectedDestination={destination}
            activeRoute={activeRoute}
            comparisonResult={comparisonResult}
            incidents={dynamicIncidents}
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
          <FieldIncidentModal
            isOpen={isFieldReportOpen}
            onClose={() => setIsFieldReportOpen(false)}
            onIncidentSubmitted={handleFieldIncidentSubmitted}
          />
        </div>

        {/* Control Tower Sidebar */}
        <Sidebar
          role={activeRole}
          locations={locations}
          origin={origin}
          destination={destination}
          onOriginChange={handleOriginChange}
          onDestinationChange={handleDestinationChange}
          comparisonResult={comparisonResult}
          selectedMode={selectedMode}
          onSelectMode={(mode) => setUserSelectedMode(mode)}
          alerts={alerts}
          onSelectAlert={(alert) => setSelectedAlert(alert)}
          demoStep={demoStep}
          onNextDemoStep={handleNextDemoStep}
          onResetDemo={handleResetDemo}
          onTruckUpdated={(truck) => setTrucks((current) => current.map((item) => item.id === truck.id ? truck : item))}
          cargoType={cargoType}
          onCargoTypeChange={setCargoType}
          language={language}
          onLanguageChange={setLanguage}
          onOpenFieldReport={() => setIsFieldReportOpen(true)}
          incidents={dynamicIncidents}
        />
      </div>

      {/* 3. BOTTOM COMPACT STATUS BAR (DEMO DATA LABELLING) */}
      <footer className="app-footer" style={{
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
          <span>Basemap: Google Maps · Telemetry: Synthetic XGBoost Risk &amp; ETA</span>
        </div>
      </footer>
    </div>
  );
};

export default App;

