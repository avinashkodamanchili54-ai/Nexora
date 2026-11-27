from fastapi import APIRouter

from app.models.schemas import ModelStatusResponse
from app.services.ml_service import ml_service

router = APIRouter(prefix="/api/models", tags=["Models"])


@router.get("/status", response_model=ModelStatusResponse)
def get_models_status():
    return ModelStatusResponse(models=ml_service.get_status())
