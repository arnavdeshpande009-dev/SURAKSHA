import type { DemoIncident } from '../types/alert';

/**
 * DISCLAIMER: This dataset contains DEMO INCIDENT DATA created for demonstrating 
 * the incident map markers and alert intelligence in Milestone 7. 
 * It does NOT represent live government or emergency response feeds.
 */
export const DEMO_INCIDENTS: DemoIncident[] = [
  {
    incident_id: 'INC-001',
    road_id: 'NER-R002',
    type: 'LANDSLIDE',
    severity: 'CRITICAL',
    latitude: 25.2000,
    longitude: 92.2500,
    description: 'Major landslide blocking NH-6 corridor between Shillong and Silchar.',
    timestamp: '10 mins ago'
  },
  {
    incident_id: 'INC-002',
    road_id: 'NER-R006',
    type: 'ROAD_DAMAGE',
    severity: 'CRITICAL',
    latitude: 25.2000,
    longitude: 94.0000,
    description: 'Bridge structural collapse on NH-2 between Kohima and Imphal.',
    timestamp: '25 mins ago'
  },
  {
    incident_id: 'INC-003',
    road_id: 'NER-R008',
    type: 'HEAVY_RAINFALL',
    severity: 'MEDIUM',
    latitude: 26.7000,
    longitude: 89.5000,
    description: 'Continuous torrential downpour causing reduced visibility along NH-10.',
    timestamp: '45 mins ago'
  },
  {
    incident_id: 'INC-004',
    road_id: 'NER-R003',
    type: 'CONGESTION',
    severity: 'LOW',
    latitude: 24.2000,
    longitude: 92.6800,
    description: 'Minor freight checkpoint queue on NH-306 near Vairengte.',
    timestamp: '1 hour ago'
  }
];
