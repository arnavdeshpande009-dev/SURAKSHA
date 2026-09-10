export type DemoStep = 0 | 1 | 2 | 3 | 4 | 5;

export interface DemoState {
  currentStep: DemoStep;
  rainfallSimulated: boolean;
  isPlaying: boolean;
}

export const DEMO_NARRATIVE_STEPS = [
  {
    step: 0,
    title: '1. Dispatch Initialization',
    badge: 'NORMAL DISPATCH',
    description: 'Emergency medical supplies ready at Guwahati central hub for delivery to Aizawl Civil Hospital.',
    route: 'LOC-GAU -> LOC-AIZ',
    actionText: 'Start Emergency Medical Dispatch Demo'
  },
  {
    step: 1,
    title: '2. Severe Rainfall Simulation',
    badge: 'SIMULATING HAZARD',
    description: 'Simulating 110mm heavy downpour across NH-6 mountain pass (Shillong-Silchar sector).',
    route: 'NH-6 Corridor',
    actionText: 'Simulate Heavy Monsoon Rainfall'
  },
  {
    step: 2,
    title: '3. AI Risk Assessment',
    badge: 'PREDICTING HAZARD',
    description: 'XGBoost Risk Engine calculates 85% HIGH disruption risk (landslide probability) on NH-6.',
    route: 'NH-6 Risk Level: HIGH (85%)',
    actionText: 'Evaluate AI Risk & ETA'
  },
  {
    step: 3,
    title: '4. Operational Alert Trigger',
    badge: 'ALERT GENERATED',
    description: 'Control Tower issues 🚨 CRITICAL DISRUPTION ALERT & ROUTE RISK WARNING.',
    route: 'Alert ALT-REROUTE-REC',
    actionText: 'Trigger Control Tower Alert'
  },
  {
    step: 4,
    title: '5. AI Risk-Aware Rerouting',
    badge: 'REROUTING RECOMMENDED',
    description: 'Risk-aware Dijkstra reroutes via NH-27/620 Nagaon bypass (22% LOW risk, saving 6 mins net ETA).',
    route: 'Bypass: Nagaon & Haflong',
    actionText: 'Execute AI Reroute Recommendation'
  },
  {
    step: 5,
    title: '6. Safe Emergency Delivery',
    badge: 'DISPATCH COMPLETED',
    description: 'Emergency medicine delivery successfully rerouted and completed safely to Aizawl without delays.',
    route: 'Status: DELIVERED SAFELY',
    actionText: 'Reset Demo Simulation'
  }
];
