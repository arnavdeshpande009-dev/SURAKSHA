import { AlertEngine } from '../services/alertEngine';
import { DEMO_ROADS } from '../data/demoRoads';

function runMilestone7AlertTests() {
  console.log('===========================================================');
  console.log('RUNNING MILESTONE 7 ALERTS & INCIDENT ENGINE TESTS');
  console.log('===========================================================');

  // Test 1: LOW Risk evaluation (No high severity alert)
  const lowRiskRoad = DEMO_ROADS.find((r) => r.road_id === 'NER-R001')!;
  const lowAlert = AlertEngine.evaluateRoadAlert(lowRiskRoad);
  console.log(`TEST 1 (LOW Risk): ${lowAlert ? lowAlert.severity : 'No Alert'}`);
  if (!lowAlert || lowAlert.severity === 'LOW') {
    console.log('SUCCESS: LOW risk generated no high-severity alert!');
  }

  // Test 2: HIGH Risk evaluation
  const highRiskRoad = DEMO_ROADS.find((r) => r.road_id === 'NER-R002')!;
  const highAlert = AlertEngine.evaluateRoadAlert(highRiskRoad)!;
  console.log(`TEST 2 (HIGH Risk): Severity=${highAlert.severity}, Title=${highAlert.title}`);
  if (highAlert && (highAlert.severity === 'HIGH' || highAlert.severity === 'CRITICAL')) {
    console.log('SUCCESS: HIGH risk generated HIGH/CRITICAL alert correctly!');
  }

  // Test 3: BLOCKED Road evaluation
  const blockedRoad = DEMO_ROADS.find((r) => r.road_id === 'NER-R006')!;
  const blockedAlert = AlertEngine.evaluateRoadAlert(blockedRoad)!;
  console.log(`TEST 3 (BLOCKED Road): Type=${blockedAlert.type}, Severity=${blockedAlert.severity}`);
  if (blockedAlert && blockedAlert.type === 'BLOCKED_ROAD') {
    console.log('SUCCESS: BLOCKED road generated BLOCKED_ROAD alert!');
  }

  console.log('\n===========================================================\n');
}

runMilestone7AlertTests();
