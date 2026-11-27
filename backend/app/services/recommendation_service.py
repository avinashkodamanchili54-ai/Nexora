import re
from typing import List, Optional
from app.data.disease_db import DISEASE_DB
from app.models.schemas import DiseaseGuidance, RegionalResource
from app.services.llm_service import llm_service


def _normalize_id(raw_label: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", raw_label.strip().lower()).strip("_")


def _format_crop_and_disease(raw_label: str) -> tuple[str, str]:
    if "___" in raw_label:
        crop_part, disease_part = raw_label.split("___", 1)
    elif " " in raw_label and raw_label.split(" ", 1)[0].lower() in {
        "apple", "blueberry", "cherry", "corn", "grape", "orange",
        "peach", "pepper", "potato", "raspberry", "soybean",
        "squash", "strawberry", "tomato", "bell",
    }:
        crop_part, disease_part = raw_label.split(" ", 1)
    else:
        return "Paddy (Rice)", raw_label.replace("_", " ").title()

    crop = crop_part.replace("_", " ").replace(",", "").strip().title()
    disease = disease_part.replace("_", " ").strip().title()
    return crop, disease


class RecommendationService:
    """Retrieves verified guidance, safe pesticide guardrails, and regional resources."""

    def get_guidance(self, raw_label: str) -> Optional[DiseaseGuidance]:
        norm = _normalize_id(raw_label)
        if norm in DISEASE_DB:
            return DiseaseGuidance(**DISEASE_DB[norm])

        for key in DISEASE_DB:
            if key in norm or norm in key:
                llm_data = llm_service.generate_disease_guidance(crop, disease)
        if llm_data:
            return DiseaseGuidance(
                disease_id=norm,
                name=f"{crop} — {disease}",
                crop=crop,
                severity="Moderate-High",
                symptoms=llm_data.get("symptoms") or [f"Visible {disease.lower()} symptoms on {crop.lower()}."],
                causes=llm_data.get("causes") or [f"Pathogen or stress associated with {disease.lower()}."],
                organic_controls=llm_data.get("organic_controls") or ["Remove heavily infected leaves."],
                treatments=llm_data.get("treatments") or ["Consult local KVK for verified dosage."],
                do_not_do=llm_data.get("do_not_do") or ["Do NOT mix unverified chemicals."],
                preventions=llm_data.get("preventions") or ["Use certified disease-free seeds."],
            )

        return DiseaseGuidance(**DISEASE_DB[key])

        crop, disease = _format_crop_and_disease(raw_label)
        is_healthy = "healthy" in norm
        if is_healthy:
            llm_data = llm_service.generate_disease_guidance(crop, disease)
        if llm_data:
            return DiseaseGuidance(
                disease_id=norm,
                name=f"{crop} — {disease}",
                crop=crop,
                severity="Moderate-High",
                symptoms=llm_data.get("symptoms") or [f"Visible {disease.lower()} symptoms on {crop.lower()}."],
                causes=llm_data.get("causes") or [f"Pathogen or stress associated with {disease.lower()}."],
                organic_controls=llm_data.get("organic_controls") or ["Remove heavily infected leaves."],
                treatments=llm_data.get("treatments") or ["Consult local KVK for verified dosage."],
                do_not_do=llm_data.get("do_not_do") or ["Do NOT mix unverified chemicals."],
                preventions=llm_data.get("preventions") or ["Use certified disease-free seeds."],
            )

        return DiseaseGuidance(
                disease_id=norm,
                name=f"Healthy {crop} Leaf",
                crop=crop,
                severity="None",
                symptoms=["No visible lesions, chlorosis, or fungal spots on leaf surface."],
                causes=["Optimal nutrition, irrigation, and field hygiene."],
                organic_controls=["Maintain compost/bio-fertilizer balance and field hygiene."],
                treatments=["No pesticide or fungicide application needed."],
                do_not_do=["Do NOT apply unnecessary preventive chemical sprays."],
                preventions=[
                    "Continue periodic field scouting every 3-4 days.",
                    "Maintain balanced soil nutrients and proper drainage.",
                ],
            )

        llm_data = llm_service.generate_disease_guidance(crop, disease)
        if llm_data:
            return DiseaseGuidance(
                disease_id=norm,
                name=f"{crop} — {disease}",
                crop=crop,
                severity="Moderate-High",
                symptoms=llm_data.get("symptoms") or [f"Visible {disease.lower()} symptoms on {crop.lower()}."],
                causes=llm_data.get("causes") or [f"Pathogen or stress associated with {disease.lower()}."],
                organic_controls=llm_data.get("organic_controls") or ["Remove heavily infected leaves."],
                treatments=llm_data.get("treatments") or ["Consult local KVK for verified dosage."],
                do_not_do=llm_data.get("do_not_do") or ["Do NOT mix unverified chemicals."],
                preventions=llm_data.get("preventions") or ["Use certified disease-free seeds."],
            )

        llm_data = llm_service.generate_disease_guidance(crop, disease)
        if llm_data:
            return DiseaseGuidance(
                disease_id=norm,
                name=f"{crop} — {disease}",
                crop=crop,
                severity="Moderate-High",
                symptoms=llm_data.get("symptoms") or [f"Visible {disease.lower()} symptoms on {crop.lower()}."],
                causes=llm_data.get("causes") or [f"Pathogen or stress associated with {disease.lower()}."],
                organic_controls=llm_data.get("organic_controls") or ["Remove heavily infected leaves."],
                treatments=llm_data.get("treatments") or ["Consult local KVK for verified dosage."],
                do_not_do=llm_data.get("do_not_do") or ["Do NOT mix unverified chemicals."],
                preventions=llm_data.get("preventions") or ["Use certified disease-free seeds."],
            )

        return DiseaseGuidance(
            disease_id=norm,
            name=f"{crop} — {disease}",
            crop=crop,
            severity="Moderate-High",
            symptoms=[
                f"Visible {disease.lower()} lesions, discoloration, or spots on {crop.lower()} foliage.",
                "Potential premature leaf yellowing or reduced vigor if untreated.",
            ],
            causes=[
                f"Pathogen or stress condition associated with {disease.lower()}.",
                "Favored by prolonged leaf wetness, high humidity, or infected crop residue.",
            ],
            organic_controls=[
                "Prune and destroy heavily infected lower leaves away from the field.",
                "Try neem oil (1500 ppm @ 3 mL/L) or Trichoderma/Pseudomonas bio-control in early stages.",
            ],
            treatments=[
                f"Consult local Krishi Vigyan Kendra (KVK) for crop-safe {disease.lower()} dosage before chemical spraying.",
                "Avoid overhead irrigation during humid evenings.",
            ],
            do_not_do=[
                "Do NOT mix multiple unverified pesticides recommended by unauthorized sellers.",
                "Do NOT spray chemicals right before expected rain or under strong midday sun.",
            ],
            preventions=[
                "Use certified disease-resistant seed or planting material.",
                "Ensure proper plant spacing for airflow and sunlight penetration.",
                "Remove and compost/destroy infected crop debris after harvest.",
            ],
        )

    def list_diseases(self) -> List[DiseaseGuidance]:
        return [DiseaseGuidance(**item) for item in DISEASE_DB.values()]

    def get_regional_resource(self, location: str = "Andhra Pradesh") -> RegionalResource:
        loc = location.lower()
        if any(k in loc for k in ("guntur", "andhra", "krishna", "godavari", "vijayawada")):
            return RegionalResource(
                region="Andhra Pradesh",
                helpline_name="Kisan Call Center & Rythu Bharosa Kendra (RBK)",
                helpline_number="1800-180-1551 / 155251",
                local_center="ANGRAU / Nearest Rythu Bharosa Kendra (RBK) & KVK Lam, Guntur",
                university_portal="https://angrau.ac.in",
                safety_note="Verify any chemical label & dosage with your RBK Village Agriculture Assistant before purchase.",
            )
        if any(k in loc for k in ("warangal", "telangana", "hyderabad", "karimnagar", "nizamabad")):
            return RegionalResource(
                region="Telangana",
                helpline_name="Kisan Call Center & Rythu Vedika",
                helpline_number="1800-180-1551",
                local_center="PJTSAU / Nearest Rythu Vedika & KVK Warangal",
                university_portal="https://www.pjtsau.edu.in",
                safety_note="Consult your Mandal Agriculture Officer at Rythu Vedika before mixing sprays.",
            )
        if any(k in loc for k in ("thanjavur", "tamil", "chennai", "coimbatore", "madurai")):
            return RegionalResource(
                region="Tamil Nadu",
                helpline_name="Kisan Call Center & Uzhavan Agri Advisory",
                helpline_number="1800-180-1551",
                local_center="TNAU Crop Protection Center / Nearest KVK",
                university_portal="https://tnau.ac.in",
                safety_note="Follow TNAU Crop Production Guide dosages rather than shopkeeper estimates.",
            )
        if any(k in loc for k in ("mandya", "karnataka", "bengaluru", "mysuru", "dharwad")):
            return RegionalResource(
                region="Karnataka",
                helpline_name="Kisan Call Center & Raitha Samparka Kendra (RSK)",
                helpline_number="1800-180-1551",
                local_center="UAS Bengaluru / Mandya ZARS & Raitha Samparka Kendra",
                university_portal="https://uasbangalore.edu.in",
                safety_note="Check recommended CIB&RC label claim at Raitha Samparka Kendra before spraying.",
            )
        return RegionalResource(
            region=location,
            helpline_name="National Kisan Call Center (ICAR / Govt. of India)",
            helpline_number="1800-180-1551",
            local_center="Nearest District Krishi Vigyan Kendra (KVK)",
            university_portal="https://kvk.icar.gov.in",
            safety_note="Always check CIB&RC approved dosage and avoid unverified pesticide mixes.",
        )


recommendation_service = RecommendationService()
