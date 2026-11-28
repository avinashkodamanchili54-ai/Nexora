from fastapi import APIRouter, Depends, HTTPException
from app.services.permapeople_service import PermapeopleService
from pydantic import BaseModel

router = APIRouter(prefix="/permapeople", tags=["Permapeople"])

class CropRequest(BaseModel):
    crop: str

@router.post("/classify", response_model=dict)
async def classify(crop_req: CropRequest):
    try:
        result = await PermapeopleService.classify_plants(crop_req.crop)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
