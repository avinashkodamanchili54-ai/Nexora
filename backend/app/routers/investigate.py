from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    ImageQualityReport,
    InvestigationRefineRequest,
    RootCauseInvestigation,
)
from app.services.recommendation_service import recommendation_service
from app.services.rootcause_service import rootcause_service
from app.services.translation_service import translation_service

router = APIRouter(prefix="/api/investigate", tags=["RootCause Investigation"])


@router.post("/refine", response_model=RootCauseInvestigation)
def refine_root_cause(payload: InvestigationRefineRequest):
    guidance = recommendation_service.get_guidance(payload.disease_id)
    if guidance is None:
        raise HTTPException(status_code=404, detail="Disease guidance not found.")

    localized_guidance, _ = translation_service.localize(
        guidance, payload.language, payload.confidence
    )
    dummy_quality = ImageQualityReport(
        quality_score=85,
        is_blurry=False,
        is_dark=False,
        is_usable=True,
        warnings=[],
        resolution="224x224",
    )
    return rootcause_service.investigate(
        guidance=localized_guidance,
        confidence=payload.confidence,
        image_quality=dummy_quality,
        crop=payload.crop,
        growth_stage=payload.growth_stage,
        humidity_percent=payload.humidity_percent,
        language=payload.language,
        answers=payload.answers,
    )
