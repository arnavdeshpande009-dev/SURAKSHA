import numpy as np
import pandas as pd
import os

# DISCLAIMER: This dataset is synthetic/demo data generated for demonstrating the ML pipeline in Milestone 4.
# It is NOT representative of actual NER road-disruption statistics.

def generate_synthetic_data(num_samples: int = 1000, random_seed: int = 42) -> pd.DataFrame:
    np.random.seed(random_seed)

    rainfall_24h = np.random.exponential(scale=35, size=num_samples) # mm
    rainfall_7d = rainfall_24h * np.random.uniform(1.8, 3.5, size=num_samples) + np.random.exponential(scale=50, size=num_samples)
    elevation = np.random.uniform(100, 3000, size=num_samples) # meters
    slope = np.random.uniform(2, 45, size=num_samples) # degrees
    road_length_km = np.random.uniform(5, 150, size=num_samples)
    traffic_level = np.random.choice([1, 2, 3], size=num_samples, p=[0.5, 0.35, 0.15]) # 1: Low, 2: Med, 3: High
    historical_flood_count = np.random.poisson(lam= rainfall_7d / 100)
    historical_landslide_count = np.random.poisson(lam=(slope / 15) * (rainfall_24h / 40))
    road_condition = np.random.choice([1, 2, 3], size=num_samples, p=[0.4, 0.4, 0.2]) # 1: Good, 2: Fair, 3: Poor

    # Latent logit formula to determine disruption probability
    logit = (
        0.04 * rainfall_24h +
        0.015 * rainfall_7d +
        0.08 * slope +
        0.3 * historical_landslide_count +
        0.25 * historical_flood_count +
        0.4 * road_condition -
        3.5
    )

    prob = 1 / (1 + np.exp(-logit))
    disruption = (prob > 0.5).astype(int)

    df = pd.DataFrame({
        'road_id': [f'SYN-R{i+1:04d}' for i in range(num_samples)],
        'rainfall_24h': np.round(rainfall_24h, 1),
        'rainfall_7d': np.round(rainfall_7d, 1),
        'elevation': np.round(elevation, 1),
        'slope': np.round(slope, 1),
        'road_length_km': np.round(road_length_km, 1),
        'traffic_level': traffic_level,
        'historical_flood_count': historical_flood_count,
        'historical_landslide_count': historical_landslide_count,
        'road_condition': road_condition,
        'disruption': disruption
    })

    return df

if __name__ == '__main__':
    out_dir = os.path.join(os.path.dirname(__file__), '../../data/demo')
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, 'synthetic_road_disruption.csv')
    df = generate_synthetic_data()
    df.to_csv(out_file, index=False)
    print(f"Generated synthetic dataset with {len(df)} rows at: {out_file}")
