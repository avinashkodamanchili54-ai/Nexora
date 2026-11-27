"""
Alerts router: GET /api/alerts
Merges weather severity + disease risk → ranked alerts for the farmer.
"""
from fastapi import APIRouter
from typing import Optional
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

SEVERITY_ORDER = {"critical": 0, "high": 1, "moderate": 2, "info": 3}


def _weather_alerts(weather: Optional[dict]) -> list:
    alerts = []
    if not weather:
        return alerts

    rain = weather.get("rainfall_mm", 0) or 0
    hum = weather.get("humidity_percent", 0) or 0
    temp = weather.get("temperature_c", 25) or 25
    wind = weather.get("wind_kmh", 0) or 0

    if rain > 50:
        alerts.append({
            "id": "weather-heavy-rain",
            "type": "weather",
            "severity": "critical",
            "icon": "🌧️",
            "title": "Heavy Rainfall Alert",
            "body": f"Rainfall of {rain:.0f} mm expected. Drain fields immediately to prevent waterlogging and bacterial blight spread.",
            "action": "Open Risk Radar",
            "action_tab": "radar",
        })
    elif rain > 20:
        alerts.append({
            "id": "weather-moderate-rain",
            "type": "weather",
            "severity": "moderate",
            "icon": "🌦️",
            "title": "Moderate Rain Expected",
            "body": f"{rain:.0f} mm rain expected. Avoid fungicide/pesticide spraying for next 24 h.",
            "action_tab": "radar",
        })

    if hum > 85:
        alerts.append({
            "id": "weather-high-humidity",
            "type": "disease_risk",
            "severity": "high",
            "icon": "💧",
            "title": "High Humidity — Fungal Risk",
            "body": f"Humidity at {hum:.0f}%. Conditions favour blast, brown spot, and downy mildew. Scout crops now.",
            "action": "Scan Crop",
            "action_tab": "scanner",
        })

    if temp > 38:
        alerts.append({
            "id": "weather-heat-stress",
            "type": "weather",
            "severity": "moderate",
            "icon": "🌡️",
            "title": "Heat Stress Warning",
            "body": f"Temperature {temp:.0f}°C. Irrigate early morning or evening to reduce crop stress.",
            "action_tab": "radar",
        })

    if wind > 50:
        alerts.append({
            "id": "weather-high-wind",
            "type": "weather",
            "severity": "high",
            "icon": "💨",
            "title": "Strong Winds",
            "body": f"Wind speed {wind:.0f} km/h. Delay all spray operations. Secure nursery/greenhouse structures.",
        })

    return alerts


def _advisory_alerts(crop: str, growth_stage: str) -> list:
    alerts = []

    stage_lower = (growth_stage or "").lower()
    if "flower" in stage_lower or "panicle" in stage_lower:
        alerts.append({
            "id": "advisory-spray-window",
            "type": "advisory",
            "severity": "info",
            "icon": "🌾",
            "title": "Optimal Spray Window",
            "body": f"Your {crop} is at {growth_stage}. Early morning (6–8 AM) is the best spray window for maximum uptake.",
        })

    if "tillering" in stage_lower:
        alerts.append({
            "id": "advisory-nitrogen",
            "type": "advisory",
            "severity": "info",
            "icon": "🌱",
            "title": "Nitrogen Top-Dressing Reminder",
            "body": "Tillering stage: apply second nitrogen dose (urea) if not done. Split application improves tiller count.",
        })

    return alerts


@router.get("")
def get_alerts(
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    crop: str = "Paddy (Rice)",
    growth_stage: str = "Vegetative",
    location: Optional[str] = None,
):
    """Return ranked alerts list for a farmer's field context."""
    # Attempt to fetch live weather for location
    weather_data = None
    try:
        from app.services.weather_service import weather_service  # type: ignore
        import asyncio
        if lat and lon:
            weather_data = asyncio.run(
                weather_service.get_weather_alert(
                    location=location or "", lat=lat, lon=lon, crop=crop, growth_stage=growth_stage
                )
            )
    except Exception:
        pass

    alerts = []
    alerts.extend(_weather_alerts(weather_data))
    alerts.extend(_advisory_alerts(crop, growth_stage))

    # Sort by severity
    alerts.sort(key=lambda a: SEVERITY_ORDER.get(a.get("severity", "info"), 99))

    # Add timestamps + unique IDs
    now = datetime.now(timezone.utc).isoformat()
    for a in alerts:
        a.setdefault("timestamp", now)
        a.setdefault("read", False)

    return {"alerts": alerts, "count": len(alerts)}
