import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../ml/src')))

import unittest
from predict_eta import predict_eta

class TestETAEngine(unittest.TestCase):
    def test_eta_prediction_and_non_negative_delay(self):
        sample_route = {
            "baseline_travel_time_min": 500,
            "route_distance_km": 350.0,
            "average_risk": 0.45,
            "maximum_risk": 0.85,
            "traffic_level": 2,
            "road_condition": 2,
            "risky_segment_count": 2,
            "blocked_segment_count": 0,
            "rainfall_24h": 60.0,
            "rainfall_7d": 150.0
        }

        res = predict_eta(sample_route)
        self.assertEqual(res['baseline_travel_time_min'], 500)
        self.assertGreaterEqual(res['predicted_delay_min'], 0)
        self.assertGreaterEqual(res['predicted_eta_min'], res['baseline_travel_time_min'])

    def test_zero_risk_route(self):
        low_risk_route = {
            "baseline_travel_time_min": 100,
            "route_distance_km": 50.0,
            "average_risk": 0.05,
            "maximum_risk": 0.10,
            "traffic_level": 1,
            "road_condition": 1,
            "risky_segment_count": 0,
            "blocked_segment_count": 0,
            "rainfall_24h": 0.0,
            "rainfall_7d": 0.0
        }

        res = predict_eta(low_risk_route)
        self.assertEqual(res['baseline_travel_time_min'], 100)
        self.assertGreaterEqual(res['predicted_delay_min'], 0)

if __name__ == '__main__':
    unittest.main()
