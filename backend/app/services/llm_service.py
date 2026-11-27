import base64
import json
from typing import Optional
import urllib.request

from app.config import GEMINI_API_KEY, GEMINI_MODEL, SUPPORTED_LANGUAGES


class LLMService:
    """Google Gemini Free-Tier integration for natural multilingual reasoning & voice STT."""

    def is_configured(self) -> bool:
        return bool(GEMINI_API_KEY)

    def _generate_content(self, payload: dict, timeout: float = 12.0) -> Optional[str]:
        if not GEMINI_API_KEY:
            return None
        for model_name in dict.fromkeys([GEMINI_MODEL, "gemini-flash-lite-latest", "gemini-2.5-flash-lite", "gemini-flash-latest"]):
            url = (
                f"https://generativelanguage.googleapis.com/v1beta/models/"
                f"{model_name}:generateContent?key={GEMINI_API_KEY}"
            )
            try:
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                    method="POST",
                )
                with urllib.request.urlopen(req, timeout=timeout) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                candidates = data.get("candidates", [])
                if not candidates:
                    continue
                parts = candidates[0].get("content", {}).get("parts", [])
                text = "".join(p.get("text", "") for p in parts).strip()
                if text:
                    return text
            except Exception:
                continue
        return None

    def generate_farmer_reply(
        self,
        message: str,
        language: str,
        crop: str,
        growth_stage: str,
        location: str,
        latest_diagnosis: Optional[str] = None,
    ) -> Optional[dict]:
        lang_name = SUPPORTED_LANGUAGES.get(language, "English")
        prompt = (
            f"You are KRISHI SAKHI AI, a warm, practical agricultural advisor helping Indian farmers.\n"
            f"Farmer context: Crop={crop}, Growth Stage={growth_stage}, District={location}, "
            f"Latest Leaf Scan={latest_diagnosis or 'None yet'}.\n"
            f"Respond strictly in {lang_name} using simple, farmer-friendly language (3-4 concise sentences). "
            f"Never recommend unsafe or unverified chemical dosages; encourage KVK verification when uncertain.\n"
            f"Return JSON ONLY with keys: \"reply\" (string in {lang_name}) and "
            f"\"suggested_questions\" (array of 3 short follow-up questions in {lang_name}).\n\n"
            f"Farmer question: {message}"
        )
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.4,
                "maxOutputTokens": 450,
                "responseMimeType": "application/json",
            },
        }
        raw = self._generate_content(payload)
        if not raw:
            return None
        try:
            parsed = json.loads(raw)
            if isinstance(parsed.get("reply"), str) and parsed["reply"].strip():
                return parsed
        except Exception:
            return {"reply": raw, "suggested_questions": []}
        return None

    def explain_root_cause(
        self,
        disease_name: str,
        crop: str,
        growth_stage: str,
        humidity_percent: int,
        uncertainty: str,
        language: str,
    ) -> Optional[str]:
        lang_name = SUPPORTED_LANGUAGES.get(language, "English")
        prompt = (
            f"Explain to a farmer in simple {lang_name} (2-3 short sentences): "
            f"Why {disease_name} is suspected on {crop} ({growth_stage}) at {humidity_percent}% humidity, "
            f"with uncertainty={uncertainty}. Keep advice practical and safe."
        )
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.3, "maxOutputTokens": 250},
        }
        return self._generate_content(payload, timeout=8.0)

    def generate_disease_guidance(self, crop: str, disease: str, language: str = "en") -> Optional[dict]:
        """Generate structured, safe crop-disease guidance via Gemini in the selected language."""
        lang_name = SUPPORTED_LANGUAGES.get(language, "English")
        prompt = (
            f"You are an ICAR-aligned agricultural scientist. Provide safe, practical disease-management "
            f"guidance for {crop} affected by {disease} strictly in {lang_name}.\n"
            f"Return JSON ONLY with keys: "
            f"\"symptoms\" (2-3 short strings in {lang_name}), \"causes\" (1-2 short strings in {lang_name}), "
            f"\"organic_controls\" (2 short strings in {lang_name}), \"treatments\" (1-2 verified steps in {lang_name}), "
            f"\"do_not_do\" (1-2 safety warnings against seller misadvice/over-spraying in {lang_name}), "
            f"\"preventions\" (2-3 short strings in {lang_name})."
        )
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.25,
                "maxOutputTokens": 500,
                "responseMimeType": "application/json",
            },
        }
        raw = self._generate_content(payload, timeout=10.0)
        if not raw:
            return None
        try:
            parsed = json.loads(raw)
            if isinstance(parsed.get("treatments"), list) and parsed["treatments"]:
                return parsed
        except Exception:
            return None
        return None

    def transcribe_audio(self, audio_bytes: bytes, mime_type: str, language: str) -> Optional[str]:
        if not GEMINI_API_KEY or not audio_bytes:
            return None
        lang_name = SUPPORTED_LANGUAGES.get(language, "English")
        b64 = base64.b64encode(audio_bytes).decode("ascii")
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": (
                                f"Transcribe this farmer's spoken question accurately in {lang_name}. "
                                "Return only the transcribed text with no commentary."
                            )
                        },
                        {"inlineData": {"mimeType": mime_type, "data": b64}},
                    ],
                }
            ],
            "generationConfig": {"temperature": 0.0, "maxOutputTokens": 200},
        }
        return self._generate_content(payload, timeout=12.0)


llm_service = LLMService()
