import { useState } from "react";
import { LANGUAGES } from "../constants";

const SEVERITY_CLASS = {
  None: "sev-none",
  "Low-Moderate": "sev-low",
  Moderate: "sev-mod",
  "Moderate-High": "sev-high",
  High: "sev-high",
  Critical: "sev-crit",
};

export default function ResultCard({ result }) {
  const [speaking, setSpeaking] = useState(false);

  if (!result) return null;

  const toggleSpeech = () => {
    if (!("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(result.speech_summary);
    const langObj = LANGUAGES.find((l) => l.code === result.language);
    utterance.lang = langObj ? langObj.speechLang : "en-IN";
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <section className="panel-card result-section" aria-live="polite">
      <div className="result-top">
        <div>
          <div className="badge-row">
            <span className={`sev-badge ${SEVERITY_CLASS[result.severity] || "sev-mod"}`}>
              Severity: {result.severity}
            </span>
            <span className="meta-pill">
              Confidence: {(result.confidence * 100).toFixed(0)}%
            </span>
            <span className="meta-pill">{result.model_mode}</span>
          </div>
          <h2>{result.disease_name}</h2>
          <p className="crop-sub">Crop: {result.guidance.crop}</p>
        </div>

        <button type="button" className="voice-btn" onClick={toggleSpeech}>
          {speaking ? "Stop Audio" : "Listen in Native Language"}
        </button>
      </div>

      {result.low_confidence ? (
        <div className="warn-banner" role="status">
          Moderate/low confidence prediction. Please retake a clear photo or verify with a local agricultural officer (KVK).
        </div>
      ) : null}

      <div className="speech-summary-card">
        <strong>Voice Summary:</strong> {result.speech_summary}
      </div>

      <div className="guidance-grid">
        <div className="guidance-box">
          <h3>Symptoms</h3>
          <ul>
            {result.guidance.symptoms.map((s, idx) => (
              <li key={idx}>{s}</li>
            ))}
          </ul>
        </div>
        <div className="guidance-box">
          <h3>Possible Causes</h3>
          <ul>
            {result.guidance.causes.map((c, idx) => (
              <li key={idx}>{c}</li>
            ))}
          </ul>
        </div>
        <div className="guidance-box">
          <h3>Recommended Treatments</h3>
          <ul>
            {result.guidance.treatments.map((t, idx) => (
              <li key={idx}>{t}</li>
            ))}
          </ul>
        </div>
        <div className="guidance-box">
          <h3>Preventive Measures</h3>
          <ul>
            {result.guidance.preventions.map((p, idx) => (
              <li key={idx}>{p}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
