"""
Comprehensive Unit & Integration Tests for Weather-Aware Truck Routing
"""

import json
from datetime import datetime, timezone, timedelta
from unittest.mock import patch, MagicMock
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from .risk_engine import (
    classify_wind,
    classify_rain,
    classify_snow,
    evaluate_checkpoint_risk,
    RISK_LOW,
    RISK_MODERATE,
    RISK_HIGH,
    RISK_SEVERE,
    RISK_NO_TRAVEL,
)
from .services import (
    haversine_miles,
    geocode_location,
    fetch_guaranteed_3_routes,
    sample_checkpoints_from_route,
    rank_and_summarize_routes,
    process_route_analysis,
)
from .weather_service import (
    attach_weather_and_forecast_to_checkpoints,
)


class RiskEngineTests(TestCase):
    """Tests all Wind, Rain, Snow, and Load Weight risk calculations."""

    def test_wind_classification_thresholds_standard_load(self):
        # < 25 mph -> Low (1)
        self.assertEqual(classify_wind(0.0, 20000)[0], RISK_LOW)
        self.assertEqual(classify_wind(15.5, 20000)[0], RISK_LOW)
        self.assertEqual(classify_wind(24.9, 20000)[0], RISK_LOW)

        # 25 <= wind < 35 mph -> Moderate (2)
        self.assertEqual(classify_wind(25.0, 20000)[0], RISK_MODERATE)
        self.assertEqual(classify_wind(30.0, 20000)[0], RISK_MODERATE)
        self.assertEqual(classify_wind(34.9, 20000)[0], RISK_MODERATE)

        # 35 <= wind < 45 mph -> High (3) (standard load <= 40,000)
        self.assertEqual(classify_wind(35.0, 20000)[0], RISK_HIGH)
        self.assertEqual(classify_wind(40.0, 35000)[0], RISK_HIGH)
        self.assertEqual(classify_wind(44.9, 40000)[0], RISK_HIGH)

        # 45 <= wind < 55 mph -> Severe (4) (light load < 30,000)
        self.assertEqual(classify_wind(45.0, 20000)[0], RISK_SEVERE)
        self.assertEqual(classify_wind(50.0, 29999)[0], RISK_SEVERE)
        self.assertEqual(classify_wind(54.9, 15000)[0], RISK_SEVERE)

        # >= 55 mph -> No Travel (5)
        self.assertEqual(classify_wind(55.0, 10000)[0], RISK_NO_TRAVEL)
        self.assertEqual(classify_wind(70.0, 0)[0], RISK_NO_TRAVEL)

    def test_load_weight_rules_on_wind(self):
        """
        Load rules:
        - wind >= 55 -> No Travel (5) for any load
        - 45 <= wind < 55 and load_weight >= 30,000 -> No Travel (5)
        - 35 <= wind < 45 and load_weight > 40,000 -> Severe (4)
        """
        # Rule 1: >= 55 mph -> No Travel regardless of weight
        score, level, reason = classify_wind(58.0, 5000)
        self.assertEqual(score, RISK_NO_TRAVEL)
        self.assertEqual(level, "No Travel")

        # Rule 2: 45-54 mph + >= 30,000 lbs -> No Travel (5)
        # Exactly 30,000 lbs
        score, level, reason = classify_wind(48.0, 30000)
        self.assertEqual(score, RISK_NO_TRAVEL)
        self.assertIn("30,000", reason)

        # Heavy load 45,000 lbs with 46 mph
        score, level, reason = classify_wind(46.0, 45000)
        self.assertEqual(score, RISK_NO_TRAVEL)

        # Under 30,000 lbs stays Severe (4)
        score, level, reason = classify_wind(48.0, 25000)
        self.assertEqual(score, RISK_SEVERE)

        # Rule 3: 35-44 mph + > 40,000 lbs -> Severe (4)
        # Exactly 40,000 lbs -> remains High (3) because rule is > 40,000
        score, level, reason = classify_wind(38.0, 40000)
        self.assertEqual(score, RISK_HIGH)

        # 42,000 lbs (> 40,000) -> escalated to Severe (4)
        score, level, reason = classify_wind(38.0, 42000)
        self.assertEqual(score, RISK_SEVERE)
        self.assertIn("42,000", reason)

        # Standard load 20,000 lbs -> High (3)
        score, level, reason = classify_wind(38.0, 20000)
        self.assertEqual(score, RISK_HIGH)

    def test_rain_classification_thresholds(self):
        # < 0.10 in/hr -> Low (1)
        self.assertEqual(classify_rain(0.0)[0], RISK_LOW)
        self.assertEqual(classify_rain(0.05)[0], RISK_LOW)
        self.assertEqual(classify_rain(0.09)[0], RISK_LOW)

        # 0.10 <= rain <= 0.25 in/hr -> Moderate (2)
        self.assertEqual(classify_rain(0.10)[0], RISK_MODERATE)
        self.assertEqual(classify_rain(0.18)[0], RISK_MODERATE)
        self.assertEqual(classify_rain(0.25)[0], RISK_MODERATE)

        # 0.25 < rain <= 0.50 in/hr -> High (3)
        self.assertEqual(classify_rain(0.26)[0], RISK_HIGH)
        self.assertEqual(classify_rain(0.35)[0], RISK_HIGH)
        self.assertEqual(classify_rain(0.50)[0], RISK_HIGH)

        # 0.50 < rain <= 1.00 in/hr -> Severe (4)
        self.assertEqual(classify_rain(0.51)[0], RISK_SEVERE)
        self.assertEqual(classify_rain(0.75)[0], RISK_SEVERE)
        self.assertEqual(classify_rain(1.00)[0], RISK_SEVERE)

        # > 1.00 in/hr -> No Travel (5)
        self.assertEqual(classify_rain(1.01)[0], RISK_NO_TRAVEL)
        self.assertEqual(classify_rain(2.50)[0], RISK_NO_TRAVEL)

    def test_snow_classification_thresholds(self):
        # < 0.5 in/hr -> Low (1)
        self.assertEqual(classify_snow(0.0)[0], RISK_LOW)
        self.assertEqual(classify_snow(0.4)[0], RISK_LOW)

        # 0.5 <= snow <= 1.0 in/hr -> Moderate (2)
        self.assertEqual(classify_snow(0.5)[0], RISK_MODERATE)
        self.assertEqual(classify_snow(0.8)[0], RISK_MODERATE)
        self.assertEqual(classify_snow(1.0)[0], RISK_MODERATE)

        # 1.0 < snow <= 2.0 in/hr -> High (3)
        self.assertEqual(classify_snow(1.1)[0], RISK_HIGH)
        self.assertEqual(classify_snow(1.5)[0], RISK_HIGH)
        self.assertEqual(classify_snow(2.0)[0], RISK_HIGH)

        # 2.0 < snow <= 3.0 in/hr -> Severe (4)
        self.assertEqual(classify_snow(2.1)[0], RISK_SEVERE)
        self.assertEqual(classify_snow(2.5)[0], RISK_SEVERE)
        self.assertEqual(classify_snow(3.0)[0], RISK_SEVERE)

        # > 3.0 in/hr -> No Travel (5)
        self.assertEqual(classify_snow(3.1)[0], RISK_NO_TRAVEL)
        self.assertEqual(classify_snow(5.0)[0], RISK_NO_TRAVEL)

    def test_overall_checkpoint_risk_combines_max(self):
        # Wind is severe (4), rain is moderate (2), snow is low (1) -> overall is 4
        res = evaluate_checkpoint_risk(wind_mph=48.0, rain_in_hr=0.15, snow_in_hr=0.0, load_weight=20000)
        self.assertEqual(res["risk_score"], RISK_SEVERE)
        self.assertEqual(res["risk_level"], "Severe")
        self.assertIn("Severe Wind", res["hazard_reason"])

        # Snow is extreme (3.5 in/hr) -> overall is 5 No Travel even if wind is 10 mph
        res2 = evaluate_checkpoint_risk(wind_mph=10.0, rain_in_hr=0.0, snow_in_hr=3.5, load_weight=15000)
        self.assertEqual(res2["risk_score"], RISK_NO_TRAVEL)
        self.assertEqual(res2["risk_level"], "No Travel")
        self.assertIn("Snowfall 3.50 in/hr", res2["hazard_reason"])

        # Clear conditions -> overall 1 Low
        res3 = evaluate_checkpoint_risk(wind_mph=12.0, rain_in_hr=0.0, snow_in_hr=0.0, load_weight=45000)
        self.assertEqual(res3["risk_score"], RISK_LOW)
        self.assertEqual(res3["risk_level"], "Low")
        self.assertIn("Clear", res3["hazard_reason"])


