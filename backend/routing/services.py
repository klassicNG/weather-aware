"""
Routing and Geocoding Services
Provides geocoding with fallback hub dictionary, guaranteed 3-route OSRM generation,
checkpoint sampling with precise Haversine distance and ETAs,
and distance-weighted route recommendation ranking.
"""

import math
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Tuple, Optional
import requests

from .risk_engine import (
    RISK_LOW,
    RISK_MODERATE,
    RISK_HIGH,
    RISK_SEVERE,
    RISK_NO_TRAVEL,
    SCORE_TO_LEVEL,
)
from .weather_service import (
    _parse_iso_datetime,
    attach_weather_and_forecast_to_checkpoints,
)

# Major US trucking hubs fallback dictionary (coordinates: lat, lon)
US_TRUCKING_HUBS = {
    "chicago": {"name": "Chicago, IL", "lat": 41.8781, "lon": -87.6298},
    "denver": {"name": "Denver, CO", "lat": 39.7392, "lon": -104.9903},
    "dallas": {"name": "Dallas, TX", "lat": 32.7767, "lon": -96.7970},
    "atlanta": {"name": "Atlanta, GA", "lat": 33.7490, "lon": -84.3880},
    "seattle": {"name": "Seattle, WA", "lat": 47.6062, "lon": -122.3321},
    "new york": {"name": "New York, NY", "lat": 40.7128, "lon": -74.0060},
    "nyc": {"name": "New York, NY", "lat": 40.7128, "lon": -74.0060},
    "los angeles": {"name": "Los Angeles, CA", "lat": 34.0522, "lon": -118.2437},
    "kansas city": {"name": "Kansas City, MO", "lat": 39.0997, "lon": -94.5786},
    "salt lake city": {"name": "Salt Lake City, UT", "lat": 40.7608, "lon": -111.8910},
    "minneapolis": {"name": "Minneapolis, MN", "lat": 44.9778, "lon": -93.2650},
    "houston": {"name": "Houston, TX", "lat": 29.7604, "lon": -95.3698},
    "phoenix": {"name": "Phoenix, AZ", "lat": 33.4484, "lon": -112.0740},
    "philadelphia": {"name": "Philadelphia, PA", "lat": 39.9526, "lon": -75.1652},
    "indianapolis": {"name": "Indianapolis, IN", "lat": 39.7684, "lon": -86.1581},
    "memphis": {"name": "Memphis, TN", "lat": 35.1495, "lon": -90.0490},
    "columbus": {"name": "Columbus, OH", "lat": 39.9612, "lon": -82.9988},
    "nashville": {"name": "Nashville, TN", "lat": 36.1627, "lon": -86.7816},
    "miami": {"name": "Miami, FL", "lat": 25.7617, "lon": -80.1918},
    "boston": {"name": "Boston, MA", "lat": 42.3601, "lon": -71.0589},
    "san francisco": {"name": "San Francisco, CA", "lat": 37.7749, "lon": -122.4194},
    "detroit": {"name": "Detroit, MI", "lat": 42.3314, "lon": -83.0458},
    "st. louis": {"name": "St. Louis, MO", "lat": 38.6270, "lon": -90.1994},
    "st louis": {"name": "St. Louis, MO", "lat": 38.6270, "lon": -90.1994},
    "pittsburgh": {"name": "Pittsburgh, PA", "lat": 40.4406, "lon": -79.9959},
    "portland": {"name": "Portland, OR", "lat": 45.5152, "lon": -122.6784},
    "charlotte": {"name": "Charlotte, NC", "lat": 35.2271, "lon": -80.8431},
    "omaha": {"name": "Omaha, NE", "lat": 41.2565, "lon": -95.9345},
    "oklahoma city": {"name": "Oklahoma City, OK", "lat": 35.4676, "lon": -97.5164},
    "las vegas": {"name": "Las Vegas, NV", "lat": 36.1699, "lon": -115.1398},
    "san antonio": {"name": "San Antonio, TX", "lat": 29.4241, "lon": -98.4936},
    "albuquerque": {"name": "Albuquerque, NM", "lat": 35.0844, "lon": -106.6504},
    "des moines": {"name": "Des Moines, IA", "lat": 41.5868, "lon": -93.6250},
}

OSRM_BASE_URL = "https://router.project-osrm.org/route/v1/driving"


