export default function HomePage({ onNavigate, farmProfile, weatherAlert, models }) {
  const readyModels = models.filter((m) => m.loaded).length;

  const modules = [
    {
      id: "farm",
      title: "1. Farm & Satellite Selector",
      desc: "Search any city/village, use Live GPS, and outline your farm boundary on Esri Satellite imagery.",
      cta: "Open Satellite Map",
    },
    {
      id: "radar",
      title: "2. Field Risk Radar",
      desc: "Live Open-Meteo weather, crop-stage threat probabilities, 5-day safe spray window, and KVK helpline.",
      cta: "View Risk Radar",
    },
    {
      id: "scanner",
      title: "3. Multi-Frame Smart Leaf Scanner",
      desc: "Upload 1–3 leaf photos with automatic foliage, blur, and lighting checks + MobileNetV2 diagnosis.",
      cta: "Scan Crop Leaf",
    },
    {
      id: "rootcause",
      title: "4. RootCause Investigation AI",
      desc: "Compare Disease vs. Nutrient vs. Pest evidence, answer quick checks, and get IPM-safe dosages.",
      cta: "Open RootCause AI",
    },
    {
      id: "assistant",
      title: "5. Krishi Sakhi Voice & Chat",
      desc: "Ask questions in Telugu, Hindi, Tamil, Kannada, or English with Gemini LLM + neural voice.",
      cta: "Talk to Sakhi AI",
    },
    {
      id: "history",
      title: "6. Crop Health History",
      desc: "Track before/after scans, view AI model accuracies, and mark KVK expert verification.",
      cta: "View History",
    },
  ];

  return (
    <div className="stack-layout">
      <section className="panel-card home-hero-card">
        <div className="home-hero-grid">
          <div>
            <span className="sev-badge sev-none">Farmer-Friendly · Voice-First · Multilingual</span>
            <h2 className="home-title">
              Predictive Crop Health &amp; Root-Cause Intelligence
            </h2>
            <p className="muted home-lead">
              KRISHI SAKHI AI helps farmers detect crop threats early, investigate the true root cause, avoid inappropriate pesticide mixes, and receive clear guidance in their native language.
            </p>
            <div className="btn-group" style={{ marginTop: "14px" }}>
              <button type="button" className="primary-btn" onClick={() => onNavigate("scanner")}>
                Start Leaf Scan
              </button>
              <button type="button" className="secondary-btn" onClick={() => onNavigate("farm")}>
                Select Farm on Satellite
              </button>
              <button type="button" className="voice-btn" onClick={() => onNavigate("assistant")}>
                Ask Sakhi Voice AI
              </button>
            </div>
          </div>

          <div className="home-highlights">
            <div className="highlight-item">
              <strong>{readyModels}/3 Specialist AI Models</strong>
              <span>Rice UCI, PlantDoc (Field), PlantVillage (38-Class)</span>
            </div>
            <div className="highlight-item">
              <strong>5 Indian Languages + Neural Voice</strong>
              <span>Telugu, Hindi, Tamil, Kannada &amp; English</span>
            </div>
            <div className="highlight-item">
              <strong>Active Farm: {farmProfile.crop}</strong>
              <span>
                {farmProfile.growth_stage} · {weatherAlert ? `${weatherAlert.risk_level} Risk` : farmProfile.location}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="panel-card">
        <h2>Explore Platform Modules</h2>
        <p className="muted">Each capability has its own dedicated workspace:</p>
        <div className="home-modules-grid">
          {modules.map((m) => (
            <article key={m.id} className="module-card">
              <h3>{m.title}</h3>
              <p className="muted">{m.desc}</p>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => onNavigate(m.id)}
              >
                {m.cta}
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
