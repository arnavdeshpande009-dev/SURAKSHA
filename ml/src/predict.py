import os
import joblib
import pandas as pd
from typing import Dict, Any, Union
from features import FEATURE_COLUMNS, classify_risk

class RiskPredictor:
    def __init__(self, model_path: str = None):
        if not model_path:
            model_path = os.path.join(os.path.dirname(__file__), '../models/xgb_road_disruption.joblib')

        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found at {model_path}. Please train model first.")

        self.model = joblib.load(model_path)

    def predict_road_risk(self, road_features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Accepts road features dictionary and returns disruption probability & risk level.
        """
        road_id = road_features.get('road_id', 'UNKNOWN')
        
        # Prepare feature vector in exact order
        feature_values = []
        for col in FEATURE_COLUMNS:
            val = road_features.get(col, 0.0) # Fallback default
            feature_values.append(val)

        df_input = pd.DataFrame([feature_values], columns=FEATURE_COLUMNS)
        
        # Predict probability of disruption (class 1)
        prob = float(self.model.predict_proba(df_input)[0][1])
        prob_rounded = round(prob, 4)
        risk_level = classify_risk(prob_rounded)

        return {
            "road_id": road_id,
            "disruption_probability": prob_rounded,
            "risk_level": risk_level
        }

# Global singleton helper
_predictor_instance = None

def get_risk_predictor():
    global _predictor_instance
    if _predictor_instance is None:
        _predictor_instance = RiskPredictor()
    return _predictor_instance

def predict_road_risk(features: Dict[str, Any]) -> Dict[str, Any]:
    try:
        predictor = get_risk_predictor()
        return predictor.predict_road_risk(features)
    except (ImportError, ModuleNotFoundError, ValueError):
        rainfall = min(float(features.get('rainfall_24h', 0.0)) / 100.0, 1.0)
        terrain = min((float(features.get('slope', 0.0)) / 45.0 + float(features.get('road_condition', 1)) / 3.0) / 2.0, 1.0)
        probability = round(min(0.05 + rainfall * 0.45 + terrain * 0.35, 0.98), 4)
        return {
            'road_id': features.get('road_id', 'UNKNOWN'),
            'disruption_probability': probability,
            'risk_level': classify_risk(probability)
        }
