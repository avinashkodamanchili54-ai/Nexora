from datetime import date, datetime
import json
import uuid
from typing import List
from fastapi import APIRouter, HTTPException

from app.config import DATA_DIR
from app.models.schemas import FarmerProfile, FarmerRegisterRequest

router = APIRouter(prefix="/api/farmers", tags=["Farmers"])
FARMERS_FILE = DATA_DIR / "farmers.json"


def _compute_growth_stage(sowing_date_str: str) -> tuple[int, str]:
    try:
        sown = datetime.strptime(sowing_date_str, "%Y-%m-%d").date()
        days = max(0, (date.today() - sown).days)
    except Exception:
        days = 30

    if days <= 20:
        stage = "Seedling / Nursery"
    elif days <= 55:
        stage = "Vegetative / Tillering"
    elif days <= 85:
        stage = "Reproductive / Flowering"
    else:
        stage = "Ripening / Maturity"
    return days, stage


def _load_farmers() -> dict:
    if not FARMERS_FILE.exists():
        return {}
    return json.loads(FARMERS_FILE.read_text(encoding="utf-8"))


def _save_farmers(data: dict) -> None:
    FARMERS_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")


@router.post("/register", response_model=FarmerProfile)
def register_farmer(payload: FarmerRegisterRequest):
    farmers = _load_farmers()
    farmer_id = str(uuid.uuid4())[:8]
    days, stage = _compute_growth_stage(payload.sowing_date)
    profile = FarmerProfile(
        farmer_id=farmer_id,
        days_after_sowing=days,
        growth_stage=stage,
        **payload.model_dump(),
    )
    farmers[farmer_id] = profile.model_dump()
    _save_farmers(farmers)
    return profile


@router.get("", response_model=List[FarmerProfile])
def list_farmers():
    farmers = _load_farmers()
    return [FarmerProfile(**item) for item in farmers.values()]


@router.get("/{farmer_id}", response_model=FarmerProfile)
def get_farmer(farmer_id: str):
    farmers = _load_farmers()
    record = farmers.get(farmer_id)
    if not record:
        raise HTTPException(status_code=404, detail="Farmer not found.")
    return FarmerProfile(**record)
