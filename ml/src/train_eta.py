import os
import joblib
import pandas as pd
import numpy as np
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from eta_features import ETA_FEATURE_COLUMNS, ETA_TARGET_COLUMN
from generate_eta_data import generate_synthetic_eta_data

def train_eta_model(data_path: str = None, model_output_path: str = None):
    if data_path and os.path.exists(data_path):
        print(f"Loading ETA data from: {data_path}")
        df = pd.read_csv(data_path)
    else:
        print("ETA data path not provided or found. Generating synthetic dataset...")
        df = generate_synthetic_eta_data()

    X = df[ETA_FEATURE_COLUMNS].fillna(df[ETA_FEATURE_COLUMNS].median())
    y = df[ETA_TARGET_COLUMN]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = XGBRegressor(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.08,
        random_state=42
    )

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_pred = np.clip(y_pred, 0, None) # Clamp negative predictions

    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)

    print("\n--- DEMONSTRATION / SYNTHETIC DATA ETA REGRESSION METRICS ---")
    print(f"Mean Absolute Error (MAE) : {mae:.2f} minutes")
    print(f"Root Mean Sq Error (RMSE) : {rmse:.2f} minutes")
    print(f"R² Score                  : {r2:.4f}")
    print("-------------------------------------------------------------\n")

    if not model_output_path:
        model_output_path = os.path.join(os.path.dirname(__file__), '../models/xgb_eta_delay.joblib')

    os.makedirs(os.path.dirname(model_output_path), exist_ok=True)
    joblib.dump(model, model_output_path)
    print(f"ETA model saved successfully to: {model_output_path}")

    return model, {'mae': mae, 'rmse': rmse, 'r2': r2}

if __name__ == '__main__':
    csv_path = os.path.join(os.path.dirname(__file__), '../../data/demo/synthetic_eta.csv')
    train_eta_model(data_path=csv_path)
