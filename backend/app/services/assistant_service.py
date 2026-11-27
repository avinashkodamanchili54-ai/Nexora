from app.models.schemas import AssistantChatRequest, AssistantChatResponse
from app.services.llm_service import llm_service


LANG_GREETINGS = {
    "en": {
        "spray": "Before spraying any chemical on {crop} ({stage}), confirm leaf lesions in daylight. If {diag}, follow targeted treatment only on affected patches and avoid spraying in strong wind or rain.",
        "weather": "In {loc}, high moisture increases fungal and bacterial risk for {crop} at {stage}. Check 10 random plants early morning and drain excess standing water.",
        "fertilizer": "During {stage} of {crop}, avoid excess urea/nitrogen if spots are visible—excess nitrogen softens leaves and accelerates Blast and Bacterial Blight. Balance with potash.",
        "default": "For your {crop} field in {loc} ({stage} stage){diag_clause}, inspect leaf undersides, monitor field drainage, and use Smart Leaf Scanner if new spots appear.",
        "suggestions": [
            "Should I spray fungicide today?",
            "How does today's weather affect my crop?",
            "Can I apply urea right now?",
        ],
    },
    "te": {
        "spray": "{crop} ({stage} దశ) పై మందు పిచికారీ చేసే ముందు పగటి వెలుతురులో ఆకు మచ్చలను నిర్ధారించండి. {diag} ఉన్నట్లయితే ప్రభావిత భాగాలపై మాత్రమే సిఫార్సు చేసిన మందును వాడండి.",
        "weather": "{loc} ప్రాంతంలో తేమ ఎక్కువగా ఉండటం వల్ల {crop} పంటకు అగ్గి తెగులు, ఆకు ఎండు తెగులు ప్రమాదం ఉంది. పొలంలో ఎక్కువ నీరు నిల్వ ఉండకుండా చూడండి.",
        "fertilizer": "{crop} {stage} దశలో ఆకు మచ్చలు కనిపిస్తే యూరియా ఎక్కువగా వేయకండి—అది తెగుళ్లను పెంచుతుంది. పొటాష్ సమతుల్యంగా వేయండి.",
        "default": "{loc} లోని మీ {crop} ({stage} దశ){diag_clause} కోసం ఉదయం పూట ఆకుల అడుగు భాగాన్ని పరిశీలించండి మరియు కొత్త మచ్చలు కనిపిస్తే Smart Leaf Scanner తో పరీక్షించండి.",
        "suggestions": [
            "ఈరోజు మందు పిచికారీ చేయవచ్చా?",
            "వాతావరణం వల్ల పంటకు ఏమైనా ప్రమాదం ఉందా?",
            "ఇప్పుడు యూరియా వేయవచ్చా?",
        ],
    },
    "hi": {
        "spray": "{crop} ({stage} चरण) पर छिड़काव से पहले दिन की रोशनी में धब्बों की पुष्टि करें। {diag} होने पर केवल प्रभावित हिस्से में अनुशंसित उपचार करें।",
        "weather": "{loc} में अधिक नमी के कारण {crop} में झुलसा और ब्लास्ट का खतरा बढ़ सकता है। खेत से अतिरिक्त पानी निकालें और सुबह निरीक्षण करें।",
        "fertilizer": "{crop} के {stage} चरण में यदि पत्ती पर धब्बे हैं तो अधिक यूरिया न डालें—इससे रोग तेजी से फैलता है। पोटाश संतुलित मात्रा में दें।",
        "default": "{loc} में आपकी {crop} ({stage}){diag_clause} के लिए सुबह पत्तियों की जांच करें और नए धब्बे दिखने पर Smart Leaf Scanner से स्कैन करें।",
        "suggestions": [
            "क्या आज दवा का छिड़काव करना सही है?",
            "मौसम से फसल को क्या खतरा है?",
            "क्या अभी यूरिया डाल सकते हैं?",
        ],
    },
    "ta": {
        "spray": "{crop} ({stage} நிலை) பயிரில் மருந்து தெளிப்பதற்கு முன் பகல் வெளிச்சத்தில் இலை புள்ளிகளை உறுதி செய்யவும். {diag} இருந்தால் பாதிக்கப்பட்ட பகுதிகளில் மட்டும் பரிந்துரைக்கப்பட்ட மருந்தை பயன்படுத்தவும்.",
        "weather": "{loc} பகுதியில் அதிக ஈரப்பதம் {crop} பயிரில் பூஞ்சை மற்றும் பாக்டீரியா நோய் அபாயத்தை அதிகரிக்கும். தேங்கிய நீரை வடிகட்டவும்.",
        "fertilizer": "{crop} {stage} நிலையில் இலை புள்ளிகள் இருந்தால் அதிக யூரியா இட வேண்டாம்; பொட்டாஷ் சமநிலையாக இடவும்.",
        "default": "{loc} பகுதியில் உள்ள உங்கள் {crop} ({stage}){diag_clause} பயிரை காலை நேரத்தில் ஆய்வு செய்து, புதிய புள்ளிகள் இருந்தால் Smart Leaf Scanner மூலம் சோதிக்கவும்.",
        "suggestions": [
            "இன்று மருந்து தெளிக்கலாமா?",
            "வானிலையால் பயிருக்கு ஆபத்து உள்ளதா?",
            "இப்போது யூரியா இடலாமா?",
        ],
    },
    "kn": {
        "spray": "{crop} ({stage} ಹಂತ) ಬೆಳೆಗೆ ಔಷಧ ಸಿಂಪಡಿಸುವ ಮೊದಲು ಹಗಲು ಬೆಳಕಿನಲ್ಲಿ ಎಲೆ ಕಲೆಗಳನ್ನು ದೃಢೀಕರಿಸಿ. {diag} ಕಂಡುಬಂದರೆ ಬಾಧಿತ ಭಾಗಗಳಿಗೆ ಮಾತ್ರ ಶಿಫಾರಸು ಮಾಡಿದ ಚಿಕಿತ್ಸೆ ನೀಡಿ.",
        "weather": "{loc} ಪ್ರದೇಶದಲ್ಲಿ ಹೆಚ್ಚಿನ ತೇವಾಂಶವು {crop} ಬೆಳೆಯಲ್ಲಿ ಶಿಲೀಂಧ್ರ ಮತ್ತು ಬ್ಯಾಕ್ಟೀರಿಯಾ ರೋಗದ ಅಪಾಯವನ್ನು ಹೆಚ್ಚಿಸುತ್ತದೆ. ಹೆಚ್ಚುವರಿ ನೀರನ್ನು ಬಸಿದುಹಾಕಿ.",
        "fertilizer": "{crop} {stage} ಹಂತದಲ್ಲಿ ಕಲೆಗಳು ಕಂಡುಬಂದರೆ ಹೆಚ್ಚಿನ ಯೂರಿಯಾ ಬಳಸಬೇಡಿ; ಪೊಟ್ಯಾಶ್ ಸಮತೋಲನದಲ್ಲಿ ನೀಡಿ.",
        "default": "{loc} ನಲ್ಲಿರುವ ನಿಮ್ಮ {crop} ({stage}){diag_clause} ಬೆಳೆಯನ್ನು ಬೆಳಿಗ್ಗೆ ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಹೊಸ ಕಲೆಗಳು ಕಂಡುಬಂದರೆ Smart Leaf Scanner ಬಳಸಿ.",
        "suggestions": [
            "ಇಂದು ಔಷಧ ಸಿಂಪಡಿಸಬಹುದೇ?",
            "ಹವಾಮಾನದಿಂದ ಬೆಳೆಗೆ ಅಪಾಯವಿದೆಯೇ?",
            "ಈಗ ಯೂರಿಯಾ ಹಾಕಬಹುದೇ?",
        ],
    },
}


