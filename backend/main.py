import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../ml/src')))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from predict import predict_road_risk
from predict_eta import predict_eta

app = FastAPI(
    title="NER-SMART Backend & AI Engine API",
    description="AI-Powered Logistics & Accessibility Intelligence Platform for the North Eastern Region",
    version="0.3.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RoadRiskRequest(BaseModel):
    road_id: str = "NER-R001"
    rainfall_24h: float = Field(default=25.0)
    rainfall_7d: float = Field(default=80.0)
    elevation: float = Field(default=450.0)
    slope: float = Field(default=12.0)
    road_length_km: float = Field(default=25.0)
    traffic_level: int = Field(default=1)
    historical_flood_count: int = Field(default=1)
    historical_landslide_count: int = Field(default=0)
    road_condition: int = Field(default=1)

class RoadRiskResponse(BaseModel):
    road_id: str
    disruption_probability: float
    risk_level: str

class ETARequest(BaseModel):
    baseline_travel_time_min: float = Field(default=500.0)
    route_distance_km: float = Field(default=350.0)
    average_risk: float = Field(default=0.25)
    maximum_risk: float = Field(default=0.85)
    traffic_level: int = Field(default=2)
    road_condition: int = Field(default=2)
    risky_segment_count: int = Field(default=1)
    blocked_segment_count: int = Field(default=0)
    rainfall_24h: float = Field(default=40.0)
    rainfall_7d: float = Field(default=110.0)

class ETAResponse(BaseModel):
    baseline_travel_time_min: int
    predicted_delay_min: int
    predicted_eta_min: int

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "NER-SMART backend, AI Risk & ETA engine"
    }

@app.post("/api/predict-risk", response_model=RoadRiskResponse)
def predict_risk_endpoint(request: RoadRiskRequest):
    try:
        features = request.model_dump()
        result = predict_road_risk(features)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/predict-eta", response_model=ETAResponse)
def predict_eta_endpoint(request: ETARequest):
    try:
        features = request.model_dump()
        result = predict_eta(features)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
