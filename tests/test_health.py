import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "SURAKSHA backend, AI Risk & ETA engine"
    }

def test_predict_risk_endpoint():
    payload = {
        "road_id": "NER-R002",
        "rainfall_24h": 85.0,
        "rainfall_7d": 240.0,
        "elevation": 1500.0,
        "slope": 35.0,
        "road_length_km": 40.0,
        "traffic_level": 2,
        "historical_flood_count": 4,
        "historical_landslide_count": 5,
        "road_condition": 3
    }
    response = client.post("/api/predict-risk", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["road_id"] == "NER-R002"
    assert 0.0 <= data["disruption_probability"] <= 1.0
    assert data["risk_level"] in ["LOW", "MEDIUM", "HIGH"]

def test_predict_eta_endpoint():
    payload = {
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
    response = client.post("/api/predict-eta", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["baseline_travel_time_min"] == 580
    assert data["predicted_delay_min"] >= 0
    assert data["predicted_eta_min"] >= 580

def test_cors_preflight_production_origin():
    headers = {
        "Origin": "https://suraksha-9pfb.onrender.com",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type"
    }
    response = client.options("/api/predict-risk", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://suraksha-9pfb.onrender.com"

def test_cors_get_fleet_trucks_production_origin():
    headers = {
        "Origin": "https://suraksha-9pfb.onrender.com"
    }
    response = client.get("/api/fleet/trucks", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://suraksha-9pfb.onrender.com"

