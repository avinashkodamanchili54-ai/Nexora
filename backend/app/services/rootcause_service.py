import uuid
from typing import Dict, List

from app.models.schemas import (
    DiseaseGuidance,
    FollowUpQuestion,
    ImageQualityReport,
    RootCauseHypothesis,
    RootCauseInvestigation,
)
from app.services.llm_service import llm_service


class RootCauseService:
    """Investigates multi-factor causes (disease, pest, nutrient, environment) with evidence."""

    def investigate(
        self,
        guidance: DiseaseGuidance,
        confidence: float,
        image_quality: ImageQualityReport,
        crop: str = "Paddy (Rice)",
        growth_stage: str = "Vegetative / Tillering",
        humidity_percent: int = 75,
        language: str = "en",
        answers: Dict[str, str] | None = None,
    ) -> RootCauseInvestigation:
        answers = answers or {}
        inv_id = str(uuid.uuid4())[:8]
        is_healthy = guidance.disease_id == "normal" or "healthy" in guidance.disease_id

        disease_score = round(min(0.95, max(0.35, confidence)), 2)
        nutrient_score = 0.25 if not is_healthy else 0.12
        pest_score = 0.22 if not is_healthy else 0.10

        supporting_disease = [
            f"Visual match: {guidance.name} ({int(round(confidence * 100))}% model confidence).",
            f"Crop growth stage ({growth_stage}) is susceptible when leaf moisture persists.",
        ]
        conflicting_disease: List[str] = []

        if humidity_percent >= 75:
            supporting_disease.append(f"High humidity ({humidity_percent}%) strongly favors pathogen spread.")
        else:
            conflicting_disease.append(f"Moderate humidity ({humidity_percent}%) slows rapid epidemic spread.")

        if not image_quality.is_usable:
            conflicting_disease.append(f"Image quality score is low ({image_quality.quality_score}/100).")

        if answers.get("morning_ooze") == "Yes":
            disease_score = min(0.96, round(disease_score + 0.12, 2))
            supporting_disease.append("Farmer observed morning bacterial ooze / fresh lesions.")
        elif answers.get("morning_ooze") == "No":
            disease_score = max(0.30, round(disease_score - 0.10, 2))
            nutrient_score = min(0.85, round(nutrient_score + 0.25, 2))
            conflicting_disease.append("No morning ooze or spreading wet lesions reported.")

        if answers.get("heavy_urea") == "Yes":
            disease_score = min(0.96, round(disease_score + 0.08, 2))
            supporting_disease.append("Recent heavy nitrogen/urea application increases leaf susceptibility.")

        if answers.get("insects_seen") == "Yes":
            pest_score = min(0.88, round(pest_score + 0.35, 2))
        elif answers.get("insects_seen") == "No":
            pest_score = max(0.08, round(pest_score - 0.08, 2))

        hypotheses = [
            RootCauseHypothesis(
                cause_id=guidance.disease_id,
                title=guidance.name,
                category="Healthy" if is_healthy else "Disease",
                likelihood=disease_score,
                supporting_evidence=supporting_disease,
                conflicting_evidence=conflicting_disease or ["None observed from current inputs."],
                explanation=(
                    "Leaf appears healthy under current visual and weather checks."
                    if is_healthy
                    else f"Symptoms and {humidity_percent}% humidity align with {guidance.name}."
                ),
            )
        ]

        if not is_healthy:
            hypotheses.append(
                RootCauseHypothesis(
                    cause_id="nutrient_stress",
                    title="Nitrogen / Potassium Deficiency",
                    category="Nutrient",
                    likelihood=nutrient_score,
                    supporting_evidence=[
                        "Yellowing or brown leaf margins can mimic early fungal/bacterial spots."
                    ],
                    conflicting_evidence=[
                        "Distinct spotted lesions usually point to biotic infection rather than pure nutrient lack."
                    ],
                    explanation="Check whether discoloration is uniform across older leaves vs discrete spots.",
                )
            )
            hypotheses.append(
                RootCauseHypothesis(
                    cause_id="sap_sucking_pest",
                    title="Leafhopper / Stem Borer Secondary Stress",
                    category="Pest",
                    likelihood=pest_score,
                    supporting_evidence=[
                        "Insect feeding wounds let bacteria/fungi enter leaf tissue."
                    ],
                    conflicting_evidence=[
                        "No chewed margins or insect colonies confirmed in photo alone."
                    ],
                    explanation="Inspect leaf undersides and stem base for hoppers or larvae.",
                )
            )

        hypotheses.sort(key=lambda h: h.likelihood, reverse=True)
        top = hypotheses[0]

        missing_info = []
        if "morning_ooze" not in answers:
            missing_info.append("Whether lesions look wet/oozing early in the morning")
        if "heavy_urea" not in answers:
            missing_info.append("Recent fertilizer (urea/potash) dosage in the past 14 days")
        if "insects_seen" not in answers:
            missing_info.append("Presence of hoppers or caterpillars on leaf undersides")

        uncertainty = (
            "High"
            if confidence < 0.60 or not image_quality.is_usable
            else "Moderate"
            if missing_info and confidence < 0.85
            else "Low"
        )
        needs_expert = uncertainty == "High" or (not is_healthy and guidance.severity in {"High", "Critical"})

        questions = [
            FollowUpQuestion(
                question_id="morning_ooze",
                question="Do the spots look wet, water-soaked, or have milky droplets early in the morning?",
                options=["Yes", "No", "Not sure"],
            ),
            FollowUpQuestion(
                question_id="heavy_urea",
                question="Did you apply heavy urea/nitrogen fertilizer within the last 2 weeks?",
                options=["Yes", "No", "Not sure"],
            ),
            FollowUpQuestion(
                question_id="insects_seen",
                question="Do you see small green hoppers, moths, or chewing damage on nearby plants?",
                options=["Yes", "No", "Not sure"],
            ),
        ]

        action_plan = list(guidance.treatments)
        if uncertainty == "High":
            action_plan.insert(
                0,
                "Hold off on chemical spraying until a clearer daylight leaf scan or KVK agricultural officer confirms the cause.",
            )

        next_inspection = (
            "Re-scan the same plot in 48 hours to track whether spots are spreading."
            if not is_healthy
            else "Continue routine field scouting every 3-4 days."
        )

        llm_explanation = llm_service.explain_root_cause(
            disease_name=top.title,
            crop=crop,
            growth_stage=growth_stage,
            humidity_percent=humidity_percent,
            uncertainty=uncertainty,
            language=language,
        )

        return RootCauseInvestigation(
            investigation_id=inv_id,
            primary_cause=top.title,
            uncertainty_level=uncertainty,
            needs_expert_verification=needs_expert,
            missing_information=missing_info,
            hypotheses=hypotheses,
            follow_up_questions=questions,
            action_plan=action_plan,
            next_inspection=next_inspection,
            llm_explanation=llm_explanation,
        )


rootcause_service = RootCauseService()
