import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../ml/src')))

import unittest
from features import FEATURE_COLUMNS, classify_risk
from data_prep import validate_dataframe
from predict import predict_road_risk
import pandas as pd

class TestAIRiskEngine(unittest.TestCase):
    def test_risk_level_conversion(self):
        self.assertEqual(classify_risk(0.15), 'LOW')
        self.assertEqual(classify_risk(0.35), 'LOW')
        self.assertEqual(classify_risk(0.50), 'MEDIUM')
        self.assertEqual(classify_risk(0.70), 'MEDIUM')
        self.assertEqual(classify_risk(0.85), 'HIGH')

    def test_feature_validation(self):
        valid_df = pd.DataFrame(columns=FEATURE_COLUMNS)
        self.assertTrue(validate_dataframe(valid_df))
        
        invalid_df = pd.DataFrame(columns=['rainfall_24h', 'elevation'])
        with self.assertRaises(ValueError):
            validate_dataframe(invalid_df)

    def test_prediction_output(self):
        sample_features = {
            "road_id": "TEST-R001",
            "rainfall_24h": 65.0,
            "rainfall_7d": 180.0,
            "elevation": 1200.0,
            "slope": 28.0,
            "road_length_km": 45.0,
            "traffic_level": 2,
            "historical_flood_count": 3,
            "historical_landslide_count": 2,
            "road_condition": 3
        }

        res = predict_road_risk(sample_features)
        self.assertEqual(res['road_id'], 'TEST-R001')
        self.assertTrue(0.0 <= res['disruption_probability'] <= 1.0)
        self.assertIn(res['risk_level'], ['LOW', 'MEDIUM', 'HIGH'])

if __name__ == '__main__':
    unittest.main()
