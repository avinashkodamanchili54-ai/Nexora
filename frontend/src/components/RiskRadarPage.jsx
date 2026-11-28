import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  fetchDiseaseReports,
  fetchForecastingReport,
  playRegionalSpeech,
  reportOutbreakSignal,
  sendAssistantMessage,
  stopRegionalSpeech,
  transcribeVoiceBlob,
} from "../api";
import { LANGUAGES } from "../constants";

export default function RiskRadarPage({
  farmProfile,
  weatherAlert,
  regionalResource,
  outbreaks,
  onOutbreakAdded,
  selectedLanguage,
}) {
  const [outbreakText, setOutbreakText] = useState("");
  const [summaryText, setSummaryText] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [forecastData, setForecastData] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState("");
  const [riskTab, setRiskTab] = useState("baseline");
  const [confirmedReports, setConfirmedReports] = useState([]);

  const handleLoadConfirmedRisks = async () => {
    setRiskTab("confirmed");
    try {
      const data = await fetchDiseaseReports(10);
      setConfirmedReports(data.reports || []);
    } catch {
      setConfirmedReports([]);
    }
  };

  const handleLoadForecasting = async () => {
    setForecastLoading(true);
    setForecastError("");
    try {
      const data = await fetchForecastingReport({
        location: farmProfile.location,
        lat: farmProfile.lat,
        lon: farmProfile.lon,
        crop: farmProfile.crop,
        growthStage: farmProfile.growth_stage,
      });
      setForecastData(data);
    } catch (err) {
      setForecastError(err.message || "Failed to load forecasting report.");
    } finally {
      setForecastLoading(false);
    }
  };
  const [speaking, setSpeaking] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);

  const handleGenerateSummary = async (customQuestion) => {
    setSummaryLoading(true);
    try {
      const prompt =
        customQuestion ||
        `Summarize today's field risk (${weatherAlert?.risk_level || "Moderate"}, ${
          weatherAlert?.humidity_percent ?? 75
        }% humidity, ${weatherAlert?.temperature_c ?? 28}°C) and top preventive actions for ${
          farmProfile.crop
        } (${farmProfile.growth_stage}) in ${farmProfile.location}.`;
      const res = await sendAssistantMessage({
        message: prompt,
        language: selectedLanguage,
        farmer_name: farmProfile.name,
        crop: farmProfile.crop,
        growth_stage: farmProfile.growth_stage,
        location: farmProfile.location,
      });
      setSummaryText(res.reply);
    } finally {
      setSummaryLoading(false);
    }
  };

  const toggleSpeakSummary = () => {
    const text = summaryText || weatherAlert?.advisory;
    if (!text) return;
    if (speaking) {
      stopRegionalSpeech();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    playRegionalSpeech(text, selectedLanguage, () => setSpeaking(false));
  };

  const handleVoiceQuestion = async () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      const rec = new SpeechRec();
      const l = LANGUAGES.find((item) => item.code === selectedLanguage);
      rec.lang = l ? l.speechLang : "en-IN";
      rec.onresult = (evt) => {
        const spoken = evt.results?.[0]?.[0]?.transcript;
        if (spoken) handleGenerateSummary(spoken);
      };
      rec.start();
      return;
    }

    if (recording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const chunks = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks, { type: "audio/webm" });
      const res = await transcribeVoiceBlob(blob, selectedLanguage).catch(() => null);
      if (res?.transcript) handleGenerateSummary(res.transcript);
    };
    mediaRecorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  };

  const handleReportOutbreak = async (e) => {
    e.preventDefault();
    if (!outbreakText.trim()) return;
    const sig = await reportOutbreakSignal({
      location: farmProfile.location,
      crop: farmProfile.crop,
      symptom_summary: outbreakText.trim(),
      severity: "High",
    });
    onOutbreakAdded(sig);
    setOutbreakText("");
  };

  return (
    <div className="stack-layout">
      <section className="panel-card">
        <div className="section-head">
          <div>
            <h2>Field Risk Radar &amp; Early Warning</h2>
            <p className="muted">
              {weatherAlert
                ? `${weatherAlert.source} · ${weatherAlert.location} · ${farmProfile.crop} (${farmProfile.growth_stage})`
                : "Connecting to Open-Meteo weather telemetry..."}
            </p>
          </div>
          {weatherAlert ? (
            <span className={`sev-badge ${weatherAlert.risk_level === "High" ? "sev-high" : "sev-mod"}`}>
              Overall Risk: {weatherAlert.risk_level}
            </span>
          ) : null}
        </div>

        <div className="gemini-voice-bar">
          <div className="btn-group">
            <button
              type="button"
              className="primary-btn"
              disabled={summaryLoading}
              onClick={() => handleGenerateSummary()}
            >
              {summaryLoading ? "Generating Gemini Summary..." : "Gemini Risk Summary"}
            </button>
            <button
              type="button"
              className="secondary-btn"
              disabled={forecastLoading}
              onClick={handleLoadForecasting}
            >
              {forecastLoading ? "Loading 7-Day & Climate..." : "Forecasting (7-Day & Climate)"}
            </button>
            <button type="button" className="voice-btn" onClick={toggleSpeakSummary}>
              {speaking ? "Stop Audio" : "Listen Summary (TTS)"}
            </button>
            <button
              type="button"
              className={`mic-icon-btn ${recording ? "recording" : ""}`}
              onClick={handleVoiceQuestion}
              aria-label="Ask Risk Radar by voice"
              title="Ask Risk Radar by voice (STT)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
          </div>
          {summaryText ? (
            <div className="speech-summary-card chat-markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{summaryText}</ReactMarkdown>
            </div>
          ) : null}
          {forecastError ? <p className="error-text">{forecastError}</p> : null}
          {forecastData ? (
            <div className="speech-summary-card" style={{ marginTop: "0.75rem" }}>
              <div className="section-head" style={{ marginBottom: "0.5rem" }}>
                <strong>7-Day Weather &amp; 30-Day Climate Forecasting ({forecastData.location})</strong>
                <span className="pill-badge">{forecastData.source}</span>
              </div>
              <p><strong>AI Climate &amp; Weather Summary:</strong> {forecastData.ai_summary}</p>
              <p style={{ marginTop: "0.4rem" }}>
                <strong>Estimated Rainfall Timing:</strong> {forecastData.rainfall_guess}
              </p>
              <div className="weather-metrics-grid" style={{ marginTop: "0.75rem" }}>
                <div className="metric-tile">
                  <span>30-Day Climate Avg Max</span>
                  <strong>{forecastData.climate?.avg_max_temp_c}°C</strong>
                </div>
                <div className="metric-tile">
                  <span>Temp Anomaly (7d vs 30d)</span>
                  <strong>{forecastData.climate?.temp_anomaly_c > 0 ? `+${forecastData.climate.temp_anomaly_c}` : forecastData.climate?.temp_anomaly_c}°C</strong>
                </div>
                <div className="metric-tile">
                  <span>30-Day Climate Rain</span>
                  <strong>{forecastData.climate?.total_rain_mm} mm</strong>
                </div>
                <div className="metric-tile">
                  <span>7-Day Expected Rain</span>
                  <strong>{forecastData.climate?.week_total_rain_mm} mm</strong>
                </div>
              </div>
              {forecastData.identified_risks?.length ? (
                <div style={{ marginTop: "0.75rem" }}>
                  <strong>Identified Risks:</strong>
                  <ul style={{ margin: "0.25rem 0 0 1.2rem" }}>
                    {forecastData.identified_risks.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="spray-grid" style={{ marginTop: "0.75rem" }}>
                {forecastData.weekly_forecast?.map((day) => (
                  <div key={day.date} className="spray-card">
                    <strong>{day.date}</strong>
                    <span>{day.temp_min_c}°C – {day.temp_max_c}°C</span>
                    <span>Rain: {day.rain_mm} mm ({day.rain_prob_pct}%)</span>
                    <span>Wind: {day.wind_kmh} km/h</span>
                    <span className="sev-badge sev-mod" style={{ marginTop: "0.25rem" }}>{day.risk}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="btn-group" style={{ marginTop: "0.75rem", marginBottom: "0.75rem" }}>
          <button
            type="button"
            className={riskTab === "baseline" ? "primary-btn" : "secondary-btn"}
            onClick={() => setRiskTab("baseline")}
          >
            Baseline / Old Weather Risks
          </button>
          <button
            type="button"
            className={riskTab === "confirmed" ? "primary-btn" : "secondary-btn"}
            onClick={handleLoadConfirmedRisks}
          >
            Confirmed Diagnosis Risks (LLM + DB)
          </button>
        </div>

        {riskTab === "confirmed" ? (
          <div className="speech-summary-card" style={{ marginBottom: "1rem" }}>
            <strong>Confirmed Field Disease Reports (Saved in Supabase)</strong>
            {confirmedReports.length === 0 ? (
              <p className="muted" style={{ marginTop: "0.4rem" }}>
                No confirmed LLM diagnoses saved yet. Use "Ask LLM to Distinguish" on the Scan Leaf page to confirm and save a diagnosis.
              </p>
            ) : (
              <div className="spray-grid" style={{ marginTop: "0.5rem" }}>
                {confirmedReports.map((rep) => (
                  <div key={rep.id} className="spray-card">
                    <strong>{rep.disease_name}</strong>
                    <span>Crop: {rep.crop_name}</span>
                    <span>Farmer: {rep.username}</span>
                    <span>Confidence: {Math.round((rep.confidence || 0) * 100)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {weatherAlert ? (
          <>
            <div className="weather-metrics-grid">
              <div className="metric-tile">
                <span>Temperature</span>
                <strong>{weatherAlert.temperature_c}°C</strong>
              </div>
              <div className="metric-tile">
                <span>Humidity</span>
                <strong>{weatherAlert.humidity_percent}%</strong>
              </div>
              <div className="metric-tile">
                <span>Rainfall</span>
                <strong>{weatherAlert.precipitation_mm} mm</strong>
              </div>
              <div className="metric-tile">
                <span>Wind Speed</span>
                <strong>{weatherAlert.wind_kmh} km/h</strong>
              </div>
            </div>

            <div className="reminder-box">
              <strong>{weatherAlert.inspection_reminder}</strong>
              <p>{weatherAlert.recommended_action}</p>
            </div>

            <div className="threat-list">
              {weatherAlert.threat_radar.map((item, idx) => (
                <div key={idx} className="threat-item">
                  <div className="threat-head">
                    <strong>{item.threat}</strong>
                    <span>{item.probability_percent}% · {item.risk_level}</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${item.probability_percent}%` }} />
                  </div>
                  <p className="muted">{item.trigger_reason}</p>
                  <p className="tip-text">Action: {item.preventive_tip}</p>
                </div>
              ))}
            </div>

            {weatherAlert.spray_windows?.length ? (
              <div className="spray-planner">
                <h4>5-Day Safe Spray Window Planner</h4>
                <div className="spray-row">
                  {weatherAlert.spray_windows.map((d) => (
                    <div key={d.date} className={`spray-day spray-${d.status.toLowerCase()}`}>
                      <strong>{d.date.slice(5)}</strong>
                      <span>{d.status}</span>
                      <small>{d.rain_mm}mm · {d.wind_kmh}km/h</small>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </section>

      <div className="two-col-layout">
        {regionalResource ? (
          <section className="panel-card regional-card">
            <h3>Regional Agricultural Support ({regionalResource.region})</h3>
            <p className="muted">
              <strong>{regionalResource.helpline_name}:</strong> {regionalResource.helpline_number}
            </p>
            <p className="muted">
              <strong>Local Center:</strong> {regionalResource.local_center}
            </p>
            <p className="tip-text">{regionalResource.safety_note}</p>
          </section>
        ) : null}

        <section className="panel-card">
          <h3>Community Outbreak Signals</h3>
          <form onSubmit={handleReportOutbreak} className="input-row">
            <input
              type="text"
              value={outbreakText}
              onChange={(e) => setOutbreakText(e.target.value)}
              placeholder="Report leaf symptoms nearby..."
            />
            <button type="submit" className="secondary-btn">
              Report
            </button>
          </form>

          <ul className="outbreak-list">
            {outbreaks.slice(0, 5).map((o) => (
              <li key={o.signal_id}>
                <strong>{o.location}</strong> ({o.crop}): {o.symptom_summary}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
