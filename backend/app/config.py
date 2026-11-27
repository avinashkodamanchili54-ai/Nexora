import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent
load_dotenv(BASE_DIR / ".env")

UPLOAD_DIR = BASE_DIR / "uploads"
DATA_DIR = BASE_DIR / "local_data"
MODELS_DIR = PROJECT_ROOT / "models"
RESULTS_DIR = PROJECT_ROOT / "results"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB
LOW_CONFIDENCE_THRESHOLD = 0.60

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest").strip()

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://zriefibnkahrxkfnexwz.supabase.co").strip()
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "sb_publishable_sDXJr6s0ztJEqE-J-bga9g_slvkFqzv").strip()
SUPABASE_DB_URL = os.getenv(
    "SUPABASE_DB_URL",
    "postgresql://postgres.zriefibnkahrxkfnexwz:Avinash7954@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require",
).strip()

SUPPORTED_LANGUAGES = {
    "en": "English",
    "te": "Telugu",
    "hi": "Hindi",
    "ta": "Tamil",
    "kn": "Kannada",
}

SUPPORTED_CROP_MODES = {
    "paddy": "Paddy / Rice Specialist (Rice UCI Model)",
    "general": "All Crops (PlantVillage 38-Class Model)",
    "field": "Field Photographs (PlantDoc 28-Class Model)",
}
