"""
Exact Risk & Load Calculation Engine
Adheres strictly to the Weather-Aware Truck Routing specification.

Risk Levels:
- Low = 1
- Moderate = 2
- High = 3
- Severe = 4
- No Travel = 5
"""

from typing import Dict, Any, Tuple

# Risk constants
RISK_LOW = 1
RISK_MODERATE = 2
RISK_HIGH = 3
RISK_SEVERE = 4
RISK_NO_TRAVEL = 5

SCORE_TO_LEVEL = {
    RISK_LOW: "Low",
    RISK_MODERATE: "Moderate",
    RISK_HIGH: "High",
    RISK_SEVERE: "Severe",
    RISK_NO_TRAVEL: "No Travel",
}

LEVEL_TO_SCORE = {v: k for k, v in SCORE_TO_LEVEL.items()}


def classify_wind(wind_mph: float, load_weight: float = 0.0) -> Tuple[int, str, str]:
    """
    Classify wind risk including truck load weight rules.

    Thresholds:
    - < 25 mph: Low (1)
    - 25 <= wind < 35 mph (25-34): Moderate (2)
    - 35 <= wind < 45 mph (35-44): High (3)
    - 45 <= wind < 55 mph (45-54): Severe (4)
    - >= 55 mph: No Travel (5)

    Load Rules:
    - wind >= 55: No Travel (5) for any load
    - 45 <= wind < 55 and load_weight >= 30,000 lbs: No Travel (5)
    - 35 <= wind < 45 and load_weight > 40,000 lbs: Severe (4)
    """
    wind = float(wind_mph)
    weight = float(load_weight)

    # Base wind classification
    if wind < 25.0:
        base_score = RISK_LOW
    elif wind < 35.0:
        base_score = RISK_MODERATE
    elif wind < 45.0:
        base_score = RISK_HIGH
    elif wind < 55.0:
        base_score = RISK_SEVERE
    else:
        base_score = RISK_NO_TRAVEL

    # Load weight rule evaluations
    effective_score = base_score
    reason = f"Wind {wind:.1f} mph ({SCORE_TO_LEVEL[base_score]})"

    if wind >= 55.0:
        effective_score = RISK_NO_TRAVEL
        reason = f"Extreme Wind {wind:.1f} mph (≥55 mph No Travel)"
    elif 45.0 <= wind < 55.0:
        if weight >= 30000.0:
            effective_score = RISK_NO_TRAVEL
            reason = f"Severe Wind {wind:.1f} mph + Heavy Load {weight:,.0f} lbs (≥30,000 lbs → No Travel)"
        else:
            effective_score = RISK_SEVERE
            reason = f"Severe Wind {wind:.1f} mph"
    elif 35.0 <= wind < 45.0:
        if weight > 40000.0:
            effective_score = RISK_SEVERE
            reason = f"High Wind {wind:.1f} mph + Heavy Load {weight:,.0f} lbs (>40,000 lbs → Severe)"
        else:
            effective_score = RISK_HIGH
            reason = f"High Wind {wind:.1f} mph"

    return effective_score, SCORE_TO_LEVEL[effective_score], reason


def classify_rain(rain_in_hr: float) -> Tuple[int, str, str]:
    """
    Classify rain risk (inches per hour).

    Thresholds:
    - < 0.10 in/hr: Low (1)
    - 0.10 <= rain <= 0.25 in/hr: Moderate (2)
    - 0.25 < rain <= 0.50 in/hr: High (3)
    - 0.50 < rain <= 1.00 in/hr: Severe (4)
    - > 1.00 in/hr: No Travel (5)
    """
    rain = float(rain_in_hr)
    if rain < 0.10:
        score = RISK_LOW
    elif rain <= 0.25:
        score = RISK_MODERATE
    elif rain <= 0.50:
        score = RISK_HIGH
    elif rain <= 1.00:
        score = RISK_SEVERE
    else:
        score = RISK_NO_TRAVEL

    level = SCORE_TO_LEVEL[score]
    reason = f"Rain {rain:.2f} in/hr ({level})" if score > RISK_LOW else f"Light/No Rain {rain:.2f} in/hr"
    return score, level, reason


def classify_snow(snow_in_hr: float) -> Tuple[int, str, str]:
    """
    Classify snowfall risk (inches per hour).

    Thresholds:
    - < 0.5 in/hr: Low (1)
    - 0.5 <= snow <= 1.0 in/hr: Moderate (2)
    - 1.0 < snow <= 2.0 in/hr: High (3)
    - 2.0 < snow <= 3.0 in/hr: Severe (4)
    - > 3.0 in/hr: No Travel (5)
    """
    snow = float(snow_in_hr)
    if snow < 0.50:
        score = RISK_LOW
    elif snow <= 1.00:
        score = RISK_MODERATE
    elif snow <= 2.00:
        score = RISK_HIGH
    elif snow <= 3.00:
        score = RISK_SEVERE
    else:
        score = RISK_NO_TRAVEL

    level = SCORE_TO_LEVEL[score]
    reason = f"Snowfall {snow:.2f} in/hr ({level})" if score > RISK_LOW else f"Light/No Snow {snow:.2f} in/hr"
    return score, level, reason


def evaluate_checkpoint_risk(
    wind_mph: float,
    rain_in_hr: float,
    snow_in_hr: float,
    load_weight: float = 0.0
) -> Dict[str, Any]:
    """
    Calculates overall checkpoint risk as max(wind_risk_with_load, rain_risk, snow_risk).
    Returns complete breakdown and primary hazard reason.
    """
    wind_score, wind_level, wind_reason = classify_wind(wind_mph, load_weight)
    rain_score, rain_level, rain_reason = classify_rain(rain_in_hr)
    snow_score, snow_level, snow_reason = classify_snow(snow_in_hr)

    overall_score = max(wind_score, rain_score, snow_score)
    overall_level = SCORE_TO_LEVEL[overall_score]

    # Determine primary hazard reason
    reasons = []
    if overall_score > RISK_LOW:
        if wind_score == overall_score:
            reasons.append(wind_reason)
        if rain_score == overall_score:
            reasons.append(rain_reason)
        if snow_score == overall_score:
            reasons.append(snow_reason)
        primary_hazard = " & ".join(reasons)
    else:
        primary_hazard = "Clear / Low Risk"

    return {
        "risk_score": overall_score,
        "risk_level": overall_level,
        "hazard_reason": primary_hazard,
        "wind_mph": round(float(wind_mph), 1),
        "rain_in_hr": round(float(rain_in_hr), 2),
        "snow_in_hr": round(float(snow_in_hr), 2),
        "load_weight": round(float(load_weight), 0),
        "wind_risk": {
            "score": wind_score,
            "level": wind_level,
            "reason": wind_reason
        },
        "rain_risk": {
            "score": rain_score,
            "level": rain_level,
            "reason": rain_reason
        },
        "snow_risk": {
            "score": snow_score,
            "level": snow_level,
            "reason": snow_reason
        }
    }
