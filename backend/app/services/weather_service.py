from datetime import date, timedelta
import json
from typing import List, Optional, Tuple
import urllib.parse
import urllib.request

from app.models.schemas import SprayWindowDay, ThreatRiskItem, WeatherAlert


class WeatherService:
    """Live Open-Meteo weather integration + Threat Risk Radar + 5-day Spray Window."""

    def _fetch_json(self, url: str, timeout: float = 3.5) -> Optional[dict]:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "KrishiSakhiAI/1.0"})
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception:
            return None

    def _geocode(self, location: str) -> Tuple[float, float, str]:
        q = urllib.parse.quote(location.split(",")[0].strip() or "Guntur")
        data = self._fetch_json(
            f"https://geocoding-api.open-meteo.com/v1/search?name={q}&count=1&language=en&format=json"
        )
        if data and data.get("results"):
            hit = data["results"][0]
            label = f"{hit.get('name', location)}, {hit.get('admin1', '')}".strip(", ")
            return float(hit["latitude"]), float(hit["longitude"]), label
        return 16.3067, 80.4365, location

    def _build_threat_radar(
        self, humidity: int, temp: float, precip: float, crop: str, growth_stage: str
    ) -> list[ThreatRiskItem]:
        threats = []
        blast_prob = min(95, max(20, int(humidity * 0.75 + (10 if 20 <= temp <= 30 else 0) + precip * 4)))
        blight_prob = min(92, max(15, int(humidity * 0.65 + (15 if temp >= 28 else 5) + precip * 5)))
        nutrient_prob = 45 if "vegetative" in growth_stage.lower() or "tillering" in growth_stage.lower() else 28

        threats.append(
            ThreatRiskItem(
                threat=f"{crop} Blast (Fungal)" if "paddy" in crop.lower() or "rice" in crop.lower() else f"{crop} Fungal Blight",
                risk_level="High" if blast_prob >= 70 else "Moderate" if blast_prob >= 45 else "Low",
                probability_percent=blast_prob,
                trigger_reason=f"Humidity at {humidity}% and temp {temp}°C favor spore germination.",
                preventive_tip="Inspect lower/middle leaves early morning; avoid excess urea top-dressing.",
            )
        )
        threats.append(
            ThreatRiskItem(
                threat="Bacterial Leaf Blight" if "paddy" in crop.lower() or "rice" in crop.lower() else "Bacterial Spot / Rot",
                risk_level="High" if blight_prob >= 70 else "Moderate" if blight_prob >= 45 else "Low",
                probability_percent=blight_prob,
                trigger_reason="Warm moisture and leaf-to-leaf splash accelerate bacterial spread.",
                preventive_tip="Drain excess stagnant field water and avoid working in wet foliage.",
            )
        )
        threats.append(
            ThreatRiskItem(
                threat="Nitrogen / Potassium Stress",
                risk_level="Moderate" if nutrient_prob >= 40 else "Low",
                probability_percent=nutrient_prob,
                trigger_reason=f"Active {growth_stage} stage requires balanced NPK uptake.",
                preventive_tip="Compare older vs younger leaf yellowing before spraying chemicals.",
            )
        )
        return threats

    def _build_spray_windows(self, forecast: Optional[dict]) -> List[SprayWindowDay]:
        windows: List[SprayWindowDay] = []
        daily = (forecast or {}).get("daily", {})
        dates = daily.get("time", [])
        temps = daily.get("temperature_2m_max", [])
        rains = daily.get("precipitation_sum", [])
        winds = daily.get("wind_speed_10m_max", [])

        if dates:
            for i in range(min(5, len(dates))):
                rain = float(rains[i]) if i < len(rains) else 0.0
                wind = float(winds[i]) if i < len(winds) else 8.0
                tmax = float(temps[i]) if i < len(temps) else 30.0
                if rain >= 2.0 or wind >= 20.0:
                    status = "Avoid"
                    reason = "Rain wash-off or high wind drift risk"
                elif rain >= 0.5 or wind >= 14.0:
                    status = "Caution"
                    reason = "Spray early morning (6-9 AM) only"
                else:
                    status = "Safe"
                    reason = "Dry & calm—ideal early morning spray window"
                windows.append(
                    SprayWindowDay(
                        date=dates[i],
                        max_temp_c=round(tmax, 1),
                        rain_mm=round(rain, 1),
                        wind_kmh=round(wind, 1),
                        status=status,
                        reason=reason,
                    )
                )
            return windows

        for i in range(5):
            d = (date.today() + timedelta(days=i)).isoformat()
            rain = 3.2 if i == 1 else 0.0
            status = "Avoid" if rain >= 2.0 else "Safe"
            reason = "Expected rain wash-off" if rain >= 2.0 else "Calm morning window (6-9 AM)"
            windows.append(
                SprayWindowDay(
                    date=d, max_temp_c=30.0, rain_mm=rain, wind_kmh=9.5, status=status, reason=reason
                )
            )
        return windows

    def get_alert(
        self,
        location: str = "Guntur, Andhra Pradesh",
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        crop: str = "Paddy (Rice)",
        growth_stage: str = "Vegetative / Tillering",
    ) -> WeatherAlert:
        resolved_label = location
        if lat is None or lon is None:
            lat, lon, resolved_label = self._geocode(location)

        url = (
            f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}"
            "&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m"
            "&daily=temperature_2m_max,precipitation_sum,wind_speed_10m_max&forecast_days=5&timezone=auto"
        )
        forecast = self._fetch_json(url)

        if forecast and "current" in forecast:
            cur = forecast["current"]
            temp = float(cur.get("temperature_2m", 28.0))
            humidity = int(round(cur.get("relative_humidity_2m", 72)))
            precip = float(cur.get("precipitation", 0.0))
            wind = float(cur.get("wind_speed_10m", 8.0))
            source = "Open-Meteo Live API"
        else:
            coastal = any(k in location.lower() for k in ("guntur", "krishna", "godavari", "andhra", "coastal"))
            temp = 29.5 if coastal else 27.0
            humidity = 82 if coastal else 66
            precip = 2.4 if coastal else 0.0
            wind = 11.2 if coastal else 7.5
            source = "Local Climatology Fallback"

        risk_level = "High" if humidity >= 78 or precip >= 2.0 else "Moderate" if humidity >= 60 else "Low"
        advisory = (
            f"{risk_level} fungal & bacterial pressure in {resolved_label} ({humidity}% RH, {temp}°C) during {growth_stage}."
        )
        recommended_action = (
            "Scout 10–15 random plants across the field today and scan any spotted leaves."
            if risk_level == "High"
            else "Continue twice-weekly visual field checks and maintain balanced irrigation."
        )
        inspection_reminder = (
            "Next Field Check: Tomorrow morning (6:30–8:30 AM)"
            if risk_level == "High"
            else "Next Field Check: In 3 days"
        )

        radar = self._build_threat_radar(humidity, temp, precip, crop, growth_stage)
        spray_windows = self._build_spray_windows(forecast)

        return WeatherAlert(
            location=resolved_label,
            lat=round(lat, 4),
            lon=round(lon, 4),
            source=source,
            risk_level=risk_level,
            humidity_percent=humidity,
            temperature_c=temp,
            precipitation_mm=precip,
            wind_kmh=wind,
            advisory=advisory,
            recommended_action=recommended_action,
            inspection_reminder=inspection_reminder,
            threat_radar=radar,
            spray_windows=spray_windows,
        )


weather_service = WeatherService()
