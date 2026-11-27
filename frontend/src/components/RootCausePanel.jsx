import { useState } from "react";
import { playRegionalSpeech, stopRegionalSpeech } from "../api";

export default function RootCausePanel({
  scanResult,
  scanPreviewUrl,
  regionalResource,
  selectedLanguage,
  onRefine,
  refining,
  onAskAssistant,
}) {
  const [answers, setAnswers] = useState({});
  const [speaking, setSpeaking] = useState(false);

  if (!scanResult) {
    return (
      <section className="panel-card empty-state-card">
        <h2>RootCause Investigation Engine</h2>
        <p className="muted">
          Scan a leaf in <strong>Smart Leaf Scanner</strong> to compare candidate causes (disease, pest, nutrient), view safe organic &amp; chemical guardrails, and get regional KVK support.
        </p>
      </section>
    );
  }

  const inv = scanResult.investigation;
  const g = scanResult.guidance;

  const toggleSpeech = () => {
    if (speaking) {
      stopRegionalSpeech();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    playRegionalSpeech(
      inv.llm_explanation || scanResult.speech_summary,
      selectedLanguage || scanResult.language,
      () => setSpeaking(false)
    );
  };

  const handleAnswerChange = (qid, val) => {
    const next = { ...answers, [qid]: val };
    setAnswers(next);
    onRefine(next);
  };

  return (
    <div className="stack-layout">
      <section className="panel-card diagnosis-hero">
        <div className="result-top">
          <div>
            <div className="badge-row">
              <span className="sev-badge sev-high">Primary Suspect: {inv.primary_cause}</span>
              <span className="meta-pill">
                Confidence: {(scanResult.confidence * 100).toFixed(0)}%
              </span>
              <span className="meta-pill">Uncertainty: {inv.uncertainty_level}</span>
            </div>
            <h2>{scanResult.disease_name}</h2>
            <p className="crop-sub">
              Model: {scanResult.model_mode} · {inv.next_inspection}
            </p>
          </div>

          <div className="btn-group">
            <button type="button" className="voice-btn" onClick={toggleSpeech}>
              {speaking ? "Speaking... (Stop)" : "Listen in Native Voice"}
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => onAskAssistant(scanResult.disease_name)}
            >
              Ask Krishi Sakhi
            </button>
          </div>
        </div>

        {inv.needs_expert_verification ? (
          <div className="warn-banner" role="status">
            Expert Verification Recommended: Confirm with your local Krishi Vigyan Kendra (KVK) before applying chemical sprays.
          </div>
        ) : null}

        <div className="speech-summary-card">
          <strong>AI Explanation:</strong> {inv.llm_explanation || scanResult.speech_summary}
        </div>

        {scanResult.heatmap_data_url ? (
          <div className="heatmap-compare-grid">
            {scanPreviewUrl ? (
              <div className="heatmap-frame">
                <span>Original Best Leaf Frame</span>
                <img src={scanPreviewUrl} alt="Original scanned leaf" />
              </div>
            ) : null}
            <div className="heatmap-frame">
              <span>AI Lesion Attention Heatmap</span>
              <img src={scanResult.heatmap_data_url} alt="Lesion attention heatmap overlay" />
            </div>
          </div>
        ) : null}
      </section>

      <section className="panel-card">
        <h3>Safe Pesticide &amp; IPM Action Plan (Avoid Over-Spraying)</h3>
        <div className="guidance-grid">
          <div className="guidance-box safe-box">
            <h4>1. Organic &amp; Cultural First</h4>
            <ul>
              {(g.organic_controls?.length ? g.organic_controls : ["Follow clean field sanitation and proper drainage."]).map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          </div>

          <div className="guidance-box">
            <h4>2. Verified Treatment &amp; Dosage</h4>
            <ul>
              {inv.action_plan.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>

          <div className="guidance-box danger-box">
            <h4>3. What NOT To Do (Seller Misadvice Guardrail)</h4>
            <ul>
              {(g.do_not_do?.length ? g.do_not_do : ["Do not mix unverified chemicals on shopkeeper advice."]).map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>

          <div className="guidance-box">
            <h4>4. Preventive Farming Practices</h4>
            <ul>
              {g.preventions.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        </div>

        {regionalResource ? (
          <div className="regional-banner">
            <strong>Region-Specific Helpline ({regionalResource.region}):</strong>{" "}
            {regionalResource.helpline_name} — <strong>{regionalResource.helpline_number}</strong> ·{" "}
            {regionalResource.local_center} ({regionalResource.safety_note})
          </div>
        ) : null}
      </section>

      <section className="panel-card">
        <h3>Answer Field Checks to Refine RootCause</h3>
        <p className="muted">Your observations update cause probabilities in real time:</p>

        <div className="questions-grid">
          {inv.follow_up_questions.map((q) => (
            <div key={q.question_id} className="question-box">
              <p>{q.question}</p>
              <div className="btn-group">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    disabled={refining}
                    className={`secondary-btn ${answers[q.question_id] === opt ? "btn-selected" : ""}`}
                    onClick={() => handleAnswerChange(q.question_id, opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel-card">
        <h3>Evidence Comparison (Possible Root Causes)</h3>
        <div className="hypotheses-grid">
          {inv.hypotheses.map((h) => {
            const pct = Math.round(h.likelihood * 100);
            return (
              <article key={h.cause_id} className="hypothesis-card">
                <div className="library-card-head">
                  <strong>{h.title}</strong>
                  <span className="meta-pill">
                    {h.category} · {pct}%
                  </span>
                </div>
                <div className="progress-track" style={{ marginTop: "8px" }}>
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <p className="muted">{h.explanation}</p>
                <p className="lib-label">Supporting Evidence</p>
                <ul>
                  {h.supporting_evidence.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
                <p className="lib-label">Conflicting / Missing Evidence</p>
                <ul>
                  {h.conflicting_evidence.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
