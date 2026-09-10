import type { LocationNode, RoadSegment, ExtendedRoadSegment, AIRiskPrediction } from '../types/road';

export const DEMO_LOCATIONS: LocationNode[] = [
  { id: 'LOC-GAU', name: 'Guwahati', state: 'Assam', coordinates: [91.7362, 26.1445] },
  { id: 'LOC-SHL', name: 'Shillong', state: 'Meghalaya', coordinates: [91.8933, 25.5788] },
  { id: 'LOC-SIL', name: 'Silchar', state: 'Assam', coordinates: [92.7789, 24.8333] },
  { id: 'LOC-AIZ', name: 'Aizawl', state: 'Mizoram', coordinates: [92.7176, 23.7367] },
  { id: 'LOC-IMP', name: 'Imphal', state: 'Manipur', coordinates: [93.9368, 24.8170] },
  { id: 'LOC-AGA', name: 'Agartala', state: 'Tripura', coordinates: [91.2868, 23.8315] },
  { id: 'LOC-KOH', name: 'Kohima', state: 'Nagaland', coordinates: [94.1086, 25.6751] },
  { id: 'LOC-GAN', name: 'Gangtok', state: 'Sikkim', coordinates: [88.6138, 27.3389] },
  { id: 'LOC-ITA', name: 'Itanagar', state: 'Arunachal Pradesh', coordinates: [93.6053, 27.0844] },
];

/**
 * Demo road network connecting key North Eastern hubs.
 * Demonstrates FASTEST vs SAFEST route trade-offs between Guwahati and Aizawl.
 * 
 * Option A (via Shillong, NH-6):
 * - Distance: 490 km
 * - Travel Time: 13h 30m (810 min) -> FASTEST
 * - AI Risk: 85% HIGH (Landslide prone section NH-6 Shillong to Silchar)
 * 
 * Option B (via Nagaon & Haflong, NH-27/620):
 * - Distance: 506 km
 * - Travel Time: 14h 10m (850 min) -> 40 mins longer, but SAFEST
 * - AI Risk: 15% LOW (Bypasses landslide corridor)
 */
export const DEMO_ROADS: ExtendedRoadSegment[] = [
  {
    road_id: 'NER-R001',
    name: 'NH-6 (Guwahati to Shillong)',
    start_node: 'LOC-GAU',
    end_node: 'LOC-SHL',
    distance_km: 99.0,
    travel_time_min: 150, // 2h 30m
    status: 'OPEN',
    coordinates: [
      [91.7362, 26.1445],
      [91.8000, 25.9000],
      [91.8933, 25.5788]
    ],
    ai_risk: { disruption_probability: 0.12, risk_level: 'LOW' }
  },
  {
    road_id: 'NER-R002',
    name: 'NH-6 (Shillong to Silchar - Severe Landslide Risk)',
    start_node: 'LOC-SHL',
    end_node: 'LOC-SIL',
    distance_km: 215.0,
    travel_time_min: 360, // 6h 0m (Total GAU-SHL-SIL = 510m / 8h 30m)
    status: 'RISKY',
    coordinates: [
      [91.8933, 25.5788],
      [92.2500, 25.2000],
      [92.7789, 24.8333]
    ],
    ai_risk: { disruption_probability: 0.85, risk_level: 'HIGH' } // High risk shortcut!
  },
  {
    road_id: 'NER-R002A',
    name: 'NH-27 / NH-620 (Guwahati to Silchar via Nagaon & Haflong Bypass)',
    start_node: 'LOC-GAU',
    end_node: 'LOC-SIL',
    distance_km: 330.0,
    travel_time_min: 550, // 9h 10m (Total GAU-Nagaon-SIL = 550m / 9h 10m -> 40m longer, but safe!)
    status: 'OPEN',
    coordinates: [
      [91.7362, 26.1445],
      [92.6800, 26.3500],
      [93.1500, 25.1800],
      [92.7789, 24.8333]
    ],
    ai_risk: { disruption_probability: 0.15, risk_level: 'LOW' } // Low risk bypass
  },
  {
    road_id: 'NER-R003',
    name: 'NH-306 (Silchar to Aizawl)',
    start_node: 'LOC-SIL',
    end_node: 'LOC-AIZ',
    distance_km: 176.0,
    travel_time_min: 300,
    status: 'OPEN',
    coordinates: [
      [92.7789, 24.8333],
      [92.6800, 24.2000],
      [92.7176, 23.7367]
    ],
    ai_risk: { disruption_probability: 0.22, risk_level: 'LOW' }
  },
  {
    road_id: 'NER-R004',
    name: 'NH-37 (Guwahati to Itanagar Link)',
    start_node: 'LOC-GAU',
    end_node: 'LOC-ITA',
    distance_km: 320.0,
    travel_time_min: 420,
    status: 'OPEN',
    coordinates: [
      [91.7362, 26.1445],
      [92.5000, 26.6000],
      [93.6053, 27.0844]
    ],
    ai_risk: { disruption_probability: 0.18, risk_level: 'LOW' }
  },
  {
    road_id: 'NER-R005',
    name: 'NH-37 / NH-29 (Guwahati to Kohima)',
    start_node: 'LOC-GAU',
    end_node: 'LOC-KOH',
    distance_km: 345.0,
    travel_time_min: 480,
    status: 'OPEN',
    coordinates: [
      [91.7362, 26.1445],
      [92.9000, 26.2000],
      [94.1086, 25.6751]
    ],
    ai_risk: { disruption_probability: 0.25, risk_level: 'LOW' }
  },
  {
    road_id: 'NER-R006',
    name: 'NH-2 (Kohima to Imphal)',
    start_node: 'LOC-KOH',
    end_node: 'LOC-IMP',
    distance_km: 138.0,
    travel_time_min: 240,
    status: 'BLOCKED',
    coordinates: [
      [94.1086, 25.6751],
      [94.0000, 25.2000],
      [93.9368, 24.8170]
    ],
    ai_risk: { disruption_probability: 0.95, risk_level: 'HIGH' }
  },
  {
    road_id: 'NER-R007',
    name: 'NH-8 (Silchar to Agartala)',
    start_node: 'LOC-SIL',
    end_node: 'LOC-AGA',
    distance_km: 250.0,
    travel_time_min: 390,
    status: 'OPEN',
    coordinates: [
      [92.7789, 24.8333],
      [92.1000, 24.2000],
      [91.2868, 23.8315]
    ],
    ai_risk: { disruption_probability: 0.31, risk_level: 'LOW' }
  },
  {
    road_id: 'NER-R008',
    name: 'NH-10 (Guwahati to Gangtok Link)',
    start_node: 'LOC-GAU',
    end_node: 'LOC-GAN',
    distance_km: 540.0,
    travel_time_min: 720,
    status: 'RISKY',
    coordinates: [
      [91.7362, 26.1445],
      [89.5000, 26.7000],
      [88.6138, 27.3389]
    ],
    ai_risk: { disruption_probability: 0.58, risk_level: 'MEDIUM' }
  }
];
