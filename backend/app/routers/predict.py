from datetime import datetime, timezone
import json
from typing import List, Optional
import uuid
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.config import (
    DATA_DIR,
    LOW_CONFIDENCE_THRESHOLD,
    MAX_UPLOAD_BYTES,
    SUPPORTED_CROP_MODES,
    SUPPORTED_LANGUAGES,
    UPLOAD_DIR,
)
from app.models.schemas import PredictionResponse, ScanHistoryEntry
from app.services.image_quality_service import InvalidImageError, image_quality_service
from app.services.ml_service import ml_service
from app.services.recommendation_service import recommendation_service
from app.services.rootcause_service import rootcause_service
from app.services.translation_service import translation_service

router = APIRouter(prefix="/api", tags=["Smart Leaf Scanner"])
HISTORY_FILE = DATA_DIR / "scan_history.json"


def _append_history(entry: ScanHistoryEntry) -> None:
    items = []
    if HISTORY_FILE.exists():
        try:
            items = json.loads(HISTORY_FILE.read_text(encoding="utf-8"))
        except Exception:
            items = []
    items.insert(0, entry.model_dump())
    HISTORY_FILE.write_text(json.dumps(items[:50], indent=2), encoding="utf-8")


@router.post("/predict", response_model=PredictionResponse)
async def predict_crop_disease(
    image: Optional[UploadFile] = File(None),
    images: Optional[List[UploadFile]] = File(None),
    language: str = Form("en"),
    crop_mode: str = Form("paddy"),
    crop_name: str = Form("Paddy (Rice)"),
    growth_stage: str = Form("Vegetative / Tillering"),
    humidity_percent: int = Form(78),
):
    if language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported language '{language}'. Choose from {list(SUPPORTED_LANGUAGES)}.",
        )
    if crop_mode not in SUPPORTED_CROP_MODES:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported crop_mode '{crop_mode}'. Choose from {list(SUPPORTED_CROP_MODES)}.",
        )

    uploads: List[UploadFile] = []
    if images:
        uploads.extend(images[:3])
    elif image is not None:
        uploads.append(image)

    if not uploads:
        raise HTTPException(status_code=400, detail="At least one leaf image is required.")

    evaluated = []
    for up in uploads:
        if not up.content_type or not up.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="All uploaded files must be images.")
        raw = await up.read()
        if not raw:
            raise HTTPException(status_code=400, detail="Uploaded image is empty.")
        if len(raw) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="Image exceeds 10 MB limit.")
        try:
            q = image_quality_service.assess(raw)
        except InvalidImageError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        evaluated.append((up.filename or "leaf.jpg", raw, q))

    humidity_percent = max(0, min(100, humidity_percent))

    # Multi-frame SmartScan: pick the highest-quality frame
    best_name, image_bytes, quality = max(evaluated, key=lambda x: x[2].quality_score)
    frame_scores = [x[2].quality_score for x in evaluated]

    scan_id = str(uuid.uuid4())[:8]
    safe_name = f"{scan_id}_{best_name.replace('/', '_')}"
    (UPLOAD_DIR / safe_name).write_bytes(image_bytes)

    heatmap_data_url = image_quality_service.generate_lesion_heatmap_b64(image_bytes)

    raw_label, confidence, model_mode = ml_service.predict_disease(
        image_bytes, crop_mode=crop_mode, crop_name=crop_name
    )
    guidance = recommendation_service.get_guidance(raw_label)
    if guidance is None:
        raise HTTPException(status_code=404, detail="Disease guidance not found.")

    low_confidence = (
        confidence < LOW_CONFIDENCE_THRESHOLD
        or not quality.is_usable
        or not quality.is_leaf_likely
    )
    localized_guidance, speech_summary = translation_service.localize(
        guidance, language, confidence, low_confidence=low_confidence
    )

    investigation = rootcause_service.investigate(
        guidance=localized_guidance,
        confidence=confidence,
        image_quality=quality,
        crop=crop_name,
        growth_stage=growth_stage,
        humidity_percent=humidity_percent,
        language=language,
    )

    _append_history(
        ScanHistoryEntry(
            scan_id=scan_id,
            timestamp=datetime.now(timezone.utc).isoformat(),
            filename=best_name,
            crop_mode=crop_mode,
            disease_id=localized_guidance.disease_id,
            disease_name=localized_guidance.name,
            confidence=confidence,
            severity=localized_guidance.severity,
            language=language,
            quality_score=quality.quality_score,
        )
    )

    return PredictionResponse(
        scan_id=scan_id,
        disease_id=localized_guidance.disease_id,
        disease_name=localized_guidance.name,
        crop_mode=crop_mode,
        confidence=confidence,
        low_confidence=low_confidence,
        severity=localized_guidance.severity,
        language=language,
        image_quality=quality,
        heatmap_data_url=heatmap_data_url,
        frames_evaluated=len(evaluated),
        frame_scores=frame_scores,
        guidance=localized_guidance,
        investigation=investigation,
        speech_summary=speech_summary,
        model_mode=model_mode,
    )
