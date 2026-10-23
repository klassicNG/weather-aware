# 🚚 Spotter Fleet AI — Weather-Aware Truck Routing Engine

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.0%2B-092E20.svg)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4.0-38B2AC.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Enterprise-grade, weather-intelligent freight dispatch and route optimization platform.** Designed to protect commercial truck drivers, minimize cargo rollover risks, and deliver guaranteed multi-corridor safety intelligence under extreme atmospheric conditions.

---

## 🌟 Executive Summary

Commercial semi-trucks operating at high highway speeds are extraordinarily vulnerable to atmospheric hazards—specifically **crosswinds, heavy downpours, and blizzard snow accumulation**. Light or empty 53-foot dry van trailers can roll over in crosswinds as low as **35 mph**, while heavy 80,000-lb rigs require emergency shutdowns when gusts exceed **60 mph**.

**Spotter Fleet AI** solves this critical transportation safety challenge. Given an **Origin**, **Destination**, **Departure Date/Time**, and **Rig Load Weight**, the platform:
1. Generates **3 distinct, realistic highway corridors** (Primary Route, Southern Bypass, Northern Alternative) via OSRM and highway cartography.
2. Samples automated **sampling stations (Checkpoints)** every 10, 25, or 50 miles.
3. Computes the **exact timestamp of truck arrival (ETA)** at each individual checkpoint.
4. Fetches **hyperlocal weather forecasts** at the truck's arrival moment using the Open-Meteo API.
5. Evaluates compliance against **cargo load rollover rules** across 5 risk tiers (Low, Moderate, High, Severe, Mandatory Shutdown).
6. Mathematically ranks and **recommends the safest corridor** using distance-weighted cumulative risk modeling.
7. Offers an interactive **48-Hour Departure Weather Simulator** with 60 FPS HTML5 Canvas heatmaps to identify the optimal departure window.

---

## 📸 Key Features & Capabilities

### 1. Guaranteed 3-Corridor Comparison
* Computes three geographically distinct highway options for any global freight lane (e.g. Chicago ➔ Denver, Dallas ➔ Atlanta, Lagos ➔ Abuja).
* Automatically crowns the **🏆 SAFEST RECOMMENDED CORRIDOR** while detailing tradeoff differentials for alternative routes (e.g., *"+89.0 mi Severe weather, +2.1 hrs longer"*).

### 2. Hyperlocal Checkpoint Telemetry (Milestones & ETAs)
* Discrete checkpoints sampled at user-selected intervals ($10\text{ mi}$, $25\text{ mi}$, or $50\text{ mi}$).
* Each checkpoint node provides interactive telemetry:
  * **Checkpoint Number & Highway Milepost** (e.g., `Checkpoint #14 • Mile 620.4`)
  * **Exact Arrival ETA** (Date & local time when the truck arrives)
  * **Independent Weather Readings**: Wind speed (`mph`), Rain intensity (`in/hr`), and Snow accumulation rate (`in/hr`).
  * **Trailer Rollover Advisory**: Explicit warnings when local crosswinds exceed trailer stability thresholds for the entered weight.

### 3. Spotter AI Safety Matrix & Load Rules
* **Cargo Weight Rules**:
  * **Light / Empty Rigs ($<30,000\text{ lbs}$)**: High Risk triggers at $35\text{ mph}$ crosswinds; Mandatory Shutdown at $45\text{ mph}$.
  * **Standard Rigs ($30,000\text{--}40,000\text{ lbs}$)**: High Risk triggers at $40\text{ mph}$; Shutdown at $48\text{ mph}$.
  * **Heavy / Loaded Rigs ($>40,000\text{ lbs}$)**: High Risk at $45\text{ mph}$; Mandatory Shutdown at $60\text{ mph}$.
* **Physical Weather Separation**: Rain and Snow are treated as independent physical phenomena with dedicated thresholds:
  * **Rain**: `<0.10` (Light), `0.10–0.25` (Moderate), `0.25–0.50` (Heavy), `0.50–1.00` (Severe), `>1.00 in/hr` (Torrential / Hydroplaning Hazard).
  * **Snow**: `<0.5` (Flurries), `0.5–1.0` (Moderate), `1.0–2.0` (Heavy Snow), `2.0–3.0` (Severe), `>3.0 in/hr` (Blizzard / Mandatory Travel Ban).

