import os
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any
from eta_features import ETA_FEATURE_COLUMNS

class ETAPredictor:
    def __init__(self, model_path: str = None):
        if not model_path:
            model_path = os.path.join(os.path.dirname(__file__), '../models/xgb_eta_delay.joblib')

        if not os.path.exists(model_path):
            raise FileNotFoundError(f"ETA Model file not found at {model_path}. Please train ETA model first.")

        self.model = joblib.load(model_path)

    def predict_eta(self, route_features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates predicted delay and final predicted ETA.
        Guarantees predicted_delay >= 0 and predicted_eta >= baseline_travel_time_min.
        """
        baseline = float(route_features.get('baseline_travel_time_min', 0.0))

        feature_values = []
        for col in ETA_FEATURE_COLUMNS:
            val = route_features.get(col, 0.0)
            feature_values.append(val)

        df_input = pd.DataFrame([feature_values], columns=ETA_FEATURE_COLUMNS)

        raw_delay = float(self.model.predict(df_input)[0])
        # Clamp negative delay predictions to 0
        predicted_delay = int(round(max(0.0, raw_delay)))
        predicted_eta = int(round(baseline + predicted_delay))

        return {
            "baseline_travel_time_min": int(round(baseline)),
            "predicted_delay_min": predicted_delay,
            "predicted_eta_min": predicted_eta
        }

_eta_predictor_instance = None

def get_eta_predictor():
    global _eta_predictor_instance
    if _eta_predictor_instance is None:
        _eta_predictor_instance = ETAPredictor()
    return _eta_predictor_instance

def predict_eta(route_features: Dict[str, Any]) -> Dict[str, Any]:
    predictor = get_eta_predictor()
    return predictor.predict_eta(route_features)
