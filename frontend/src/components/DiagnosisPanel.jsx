import { useState } from "react";
import { CROP_MODES, LANGUAGES } from "../constants";

export default function DiagnosisPanel({
  language,
  onLanguageChange,
  cropMode,
  onCropModeChange,
  location,
  onLocationChange,
  onAnalyze,
  loading,
  error,
}) {
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const selectFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    selectFile(file);
  };

  const handleVoiceLocation = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;
    const rec = new SpeechRec();
    const langObj = LANGUAGES.find((l) => l.code === language);
    rec.lang = langObj ? langObj.speechLang : "en-IN";
    rec.onresult = (evt) => {
      const spoken = evt.results?.[0]?.[0]?.transcript;
      if (spoken) onLocationChange(spoken);
    };
    rec.start();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAnalyze(imageFile);
  };

  return (
    <form className="panel-card" onSubmit={handleSubmit}>
      <div className="controls-grid">
        <div className="field">
          <label htmlFor="language-select">Farmer Language</label>
          <select
            id="language-select"
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

        <div className="field">
          <label htmlFor="crop-mode-select">Crop / AI Model Mode</label>
          <select
            id="crop-mode-select"
            value={cropMode}
            onChange={(e) => onCropModeChange(e.target.value)}
          >
            {CROP_MODES.map((m) => (
              <option key={m.code} value={m.code}>
                {m.label} — {m.subtitle}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="location-input">District / Location</label>
          <div className="input-row">
            <input
              id="location-input"
              type="text"
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              placeholder="e.g., Guntur, Warangal"
            />
            {"webkitSpeechRecognition" in window || "SpeechRecognition" in window ? (
              <button
                type="button"
                className="icon-btn"
                onClick={handleVoiceLocation}
                title="Speak district name"
                aria-label="Speak district name"
              >
                Mic
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className={`dropzone ${dragActive ? "drag-active" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <input
          id="leaf-upload"
          type="file"
          accept="image/*"
          onChange={(e) => selectFile(e.target.files?.[0])}
        />

        {previewUrl ? (
          <div className="preview-wrap">
            <img src={previewUrl} alt="Selected crop leaf preview" />
            <div className="preview-actions">
              <span className="file-name">{imageFile?.name}</span>
              <label htmlFor="leaf-upload" className="secondary-btn">
                Change Image
              </label>
            </div>
          </div>
        ) : (
          <label htmlFor="leaf-upload" className="dropzone-prompt">
            <strong>Upload or Drag &amp; Drop a Leaf Photo</strong>
            <span>Supports JPG, PNG up to 10 MB (close-up of affected leaf works best)</span>
          </label>
        )}
      </div>

      <div className="submit-row">
        <button type="submit" className="primary-btn" disabled={loading || !imageFile}>
          {loading ? "Analyzing Leaf Image..." : "Identify Disease & Get Guidance"}
        </button>
      </div>

      {error ? (
        <p className="error-banner" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
