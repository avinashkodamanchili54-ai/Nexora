from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None


class APIErrorResponse(BaseModel):
    error: ErrorDetail


class LatLonPoint(BaseModel):
    lat: float
    lon: float


class FarmerRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=8, max_length=15)
    preferred_language: str = "te"
    location: str = "Guntur, Andhra Pradesh"
    crop: str = "Paddy (Rice)"
    variety: str = "BPT 5204 (Samba Mahsuri)"
    acreage: float = Field(2.5, ge=0.1, le=10000.0)
    sowing_date: str = "2026-10-15"
    center_lat: float = 16.3067
    center_lon: float = 80.4365
    boundary_coords: List[LatLonPoint] = Field(default_factory=list)


class FarmerProfile(FarmerRegisterRequest):
    farmer_id: str
    days_after_sowing: int
    growth_stage: str


class ImageQualityReport(BaseModel):
    quality_score: int = Field(..., ge=0, le=100)
    is_blurry: bool
    is_dark: bool
    is_usable: bool
    is_leaf_likely: bool = True
    foliage_ratio: float = 1.0
    warnings: List[str]
    resolution: str


class DiseaseGuidance(BaseModel):
    disease_id: str
    name: str
    crop: str = "Paddy (Rice)"
    severity: str
    symptoms: List[str]
    causes: List[str]
    treatments: List[str]
    preventions: List[str]
    organic_controls: List[str] = Field(default_factory=list)
    do_not_do: List[str] = Field(default_factory=list)


class RegionalResource(BaseModel):
    region: str
    helpline_name: str
    helpline_number: str
    local_center: str
    university_portal: str
    safety_note: str


class FollowUpQuestion(BaseModel):
    question_id: str
    question: str
    options: List[str]


class RootCauseHypothesis(BaseModel):
    cause_id: str
    title: str
    category: str
    likelihood: float = Field(..., ge=0.0, le=1.0)
    supporting_evidence: List[str]
    conflicting_evidence: List[str]
    explanation: str


class RootCauseInvestigation(BaseModel):
    investigation_id: str
    primary_cause: str
    uncertainty_level: str
    needs_expert_verification: bool
    missing_information: List[str]
    hypotheses: List[RootCauseHypothesis]
    follow_up_questions: List[FollowUpQuestion]
    action_plan: List[str]
    next_inspection: str
    llm_explanation: Optional[str] = None


class PredictionResponse(BaseModel):
    scan_id: str
    disease_id: str
    disease_name: str
    crop_mode: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    low_confidence: bool = False
    severity: str
    language: str
    image_quality: ImageQualityReport
    heatmap_data_url: Optional[str] = None
    frames_evaluated: int = 1
    frame_scores: List[int] = Field(default_factory=list)
    guidance: DiseaseGuidance
    investigation: RootCauseInvestigation
    speech_summary: str
    model_mode: str
    top_candidates: List[dict] = Field(default_factory=list)


class InvestigationRefineRequest(BaseModel):
    scan_id: str
    disease_id: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    crop: str = "Paddy (Rice)"
    growth_stage: str = "Vegetative"
    humidity_percent: int = Field(75, ge=0, le=100)
    language: str = "en"
    answers: Dict[str, str] = Field(default_factory=dict)


class ScanHistoryEntry(BaseModel):
    scan_id: str
    timestamp: str
    filename: str
    crop_mode: str
    disease_id: str
    disease_name: str
    confidence: float
    severity: str
    language: str
    quality_score: int = 100
    expert_status: str = "Pending Review"
    follow_up_note: Optional[str] = None


class ExpertVerifyRequest(BaseModel):
    expert_status: str = "Verified by KVK"
    follow_up_note: Optional[str] = None


class ThreatRiskItem(BaseModel):
    threat: str
    risk_level: str
    probability_percent: int
    trigger_reason: str
    preventive_tip: str


class SprayWindowDay(BaseModel):
    date: str
    max_temp_c: float
    rain_mm: float
    wind_kmh: float
    status: str  # Safe | Caution | Avoid
    reason: str


class WeatherAlert(BaseModel):
    location: str
    lat: float
    lon: float
    source: str
    risk_level: str
    humidity_percent: int
    temperature_c: float
    precipitation_mm: float
    wind_kmh: float
    advisory: str
    recommended_action: str
    inspection_reminder: str
    threat_radar: List[ThreatRiskItem] = Field(default_factory=list)
    spray_windows: List[SprayWindowDay] = Field(default_factory=list)


class OutbreakSignalRequest(BaseModel):
    location: str
    crop: str
    symptom_summary: str
    severity: str = "Moderate"


class OutbreakSignal(OutbreakSignalRequest):
    signal_id: str
    reported_at: str


class AssistantChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    language: str = "en"
    farmer_name: Optional[str] = None
    crop: str = "Paddy (Rice)"
    growth_stage: str = "Vegetative"
    location: str = "Guntur"
    latest_diagnosis: Optional[str] = None


class AssistantChatResponse(BaseModel):
    reply: str
    language: str
    provider: str = "local-fallback"
    suggested_questions: List[str]


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    language: str = "en"


class VoiceSTTResponse(BaseModel):
    transcript: str
    language: str


class ModelInfo(BaseModel):
    key: str
    loaded: bool
    classes_count: int
    accuracy: Optional[float] = None
    macro_f1: Optional[float] = None


class ModelStatusResponse(BaseModel):
    models: List[ModelInfo]