class RouteRecommendationRankingTests(TestCase):
    """Tests the strict 5-step tie breaker recommendation engine."""

    def test_tie_breaker_safety_gate_no_travel_miles(self):
        # Route A has 10 miles of No Travel, but only 10 hours duration
        # Route B has 0 miles of No Travel, but 12 hours duration
        # Route B MUST win because fewer no_travel_miles is priority #1
        r_a = {
            "id": "route_a",
            "name": "Fast Route with Blizzard",
            "total_distance_miles": 600.0,
            "total_duration_hours": 10.0,
            "checkpoints": [
                {"segment_miles": 10.0, "risk": {"risk_score": 5}, "eta_iso": "2026-10-22T10:00:00Z"},
                {"segment_miles": 590.0, "risk": {"risk_score": 1}, "eta_iso": "2026-10-22T20:00:00Z"},
            ]
        }
        r_b = {
            "id": "route_b",
            "name": "Safe Slower Route",
            "total_distance_miles": 650.0,
            "total_duration_hours": 12.0,
            "checkpoints": [
                {"segment_miles": 650.0, "risk": {"risk_score": 1}, "eta_iso": "2026-10-22T22:00:00Z"},
            ]
        }
        ranked, winner_id = rank_and_summarize_routes([r_a, r_b])
        self.assertEqual(winner_id, "route_b")
        self.assertTrue(ranked[0]["is_recommended"])
        self.assertEqual(ranked[0]["id"], "route_b")

    def test_tie_breaker_severe_miles(self):
        # Both have 0 no_travel_miles
        # Route A has 50 miles severe; Route B has 10 miles severe
        # Route B wins priority #2
        r_a = {
            "id": "route_a",
            "total_distance_miles": 500.0,
            "total_duration_hours": 8.0,
            "checkpoints": [
                {"segment_miles": 50.0, "risk": {"risk_score": 4}, "eta_iso": "2026-10-22T10:00:00Z"},
                {"segment_miles": 450.0, "risk": {"risk_score": 1}, "eta_iso": "2026-10-22T18:00:00Z"},
            ]
        }
        r_b = {
            "id": "route_b",
            "total_distance_miles": 500.0,
            "total_duration_hours": 8.5,
            "checkpoints": [
                {"segment_miles": 10.0, "risk": {"risk_score": 4}, "eta_iso": "2026-10-22T10:00:00Z"},
                {"segment_miles": 490.0, "risk": {"risk_score": 1}, "eta_iso": "2026-10-22T18:30:00Z"},
            ]
        }
        ranked, winner_id = rank_and_summarize_routes([r_a, r_b])
        self.assertEqual(winner_id, "route_b")

    def test_tie_breaker_duration_when_risk_is_equal(self):
        # Equal risk scores and miles, shorter travel time wins priority #5
        r_a = {
            "id": "route_fast",
            "total_distance_miles": 500.0,
            "total_duration_hours": 8.0,
            "checkpoints": [
                {"segment_miles": 500.0, "risk": {"risk_score": 1}, "eta_iso": "2026-10-22T18:00:00Z"},
            ]
        }
        r_b = {
            "id": "route_slow",
            "total_distance_miles": 500.0,
            "total_duration_hours": 9.5,
            "checkpoints": [
                {"segment_miles": 500.0, "risk": {"risk_score": 1}, "eta_iso": "2026-10-22T19:30:00Z"},
            ]
        }
        ranked, winner_id = rank_and_summarize_routes([r_a, r_b])
        self.assertEqual(winner_id, "route_fast")


