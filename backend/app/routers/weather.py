from datetime import datetime, timezone
import json
from typing import List, Optional
import uuid
from fastapi import APIRouter, Query

from app.config import DATA_DIR
from app.models.schemas import OutbreakSignal, OutbreakSignalRequest, WeatherAlert
from app.services.weather_service import weather_service

router = APIRouter(prefix="/api/weather", tags=["Weather & Risk Radar"])
OUTBREAKS_FILE = DATA_DIR / "outbreaks.json"


def _load_outbreaks() -> list:
    if not OUTBREAKS_FILE.exists():
        return [
            {
                "signal_id": "demo-01",
                "location": "Tenali, Guntur",
                "crop": "Paddy (Rice)",
                "symptom_summary": "Yellowing leaf margins reported in 3 nearby plots",
                "severity": "High",
                "reported_at": datetime.now(timezone.utc).isoformat(),
            }
        ]
    return json.loads(OUTBREAKS_FILE.read_text(encoding="utf-8"))


@router.get("/alerts", response_model=WeatherAlert)
def get_weather_alerts(
    location: str = Query("Guntur, Andhra Pradesh"),
    lat: Optional[float] = Query(None, ge=-90.0, le=90.0),
    lon: Optional[float] = Query(None, ge=-180.0, le=180.0),
    crop: str = Query("Paddy (Rice)"),
    growth_stage: str = Query("Vegetative / Tillering"),
):
    return weather_service.get_alert(
        location=location, lat=lat, lon=lon, crop=crop, growth_stage=growth_stage
    )


@router.get("/forecasting")
def get_weather_and_climate_forecasting(
    location: str = Query("Guntur, Andhra Pradesh"),
    lat: Optional[float] = Query(None, ge=-90.0, le=90.0),
    lon: Optional[float] = Query(None, ge=-180.0, le=180.0),
    crop: str = Query("Paddy (Rice)"),
    growth_stage: str = Query("Vegetative / Tillering"),
):
    return weather_service.get_forecasting(
        location=location, lat=lat, lon=lon, crop=crop, growth_stage=growth_stage
    )


@router.get("/outbreaks", response_model=List[OutbreakSignal])
def list_outbreaks():
    return [OutbreakSignal(**o) for o in _load_outbreaks()]


@router.post("/outbreaks", response_model=OutbreakSignal)
def report_outbreak(payload: OutbreakSignalRequest):
    items = _load_outbreaks()
    signal = OutbreakSignal(
        signal_id=str(uuid.uuid4())[:8],
        reported_at=datetime.now(timezone.utc).isoformat(),
        **payload.model_dump(),
    )
    items.insert(0, signal.model_dump())
    OUTBREAKS_FILE.write_text(json.dumps(items[:25], indent=2), encoding="utf-8")
    return signal
