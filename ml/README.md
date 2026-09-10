# SURAKSHA ML Modules

## 1. AI Road Disruption Risk Engine (`XGBClassifier`)

Predicts the probability of a road segment experiencing disruption ($0.0 - 1.0$) based on rainfall, slope, elevation, and historical flood/landslide counts.

## 2. AI ETA & Delay Prediction Engine (`XGBRegressor`)

> [!WARNING]
> **SYNTHETIC / DEMO DATA DISCLAIMER**: The ETA dataset (`data/demo/synthetic_eta.csv`) is synthetically generated to demonstrate the regression pipeline for Milestone 6. It does **NOT** represent actual NER traffic or real-time GPS telemetry statistics.

### Target Variable:

- `delay_minutes` (float): Additional predicted delay in minutes over baseline travel time.

### Feature Schema:

- `baseline_travel_time_min` (float)
- `route_distance_km` (float)
- `average_risk` (float)
- `maximum_risk` (float)
- `traffic_level` (int)
- `road_condition` (int)
- `risky_segment_count` (int)
- `blocked_segment_count` (int)
- `rainfall_24h` (float)
- `rainfall_7d` (float)

### Model & Evaluation Metrics:

- **Algorithm**: `XGBRegressor` (`max_depth=4`, `learning_rate=0.08`, 100 estimators)
- **MAE**: `7.72 minutes`
- **RMSE**: `9.71 minutes`
- **$R^2$ Score**: `0.8905`

### 🚀 How to Train & Predict ETA

#### Train Model:

```bash
cd backend
python ..\ml\src\train_eta.py
```

Model artifacts will be saved at: `ml/models/xgb_eta_delay.joblib`.

#### Predict via FastAPI:

`POST /api/predict-eta`

```json
{
  "baseline_travel_time_min": 580,
  "route_distance_km": 420.0,
  "average_risk": 0.45,
  "maximum_risk": 0.85,
  "traffic_level": 2,
  "road_condition": 2,
  "risky_segment_count": 2,
  "blocked_segment_count": 0,
  "rainfall_24h": 50.0,
  "rainfall_7d": 120.0
}
```

**Response**:

```json
{
  "baseline_travel_time_min": 580,
  "predicted_delay_min": 42,
  "predicted_eta_min": 622
}
```

## ⚠️ Important Disclaimer on Real-World Data Requirements

High-quality, production-ready ETA prediction requires integration with real-time GPS telematics feeds, live traffic APIs (e.g. MapmyIndia / Google Traffic), and state PWD road disruption logs.
