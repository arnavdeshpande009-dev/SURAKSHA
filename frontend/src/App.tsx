import React, { useEffect, useState, useMemo, useRef } from 'react';
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
import { Compass, Database, RefreshCw, Truck, ChevronDown } from 'lucide-react';
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

const ROLE_OPTIONS: { role: FleetRole; label: string }[] = [
  { role: 'ADMINISTRATOR', label: 'Admin' },
  { role: 'DISPATCHER', label: 'Dispatcher' },
  { role: 'DRIVER', label: 'Driver' },
  { role: 'RISK_ANALYST', label: 'Risk analyst' }
];

export const App: React.FC = () => {
  const locations = RoadNetworkService.getLocations();
  const [activeRole, setActiveRole] = useState<FleetRole>('DISPATCHER');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState<boolean>(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [trucks, setTrucks] = useState<SimulatedTruck[]>(INITIAL_TRUCKS);
  const [weatherSummary, setWeatherSummary] = useState<string>('Weather: loading');
  const [cargoType, setCargoType] = useState<string>('MEDICAL_SUPPLIES');
  const [language, setLanguage] = useState<Language>('en');
  const [isFieldReportOpen, setIsFieldReportOpen] = useState<boolean>(false);
  const [dynamicIncidents, setDynamicIncidents] = useState<DemoIncident[]>(DEMO_INCIDENTS);

  useEffect(() => {
    console.log('[FLEET] polling started');

    // Smooth local progress animation interval (purely client-side UI update, no network calls)
    const animationTimer = window.setInterval(() => {
      setTrucks((currentTrucks) => currentTrucks.map((truck) => ({
        ...truck,
        progress: truck.status === 'IDLE' ? truck.progress : (truck.progress + 0.008) % 1
      })));
    }, 1000);

    // Controlled 12-second fleet network polling loop
    const fetchFleet = () => {
      backendService.getFleetTrucks()
        .then((liveTrucks) => {
          setTrucks(liveTrucks);
        })
        .catch(() => undefined);
    };

    fetchFleet();
    const networkTimer = window.setInterval(fetchFleet, 12000);

    return () => {
      console.log('[FLEET] polling stopped');
      window.clearInterval(animationTimer);
      window.clearInterval(networkTimer);
    };
  }, []);

  useEffect(() => {
    void backendService.syncPendingIncidents();
    const weatherTimer = window.setInterval(() => {
      backendService.getWeather(26.1445, 91.7362)
        .then((weather) => setWeatherSummary(`${weather.temperature_c}°C · ${weather.rainfall_mm}mm rain`))
        .catch(() => setWeatherSummary('Weather: offline'));
    }, 300000);
    backendService.getWeather(26.1445, 91.7362)
      .then((weather) => setWeatherSummary(`${weather.temperature_c}°C · ${weather.rainfall_mm}mm rain`))
      .catch(() => setWeatherSummary('Weather: offline'));
    return () => window.clearInterval(weatherTimer);
  }, []);

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
    return baseRoads.map((r) => {
      const name = (r.name || '') + ' ' + (r.road_id || '');
      if (r.road_id === 'NER-R002' || name.toUpperCase().includes('NH6') || name.toUpperCase().includes('NH-6')) {
        return {
          ...r,
          status: 'RISKY' as const,
          ai_risk: {
            disruption_probability: (rainfallSimulated || demoStep >= 1) ? 0.92 : 0.85,
            risk_level: 'HIGH' as const
          }
        };
      }
      return r;
    });
  }, [rainfallSimulated, demoStep]);

  useEffect(() => {
    let cancelled = false;

    const enrichRoadRisk = async () => {
      try {
        // Sample key RISKY corridors and primary highways to enrich risk predictions without socket pool exhaustion
        const targetRoads = roads.filter((r) => r.status === 'RISKY' || r.road_id === 'NER-R002').slice(0, 15);
        if (targetRoads.length === 0) return;

        const predictions = await Promise.all(
          targetRoads.map((road) => backendService.predictRoadRisk(road).catch(() => null))
        );

        if (cancelled) return;

        const predictionMap = new Map(
          predictions.filter((p): p is NonNullable<typeof p> => p !== null).map((p) => [p.road_id, p])
        );

        const enrichedRoads = roads.map((road) => {
          const pred = predictionMap.get(road.road_id);
          if (!pred) return road;
          return {
            ...road,
            ai_risk: {
              disruption_probability: pred.disruption_probability,
              risk_level: pred.risk_level
            }
          };
        });

        setBackendRoads(enrichedRoads);
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
  const [origin, setOrigin] = useState<string>('LOC-GAU'); // Guwahati
  const [destination, setDestination] = useState<string>('LOC-AIZ'); // Aizawl

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
          {/* Custom Dark Role Selector */}
          <div ref={roleDropdownRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setIsRoleDropdownOpen((prev) => !prev)}
              aria-label="Active user role"
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.16)',
                borderRadius: radius.pill,
                color: '#FFFFFF',
                padding: '6px 12px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{ROLE_OPTIONS.find((opt) => opt.role === activeRole)?.label ?? 'Role'}</span>
              <ChevronDown size={12} style={{ transform: isRoleDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
            </button>

            {isRoleDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                backgroundColor: '#0F2747',
                border: '1px solid rgba(255,255,255,0.16)',
                borderRadius: radius.md,
                padding: '4px',
                zIndex: 100,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                minWidth: '130px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                {ROLE_OPTIONS.map((opt) => {
                  const isSelected = activeRole === opt.role;
                  return (
                    <button
                      key={opt.role}
                      type="button"
                      onClick={() => {
                        setActiveRole(opt.role);
                        setIsRoleDropdownOpen(false);
                      }}
                      style={{
                        backgroundColor: isSelected ? color.accent : 'transparent',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: radius.sm,
                        padding: '7px 10px',
                        fontSize: '0.75rem',
                        fontWeight: isSelected ? 700 : 500,
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'background-color 0.12s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
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

