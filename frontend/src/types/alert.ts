export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
export type AlertType = 'HIGH_DISRUPTION_RISK' | 'BLOCKED_ROAD' | 'ROUTE_RISK_INCREASE' | 'REROUTING_RECOMMENDATION';

export interface Alert {
  alert_id: string;
  road_id?: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  cause: string;
  risk_probability?: number;
  timestamp: string;
  recommended_action: string;
  status: AlertStatus;
}

export type IncidentType = 'FLOOD' | 'LANDSLIDE' | 'ROAD_DAMAGE' | 'HEAVY_RAINFALL' | 'CONGESTION';
export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface DemoIncident {
  incident_id: string;
  road_id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  latitude: number;
  longitude: number;
  description: string;
  timestamp: string;
}

export interface AlertRuleConfig {
  lowMax: number;      // < 0.30
  mediumMax: number;   // 0.30 <= risk < 0.60
  highMax: number;     // 0.60 <= risk < 0.80
  criticalMin: number; // >= 0.80
}
