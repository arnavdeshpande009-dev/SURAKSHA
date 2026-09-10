import { RouteService } from '../routing/routeService';
import { findShortestPath } from '../routing/dijkstra';

function runMilestone6ETATests() {
  console.log('===========================================================');
  console.log('RUNNING MILESTONE 6 AI ETA & DELAY PREDICTION ENGINE TESTS');
  console.log('===========================================================');

  RouteService.resetGraphCache();

  // Test 1: Guwahati -> Aizawl Demo Scenario (ETA Comparison)
  console.log('\nTEST 1: Guwahati -> Aizawl (ETA & Delay Comparison)');
  const comparison = RouteService.compareRoutes('LOC-GAU', 'LOC-AIZ');
  const fastest = comparison.fastestRoute!;
  const safest = comparison.safestRoute!;

  const formatHrs = (min: number) => `${Math.floor(min / 60)}h ${min % 60}m`;

  console.log('FASTEST ROUTE:');
  console.log(`  Path                : ${fastest.path.join(' -> ')}`);
  console.log(`  Baseline Travel Time: ${formatHrs(fastest.totalTravelTimeMin)}`);
  console.log(`  Predicted Delay     : +${fastest.etaPrediction.predicted_delay_min} mins`);
  console.log(`  PREDICTED ETA       : ${formatHrs(fastest.etaPrediction.predicted_eta_min)}`);
  console.log(`  Risk                : ${Math.round(fastest.riskMetrics.maximumRisk * 100)}% (${fastest.riskMetrics.routeRiskLevel})`);

  console.log('\nSAFEST ROUTE:');
  console.log(`  Path                : ${safest.path.join(' -> ')}`);
  console.log(`  Baseline Travel Time: ${formatHrs(safest.totalTravelTimeMin)}`);
  console.log(`  Predicted Delay     : +${safest.etaPrediction.predicted_delay_min} mins`);
  console.log(`  PREDICTED ETA       : ${formatHrs(safest.etaPrediction.predicted_eta_min)}`);
  console.log(`  Risk                : ${Math.round(safest.riskMetrics.maximumRisk * 100)}% (${safest.riskMetrics.routeRiskLevel})`);

  console.log(`\nRECOMMENDED MODE    : ${comparison.recommendedMode}`);
  console.log(`RECOMMENDATION REASON: ${comparison.recommendationReason}`);

  if (fastest.etaPrediction.predicted_delay_min >= 0 && safest.etaPrediction.predicted_delay_min >= 0) {
    console.log('SUCCESS: Delay predictions are non-negative!');
  }
  if (fastest.etaPrediction.predicted_eta_min >= fastest.totalTravelTimeMin) {
    console.log('SUCCESS: Predicted ETA >= Baseline Travel Time!');
  }

  // Test 2: Fallback Handling Test
  console.log('\nTEST 2: Fallback Handling Verification');
  const fallbackResult = findShortestPath('LOC-GAU', 'LOC-SHL', RouteService.getGraph(), 'FASTEST');
  if (fallbackResult.etaPrediction && !fallbackResult.etaPrediction.is_fallback) {
    console.log('SUCCESS: ETA calculation executed smoothly without errors!');
  }

  console.log('\n===========================================================\n');
}

runMilestone6ETATests();
