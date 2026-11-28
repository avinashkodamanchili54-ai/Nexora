import { useTranslation } from "react-i18next";
import { LANGUAGES, TABS } from "../constants";
import { useAuth } from "../context/AuthContext";
import { useAlerts } from "../context/AlertsContext";
import i18n from "../i18n";

const STEP_ICONS = {
  home: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  farm: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  ),
  radar: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
      <circle cx="12" cy="12" r="9" /><path d="M12 3v9l6 3" />
    </svg>
  ),
  scanner: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  rootcause: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  ),
  assistant: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  history: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
      <path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><path d="M12 7v5l4 2" />
    </svg>
  ),
};

const SHORT_LANG = { en: "EN", te: "తె", hi: "हि", ta: "த", kn: "ಕ" };

export default function Navbar({ activeTab, onSelectTab, models, currentLang, onSelectLanguage, onOpenAlerts, onOpenProfile }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { unreadCount } = useAlerts();
  const readyCount = models.filter((m) => m.loaded).length;
  const initials = (user?.name || "F").slice(0, 2).toUpperCase();
  const activeLanguage = currentLang || i18n.language || "en";

  return (
    <header className="hero-header">
      <div className="hero-inner">
        <div className="brand-block">
          <div className="brand-emblem" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 22V10" /><path d="M12 14C12 8.5 16.5 4 21 4c0 4.5-4.5 10-9 10Z" />
              <path d="M12 11C12 6.5 8 3 3 3c0 4.5 4 8 9 8Z" />
            </svg>
          </div>
          <div>
            <div className="title-row">
              <h1>KRISHI SAKHI AI</h1>
              <span className="hero-chip">Predictive Crop Health · RootCause AI</span>
            </div>
            <p className="hero-tagline">{t("tagline")}</p>
          </div>
        </div>

        <div className="header-controls">
          <div className="glass-pill" title="AI Engine Status">
            <span className={`dot ${readyCount > 0 ? "dot-live" : "dot-warn"}`} />
            <span>{readyCount}/2 Models · {user?.crop_type || "Paddy"}</span>
          </div>

          {/* Language selector */}
          <div className="lang-pill-group" role="group" aria-label="Language Switch">
            {LANGUAGES.map((l) => (
              <button key={l.code} type="button"
                className={`lang-pill-btn ${activeLanguage === l.code ? "active" : ""}`}
                onClick={() => {
                  if (onSelectLanguage) {
                    onSelectLanguage(l.code);
                  } else {
                    i18n.changeLanguage(l.code);
                    localStorage.setItem("nexora_lang", l.code);
                  }
                }}
                title={l.label}
              >
                {SHORT_LANG[l.code]}
              </button>
            ))}
          </div>

          {/* Alerts bell */}
          <button type="button" className="icon-btn icon-btn-nav" onClick={onOpenAlerts}
            aria-label={`${unreadCount} alerts`} title={t("nav.alerts")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && <span className="bell-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
          </button>

          {/* Profile avatar */}
          <button type="button" className="avatar-btn" onClick={onOpenProfile}
            aria-label={t("nav.profile")} title={t("nav.profile")}>
            {initials}
          </button>
        </div>
      </div>

      <nav className="stepper-nav" aria-label="Farmer Journey Pages">
        {TABS.map((tab) => (
          <button key={tab.id} type="button"
            className={`step-pill ${activeTab === tab.id ? "active" : ""}`}
            aria-current={activeTab === tab.id ? "page" : undefined}
            onClick={() => onSelectTab(tab.id)}
          >
            {STEP_ICONS[tab.id]}
            <span>{t(`tabs.${tab.id}`)}</span>
          </button>
        ))}
      </nav>
    </header>
  );
}
