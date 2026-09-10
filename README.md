# SURAKSHA — AI-Powered Logistics & Accessibility Intelligence Platform for the North Eastern Region (NER)

**SIH Problem Statement ID:** 26002

## 📌 Project Overview

SURAKSHA is designed to monitor and predict logistics and accessibility disruptions across the North Eastern Region (NER) caused by severe weather (heavy rainfall, floods, landslides), road damage, and congestion. It empowers logistics operators to identify high-risk routes, select safer alternate pathways, accurately estimate ETAs, and receive real-time disruption alerts.

## 🏗️ Monorepo Architecture

```text
nersmart/
├── frontend/     # React + TypeScript + Vite web interface (MapLibre GL JS)
├── backend/      # Python FastAPI REST API server
├── ml/           # Disruption-risk (XGBClassifier) & ETA delay (XGBRegressor) models
├── routing/      # Risk-aware pathfinding algorithms (Dijkstra shortest/safest path)
├── data/         # GIS data, OSM extracts, weather & terrain datasets
├── docs/         # Documentation & SIH submission assets
├── tests/        # Backend & core algorithm test suites
└── README.md
```

## 🚀 How to Start

### 1. Backend (FastAPI)

```bash
cd backend
# On Windows:
.\venv\Scripts\activate

# Install requirements if needed:
pip install -r requirements.txt

# Start FastAPI server:
python main.py
```

- **API Health Check**: `http://localhost:8000/api/health`
- **Risk Prediction Endpoint**: `POST http://localhost:8000/api/predict-risk`
- **ETA Prediction Endpoint**: `POST http://localhost:8000/api/predict-eta`

### 2. Frontend (React + TS + Vite)

```bash
cd frontend
npm install
npm run dev
```

- **Application URL**: `http://localhost:5173`

---

## 📍 Completed Milestones Summary

- **Milestone 1: Project Initialization** — Clean monorepo, FastAPI backend, React + TS frontend setup.
- **Milestone 2: Interactive NER Map Foundation** — MapLibre GL JS integration centered over North Eastern Region, OSM dark tile styling, road color coding (`OPEN`, `RISKY`, `BLOCKED`).
- **Milestone 3: Baseline Routing Engine** — In-memory weighted graph, bi-directional Dijkstra pathfinding algorithm.
- **Milestone 4: AI Road Disruption Risk Engine** — XGBoost classification model evaluating 9 road/terrain/weather features to predict disruption probability ($0.0 - 1.0$) and risk levels (`LOW`, `MEDIUM`, `HIGH`).
- **Milestone 5: AI Risk-Aware Routing** — Dual-mode routing engine (`FASTEST` vs `SAFEST`) incorporating disruption risk penalties ($W_{\text{risk}} = 300\text{ min}$) to prefer safer bypass routes.
- **Milestone 6: AI ETA / Delay Prediction Engine** — `XGBRegressor` estimating delay minutes based on route risk metrics and segment hazards, providing explicit breakdown (**Baseline Time**, **Predicted Delay**, **PREDICTED ETA**).
- **Milestone 7: Alerts & Incident Intelligence** — Operational alert rule engine generating `HIGH_DISRUPTION_RISK`, `BLOCKED_ROAD`, and `REROUTING_RECOMMENDATION` alerts, interactive alert modal, and incident map markers.
