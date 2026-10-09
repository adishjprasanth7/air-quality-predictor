"""
Data Preprocessing module for Air Quality Predictor.
Ensures identical transformations between model training and real-time inference.
"""

from typing import Dict, Any, Tuple

# The primary criteria air pollutants used as standard ML features
FEATURE_COLUMNS = [
    "PM2.5",
    "PM10",
    "NO2",
    "CO",
    "SO2",
    "O3"
]

TARGET_COLUMN = "AQI"

# National Air Quality Index (NAQI) Standard Categories & Health Recommendations
AQI_CATEGORIES = [
    {
        "min": 0,
        "max": 50,
        "category": "Good",
        "color": "#10b981", # Emerald
        "level": "Low Risk",
        "advisory": "Air quality is considered satisfactory, and air pollution poses little or no risk.",
        "precautions": "Enjoy outdoor activities. Ideal conditions for all individuals."
    },
    {
        "min": 51,
        "max": 100,
        "category": "Satisfactory",
        "color": "#84cc16", # Lime
        "level": "Minor Risk",
        "advisory": "Air quality is acceptable. A minor breathing discomfort may be experienced by unusually sensitive people.",
        "precautions": "Sensitive individuals should consider reducing prolonged or heavy outdoor exertion."
    },
    {
        "min": 101,
        "max": 200,
        "category": "Moderate",
        "color": "#f59e0b", # Amber
        "level": "Moderate Risk",
        "advisory": "Breathing discomfort to people with lung disease, asthma, and heart conditions.",
        "precautions": "Children and older adults should limit prolonged outdoor exertion. Sensitive groups should wear masks."
    },
    {
        "min": 201,
        "max": 300,
        "category": "Poor",
        "color": "#f97316", # Orange
        "level": "High Risk",
        "advisory": "Breathing discomfort to most people on prolonged exposure. Significant distress for sensitive groups.",
        "precautions": "Avoid prolonged outdoor exertion. Wear N95 masks outdoors and use air purifiers indoors."
    },
    {
        "min": 301,
        "max": 400,
        "category": "Very Poor",
        "color": "#ef4444", # Red
        "level": "Very High Risk",
        "advisory": "Respiratory illness to the people on prolonged exposure. Pronounced effect on people with existing conditions.",
        "precautions": "Keep windows closed. Avoid all outdoor physical activity. Keep indoor air filtered."
    },
    {
        "min": 401,
        "max": float("inf"),
        "category": "Severe",
        "color": "#881337", # Dark Burgundy / Maroon
        "level": "Emergency / Hazardous",
        "advisory": "Healthy people will experience serious health impacts, and severe consequences for those with respiratory or cardiovascular diseases.",
        "precautions": "Stay indoors with air purifiers active. Emergency advisory: avoid any physical exposure outside."
    }
]

def get_aqi_classification(aqi_value: float) -> Dict[str, Any]:
    """
    Returns NAQI category, color, risk level, advisory, and precautions for a given AQI score.
    """
    score = max(0.0, float(aqi_value))
    for item in AQI_CATEGORIES:
        if item["min"] <= score <= item["max"]:
            return {
                "aqi": round(score, 1),
                "category": item["category"],
                "color": item["color"],
                "risk_level": item["level"],
                "health_advisory": item["advisory"],
                "precautions": item["precautions"]
            }
            
    # Fallback to severe if exceeds range
    severe = AQI_CATEGORIES[-1]
    return {
        "aqi": round(score, 1),
        "category": severe["category"],
        "color": severe["color"],
        "risk_level": severe["level"],
        "health_advisory": severe["advisory"],
        "precautions": severe["precautions"]
    }
