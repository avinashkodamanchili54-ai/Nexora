import io
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw
import pytest

from app.main import app
from app.services.image_quality_service import InvalidImageError, image_quality_service

client = TestClient(app)


def _img_bytes(color, size=(224, 224), spots=False) -> bytes:
    img = Image.new("RGB", size, color=color)
    if spots:
        draw = ImageDraw.Draw(img)
        # High-contrast leaf vein & lesion details so image is sharp & textured
        for x in range(20, size[0] - 20, 28):
            draw.line((x, 10, x + 15, size[1] - 10), fill=(30, 110, 30), width=3)
            draw.ellipse((x, 80, x + 14, 96), fill=(150, 80, 20))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


# --- 1. ImageQualityService.assess() unit tests ---

def test_image_quality_sharp_leaf():
    report = image_quality_service.assess(_img_bytes((50, 140, 40), spots=True))
    assert report.is_leaf_likely is True
    assert report.is_blurry is False
    assert report.is_dark is False
    assert report.is_usable is True
    assert report.quality_score >= 90


def test_image_quality_blurry_uniform():
    report = image_quality_service.assess(_img_bytes((50, 140, 40), spots=False))
    assert report.is_blurry is True
    assert report.is_leaf_likely is True
    assert report.quality_score < 100


def test_image_quality_dark_and_low_res():
    report = image_quality_service.assess(_img_bytes((8, 12, 8), size=(80, 80)))
    assert report.is_dark is True
    assert report.is_usable is False
    assert len(report.warnings) >= 2


def test_image_quality_non_leaf_blue_wall():
    report = image_quality_service.assess(_img_bytes((20, 40, 210), spots=False))
    assert report.is_leaf_likely is False
    assert report.is_usable is False


def test_image_quality_corrupted_bytes():
    with pytest.raises(InvalidImageError):
        image_quality_service.assess(b"not-valid-image-bytes")


def test_lesion_heatmap_generation():
    data_url = image_quality_service.generate_lesion_heatmap_b64(_img_bytes((50, 140, 40), spots=True))
    assert data_url.startswith("data:image/png;base64,")
    assert len(data_url) > 200


# --- 2. End-to-End API & Edge-Case Tests ---

def test_health_and_models_status():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["service"] == "krishi-sakhi-ai"

    m = client.get("/api/models/status")
    assert m.status_code == 200
    assert {item["key"] for item in m.json()["models"]} == {"rice", "plantdoc", "plantvillage"}


def test_weather_spray_windows_and_validation():
    res = client.get("/api/weather/alerts?location=Guntur&lat=16.3067&lon=80.4365")
    assert res.status_code == 200
    body = res.json()
    assert len(body["threat_radar"]) >= 3
    assert len(body["spray_windows"]) == 5

    bad = client.get("/api/weather/alerts?lat=999")
    assert bad.status_code == 422
    assert bad.json()["error"]["code"] == "VALIDATION_ERROR"

    out = client.post(
        "/api/weather/outbreaks",
        json={
            "location": "Tenali",
            "crop": "Paddy (Rice)",
            "symptom_summary": "Spindle spots on leaves",
            "severity": "High",
        },
    )
    assert out.status_code == 200
    assert out.json()["location"] == "Tenali"


def test_predict_corrupted_image_returns_400():
    res = client.post(
        "/api/predict",
        files={"image": ("bad.jpg", b"corrupt-data", "image/jpeg")},
        data={"language": "en", "crop_mode": "paddy"},
    )
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "BAD_REQUEST"


def test_multiframe_smart_scan_picks_best_frame():
    dark_blur = _img_bytes((10, 12, 10), size=(90, 90))
    sharp_leaf = _img_bytes((55, 145, 45), size=(256, 256), spots=True)

    res = client.post(
        "/api/predict",
        files=[
            ("images", ("blurry.jpg", dark_blur, "image/jpeg")),
            ("images", ("sharp.jpg", sharp_leaf, "image/jpeg")),
        ],
        data={"language": "te", "crop_mode": "paddy"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["frames_evaluated"] == 2
    assert max(body["frame_scores"]) == body["image_quality"]["quality_score"]
    assert body["heatmap_data_url"].startswith("data:image/png;base64,")
    assert body["guidance"]["do_not_do"]


def test_rootcause_refine_rescores_hypotheses():
    yes_res = client.post(
        "/api/investigate/refine",
        json={
            "scan_id": "test1234",
            "disease_id": "bacterial_leaf_blight",
            "confidence": 0.75,
            "language": "en",
            "humidity_percent": 82,
            "answers": {"morning_ooze": "Yes", "heavy_urea": "Yes", "insects_seen": "No"},
        },
    )
    no_res = client.post(
        "/api/investigate/refine",
        json={
            "scan_id": "test1234",
            "disease_id": "bacterial_leaf_blight",
            "confidence": 0.75,
            "language": "en",
            "humidity_percent": 82,
            "answers": {"morning_ooze": "No", "insects_seen": "Yes"},
        },
    )
    assert yes_res.status_code == 200
    assert no_res.status_code == 200
    yes_top = yes_res.json()["hypotheses"][0]["likelihood"]
    no_disease = next(h["likelihood"] for h in no_res.json()["hypotheses"] if h["category"] == "Disease")
    assert yes_top > no_disease


def test_regional_resources_and_diseases():
    for loc, expected in [
        ("Guntur", "Andhra Pradesh"),
        ("Warangal", "Telangana"),
        ("Thanjavur", "Tamil Nadu"),
        ("Mandya", "Karnataka"),
    ]:
        r = client.get(f"/api/diseases/resources/regional?location={loc}")
        assert r.status_code == 200
        assert r.json()["region"] == expected
        assert "1800-180-1551" in r.json()["helpline_number"]


def test_assistant_and_voice_endpoints():
    chat = client.post(
        "/api/assistant/chat",
        json={
            "message": "Should I spray fungicide today?",
            "language": "te",
            "crop": "Paddy (Rice)",
            "growth_stage": "Vegetative / Tillering",
            "location": "Guntur",
        },
    )
    assert chat.status_code == 200
    assert chat.json()["language"] == "te"
    assert chat.json()["reply"]

    tts_ok = client.post("/api/voice/tts", json={"text": "నమస్కారం", "language": "te"})
    assert tts_ok.status_code == 200
    assert tts_ok.headers["content-type"] == "audio/mpeg"

    tts_bad = client.post("/api/voice/tts", json={"text": "Bonjour", "language": "fr"})
    assert tts_bad.status_code == 422
    assert tts_bad.json()["error"]["code"] == "VALIDATION_ERROR"


def test_farmer_and_history_lifecycle():
    reg = client.post(
        "/api/farmers/register",
        json={
            "name": "Ramesh",
            "phone": "9876543210",
            "preferred_language": "te",
            "location": "Guntur",
            "crop": "Paddy (Rice)",
            "variety": "BPT 5204",
            "acreage": 3.2,
            "sowing_date": "2026-10-15",
            "center_lat": 16.3067,
            "center_lon": 80.4365,
            "boundary_coords": [
                {"lat": 16.306, "lon": 80.436},
                {"lat": 16.307, "lon": 80.436},
                {"lat": 16.307, "lon": 80.437},
            ],
        },
    )
    assert reg.status_code == 200
    fid = reg.json()["farmer_id"]
    assert client.get(f"/api/farmers/{fid}").status_code == 200
    assert client.get("/api/farmers/nonexistent-id").status_code == 404