class AssistantService:
    """Context-aware multilingual agricultural assistant powered by Gemini + local fallback."""

    def reply(self, req: AssistantChatRequest) -> AssistantChatResponse:
        lang = req.language if req.language in LANG_GREETINGS else "en"
        templates = LANG_GREETINGS[lang]

        llm_result = llm_service.generate_farmer_reply(
            message=req.message,
            language=lang,
            crop=req.crop,
            growth_stage=req.growth_stage,
            location=req.location,
            latest_diagnosis=req.latest_diagnosis,
        )
        if llm_result:
            suggestions = llm_result.get("suggested_questions") or templates["suggestions"]
            return AssistantChatResponse(
                reply=llm_result["reply"],
                language=lang,
                provider="gemini-free-tier",
                suggested_questions=suggestions[:3],
            )

        text = req.message.lower()
        diag_text = req.latest_diagnosis or "suspected leaf symptoms"
        diag_clause = f" (latest scan: {req.latest_diagnosis})" if req.latest_diagnosis else ""

        if any(k in text for k in ("spray", "chemical", "fungicide", "medicine", "మందు", "పిచికారీ", "छिड़काव", "दवा", "மருந்து", "ಔಷಧ")):
            key = "spray"
        elif any(k in text for k in ("weather", "rain", "humidity", "risk", "వాతావరణ", "వర్షం", "मौसम", "बारिश", "வானிலை", "ಹವಾಮಾನ")):
            key = "weather"
        elif any(k in text for k in ("urea", "fertilizer", "nitrogen", "npk", "యూరియా", "ఎరువు", "यूरिया", "खाद", "யூரியா", "ಯೂರಿಯಾ")):
            key = "fertilizer"
        else:
            key = "default"

        reply = templates[key].format(
            crop=req.crop,
            stage=req.growth_stage,
            loc=req.location,
            diag=diag_text,
            diag_clause=diag_clause,
        )

        return AssistantChatResponse(
            reply=reply,
            language=lang,
            provider="local-fallback",
            suggested_questions=templates["suggestions"],
        )


assistant_service = AssistantService()
