FEATURE_COLUMNS = [
    'rainfall_24h',
    'rainfall_7d',
    'elevation',
    'slope',
    'road_length_km',
    'traffic_level',
    'historical_flood_count',
    'historical_landslide_count',
    'road_condition'
]

TARGET_COLUMN = 'disruption'

# Thresholds for risk classification
RISK_THRESHOLDS = {
    'LOW_MAX': 0.35,      # <= 0.35 is LOW
    'MEDIUM_MAX': 0.70    # > 0.35 and <= 0.70 is MEDIUM; > 0.70 is HIGH
}

def classify_risk(probability: float) -> str:
    """Categorizes a disruption probability into LOW, MEDIUM, or HIGH risk level."""
    if probability <= RISK_THRESHOLDS['LOW_MAX']:
        return 'LOW'
    elif probability <= RISK_THRESHOLDS['MEDIUM_MAX']:
        return 'MEDIUM'
    else:
        return 'HIGH'