### 4. 48-Hour Departure Weather Radar & Simulator
* Interactive timeline slider with Play/Pause radar animation (0 to 48 hours into the future).
* Allows dispatchers to test: *"What happens if we delay departure by 3 hours or 6 hours?"*
* **Separate Heatmap Channels**:
  - `[🛡️ Hazard Risk]`: Compound Spotter AI danger score from Green (Safe) to Magenta (Shutdown).
  - `[🌬️ Wind Speed]`: Crosswind gust intensity along open highway expanses.
  - `[🌧️ Rain]`: Liquid precipitation rate (`in/hr`).
  - `[❄️ Snow]`: Frozen snowfall accumulation rate (`in/hr`).
* Dynamic live peak weather readouts and adaptive highway scale legends.

### 5. In-Situ Cartographic Map Design (Card-Free)
* Replaces cluttered floating overlay cards with an ultra-clean, flush **Top Corridor Telemetry Ribbon**.
* Highway polylines glow according to safety condition.
* Zero-shift, flicker-free **Mile-by-Mile Crosswind Profile Chart** with interactive scrubbing that spotlights exact map coordinates.

---

## 🏗️ Architecture & Technology Stack

```
                          ┌─────────────────────────────────────┐
                          │         React 19 Frontend           │
                          │   Leaflet + Canvas 2D + Vite        │
                          └──────────────────┬──────────────────┘
                                             │ HTTP / JSON
                                             ▼
                          ┌─────────────────────────────────────┐
                          │        Django REST Backend          │
                          │   Python 3.10+ / Gunicorn / ASGI    │
                          └──────┬───────────────────────┬──────┘
                                 │                       │
               OSRM Driving API  │                       │  Open-Meteo API
                                 ▼                       ▼
                    ┌────────────────────────┐  ┌────────────────────────┐
                    │ Multi-Route Corridors  │  │ 72h Hourly Forecasts   │
                    │ & Checkpoint Sampling  │  │ Wind, Rain & Snowfall  │
                    └────────────────────────┘  └────────────────────────┘
```

| Layer | Technologies | Key Responsibilities |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide React, Leaflet, React-Leaflet | Reactive UI, interactive map cartography, Canvas 2D thermal heatmaps, crosswind profile chart. |
| **Backend** | Python 3.10+, Django 5/6, Django REST Framework, requests | Geocoding resolution, OSRM routing, Haversine checkpoint sampling, Spotter AI risk engine, in-memory caching. |
| **External APIs** | Open-Meteo, OSRM (Open Source Routing Machine) | Free, unrestricted, production-grade weather forecasting and highway road networks. |
| **Deployment** | Gunicorn, WhiteNoise, Vercel / Render / Docker | Zero-cost, high-reliability cloud production hosting. |

---

## 🚀 Quickstart & Local Installation

### Prerequisites
* **Python 3.10+**
* **Node.js 18+** & **npm**
* **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/klassicNG/weather-aware.git
cd weather-aware
```

### 2. Backend Setup (Django REST)
```bash
# Navigate to backend directory
cd backend

# Create and activate a virtual environment
python -m venv venv

# On Windows:
.\venv\Scripts\activate
# On macOS / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start development server on port 8000
python manage.py runserver 127.0.0.1:8000
```
* Backend will be active at: `http://127.0.0.1:8000/`
* Health Check: `http://127.0.0.1:8000/api/health/`

### 3. Frontend Setup (React 19 + Vite)
```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install node dependencies
npm install

# Start Vite dev server
npm run dev
```
* Frontend will be active at: `http://localhost:5173/`

---

## 📡 REST API Reference

### `POST /api/routes/analyze/`
Analyzes multiple corridors between origin and destination, samples checkpoints, gathers forecasts, and returns the recommended route.

#### Request Body
```json
{
  "origin": "Chicago, IL",
  "destination": "Denver, CO",
  "departure_time": "2026-10-24T08:00:00Z",
  "load_weight": 45000,
  "checkpoint_interval": 50.0,
  "simulate_storm": false
}
```

