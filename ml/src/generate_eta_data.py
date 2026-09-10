import numpy as np
import pandas as pd
import os
from eta_features import ETA_FEATURE_COLUMNS, ETA_TARGET_COLUMN

# DISCLAIMER: This dataset is synthetic/demo data created to demonstrate the ETA prediction pipeline.
# It does NOT represent actual NER traffic or logistics statistics.

def generate_synthetic_eta_data(num_samples: int = 1000, random_seed: int = 42) -> pd.DataFrame:
    np.random.seed(random_seed)

    route_distance_km = np.random.uniform(50, 600, size=num_samples)
    baseline_travel_time_min = route_distance_km * np.random.uniform(1.2, 1.8, size=num_samples) # approx 40-50 km/h average speed
    
    average_risk = np.random.beta(a=2, b=5, size=num_samples) # skewed towards lower/mid risk
    maximum_risk = np.clip(average_risk + np.random.uniform(0.1, 0.4, size=num_samples), 0.0, 0.98)
    
    traffic_level = np.random.choice([1, 2, 3], size=num_samples, p=[0.4, 0.4, 0.2]) # 1: Low, 2: Med, 3: High
    road_condition = np.random.choice([1, 2, 3], size=num_samples, p=[0.4, 0.4, 0.2]) # 1: Good, 2: Fair, 3: Poor
    
    risky_segment_count = np.random.poisson(lam=maximum_risk * 3)
    blocked_segment_count = np.zeros(num_samples, dtype=int) # Blocked segments are excluded by routing engine
    
    rainfall_24h = np.random.exponential(scale=30, size=num_samples)
    rainfall_7d = rainfall_24h * np.random.uniform(1.5, 3.0, size=num_samples)

    # Delay modeling logic (minutes of additional delay)
    delay_minutes = (
        (maximum_risk * 45) +
        (average_risk * 30) +
        (traffic_level - 1) * 20 +
        (road_condition - 1) * 15 +
        (risky_segment_count * 12) +
        (rainfall_24h * 0.25) +
        np.random.normal(loc=0, scale=8, size=num_samples)
    )

    # Clamp negative delay to zero
    delay_minutes = np.clip(delay_minutes, 0, None)

    df = pd.DataFrame({
        'route_id': [f'ETA-R{i+1:04d}' for i in range(num_samples)],
        'baseline_travel_time_min': np.round(baseline_travel_time_min, 1),
        'route_distance_km': np.round(route_distance_km, 1),
        'average_risk': np.round(average_risk, 3),
        'maximum_risk': np.round(maximum_risk, 3),
        'traffic_level': traffic_level,
        'road_condition': road_condition,
        'risky_segment_count': risky_segment_count,
        'blocked_segment_count': blocked_segment_count,
        'rainfall_24h': np.round(rainfall_24h, 1),
        'rainfall_7d': np.round(rainfall_7d, 1),
        'delay_minutes': np.round(delay_minutes, 1)
    })

    return df

if __name__ == '__main__':
    out_dir = os.path.join(os.path.dirname(__file__), '../../data/demo')
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, 'synthetic_eta.csv')
    df = generate_synthetic_eta_data()
    df.to_csv(out_file, index=False)
    print(f"Generated synthetic ETA dataset with {len(df)} rows at: {out_file}")
