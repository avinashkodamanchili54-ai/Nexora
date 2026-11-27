from typing import List
from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import DiseaseGuidance, RegionalResource
from app.services.recommendation_service import recommendation_service

router = APIRouter(prefix="/api/diseases", tags=["Diseases & Regional Resources"])


@router.get("", response_model=List[DiseaseGuidance])
def list_diseases():
    return recommendation_service.list_diseases()


@router.get("/resources/regional", response_model=RegionalResource)
def get_regional_resources(location: str = Query("Guntur, Andhra Pradesh")):
    return recommendation_service.get_regional_resource(location)


@router.get("/{disease_id}", response_model=DiseaseGuidance)
def get_disease(disease_id: str):
    guidance = recommendation_service.get_guidance(disease_id)
    if not guidance:
        raise HTTPException(status_code=404, detail="Disease not found.")
    return guidance