class CheckpointSamplingTests(TestCase):
    """Tests polyline checkpoint sampling at 10, 25, 50 miles."""

    def test_checkpoint_sampling_50_miles(self):
        # Create a synthetic 200-mile straight route
        # ~3 degrees longitude at lat 40 is ~160 miles, let's use Chicago to Des Moines coordinates
        start = {"lat": 41.8781, "lon": -87.6298}  # Chicago
        end = {"lat": 41.5868, "lon": -93.6250}    # Des Moines (~315 miles)
        coords = [
            [-87.6298, 41.8781],
            [-90.5, 41.7],
            [-93.6250, 41.5868],
        ]
        total_dist = haversine_miles(41.8781, -87.6298, 41.7, -90.5) + haversine_miles(41.7, -90.5, 41.5868, -93.6250)

        route = {
            "geometry": {"type": "LineString", "coordinates": coords},
            "distance": total_dist * 1609.34,
            "duration": (total_dist / 60.0) * 3600.0,
        }

        checkpoints = sample_checkpoints_from_route(route, interval_miles=50.0, departure_time_iso="2026-10-22T10:00:00Z")

        # Must have origin (0), 50, 100, 150, ..., and destination
        self.assertGreaterEqual(len(checkpoints), 4)
        self.assertEqual(checkpoints[0]["distance_from_origin_miles"], 0.0)
        self.assertAlmostEqual(checkpoints[-1]["distance_from_origin_miles"], total_dist, delta=1.0)

        # Sum of segment miles must equal total distance
        sum_seg_miles = sum(cp["segment_miles"] for cp in checkpoints)
        self.assertAlmostEqual(sum_seg_miles, total_dist, delta=0.5)

        # ETAs must increase monotonically
        for i in range(1, len(checkpoints)):
            self.assertGreaterEqual(checkpoints[i]["hours_from_departure"], checkpoints[i-1]["hours_from_departure"])


