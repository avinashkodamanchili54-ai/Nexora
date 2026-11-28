import { useTranslation } from "react-i18next";

import { useTranslation } from "react-i18next";

export default function HomePage({ onNavigate, farmProfile, weatherAlert, models }) {
  const { t } = useTranslation();
  const modules = [
    {
      id: "farm",
      title: t("homePage.modules.farm.title"),
      desc: t("homePage.modules.farm.desc"),
      cta: t("homePage.modules.farm.cta"),
    },
    {
      id: "radar",
      title: t("homePage.modules.radar.title"),
      desc: t("homePage.modules.radar.desc"),
      cta: t("homePage.modules.radar.cta"),
    },
    {
      id: "scanner",
      title: t("homePage.modules.scanner.title"),
      desc: t("homePage.modules.scanner.desc"),
      cta: t("homePage.modules.scanner.cta"),
    },
    {
      id: "rootcause",
      title: t("homePage.modules.rootcause.title"),
      desc: t("homePage.modules.rootcause.desc"),
      cta: t("homePage.modules.rootcause.cta"),
    },
    {
      id: "assistant",
      title: t("homePage.modules.assistant.title"),
      desc: t("homePage.modules.assistant.desc"),
      cta: t("homePage.modules.assistant.cta"),
    },
    {
      id: "history",
      title: t("homePage.modules.history.title"),
      desc: t("homePage.modules.history.desc"),
      cta: t("homePage.modules.history.cta"),
    },
  ];
const readyModels = models.filter((m) => m.loaded).length;

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
