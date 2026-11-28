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
  const [forecastView, setForecastView] = useState("weather"); // 'weather' or 'climate'
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
            <div className="speech-summary-card" style={{ marginTop: "0.75rem", background: "var(--card-bg, #1e293b)", borderRadius: "12px", padding: "1.2rem", border: "1px solid var(--border-color, #334155)" }}>
              {/* Header with Weather vs Climate Switch */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span>🌤️</span> 7-Day Weather &amp; 30-Day Climate Analysis
                  </h3>
                  <small className="muted">{forecastData.location} · {farmProfile.crop} ({farmProfile.growth_stage})</small>
                </div>
                {/* Switch Button */}
                <div style={{ display: "inline-flex", background: "rgba(0,0,0,0.3)", padding: "3px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <button
                    type="button"
                    style={{
                      padding: "6px 14px",
                      borderRadius: "6px",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      background: forecastView === "weather" ? "#10b981" : "transparent",
                      color: forecastView === "weather" ? "#fff" : "#94a3b8",
                      transition: "all 0.2s ease"
                    }}
                    onClick={() => setForecastView("weather")}
                  >
                    ⛅ Weather Forecast (7-Day)
                  </button>
                  <button
                    type="button"
                    style={{
                      padding: "6px 14px",
                      borderRadius: "6px",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      background: forecastView === "climate" ? "#3b82f6" : "transparent",
                      color: forecastView === "climate" ? "#fff" : "#94a3b8",
                      transition: "all 0.2s ease"
                    }}
                    onClick={() => setForecastView("climate")}
                  >
                    🌍 Climate Trends &amp; Norms
                  </button>
                </div>
              </div>

              {/* Weather App Style Interactive Graph */}
              {forecastView === "weather" ? (
                <div style={{ marginBottom: "1.2rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#38bdf8" }}>📈 7-Day Temperature (°C) &amp; Rain Probability (%) Curve</span>
                    <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Max Temp (Orange) · Min Temp (Blue) · Rain % (Cyan bars)</span>
                  </div>

                  {/* SVG Line & Bar Chart */}
                  <div style={{ width: "100%", overflowX: "auto", background: "rgba(15, 23, 42, 0.6)", borderRadius: "8px", padding: "10px 4px" }}>
                    <svg viewBox="0 0 700 210" style={{ width: "100%", minWidth: "550px", height: "200px" }}>
                      <defs>
                        <linearGradient id="rainBarGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.2" />
                        </linearGradient>
                      </defs>

                      {/* Grid lines */}
                      {[40, 80, 120, 160].map((y) => (
                        <line key={y} x1="30" y1={y} x2="680" y2={y} stroke="rgba(255,255,255,0.07)" strokeDasharray="4 4" />
                      ))}

                      {/* Render Bars for Rain Probability */}
                      {forecastData.weekly_forecast?.map((day, idx) => {
                        const x = 50 + idx * 90;
                        const barHeight = Math.max(4, (day.rain_prob_pct / 100) * 110);
                        const y = 170 - barHeight;
                        return (
                          <g key={`bar-${idx}`}>
                            <rect
                              x={x + 10}
                              y={y}
                              width="28"
                              height={barHeight}
                              rx="4"
                              fill="url(#rainBarGrad)"
                            />
                            <text x={x + 24} y={y - 6} textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold">
                              {day.rain_prob_pct}%
                            </text>
                            <text x={x + 24} y="195" textAnchor="middle" fill="#94a3b8" fontSize="11">
                              {day.date.slice(5)}
                            </text>
                          </g>
                        );
                      })}

                      {/* Render Max Temp Line */}
                      {(() => {
                        const points = forecastData.weekly_forecast?.map((d, i) => {
                          const x = 50 + i * 90 + 24;
                          // Scale temp (range 15-45C mapped to y: 140 to 30)
                          const y = 150 - ((d.temp_max_c - 15) / 30) * 120;
                          return { x, y, temp: d.temp_max_c };
                        }) || [];

                        const minPoints = forecastData.weekly_forecast?.map((d, i) => {
                          const x = 50 + i * 90 + 24;
                          const y = 150 - ((d.temp_min_c - 15) / 30) * 120;
                          return { x, y, temp: d.temp_min_c };
                        }) || [];

                        const maxPath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
                        const minPath = minPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

                        return (
                          <>
                            {/* Max Temp Line */}
                            <path d={maxPath} fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
                            {points.map((p, i) => (
                              <g key={`max-dot-${i}`}>
                                <circle cx={p.x} cy={p.y} r="4.5" fill="#f97316" stroke="#fff" strokeWidth="1.5" />
                                <text x={p.x} y={p.y - 8} textAnchor="middle" fill="#fb923c" fontSize="11" fontWeight="bold">
                                  {p.temp}°
                                </text>
                              </g>
                            ))}

                            {/* Min Temp Line */}
                            <path d={minPath} fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeDasharray="3 3" strokeLinecap="round" />
                            {minPoints.map((p, i) => (
                              <g key={`min-dot-${i}`}>
                                <circle cx={p.x} cy={p.y} r="3.5" fill="#3b82f6" stroke="#fff" strokeWidth="1" />
                                <text x={p.x} y={p.y + 16} textAnchor="middle" fill="#93c5fd" fontSize="10">
                                  {p.temp}°
                                </text>
                              </g>
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                </div>
              ) : (
                /* Climate View */
                <div style={{ marginBottom: "1.2rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#60a5fa" }}>📊 30-Day Climate Baseline vs 7-Day Forecast Comparison</span>
                  </div>
                  <div className="weather-metrics-grid" style={{ marginTop: "0.5rem" }}>
                    <div className="metric-tile" style={{ borderLeft: "4px solid #3b82f6" }}>
                      <span>30-Day Historical Avg Max</span>
                      <strong>{forecastData.climate?.avg_max_temp_c}°C</strong>
                      <small className="muted">District baseline norm</small>
                    </div>
                    <div className="metric-tile" style={{ borderLeft: "4px solid #f97316" }}>
                      <span>Temperature Anomaly</span>
                      <strong>{forecastData.climate?.temp_anomaly_c > 0 ? `+${forecastData.climate.temp_anomaly_c}` : forecastData.climate?.temp_anomaly_c}°C</strong>
                      <small className="muted">Difference from 30-day normal</small>
                    </div>
                    <div className="metric-tile" style={{ borderLeft: "4px solid #06b6d4" }}>
                      <span>30-Day Cumulative Rain</span>
                      <strong>{forecastData.climate?.total_rain_mm} mm</strong>
                      <small className="muted">Past month precipitation</small>
                    </div>
                    <div className="metric-tile" style={{ borderLeft: "4px solid #10b981" }}>
                      <span>7-Day Expected Rain</span>
                      <strong>{forecastData.climate?.week_total_rain_mm} mm</strong>
                      <small className="muted">Upcoming 7-day projection</small>
                    </div>
                  </div>
                </div>
              )}

              {/* Crop-Specific Risk & Weather Factors */}
              <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: "8px", padding: "12px", marginBottom: "1rem" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#e2e8f0", fontSize: "0.95rem" }}>
                  🌾 Crop Weather Sensitivity Factors for {farmProfile.crop} ({farmProfile.growth_stage}):
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", fontSize: "0.85rem" }}>
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "8px 10px", borderRadius: "6px" }}>
                    <span style={{ color: "#94a3b8" }}>🌧️ Rainfall Timing: </span>
                    <strong style={{ color: "#38bdf8" }}>{forecastData.rainfall_guess}</strong>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "8px 10px", borderRadius: "6px" }}>
                    <span style={{ color: "#94a3b8" }}>🌬️ Spore Dispersal Risk: </span>
                    <strong style={{ color: forecastData.weekly_forecast?.some(d => d.wind_kmh > 15) ? "#f59e0b" : "#10b981" }}>
                      {forecastData.weekly_forecast?.some(d => d.wind_kmh > 15) ? "Moderate (Wind > 15 km/h)" : "Low Wind Spread"}
                    </strong>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "8px 10px", borderRadius: "6px" }}>
                    <span style={{ color: "#94a3b8" }}>💧 Fungal Moisture Window: </span>
                    <strong style={{ color: forecastData.climate?.week_total_rain_mm > 10 ? "#ef4444" : "#10b981" }}>
                      {forecastData.climate?.week_total_rain_mm > 10 ? "High Leaf Wetness Danger" : "Favorable / Safe"}
                    </strong>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "8px 10px", borderRadius: "6px" }}>
                    <span style={{ color: "#94a3b8" }}>🛡️ Spray Recommendation: </span>
                    <strong style={{ color: forecastData.rainfall_guess.toLowerCase().includes("no significant") ? "#10b981" : "#f59e0b" }}>
                      {forecastData.rainfall_guess.toLowerCase().includes("no significant") ? "Clear to Spray Today" : "Delay Spray (Rain Ahead)"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* AI Weather Summary */}
              <div style={{ borderLeft: "3px solid #10b981", paddingLeft: "10px", margin: "10px 0" }}>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "#f1f5f9" }}>
                  <strong>🤖 AI Climate &amp; Weather Summary:</strong> {forecastData.ai_summary}
                </p>
              </div>

              {/* Identified Risks */}
              {forecastData.identified_risks?.length ? (
                <div style={{ marginTop: "0.75rem", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", padding: "10px" }}>
                  <strong style={{ color: "#fca5a5", fontSize: "0.9rem" }}>⚠️ Identified Weather &amp; Crop Threats:</strong>
                  <ul style={{ margin: "0.35rem 0 0 1.2rem", fontSize: "0.85rem", color: "#fecaca" }}>
                    {forecastData.identified_risks.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* 7-Day Day-by-Day Cards */}
              <div className="spray-grid" style={{ marginTop: "1rem" }}>
                {forecastData.weekly_forecast?.map((day) => (
                  <div key={day.date} className="spray-card" style={{ textAlign: "center" }}>
                    <strong style={{ display: "block", fontSize: "0.85rem" }}>{day.date}</strong>
                    <div style={{ margin: "4px 0", fontSize: "1.05rem", fontWeight: 700, color: "#fb923c" }}>
                      {day.temp_max_c}° <span style={{ fontSize: "0.85rem", color: "#93c5fd", fontWeight: 400 }}>/ {day.temp_min_c}°</span>
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#38bdf8" }}>🌧️ {day.rain_prob_pct}% ({day.rain_mm}mm)</div>
                    <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>💨 {day.wind_kmh} km/h</div>
                    <span className={`sev-badge ${day.risk.toLowerCase().includes("high") ? "sev-high" : day.risk.toLowerCase().includes("mod") ? "sev-mod" : "sev-none"}`} style={{ marginTop: "0.35rem", display: "inline-block", fontSize: "0.75rem" }}>
                      {day.risk}
                    </span>
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
