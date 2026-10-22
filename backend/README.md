# Weather-Aware Truck Routing Backend (Phase 1)

Robust, high-performance Django + Django REST Framework backend for the Weather-Aware Truck Routing system.

## Features
- **Deterministic Risk & Load Engine (`routing/risk_engine.py`)**:
  - Wind speed thresholds: `<25` (Low 1), `25-34` (Moderate 2), `35-44` (High 3), `45-54` (Severe 4), `≥55` (No Travel 5).
  - Rain rate thresholds: `<0.10` (Low 1), `0.10-0.25` (Moderate 2), `0.25-0.50` (High 3), `0.50-1.00` (Severe 4), `>1.00` (No Travel 5).
  - Snowfall rate thresholds: `<0.5` (Low 1), `0.5-1.0` (Moderate 2), `1.0-2.0` (High 3), `2.0-3.0` (Severe 4), `>3.0` (No Travel 5).
  - Specific Truck Load Rules:
    - `wind >= 55 mph` → No Travel (5) for any load
    - `45 <= wind < 55 mph` and `load_weight >= 30,000 lbs` → No Travel (5)
    - `35 <= wind < 45 mph` and `load_weight > 40,000 lbs` → Severe (4)
- **Guaranteed 3 Routes (`routing/services.py`)**:
  - Geocoding via Photon/Nominatim with an offline-resilient dictionary of major US trucking hubs.
  - Queries OSRM API with automatic perpendicular waypoint corridor offsets so the engine **always returns 3 distinct, realistic route options**.
- **Checkpoint Sampling & ETAs**:
  - Walks each route's GeoJSON polyline with Haversine distance, sampling checkpoints at user-defined intervals (10, 25, or 50 miles, plus origin and destination).
  - Computes exact segment miles and arrival ETAs for each checkpoint.
- **Batch Weather & 0-48h Corridor Forecast (`routing/weather_service.py`)**:
  - Queries Open-Meteo API using batched coordinates.
  - Samples weather at each checkpoint's estimated arrival time.
  - Generates a 0–48h corridor heatmap forecast array (`forecast_48h` with 49 hourly slots `[wind_mph, rain_in_hr, snow_in_hr, risk_score]`) for 60 FPS frontend scrubbing without additional network calls.
- **Strict 5-Step Recommendation Ranking**:
  1. Fewest `no_travel_miles` (safety gate)
  2. Fewest `severe_miles`
  3. Fewest `high_miles`
  4. Lowest `average_risk_score` (distance-weighted)
  5. Shortest `total_duration_hours`
- **CORS Enabled**: Configured for all origins to seamlessly communicate with Vite/React frontend and cloud deployments.

---

## Getting Started

### 1. Activate Environment & Run Server
```bash
# Windows
cd backend
.\venv\Scripts\activate
python manage.py runserver 8000
```

### 2. Run Test Suite
```bash
python manage.py test
```

---

## API Endpoints

### 1. Health Check
`GET /api/health/`
**Response:**
```json
{
  "status": "ok",
  "service": "weather-aware-truck-routing",
  "version": "1.0.0"
}
```

### 2. Route Analysis
`POST /api/routes/analyze/`

**Request Body:**
```json
{
  "origin": "Chicago, IL",
  "destination": "Denver, CO",
  "departure_time": "2026-10-22T08:00:00Z",
  "load_weight": 45000,
  "checkpoint_interval": 50
}
```

**Key Response Properties:**
- `origin`, `destination`, `load_weight`, `checkpoint_interval_miles`
- `recommended_route_id`: ID of the optimal route
- `routes`: Array of 3 route objects, each containing:
  - `id`: e.g. `"route_1"`
  - `name`: e.g. `"Primary Highway Route"`
  - `is_recommended`: `true` or `false`
  - `recommendation_reason`: Clear explanation of the ranking decision
  - `summary`:
    - `total_distance_miles`
    - `total_duration_hours`
    - `eta_destination`
    - `average_risk_score`
    - `no_travel_miles`, `severe_miles`, `high_miles`, `moderate_miles`, `low_miles`
  - `geometry`: GeoJSON LineString for map rendering
  - `checkpoints`: List of sampled points along the route with:
    - `distance_from_origin_miles`, `segment_miles`, `eta_iso`
    - `weather`: `wind_mph`, `rain_in_hr`, `snow_in_hr`
    - `risk`: `risk_score`, `risk_level`, `hazard_reason`
    - `forecast_48h`: 49 hourly predictions `[wind, rain, snow, risk_score]` for the timeline slider
