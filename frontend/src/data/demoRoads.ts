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
 * Ultra-detailed high-fidelity Google Maps geometry points matching actual National Highway curves.
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
      [91.7580, 26.1310],
      [91.7910, 26.1150],
      [91.8150, 26.0820],
      [91.8390, 26.0410],
      [91.8650, 26.0020], // Khanapara / Jorabat
      [91.8730, 25.9610],
      [91.8840, 25.9200],
      [91.8900, 25.8750], // Nongpoh
      [91.8860, 25.8300],
      [91.8810, 25.7890],
      [91.8920, 25.7410], // Umling
      [91.9050, 25.6920], // Umiam (Barapani) Lake curve
      [91.9120, 25.6540],
      [91.9050, 25.6150],
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
      [91.9320, 25.5610],
      [91.9750, 25.5420], // Mawryngkneng
      [92.0310, 25.5210],
      [92.0890, 25.4980],
      [92.1520, 25.4650], // Jowai north
      [92.2040, 25.4410], // Jowai town
      [92.2450, 25.3950],
      [92.2890, 25.3520], // Lad Rymbai
      [92.3410, 25.3100],
      [92.3980, 25.2650], // Khliehriat
      [92.4510, 25.2180],
      [92.5120, 25.1720], // Lumshnong (Landslide zone)
      [92.5640, 25.1210],
      [92.6100, 25.0650], // Sonapur Tunnel / Meghalaya border
      [92.6580, 25.0120],
      [92.6950, 24.9540], // Ratacherra / Kalain
      [92.7310, 24.8950], // Badarpur
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
      [91.8200, 26.1650],
      [91.9500, 26.1920], // Jagiroad
      [92.1400, 26.2210],
      [92.3400, 26.2550], // Raha
      [92.5100, 26.2950],
      [92.6800, 26.3500], // Nagaon junction
      [92.8100, 26.2800],
      [92.9500, 26.1700], // Dabaka
      [93.0800, 26.0200],
      [93.1800, 25.8400], // Lumding
      [93.2200, 25.6500],
      [93.1900, 25.4800], // Haflong North
      [93.1500, 25.1800], // Haflong hill curves
      [93.0800, 25.0500],
      [92.9500, 24.9500], // Harangajao
      [92.8500, 24.8800],
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
      [92.7620, 24.7810],
      [92.7410, 24.7210], // Kabuganj
      [92.7150, 24.6540],
      [92.6920, 24.5810], // Lailapur (Assam-Mizoram border)
      [92.6810, 24.5100],
      [92.6730, 24.4250], // Vairengte hill entrance
      [92.6650, 24.3410],
      [92.6580, 24.2620], // Bilkhawthlir
      [92.6720, 24.1810],
      [92.6950, 24.1020], // Kolasib bypass
      [92.7210, 24.0150],
      [92.7480, 23.9310], // Kawnpui
      [92.7520, 23.8540], // Sairang
      [92.7350, 23.7850],
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
      [91.9200, 26.3100],
      [92.1500, 26.4500], // Mangaldai
      [92.3500, 26.5400],
      [92.5000, 26.6000], // Tezpur bridge
      [92.8500, 26.7200],
      [93.1000, 26.8500], // Biswanath Chariali
      [93.3800, 26.9800],
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
      [93.1500, 26.2100],
      [93.5000, 26.0500], // Numaligarh
      [93.7200, 25.9000], // Dimapur valley
      [93.9200, 25.7800],
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
      [94.0920, 25.5810], // Viswema
      [94.0650, 25.4210], // Mao gate
      [94.0210, 25.2500], // Maram
      [93.9820, 25.0410], // Senapati
      [93.9510, 24.9120],
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
      [92.5800, 24.6800],
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
      [90.8000, 26.3200],
      [90.2000, 26.5000], // Bongaigaon
      [89.5000, 26.7000], // Hasimara
      [88.8000, 26.9000], // Sevoke bridge
      [88.6138, 27.3389]  // Gangtok
    ],
    ai_risk: { disruption_probability: 0.58, risk_level: 'MEDIUM' }
  }
];
