import io
import edge_tts

VOICE_MAP = {
    "en": "en-IN-NeerjaNeural",
    "te": "te-IN-ShrutiNeural",
    "hi": "hi-IN-SwaraNeural",
    "ta": "ta-IN-PallaviNeural",
    "kn": "kn-IN-SapnaNeural",
}


class VoiceService:
    """Generates natural regional-language neural speech (MP3) using edge-tts."""

    async def synthesize(self, text: str, language: str = "en") -> bytes:
        voice = VOICE_MAP.get(language, VOICE_MAP["en"])
        communicate = edge_tts.Communicate(text=text, voice=voice)
        buf = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                buf.write(chunk["data"])
        return buf.getvalue()


voice_service = VoiceService()