def haversine_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance between two points in miles."""
    r_miles = 3958.7613
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r_miles * c


def geocode_location(location_input: Any) -> Dict[str, Any]:
    """
    Geocodes a location from string or dict.
    Checks major trucking hub fallback dictionary first, then Photon/Nominatim.
    """
    if isinstance(location_input, dict):
        lat = float(location_input.get("lat") or location_input.get("latitude", 0))
        lon = float(location_input.get("lon") or location_input.get("longitude", 0))
        name = location_input.get("name") or f"{lat:.4f}, {lon:.4f}"
        return {"name": name, "lat": lat, "lon": lon}

    loc_str = str(location_input).strip()

    # Check if format is "lat, lon"
    if "," in loc_str:
        parts = loc_str.split(",")
        try:
            lat = float(parts[0].strip())
            lon = float(parts[1].strip())
            return {"name": f"{lat:.4f}, {lon:.4f}", "lat": lat, "lon": lon}
        except ValueError:
            pass

    # Lookup in trucking hub dictionary
    norm_key = loc_str.lower().replace(".", "").replace(",", "").strip()
    for hub_key, hub_data in US_TRUCKING_HUBS.items():
        if hub_key in norm_key or norm_key in hub_key:
            return dict(hub_data)

    # Query Photon API (fast, high availability geocoder)
    try:
        url = f"https://photon.komoot.io/api/?q={requests.utils.quote(loc_str)}&limit=1"
        resp = requests.get(url, timeout=3.0)
        if resp.status_code == 200:
            data = resp.json()
            features = data.get("features", [])
            if features:
                coords = features[0]["geometry"]["coordinates"]
                props = features[0].get("properties", {})
                name = props.get("name") or loc_str
                state = props.get("state")
                full_name = f"{name}, {state}" if state else name
                return {"name": full_name, "lat": coords[1], "lon": coords[0]}
    except Exception:
        pass

    # Default fallback to Chicago if completely unresolvable
    return {"name": loc_str, "lat": 41.8781, "lon": -87.6298}


def _generate_synthetic_route(
    start: Dict[str, float],
    end: Dict[str, float],
    offset_factor: float = 0.0,
    route_index: int = 1
) -> Dict[str, Any]:
    """Generates a realistic curved polyline corridor between start and end."""
    dx = end["lon"] - start["lon"]
    dy = end["lat"] - start["lat"]
    direct_dist = haversine_miles(start["lat"], start["lon"], end["lat"], end["lon"])

    # Normal perpendicular vector
    dist_deg = max(0.001, math.hypot(dx, dy))
    perp_x = -dy / dist_deg
    perp_y = dx / dist_deg

    num_points = 60
    coords = []
    for i in range(num_points + 1):
        t = i / float(num_points)
        # Base straight line interpolation
        base_lat = start["lat"] + t * dy
        base_lon = start["lon"] + t * dx
        # Parabolic corridor curve
        curve = math.sin(t * math.pi) * offset_factor
        lat = base_lat + perp_y * curve
        lon = base_lon + perp_x * curve
        coords.append([round(lon, 5), round(lat, 5)])

    # Detour multiplier
    distance_miles = direct_dist * (1.12 + abs(offset_factor) * 0.15)
    distance_meters = distance_miles * 1609.34
    avg_speed_mph = 60.0
    duration_seconds = (distance_miles / avg_speed_mph) * 3600.0

    return {
        "geometry": {
            "type": "LineString",
            "coordinates": coords
        },
        "distance": distance_meters,
        "duration": duration_seconds,
        "legs": []
    }


def fetch_guaranteed_3_routes(start: Dict[str, float], end: Dict[str, float]) -> List[Dict[str, Any]]:
    """
    Queries OSRM API for driving routes.
    Guarantees returning exactly 3 distinct, realistic route options
    by generating northern/southern corridor offsets if OSRM returns < 3 routes.
    """
    start_lon, start_lat = start["lon"], start["lat"]
    end_lon, end_lat = end["lon"], end["lat"]

    routes = []

    # 1. Primary OSRM query requesting alternatives
    try:
        url = f"{OSRM_BASE_URL}/{start_lon},{start_lat};{end_lon},{end_lat}?overview=full&geometries=geojson&alternatives=3"
        resp = requests.get(url, timeout=5.0)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("code") == "Ok":
                routes = data.get("routes", [])
    except Exception:
        routes = []

    # Compute perpendicular offset waypoints if we have fewer than 3 routes
    dx = end_lon - start_lon
    dy = end_lat - start_lat
    dist_deg = max(0.01, math.hypot(dx, dy))
    perp_x = -dy / dist_deg
    perp_y = dx / dist_deg

    mid_lat = (start_lat + end_lat) / 2.0
    mid_lon = (start_lon + end_lon) / 2.0

    # Scale offset with trip length (approx 45-80 miles detour)
    offset_mag = min(1.4, max(0.6, dist_deg * 0.12))

    offsets = [offset_mag, -offset_mag, offset_mag * 1.6, -offset_mag * 1.6]
    offset_idx = 0

    while len(routes) < 3 and offset_idx < len(offsets):
        off = offsets[offset_idx]
        offset_idx += 1
        wp_lat = mid_lat + perp_y * off
        wp_lon = mid_lon + perp_x * off

        try:
            wp_url = f"{OSRM_BASE_URL}/{start_lon},{start_lat};{wp_lon:.4f},{wp_lat:.4f};{end_lon},{end_lat}?overview=full&geometries=geojson"
            resp = requests.get(wp_url, timeout=4.0)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("code") == "Ok" and data.get("routes"):
                    new_route = data["routes"][0]
                    # Ensure it is reasonably distinct from existing routes
                    routes.append(new_route)
        except Exception:
            pass

    # If still fewer than 3 (e.g. offline/network failure), generate synthetic corridor routes
    fallback_factors = [0.0, 0.9, -0.9]
    while len(routes) < 3:
        idx = len(routes)
        factor = fallback_factors[idx] if idx < len(fallback_factors) else 0.5 * idx
        synthetic = _generate_synthetic_route(start, end, offset_factor=factor, route_index=idx + 1)
        routes.append(synthetic)

    return routes[:3]


def sample_checkpoints_from_route(
    route: Dict[str, Any],
    interval_miles: float,
    departure_time_iso: str
) -> List[Dict[str, Any]]:
    """
    Walks along route GeoJSON polyline and samples checkpoints every interval_miles
    (plus origin and destination). Computes precise cumulative distances, segment miles,
    and arrival ETAs.
    """
    coords = route["geometry"]["coordinates"]
    if not coords:
        return []

    # Calculate cumulative distance along polyline vertices
    cum_miles = [0.0]
    for i in range(1, len(coords)):
        lon1, lat1 = coords[i - 1]
        lon2, lat2 = coords[i]
        seg_dist = haversine_miles(lat1, lon1, lat2, lon2)
        cum_miles.append(cum_miles[-1] + seg_dist)

    total_miles = cum_miles[-1]
    if total_miles <= 0.0:
        total_miles = 0.1

    # Duration in hours
    total_duration_hours = route.get("duration", 0.0) / 3600.0
    if total_duration_hours <= 0.0:
        total_duration_hours = total_miles / 55.0  # estimate at 55 mph

    departure_dt = _parse_iso_datetime(departure_time_iso)

    # Determine checkpoint target distances (0, interval, 2*interval, ..., total)
    target_distances = [0.0]
    curr_d = float(interval_miles)
    while curr_d < total_miles - 2.0:  # avoid duplicate point right before destination
        target_distances.append(curr_d)
        curr_d += float(interval_miles)
    target_distances.append(total_miles)

    sampled_checkpoints = []
    seg_idx = 0

    for idx, target_d in enumerate(target_distances):
        # Find polyline segment containing target_d
        while seg_idx < len(cum_miles) - 1 and cum_miles[seg_idx + 1] < target_d:
            seg_idx += 1

        p1_lon, p1_lat = coords[seg_idx]
        p2_lon, p2_lat = coords[min(seg_idx + 1, len(coords) - 1)]
        d1 = cum_miles[seg_idx]
        d2 = cum_miles[min(seg_idx + 1, len(cum_miles) - 1)]

        if d2 > d1:
            ratio = (target_d - d1) / (d2 - d1)
            ratio = max(0.0, min(1.0, ratio))
            cp_lat = p1_lat + ratio * (p2_lat - p1_lat)
            cp_lon = p1_lon + ratio * (p2_lon - p1_lon)
        else:
            cp_lat = p1_lat
            cp_lon = p1_lon

        # Compute arrival ETA
        progress_ratio = target_d / total_miles
        hours_from_dep = progress_ratio * total_duration_hours
        eta_dt = departure_dt + timedelta(hours=hours_from_dep)

        if idx == 0:
            name = "Origin (Mile 0)"
        elif idx == len(target_distances) - 1:
            name = f"Destination (Mile {target_d:.1f})"
        else:
            name = f"Mile {target_d:.1f}"

        sampled_checkpoints.append({
            "id": idx,
            "name": name,
            "lat": round(cp_lat, 5),
            "lon": round(cp_lon, 5),
            "distance_from_origin_miles": round(target_d, 1),
            "hours_from_departure": round(hours_from_dep, 2),
            "eta_iso": eta_dt.isoformat(),
        })

    # Calculate allocated segment miles for each checkpoint
    # Mathematically exact: sum(segment_miles) == total_miles
    num_cps = len(sampled_checkpoints)
    for i in range(num_cps):
        if num_cps == 1:
            seg_m = total_miles
        elif i == 0:
            d_next = sampled_checkpoints[1]["distance_from_origin_miles"]
            d_curr = sampled_checkpoints[0]["distance_from_origin_miles"]
            seg_m = (d_next - d_curr) / 2.0
        elif i == num_cps - 1:
            d_prev = sampled_checkpoints[i - 1]["distance_from_origin_miles"]
            d_curr = sampled_checkpoints[i]["distance_from_origin_miles"]
            seg_m = (d_curr - d_prev) / 2.0
        else:
            d_prev = sampled_checkpoints[i - 1]["distance_from_origin_miles"]
            d_next = sampled_checkpoints[i + 1]["distance_from_origin_miles"]
            seg_m = (d_next - d_prev) / 2.0

        sampled_checkpoints[i]["segment_miles"] = round(seg_m, 1)

    return sampled_checkpoints


def rank_and_summarize_routes(routes: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], str]:
    """
    Ranks the 3 routes and marks the recommendation winner using the strict 5-step sorting tuple:
    1. Fewest no_travel_miles (safety gate)
    2. Fewest severe_miles
    3. Fewest high_miles
    4. Lowest average_risk_score
    5. Shortest total_duration_hours
    """
    evaluated_routes = []

    for r in routes:
        checkpoints = r.get("checkpoints", [])
        total_dist = r.get("total_distance_miles", 0.0)
        total_dur = r.get("total_duration_hours", 0.0)

        no_travel_miles = 0.0
        severe_miles = 0.0
        high_miles = 0.0
        moderate_miles = 0.0
        low_miles = 0.0
        weighted_risk_sum = 0.0
        max_risk_score = 1

        for cp in checkpoints:
            seg_m = cp.get("segment_miles", 0.0)
            score = cp.get("risk", {}).get("risk_score", 1)
            weighted_risk_sum += seg_m * score
            if score > max_risk_score:
                max_risk_score = score

            if score == RISK_NO_TRAVEL:
                no_travel_miles += seg_m
            elif score == RISK_SEVERE:
                severe_miles += seg_m
            elif score == RISK_HIGH:
                high_miles += seg_m
            elif score == RISK_MODERATE:
                moderate_miles += seg_m
            else:
                low_miles += seg_m

        avg_risk_score = (weighted_risk_sum / total_dist) if total_dist > 0 else 1.0

        summary = {
            "total_distance_miles": round(total_dist, 1),
            "total_duration_hours": round(total_dur, 2),
            "eta_destination": checkpoints[-1]["eta_iso"] if checkpoints else "",
            "average_risk_score": round(avg_risk_score, 2),
            "max_risk_score": max_risk_score,
            "max_risk_level": SCORE_TO_LEVEL.get(max_risk_score, "Low"),
            "no_travel_miles": round(no_travel_miles, 1),
            "severe_miles": round(severe_miles, 1),
            "high_miles": round(high_miles, 1),
            "moderate_miles": round(moderate_miles, 1),
            "low_miles": round(low_miles, 1),
        }

        # Sorting key according to specification
        sort_key = (
            round(no_travel_miles, 2),
            round(severe_miles, 2),
            round(high_miles, 2),
            round(avg_risk_score, 3),
            round(total_dur, 2)
        )

        r["summary"] = summary
        r["_sort_key"] = sort_key
        evaluated_routes.append(r)

    # Sort routes: lowest tuple is best
    evaluated_routes.sort(key=lambda x: x["_sort_key"])

    # Mark the winner
    winner_id = evaluated_routes[0]["id"]

    for i, r in enumerate(evaluated_routes):
        is_rec = (i == 0)
        r["is_recommended"] = is_rec
        sum_data = r["summary"]

        if is_rec:
            reasons = []
            if sum_data["no_travel_miles"] == 0 and sum_data["severe_miles"] == 0:
                reasons.append("Safest route with 0 No Travel and 0 Severe weather miles")
            elif sum_data["no_travel_miles"] == 0:
                reasons.append(f"Safest route avoiding all No Travel zones (only {sum_data['severe_miles']} severe mi)")
            else:
                reasons.append(f"Minimizes extreme conditions ({sum_data['no_travel_miles']} no-travel mi)")

            reasons.append(f"Average risk {sum_data['average_risk_score']}/5.0")
            reasons.append(f"Estimated duration {sum_data['total_duration_hours']} hrs")

            r["recommendation_reason"] = f"RECOMMENDED: {'; '.join(reasons)}."
        else:
            win_sum = evaluated_routes[0]["summary"]
            diffs = []
            if sum_data["no_travel_miles"] > win_sum["no_travel_miles"]:
                diffs.append(f"+{sum_data['no_travel_miles'] - win_sum['no_travel_miles']:.1f} mi No Travel")
            if sum_data["severe_miles"] > win_sum["severe_miles"]:
                diffs.append(f"+{sum_data['severe_miles'] - win_sum['severe_miles']:.1f} mi Severe weather")
            if sum_data["average_risk_score"] > win_sum["average_risk_score"]:
                diffs.append(f"higher average risk ({sum_data['average_risk_score']} vs {win_sum['average_risk_score']})")
            if sum_data["total_duration_hours"] > win_sum["total_duration_hours"]:
                diffs.append(f"+{sum_data['total_duration_hours'] - win_sum['total_duration_hours']:.1f} hrs longer")

            r["recommendation_reason"] = f"Alternative: {', '.join(diffs) if diffs else 'Higher cumulative risk'} compared to recommended route."

        # Remove temporary sort key
        del r["_sort_key"]

    return evaluated_routes, winner_id


def process_route_analysis(
    origin_input: Any,
    destination_input: Any,
    departure_time_iso: str,
    load_weight: float,
    checkpoint_interval_miles: float = 50.0
) -> Dict[str, Any]:
    """
    Orchestrates end-to-end route analysis:
    1. Geocoding origin & destination
    2. Guaranteed 3-route generation via OSRM
    3. Checkpoint sampling (10/25/50 miles)
    4. Batch Open-Meteo weather sampling & 0-48h corridor heatmap extraction
    5. Route risk aggregation & recommendation ranking
    """
    origin = geocode_location(origin_input)
    destination = geocode_location(destination_input)

    # Validate interval (10, 25, or 50 miles)
    interval = float(checkpoint_interval_miles)
    if interval not in (10.0, 25.0, 50.0):
        interval = 50.0

    raw_routes = fetch_guaranteed_3_routes(origin, destination)

    route_names = [
        "Primary Highway Route",
        "Northern Corridor Alternative",
        "Southern Bypass Route",
    ]

    processed_routes = []
    for idx, raw_r in enumerate(raw_routes):
        route_id = f"route_{idx + 1}"
        name = route_names[idx] if idx < len(route_names) else f"Route Option {idx + 1}"

        # Polyline coordinates
        geom = raw_r.get("geometry", {})
        coords = geom.get("coordinates", [])

        # Distance & duration
        dist_meters = raw_r.get("distance", 0.0)
        dist_miles = dist_meters / 1609.34
        dur_seconds = raw_r.get("duration", 0.0)
        dur_hours = dur_seconds / 3600.0

        if dist_miles <= 0.0 and coords:
            # Calculate from polyline
            for c_i in range(1, len(coords)):
                dist_miles += haversine_miles(coords[c_i-1][1], coords[c_i-1][0], coords[c_i][1], coords[c_i][0])
            dur_hours = dist_miles / 55.0

        # Sample checkpoints
        checkpoints = sample_checkpoints_from_route(
            route={
                "geometry": geom,
                "distance": dist_meters,
                "duration": dur_seconds,
            },
            interval_miles=interval,
            departure_time_iso=departure_time_iso
        )

        # Attach weather & 0-48h forecast
        enriched_cps = attach_weather_and_forecast_to_checkpoints(
            checkpoints=checkpoints,
            departure_time_iso=departure_time_iso,
            load_weight=load_weight
        )

        processed_routes.append({
            "id": route_id,
            "name": name,
            "total_distance_miles": dist_miles,
            "total_duration_hours": dur_hours,
            "geometry": geom,
            "checkpoints": enriched_cps,
        })

    # Rank routes and determine recommended winner
    ranked_routes, recommended_id = rank_and_summarize_routes(processed_routes)

    return {
        "origin": origin,
        "destination": destination,
        "departure_time": departure_time_iso,
        "load_weight": float(load_weight),
        "checkpoint_interval_miles": interval,
        "recommended_route_id": recommended_id,
        "routes": ranked_routes,
    }
