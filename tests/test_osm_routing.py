import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_routes_calculate_endpoint():
    payload = {
        "origin": {"lat": 26.1445, "lon": 91.7362}, # Guwahati
        "destination": {"lat": 23.7367, "lon": 92.7176}, # Aizawl
        "mode": "fastest"
    }
    response = client.post("/api/routes/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "FASTEST"
    assert data["distance_km"] > 500
    assert data["geometry"]["type"] == "LineString"
    assert len(data["geometry"]["coordinates"]) > 1000
    assert len(data["segments"]) > 100