class Guaranteed3RouteTests(TestCase):
    """Tests guaranteed 3-route generation."""

    def test_guaranteed_3_routes_always_returns_three(self):
        chicago = geocode_location("Chicago, IL")
        denver = geocode_location("Denver, CO")
        routes = fetch_guaranteed_3_routes(chicago, denver)
        self.assertEqual(len(routes), 3)
        for r in routes:
            self.assertIn("geometry", r)
            self.assertIn("coordinates", r["geometry"])
            self.assertGreater(len(r["geometry"]["coordinates"]), 5)


class RouteAnalyzeAPITests(TestCase):
    """Tests the REST API endpoints."""

    def setUp(self):
        self.client = APIClient()

    def test_health_check_endpoint(self):
        resp = self.client.get("/api/health/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["service"], "weather-aware-truck-routing")

    def test_analyze_routes_valid_payload(self):
        payload = {
            "origin": "Chicago, IL",
            "destination": "Denver, CO",
            "departure_time": "2026-10-22T10:00:00Z",
            "load_weight": 45000,
            "checkpoint_interval": 50
        }
        resp = self.client.post("/api/routes/analyze/", data=json.dumps(payload), content_type="application/json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.json()

        # Check response structure
        self.assertIn("origin", data)
        self.assertIn("destination", data)
        self.assertIn("recommended_route_id", data)
        self.assertIn("routes", data)
        self.assertEqual(len(data["routes"]), 3)

        # Exactly 1 route should be recommended
        recommended_count = sum(1 for r in data["routes"] if r["is_recommended"])
        self.assertEqual(recommended_count, 1)

        # Verify checkpoints and 48h heatmap forecast
        first_route = data["routes"][0]
        self.assertIn("summary", first_route)
        self.assertIn("average_risk_score", first_route["summary"])
        self.assertIn("no_travel_miles", first_route["summary"])
        self.assertIn("checkpoints", first_route)
        self.assertGreater(len(first_route["checkpoints"]), 2)

        first_cp = first_route["checkpoints"][0]
        self.assertIn("weather", first_cp)
        self.assertIn("risk", first_cp)
        self.assertIn("forecast_48h", first_cp)
        # forecast_48h should contain 49 hourly items (0 to 48 hours)
        self.assertEqual(len(first_cp["forecast_48h"]), 49)
        # Each entry is [wind, rain, snow, risk_score]
        self.assertEqual(len(first_cp["forecast_48h"][0]), 4)

    def test_analyze_routes_missing_required_fields(self):
        payload = {"origin": "Chicago, IL"}  # missing destination
        resp = self.client.post("/api/routes/analyze/", data=json.dumps(payload), content_type="application/json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
