import { useState } from "react";
import { CROP_MODES, CROP_PRESETS, LANGUAGES, UI_STRINGS } from "../constants";

function ScoreGauge({ value, label }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="gauge-wrap">
      <svg width="68" height="68" viewBox="0 0 68 68">
        <circle cx="34" cy="34" r={radius} className="gauge-bg" />
        <circle
          cx="34"
          cy="34"
          r={radius}
          className="gauge-fg"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <text x="34" y="38" textAnchor="middle" className="gauge-text">
          {value}
        </text>
      </svg>
      <span className="gauge-label">{label}</span>
    </div>
  );
}

function createSampleLeafFile(callback) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#4d7c2b";
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = "#65a30d";
  ctx.beginPath();
  ctx.ellipse(128, 128, 42, 105, 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#854d0e";
  [
    [118, 92, 9],
    [136, 134, 11],
    [122, 168, 8],
  ].forEach(([x, y, r]) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });
  canvas.toBlob((blob) => {
    if (!blob) return;
    const file = new File([blob], "sample_paddy_leaf.jpg", { type: "image/jpeg" });
    callback([file]);
  }, "image/jpeg");
}

export default function SmartLeafScannerPanel({
  language,
  onLanguageChange,
  cropMode,
  onCropModeChange,
  selectedCrop,
  onSelectedCropChange,
  onScan,
  loading,
  error,
  scanResult,
}) {
  const [imageFiles, setImageFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const strings = UI_STRINGS[language] || UI_STRINGS.en;

  const selectFiles = (fileList) => {
    const valid = Array.from(fileList || [])
      .filter((f) => f && f.type.startsWith("image/"))
      .slice(0, 3);
    if (valid.length === 0) return;
    setImageFiles(valid);
    setPreviewUrls(valid.map((f) => URL.createObjectURL(f)));
  };

  return (
    <section className="panel-card scanner-shell">
      <div className="section-head">
        <div>
          <h2>Multi-Frame Smart Leaf Scanner</h2>
          <p className="muted">
            Upload 1–3 angles of the affected leaf. SmartScan checks foliage presence, blur, and lighting, then picks the sharpest frame.
          </p>
        </div>
        <button
          type="button"
          className="secondary-btn"
          onClick={() => createSampleLeafFile(selectFiles)}
        >
          Load Sample Paddy Leaf
        </button>
      </div>

      <div className="mode-cards-grid">
        {CROP_MODES.map((m) => (
          <button
            key={m.code}
            type="button"
            className={`mode-select-card ${cropMode === m.code ? "active" : ""}`}
            onClick={() => onCropModeChange(m.code)}
          >
            <strong>{m.label}</strong>
            <span>{m.subtitle}</span>
          </button>
        ))}
      </div>

      <div className="controls-grid">
        <div className="field">
          <label htmlFor="scan-crop">Select Crop</label>
          <select
            id="scan-crop"
            value={selectedCrop || "Paddy (Rice)"}
            onChange={(e) => {
              const val = e.target.value;
              if (onSelectedCropChange) onSelectedCropChange(val);
              const isPaddy = val.toLowerCase().includes("paddy") || val.toLowerCase().includes("rice");
              onCropModeChange(isPaddy ? "paddy" : "general");
            }}
          >
            {CROP_PRESETS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label} ({c.mode === "paddy" ? "Paddy Model" : "PlantVillage Model"})
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="scan-lang">Report &amp; Voice Output Language</label>
          <select
            id="scan-lang"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="model-active-badge" style={{
        padding: "8px 14px",
        margin: "0 0 16px",
        borderRadius: "8px",
        background: cropMode === "paddy" ? "#f0fdf4" : "#eff6ff",
        border: `1.5px solid ${cropMode === "paddy" ? "#86efac" : "#93c5fd"}`,
        color: cropMode === "paddy" ? "#166534" : "#1e40af",
        fontSize: "0.875rem",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }}>
        <span>{cropMode === "paddy" ? "🌾" : "🌿"}</span>
        <span>
          <strong>Active AI Engine:</strong> {cropMode === "paddy" ? "Paddy Doctor Specialist (10 Classes) — Activated for Paddy" : "PlantVillage Multi-Crop AI (38 Classes) — Activated for all other crops"}
        </span>
      </div>

      <div
        className={`dropzone ${dragActive ? "drag-active" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          selectFiles(e.dataTransfer.files);
        }}
      >
        <input
          id="smart-leaf-upload"
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          onChange={(e) => selectFiles(e.target.files)}
        />

        {previewUrls.length > 0 ? (
          <div className="preview-wrap">
            <div className="multi-preview-row">
              {previewUrls.map((url, idx) => (
                <img key={idx} src={url} alt={`Leaf angle ${idx + 1}`} />
              ))}
            </div>
            <div className="preview-actions">
              <span className="file-name">
                {imageFiles.length} frame(s) selected ({imageFiles.map((f) => f.name).join(", ")})
              </span>
              <label htmlFor="smart-leaf-upload" className="secondary-btn">
                Retake / Choose up to 3 Photos
              </label>
            </div>
          </div>
        ) : (
          <label htmlFor="smart-leaf-upload" className="dropzone-prompt">
            <div className="upload-icon-circle" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <strong>Tap to Capture or Upload 1–3 Leaf Photos</strong>
            <span>Multi-frame SmartScan automatically picks the clearest daylight photo</span>
          </label>
        )}
      </div>

      <div className="submit-row">
        <button
          type="button"
          className="primary-btn full-btn"
          disabled={loading || imageFiles.length === 0}
          onClick={() => onScan(imageFiles)}
        >
          {loading ? "Running SmartScan & RootCause AI..." : strings.scanCta}
        </button>
      </div>

      {error ? <p className="error-banner">{error}</p> : null}

      {scanResult?.image_quality ? (
        <div className="quality-card">
          <ScoreGauge value={scanResult.image_quality.quality_score} label="Quality" />
          <div className="quality-details">
            <div className="badge-row">
              <span className={`sev-badge ${scanResult.image_quality.is_usable ? "sev-none" : "sev-high"}`}>
                {scanResult.image_quality.is_usable ? "Clear Leaf Frame" : "Retake Recommended"}
              </span>
              <span className="meta-pill">
                Foliage: {Math.round(scanResult.image_quality.foliage_ratio * 100)}%
              </span>
              <span className="meta-pill">
                Frames Checked: {scanResult.frames_evaluated}
              </span>
            </div>
            {scanResult.image_quality.warnings.length > 0 ? (
              <ul>
                {scanResult.image_quality.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            ) : (
              <p className="muted">Foliage, sharpness, and daylight exposure look great for diagnosis.</p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
