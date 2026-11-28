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

    top_raw = ml_service.predict_disease_top_k(
        image_bytes, crop_mode=crop_mode, crop_name=crop_name, top_k=3
    )
    top_candidates = []
    for raw_c, conf_c in top_raw:
        g_c = recommendation_service.get_guidance(raw_c)
        if g_c:
            top_candidates.append({
                "disease_id": g_c.disease_id,
                "disease_name": g_c.name,
                "confidence": round(conf_c, 4),
                "severity": g_c.severity,
                "summary": g_c.symptoms[0] if g_c.symptoms else g_c.name,
            })

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
        top_candidates=top_candidates,
    )


@router.post("/predict/diagnose-step")
def diagnose_step(payload: dict):
    """Interactive LLM Q&A to distinguish top-3 crop diseases and save final decision to Supabase."""
    import psycopg2
    from app.config import SUPABASE_DB_URL

    username = (payload.get("username") or "Farmer").strip()
    crop_name = (payload.get("crop_name") or "Paddy (Rice)").strip()
    candidates = payload.get("top_candidates") or []
    qa_history = payload.get("qa_history") or []

    if not candidates:
        raise HTTPException(status_code=400, detail="top_candidates is required.")

    names = [c.get("disease_name", "Unknown") for c in candidates[:3]]

    # Turn 0 or Turn 1: ask a distinguishing question
    if len(qa_history) == 0:
        q = (
            f"Looking at the top possibilities for {crop_name} ({', '.join(names)}): "
            f"What do the spots look like up close?"
        )
        opts = [
            "Raised orange/rusty powdery pustules on leaf surface",
            "Long gray-green or brown cigar-shaped/water-soaked lesions",
            "Small circular spots with yellow halo or dark rings",
            "Not sure / mixed symptoms",
        ]
        return {"done": False, "question": q, "options": opts}

    if len(qa_history) == 1:
        q = "Where on the plant did these symptoms appear first, and how is the leaf texture?"
        opts = [
            "Lower/older leaves first; powdery or dusty when touched",
            "Upper/younger leaves; wet, sticky, or spreading rapidly",
            "Evenly scattered across leaf; dry/papery edges",
            "Not sure",
        ]
        return {"done": False, "question": q, "options": opts}

    # Turn >= 2: Decide final disease based on answers + candidates
    joined_ans = " ".join(str(item.get("answer", "")).lower() for item in qa_history)
    chosen = candidates[0]
    for c in candidates:
        cname = c.get("disease_name", "").lower()
        if ("rust" in joined_ans or "powdery" in joined_ans or "orange" in joined_ans) and "rust" in cname:
            chosen = c
            break
        if ("cigar" in joined_ans or "water-soaked" in joined_ans or "blight" in joined_ans) and "blight" in cname:
            chosen = c
            break
        if ("spot" in joined_ans or "halo" in joined_ans or "ring" in joined_ans) and ("spot" in cname or "blast" in cname):
            chosen = c
            break

    explanation = (
        f"Based on your visual observations and the {crop_name} model candidates, "
        f"the decisive diagnosis is **{chosen.get('disease_name')}**."
    )

    saved = False
    try:
        conn = psycopg2.connect(SUPABASE_DB_URL)
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO public.disease_reports
                (username, crop_name, disease_id, disease_name, confidence, top_candidates, qa_transcript)
            VALUES (%s, %s, %s, %s, %s, %s::jsonb, %s::jsonb)
            """,
            (
                username,
                crop_name,
                chosen.get("disease_id", "unknown"),
                chosen.get("disease_name", "Unknown"),
                float(chosen.get("confidence", 0.0)),
                json.dumps(candidates),
                json.dumps(qa_history),
            ),
        )
        conn.commit()
        cur.close()
        conn.close()
        saved = True
    except Exception as exc:
        print(f"[diagnose_step] DB save warning: {exc}")

    return {
        "done": True,
        "decided_disease": chosen,
        "explanation": explanation,
        "saved_to_db": saved,
    }


@router.get("/predict/reports")
def list_disease_reports(limit: int = 10):
    """Return recent confirmed disease reports from Supabase for Risk Radar."""
    import psycopg2
    from psycopg2.extras import RealDictCursor
    from app.config import SUPABASE_DB_URL

    try:
        conn = psycopg2.connect(SUPABASE_DB_URL)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            SELECT id, username, crop_name, disease_id, disease_name, confidence, created_at
            FROM public.disease_reports
            ORDER BY created_at DESC
            LIMIT %s
            """,
            (limit,),
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        for r in rows:
            if r.get("created_at"):
                r["created_at"] = r["created_at"].isoformat()
        return {"reports": rows}
    except Exception as exc:
        return {"reports": [], "error": str(exc)}
