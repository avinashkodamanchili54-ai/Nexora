import { useTranslation } from "react-i18next";
import { useAlerts } from "../context/AlertsContext";

const SEVERITY_STYLES = {
  critical: { border: "#dc2626", bg: "#fef2f2", badge: "alert-critical" },
  high:     { border: "#ea580c", bg: "#fff7ed", badge: "alert-high" },
  moderate: { border: "#d97706", bg: "#fffbeb", badge: "alert-moderate" },
  info:     { border: "#0284c7", bg: "#f0f9ff", badge: "alert-info" },
};

export default function AlertsPanel({ onClose, onNavigate }) {
  const { t } = useTranslation();
  const { alerts, unreadCount, markAllRead } = useAlerts();

  return (
    <div className="alerts-panel" role="dialog" aria-modal="true" aria-label={t("alerts.title")}>
      <div className="alerts-header">
        <h3>{t("alerts.title")}</h3>
        <div className="alerts-header-actions">
          {unreadCount > 0 && (
            <button type="button" className="link-btn" onClick={markAllRead}>
              {t("alerts.markRead")}
            </button>
          )}
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close alerts">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="alerts-empty">
          <span>🌿</span>
          <p>{t("alerts.noAlerts")}</p>
        </div>
      ) : (
        <ul className="alerts-list" role="list">
          {alerts.map((alert) => {
            const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info;
            return (
              <li
                key={alert.id}
                className={`alert-item ${alert.read ? "alert-read" : "alert-unread"}`}
                style={{ borderLeftColor: style.border, background: style.bg }}
              >
                <div className="alert-top">
                  <span className="alert-icon">{alert.icon || "⚠️"}</span>
                  <span className="alert-title">{alert.title}</span>
                  <span className={`alert-badge ${style.badge}`}>{alert.severity}</span>
                </div>
                <p className="alert-body">{alert.body}</p>
                {alert.action && alert.action_tab && (
                  <button
                    type="button"
                    className="alert-action-btn"
                    onClick={() => { onNavigate(alert.action_tab); onClose(); }}
                  >
                    {alert.action} →
                  </button>
                )}
                <span className="alert-time">
                  {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

