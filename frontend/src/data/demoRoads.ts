import type { LocationNode, ExtendedRoadSegment } from '../types/road';

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
 * Realistic curvy waypoints following the actual National Highway alignments in the Northeast.
 */
export const DEMO_ROADS: ExtendedRoadSegment[] = [
  {
    road_id: 'NER-R001',
    name: 'NH-6 (Guwahati to Shillong)',
    start_node: 'LOC-GAU',
    end_node: 'LOC-SHL',
    distance_km: 99.0,
    travel_time_min: 150,
    status: 'OPEN',
    coordinates: [
      [91.7362, 26.1445], // Guwahati
      [91.8100, 26.0500], // Dispur exit
      [91.8700, 25.9600], // Jorabat junction
      [91.8900, 25.8800], // Nongpoh entry
      [91.8820, 25.8000], // Nongpoh hill climb
      [91.8950, 25.7100], // Umling
      [91.9020, 25.6500], // Umiam lake bypass
      [91.8933, 25.5788]  // Shillong
    ],
    ai_risk: { disruption_probability: 0.12, risk_level: 'LOW' }
  },
  {
    road_id: 'NER-R002',
    name: 'NH-6 (Shillong to Silchar - Severe Landslide Risk)',
    start_node: 'LOC-SHL',
    end_node: 'LOC-SIL',
    distance_km: 215.0,
    travel_time_min: 360,
    status: 'RISKY',
    coordinates: [
      [91.8933, 25.5788], // Shillong
      [92.0500, 25.5000], // Mawryngkneng
      [92.2000, 25.4300], // Jowai north
      [92.2600, 25.3500], // Jowai bypass
      [92.3500, 25.2800], // Lad Rymbai
      [92.4200, 25.2100], // Khliehriat
      [92.5100, 25.1300], // Lumshnong (High Landslide Zone)
      [92.5800, 25.0400], // Sonapur Tunnel entrance
      [92.6500, 24.9700], // Meghalaya-Assam border (Ratacherra)
      [92.7100, 24.9000], // Badarpur junction
      [92.7789, 24.8333]  // Silchar
    ],
    ai_risk: { disruption_probability: 0.85, risk_level: 'HIGH' }
  },
  {
    road_id: 'NER-R002A',
    name: 'NH-27 / NH-620 (Guwahati to Silchar via Nagaon & Haflong Bypass)',
    start_node: 'LOC-GAU',
    end_node: 'LOC-SIL',
    distance_km: 330.0,
    travel_time_min: 550,
    status: 'OPEN',
    coordinates: [
      [91.7362, 26.1445], // Guwahati
      [91.9800, 26.2000], // Jagiroad
      [92.3400, 26.2800], // Raha
      [92.6800, 26.3500], // Nagaon junction
      [92.9500, 26.1500], // Dabaka
      [93.1200, 25.8000], // Lumding bypass
      [93.1800, 25.5000], // Haflong north entry
      [93.1500, 25.1800], // Haflong valley bypass
      [92.9500, 24.9800], // Harangajao
      [92.7789, 24.8333]  // Silchar
    ],
    ai_risk: { disruption_probability: 0.15, risk_level: 'LOW' }
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
      [92.7789, 24.8333], // Silchar
      [92.7200, 24.6800], // Kabuganj
      [92.6900, 24.5200], // Lailapur (Assam-Mizoram border)
      [92.6800, 24.3600], // Vairengte hill climb
      [92.6500, 24.2000], // Bilkhawthlir
      [92.7000, 24.0500], // Kolasib bypass
      [92.7400, 23.9000], // Darlawn junction
      [92.7176, 23.7367]  // Aizawl
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
      [91.7362, 26.1445], // Guwahati
      [92.1500, 26.4500], // Mangaldai
      [92.5000, 26.6000], // Tezpur bridge
      [93.1000, 26.8500], // Biswanath Chariali
      [93.6053, 27.0844]  // Itanagar
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
      [91.7362, 26.1445], // Guwahati
      [92.6800, 26.3500], // Nagaon
      [93.5000, 26.0500], // Numaligarh
      [93.7200, 25.9000], // Dimapur valley
      [94.1086, 25.6751]  // Kohima
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
      [94.1086, 25.6751], // Kohima
      [94.0800, 25.4800], // Viswema
      [94.0500, 25.3200], // Mao gate
      [94.0000, 25.1500], // Maram
      [93.9600, 24.9800], // Senapati
      [93.9368, 24.8170]  // Imphal
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
      [92.7789, 24.8333], // Silchar
      [92.4200, 24.5500], // Karimganj
      [92.2000, 24.3500], // Churaibari
      [91.8500, 24.1500], // Dharmanagar
      [91.5500, 23.9500], // Teliamura
      [91.2868, 23.8315]  // Agartala
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
      [91.7362, 26.1445], // Guwahati
      [90.2000, 26.5000], // Bongaigaon
      [89.5000, 26.7000], // Hasimara
      [88.8000, 26.9000], // Sevoke bridge (Teesta River)
      [88.6138, 27.3389]  // Gangtok
    ],
    ai_risk: { disruption_probability: 0.58, risk_level: 'MEDIUM' }
  }
];
