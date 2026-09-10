# NER-SMART — Hackathon Demo Checklist & Operational Guide

**Problem Statement ID:** 26002 (SIH 2026)  
**Project:** NER-SMART — AI-Powered Logistics & Accessibility Intelligence Platform for the North Eastern Region  
**Target Event:** Internal Hackathon — 12 September 2026  

---

## 🗺️ Google Maps API Setup Instructions

To enable live Google Maps vector tiles, real-time Google TrafficLayer, and traffic-aware routing directions:

1. **Create API Key**: Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a project with an API Key.
2. **Enable Required APIs**:
   - Maps JavaScript API
   - Directions API
   - Routes API
3. **Configure Environment Variable**:
   Create a `.env` file in the `frontend/` directory (or copy `.env.example`):
   ```env
   VITE_GOOGLE_MAPS_API_KEY=YOUR_ACTUAL_GOOGLE_MAPS_API_KEY
   ```
4. **Restart Frontend**:
   Restart the Vite dev server (`npm run dev`) to load the new environment variable.

*Note: If `VITE_GOOGLE_MAPS_API_KEY` is missing or invalid, NER-SMART will automatically fall back to **DEMO MODE** using local MapLibre tiles without crashing.*

---

## 🛠️ System Startup Instructions

### Prerequisites
- Python 3.10+ with `venv`
- Node.js 18+ and `npm`

---

### 1. Backend Service (FastAPI)

1. Open a terminal in the project root directory.
2. Activate Python virtual environment and navigate to `backend`:
   ```bash
   cd backend
   ..\venv\Scripts\activate
   ```
3. Run the backend development server using `uvicorn`:
   ```bash
   python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```
4. Verify backend health check:
   Open browser to `http://127.0.0.1:8000/api/health` — expected response: `{"status": "ok", "service": "NER-SMART Backend"}`.

---

### 2. Frontend Application (React + Vite + Google Maps / MapLibre)

1. Open a second terminal in the project root directory.
2. Navigate to `frontend`:
   ```bash
   cd frontend
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access dashboard in browser:
   Open `http://localhost:5173`

---

### 3. Automated Test Suite Verification

Run backend unit and integration tests from the `backend` folder:
```bash
..\venv\Scripts\pytest ..\tests
```
Expected output: `8 passed`.

---

## 📋 Hackathon Demo Flow (16-Step Checklist)

Follow this exact sequence for a deterministic, 100% reliable 3-minute hackathon pitch:

| Step | Action | Key Feature to Highlight / Present | Expected Visual Result |
|---|---|---|---|
| **1** | Open Dashboard | Operational Control Tower Overview | Dark-themed GIS map centered on North East India with live status badges (`MAP: GOOGLE CONNECTED` / `TRAFFIC: LIVE`). |
| **2** | Inspect Map Layers | Google Maps + Live Traffic Layer | Google vector basemap with real-time green/yellow/red traffic lines & major corridors: NH-6 (Guwahati-Aizawl), NH-27, NH-620. |
| **3** | Select Corridor | Guwahati $\rightarrow$ Aizawl | Origin dropdown: `Guwahati (GAU)`, Destination dropdown: `Aizawl (AJL)`. |
| **4** | Route Comparison | Baseline (FASTEST) vs AI Risk-Aware (SAFEST) | Display side-by-side card comparison panel + Google Traffic-Aware ETA card. |
| **5** | Show FASTEST Route | Baseline Travel Time vs Disruption Risk | **13h 30m** baseline time, **85% AI Disruption Risk (HIGH)** via NH-6 (Landslide Prone). |
| **6** | Show SAFEST Route | AI Risk-Aware Routing Bypass | **14h 10m** baseline time via Nagaon & Haflong bypass, **22% AI Disruption Risk (LOW)**. |
| **7** | Explain AI Risk Engine | XGBoost Machine Learning Model | Feature inputs: 24h rainfall (mm), elevation profile, slope, historic landslide frequency, road condition index. |
| **8** | Explain Predicted ETA | XGBoost ETA Regression | **FASTEST**: 13h 30m + 62m delay = **14h 32m PREDICTED ETA**. <br>**SAFEST**: 14h 10m + 16m delay = **14h 26m PREDICTED ETA**. <br> *Key Insight*: Safest bypass is baseline longer, but arrives **6 minutes earlier**! |
| **9** | Inspect Alert Center | Operational Risk & Incident Intelligence | Active alert badge shows 2 critical alerts for NH-6 (Silchar-Aizawl section). Click alert to review detail modal. |
| **10** | Launch M9 Demo | M9 Emergency Medicine Delivery Scenario | Click **"🚀 Start M9 Demo"** button on the bottom control panel. |
| **11** | Step 1 & 2: Normal Ops | Medicine convoy dispatched | Medical shipment leaves Guwahati. Baseline FASTEST (NH-6) route active. |
| **12** | Step 3: Weather Event | Trigger Heavy Rainfall Simulation | Click **"Simulate Monsoon Downpour"**. 24h rainfall spikes to 145mm on NH-6. |
| **13** | Step 4: Risk Escalation | Real-time AI Risk Update | AI Risk on NH-6 jumps to 94% (CRITICAL LANDSLIDE RISK). |
| **14** | Step 5: Dynamic Alert & Reroute | AI Alert & Automated Route Recommendation | **REROUTING RECOMMENDATION** alert pops up. System automatically switches active route to **SAFEST** (Haflong bypass). |
| **15** | Pitch 5-Word Core Mantra | **Predict $\rightarrow$ Assess $\rightarrow$ Reroute $\rightarrow$ Alert $\rightarrow$ Deliver** | Summarize value proposition: Preventing stuck medical supplies in high-risk NER landslide zones. |
| **16** | Reset Demo | Demo Reset & Clean State | Click **"Reset Demo"** to reset simulation parameters back to baseline. |

---

## 🏷️ Transparency & Demo Data Safety Rules

- Live traffic and map vector tiles are provided by **Google Maps JS API**.
- All environmental, rainfall, slope, and landslide risk predictions shown during the presentation are generated by **NER-SMART XGBoost Models**.
- If Google Maps API is offline or unconfigured, the dashboard seamlessly operates in **DEMO / SIMULATION MODE**.
