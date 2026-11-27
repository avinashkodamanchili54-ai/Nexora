import json
from typing import List
from fastapi import APIRouter, HTTPException

from app.config import DATA_DIR
from app.models.schemas import ExpertVerifyRequest, ScanHistoryEntry

router = APIRouter(prefix="/api/history", tags=["Crop Health History"])
HISTORY_FILE = DATA_DIR / "scan_history.json"


def _read_history() -> list:
    if not HISTORY_FILE.exists():
        return []
    try:
        return json.loads(HISTORY_FILE.read_text(encoding="utf-8"))
    except Exception:
        return []


@router.get("", response_model=List[ScanHistoryEntry])
def get_scan_history():
    return [ScanHistoryEntry(**item) for item in _read_history()]


@router.patch("/{scan_id}/verify", response_model=ScanHistoryEntry)
def verify_scan_entry(scan_id: str, payload: ExpertVerifyRequest):
    items = _read_history()
    for item in items:
        if item.get("scan_id") == scan_id:
            item["expert_status"] = payload.expert_status
            if payload.follow_up_note is not None:
                item["follow_up_note"] = payload.follow_up_note
            HISTORY_FILE.write_text(json.dumps(items, indent=2), encoding="utf-8")
            return ScanHistoryEntry(**item)
    raise HTTPException(status_code=404, detail="Scan entry not found.")


@router.delete("")
def clear_scan_history():
    if HISTORY_FILE.exists():
        HISTORY_FILE.unlink()
    return {"cleared": True}
