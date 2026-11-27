from app.models.schemas import DiseaseGuidance

LOCALIZED_DISEASE_NAMES = {
    "te": {
        "bacterial_leaf_blight": "బాక్టీరియల్ ఆకు ఎండు తెగులు",
        "brown_spot": "గోధుమ మచ్చ తెగులు",
        "leaf_smut": "ఆకు కాటుక తెగులు",
        "blast": "వరి అగ్గి తెగులు (బ్లాస్ట్)",
        "tungro": "వరి తుంగ్రో వైరస్",
        "normal": "ఆరోగ్యకరమైన వరి ఆకు",
    },
    "hi": {
        "bacterial_leaf_blight": "जीवाणु पत्ती झुलसा रोग",
        "brown_spot": "भूरा धब्बा रोग",
        "leaf_smut": "पत्ती कंडुआ रोग",
        "blast": "धान का ब्लास्ट रोग",
        "tungro": "धान का टुंगरो वायरस",
        "normal": "स्वस्थ धान की पत्ती",
    },
    "ta": {
        "bacterial_leaf_blight": "பாக்டீரியா இலை கருகல் நோய்",
        "brown_spot": "பழுப்பு புள்ளி நோய்",
        "leaf_smut": "இலை கரிப்பூட்டை நோய்",
        "blast": "நெல் குலை நோய்",
        "tungro": "நெல் துங்ரோ வைரஸ்",
        "normal": "ஆரோக்கியமான நெல் இலை",
    },
    "kn": {
        "bacterial_leaf_blight": "ಬ್ಯಾಕ್ಟೀರಿಯಾ ಎಲೆ ಅಂಗಮಾರಿ ರೋಗ",
        "brown_spot": "ಕಂದು ಚುಕ್ಕೆ ರೋಗ",
        "leaf_smut": "ಎಲೆ ಕಾಡಿಗೆ ರೋಗ",
        "blast": "ಭತ್ತದ ಬೆಂಕಿ ರೋಗ",
        "tungro": "ಭತ್ತದ ತುಂಗ್ರೋ ವೈರಸ್",
        "normal": "ಆರೋಗ್ಯಕರ ಭತ್ತದ ಎಲೆ",
    },
}

SPEECH_TEMPLATES = {
    "en": "Detected {name} with {conf}% confidence. Severity is {sev}. Recommended action: {treat}",
    "te": "{name} గుర్తించబడింది ({conf}% ఖచ్చితత్వం). తీవ్రత: {sev}. సూచించిన చికిత్స: {treat}",
    "hi": "{name} की पहचान हुई है ({conf}% विश्वास). गंभीरता: {sev}. अनुशंसित उपचार: {treat}",
    "ta": "{name} கண்டறியப்பட்டது ({conf}% உறுதி). தீவிரம்: {sev}. பரிந்துரைக்கப்பட்ட சிகிச்சை: {treat}",
    "kn": "{name} ಪತ್ತೆಯಾಗಿದೆ ({conf}% ಖಚಿತತೆ). ತೀವ್ರತೆ: {sev}. ಶಿಫಾರಸು ಮಾಡಿದ ಚಿಕಿತ್ಸೆ: {treat}",
}

LOW_CONF_SUFFIX = {
    "en": " Confidence is moderate—please verify with an agricultural officer.",
    "te": " ఖచ్చితత్వం తక్కువగా ఉంది—దయచేసి వ్యవసాయ అధికారిని సంప్రదించండి.",
    "hi": " विश्वास स्तर कम है—कृपया कृषि विशेषज्ञ से पुष्टि करें.",
    "ta": " உறுதித்தன்மை குறைவாக உள்ளது—வேளாண் அதிகாரியிடம் சரிபார்க்கவும்.",
    "kn": " ಖಚಿತತೆ ಕಡಿಮೆಯಿದೆ—ದಯವಿಟ್ಟು ಕೃಷಿ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.",
}


class TranslationService:
    """Localizes disease names and generates voice-ready speech summaries."""

    def localize(
        self,
        guidance: DiseaseGuidance,
        language: str,
        confidence: float,
        low_confidence: bool = False,
    ) -> tuple[DiseaseGuidance, str]:
        lang = language if language in {"en", "te", "hi", "ta", "kn"} else "en"
        localized_name = LOCALIZED_DISEASE_NAMES.get(lang, {}).get(
            guidance.disease_id, guidance.name
        )
        localized_guidance = guidance.model_copy(update={"name": localized_name})

        template = SPEECH_TEMPLATES.get(lang, SPEECH_TEMPLATES["en"])
        first_treatment = guidance.treatments[0] if guidance.treatments else ""
        speech_summary = template.format(
            name=localized_name,
            conf=int(round(confidence * 100)),
            sev=guidance.severity,
            treat=first_treatment,
        )
        if low_confidence:
            speech_summary += LOW_CONF_SUFFIX.get(lang, LOW_CONF_SUFFIX["en"])

        return localized_guidance, speech_summary


translation_service = TranslationService()
