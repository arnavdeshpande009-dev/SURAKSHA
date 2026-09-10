export type FleetRole = 'ADMINISTRATOR' | 'DISPATCHER' | 'DRIVER' | 'RISK_ANALYST';

export interface FleetUser {
  id: string;
  name: string;
  role: FleetRole;
  title: string;
  initials: string;
  color: string;
  status: 'ONLINE' | 'ON_ROUTE' | 'OFFLINE';
}

export interface SimulatedTruck {
  id: string;
  label: string;
  driver: string;
  routeLabel: string;
  color: string;
  path: [number, number][];
  progress: number;
  status: 'MOVING' | 'IDLE' | 'DELAYED';
}

export const FLEET_USERS: FleetUser[] = [
  { id: 'USR-001', name: 'Ananya Sharma', role: 'ADMINISTRATOR', title: 'System Administrator', initials: 'AS', color: '#2954FF', status: 'ONLINE' },
  { id: 'USR-002', name: 'Arjun Mehta', role: 'DISPATCHER', title: 'Fleet Dispatcher', initials: 'AM', color: '#15A05A', status: 'ONLINE' },
  { id: 'USR-003', name: 'Vikram Singh', role: 'DRIVER', title: 'Senior Driver', initials: 'VS', color: '#D97B0A', status: 'ON_ROUTE' },
  { id: 'USR-004', name: 'Priya Nair', role: 'RISK_ANALYST', title: 'Risk Analyst', initials: 'PN', color: '#7C4DFF', status: 'ONLINE' },
];

export const INITIAL_TRUCKS: SimulatedTruck[] = [
  {
    id: 'TRK-101',
    label: 'SURAKSHA-101',
    driver: 'Vikram Singh',
    routeLabel: 'Guwahati → Aizawl',
    color: '#2563EB',
    path: [[91.7362, 26.1445], [91.8933, 25.5788], [92.7789, 24.8333], [92.7176, 23.7367]],
    progress: 0.34,
    status: 'MOVING'
  },
  {
    id: 'TRK-204',
    label: 'SURAKSHA-204',
    driver: 'Rahul Das',
    routeLabel: 'Guwahati → Silchar',
    color: '#15A05A',
    path: [[91.7362, 26.1445], [92.25, 25.2], [92.7789, 24.8333]],
    progress: 0.58,
    status: 'MOVING'
  },
  {
    id: 'TRK-310',
    label: 'SURAKSHA-310',
    driver: 'Neha Kapoor',
    routeLabel: 'Silchar → Agartala',
    color: '#D97706',
    path: [[92.7789, 24.8333], [92.1, 24.2], [91.2868, 23.8315]],
    progress: 0.72,
    status: 'DELAYED'
  }
];