#### Response Structure (Truncated)
```json
{
  "origin": { "name": "Chicago, IL, USA", "lat": 41.8781, "lon": -87.6298 },
  "destination": { "name": "Denver, CO, USA", "lat": 39.7392, "lon": -104.9903 },
  "departure_time": "2026-10-24T08:00:00Z",
  "load_weight": 45000.0,
  "checkpoint_interval_miles": 50.0,
  "recommended_route_id": "route_1",
  "routes": [
    {
      "id": "route_1",
      "name": "Primary Highway Route",
      "is_recommended": true,
      "recommendation_reason": "RECOMMENDED: Safest route avoiding all No Travel zones; Average risk 2.4/5.0; Estimated duration 17.8 hrs.",
      "summary": {
        "total_distance_miles": 1005.1,
        "total_duration_hours": 17.8,
        "eta_destination": "2026-10-25T01:48:00Z",
        "average_risk_score": 2.4,
        "max_risk_score": 4,
        "max_risk_level": "Severe",
        "severe_miles": 375.0,
        "low_miles": 630.1
      },
      "checkpoints": [ ... ]
    }
  ]
}
```

---

## 🌐 Production Deployment Guide

### Option A: Free Cloud Deployment (Render + Vercel)

#### 1. Backend on Render (Free Web Service)
1. Link your GitHub repository `https://github.com/klassicNG/weather-aware.git` to [Render](https://render.com/).
2. Create a **New Web Service**:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt && python manage.py collectstatic --noinput`
   - **Start Command**: `gunicorn core.wsgi:application --bind 0.0.0.0:$PORT`
   - **Environment Variables**:
     - `PYTHON_VERSION`: `3.12.9`
     - `DEBUG`: `False`
     - `ALLOWED_HOSTS`: `*`
3. Copy your live backend URL (e.g., `https://weather-aware-backend.onrender.com`).

#### 2. Frontend on Vercel (Free Static Hosting)
1. Import your GitHub repository to [Vercel](https://vercel.com/).
2. Set **Root Directory** to `frontend`.
3. Add **Environment Variable**:
   - `VITE_API_BASE_URL`: `https://weather-aware-backend.onrender.com` (your deployed Render URL)
4. Click **Deploy**. Your app will be live globally on CDN with full SSL.

---

## 🎥 Video Walkthrough (Loom Guide)

When recording your Loom video walkthrough for the evaluation submission, use the following structured script:

| Timestamp | Topic | Demo Actions |
| :--- | :--- | :--- |
| **0:00 – 0:45** | **Problem & Overview** | Introduce Spotter Fleet AI, explaining why high crosswinds and storm cells cause rollover hazards for commercial trucks. Show the clean, dark-mode cartographic interface. |
| **0:45 – 1:30** | **Dispatch Setup & Load Rules** | Enter an Origin and Destination (e.g. Chicago to Denver). Demonstrate changing rig weight from **$15,000\text{ lbs}$ (empty)** to **$45,000\text{ lbs}$ (loaded)**, explaining how crosswind danger thresholds dynamically shift. |
| **1:30 – 2:30** | **3-Route Comparison & Safest Selection** | Click **"DISPATCH & ANALYZE CORRIDORS"**. Show the 3 distinct routes rendered on the map. Point out the top telemetry ribbon with route badges, ETAs, and the algorithmically recommended safest route. |
| **2:30 – 3:30** | **Checkpoints & Road Telemetry** | Zoom into the map. Click on individual checkpoints to show exact arrival ETAs, wind gusts, rainfall, snowfall, and load safety notices. Explain the difference between **Avg Corridor Risk** and **Peak Hazard Level**. |
| **3:30 – 4:30** | **48-Hour Departure Simulator** | Hit **"Play Radar"** on the departure simulator. Show how weather moves across the highway over time. Switch between **Hazard Risk**, **Wind Speed**, **Rain**, and **Snow** heatmaps. Show how delaying departure by +6 hours can bypass a dangerous storm. |
| **4:30 – 5:00** | **Conclusion & Submission Wrap-up** | Conclude with backend architecture highlights (Django REST, OSRM, Open-Meteo, resilient caching) and verify production readiness. |

---

## 📋 Assessment Deliverables Checklist

- [x] **GitHub Repository**: [https://github.com/klassicNG/weather-aware.git](https://github.com/klassicNG/weather-aware.git)
- [x] **Production Ready Codebase**:
  - Django backend configured with `gunicorn`, `whitenoise`, environment settings, and connection pooling.
  - React 19 frontend compiled and production-verified (`npm run build` exit code `0`).
- [x] **Deployment Documentation**: Ready for 1-click hosting on Render / Vercel.
- [x] **Demonstration Walkthrough Guide**: Full video script and rubric alignment included above.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
