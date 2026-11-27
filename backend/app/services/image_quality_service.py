import base64
import io
import numpy as np
from PIL import Image, ImageFilter, UnidentifiedImageError

from app.models.schemas import ImageQualityReport


class InvalidImageError(ValueError):
    """Raised when uploaded bytes cannot be decoded as an image."""


class ImageQualityService:
    """Evaluates leaf sharpness, lighting, plant foliage presence, and lesion saliency."""

    def assess(self, image_bytes: bytes) -> ImageQualityReport:
        try:
            with Image.open(io.BytesIO(image_bytes)) as opened:
                img = opened.convert("RGB")
        except (UnidentifiedImageError, OSError) as exc:
            raise InvalidImageError("Unable to decode uploaded image file.") from exc
        width, height = img.size
        resized = img.resize((256, 256))
        rgb = np.asarray(resized, dtype=np.float32)
        gray = np.asarray(resized.convert("L"), dtype=np.float32)

        dx = np.diff(gray, axis=1)
        dy = np.diff(gray, axis=0)
        sharpness = float(np.mean(dx ** 2) + np.mean(dy ** 2))
        brightness = float(np.mean(gray))

        # Foliage detection: green, olive, yellow-green, or brown-leaf tones
        r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
        green_mask = (g > b + 8) & (g >= r - 18) & (g > 35)
        leaf_brown_mask = (r > g) & (g > b + 10) & (r > 55) & (r < 220)
        foliage_ratio = round(float(np.mean(green_mask | leaf_brown_mask)), 3)
        is_leaf_likely = foliage_ratio >= 0.12

        warnings = []
        score = 100

        is_blurry = sharpness < 18.0
        if is_blurry:
            warnings.append("Image appears slightly blurry; hold camera steady closer to the leaf.")
            score -= 30

        is_dark = brightness < 45.0
        if is_dark:
            warnings.append("Lighting is too dim; move to natural daylight for clearer lesions.")
            score -= 25
        elif brightness > 225.0:
            warnings.append("Image is overexposed; avoid direct harsh glare on the leaf surface.")
            score -= 15

        if min(width, height) < 120:
            warnings.append("Image resolution is low; capture a closer photo of the affected area.")
            score -= 20

        if not is_leaf_likely:
            warnings.append(
                "Very little plant foliage detected—ensure the leaf fills most of the camera frame."
            )
            score -= 35

        score = max(10, min(100, score))
        is_usable = score >= 45 and is_leaf_likely

        return ImageQualityReport(
            quality_score=score,
            is_blurry=is_blurry,
            is_dark=is_dark,
            is_usable=is_usable,
            is_leaf_likely=is_leaf_likely,
            foliage_ratio=foliage_ratio,
            warnings=warnings,
            resolution=f"{width}x{height}",
        )

    def generate_lesion_heatmap_b64(self, image_bytes: bytes) -> str:
        """Overlay a smooth lesion-attention heatmap highlighting chlorotic/necrotic spots."""
        base = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize((224, 224))
        arr = np.asarray(base, dtype=np.float32)
        r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]

        # Highlight yellowing/browning anomalies relative to healthy green chlorophyll
        lesion_signal = np.clip((r - g * 0.85) + (r - b) * 0.4, 0, 255)
        max_val = float(np.max(lesion_signal))
        if max_val > 5.0:
            norm = lesion_signal / max_val
        else:
            # Fallback to edge energy if uniform green
            gray = np.asarray(base.convert("L"), dtype=np.float32)
            gx = np.abs(np.gradient(gray, axis=1))
            gy = np.abs(np.gradient(gray, axis=0))
            edge = gx + gy
            norm = edge / max(1.0, float(np.max(edge)))

        heat_img = Image.fromarray(np.uint8(norm * 255)).filter(ImageFilter.GaussianBlur(radius=6))
        heat = np.asarray(heat_img, dtype=np.float32) / 255.0

        overlay = arr.copy()
        alpha = np.clip(heat * 0.65, 0.0, 0.65)
        overlay[:, :, 0] = arr[:, :, 0] * (1 - alpha) + 239.0 * alpha
        overlay[:, :, 1] = arr[:, :, 1] * (1 - alpha) + (180.0 * (1 - heat) + 40.0 * heat) * alpha
        overlay[:, :, 2] = arr[:, :, 2] * (1 - alpha) + 30.0 * alpha

        out = Image.fromarray(np.uint8(np.clip(overlay, 0, 255)))
        buf = io.BytesIO()
        out.save(buf, format="PNG")
        b64 = base64.b64encode(buf.getvalue()).decode("ascii")
        return f"data:image/png;base64,{b64}"


image_quality_service = ImageQualityService()
