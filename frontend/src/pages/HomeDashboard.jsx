import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useAlerts } from "../context/AlertsContext";

const TILES = [
  { id: "scanner", icon: "📸", key: "scan", color: "tile-green" },
  { id: "radar",   icon: "📡", key: "radar", color: "tile-blue" },
  { id: "assistant", icon: "💬", key: "chat", color: "tile-teal" },
  { id: "history", icon: "📋", key: "history", color: "tile-amber" },
  { id: "__alerts__", icon: "🌦️", key: "weather", color: "tile-sky" },
  { id: "diseases", icon: "🔬", key: "library", color: "tile-purple" },
];

export default function HomeDashboard({ onNavigate, onOpenAlerts }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { unreadCount } = useAlerts();

  const farm = user?.farm_profile || {};
  const firstName = (user?.name || "Farmer").split(" ")[0];
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  const handleTile = (id) => {
    if (id === "__alerts__") { onOpenAlerts(); return; }
    onNavigate(id);
  };

  return (
    <div className="home-dashboard">
      {/* Welcome banner */}
      <div className="dashboard-banner">
        <div className="dashboard-greeting">
          <span className="greeting-wave">🌾</span>
          <div>
            <h2>{t("home.welcome")}, {firstName}!</h2>
            <p className="greeting-date">{today}</p>
          </div>
        </div>
        <div className="dashboard-meta">
          <span className="crop-badge">{user?.crop_type || "Paddy (Rice)"}</span>
          {farm.growth_stage && <span className="stage-badge">{farm.growth_stage}</span>}
          {unreadCount > 0 && (
            <button className="alert-banner-btn" onClick={onOpenAlerts} aria-label={`${unreadCount} alerts`}>
              🔔 {unreadCount} {unreadCount === 1 ? "Alert" : "Alerts"}
            </button>
          )}
        </div>
      </div>

      {/* Quick-action tiles */}
      <div className="tiles-grid" role="list">
        {TILES.map((tile) => (
          <button
            key={tile.id}
            role="listitem"
            type="button"
            className={`feature-tile ${tile.color}`}
            onClick={() => handleTile(tile.id)}
          >
            <span className="tile-icon" aria-hidden="true">{tile.icon}</span>
            <span className="tile-label">{t(`home.${tile.key}`)}</span>
            {tile.id === "__alerts__" && unreadCount > 0 && (
              <span className="tile-badge">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Crop info strip */}
      {farm.location && (
        <div className="farm-strip">
          <span>📍 {farm.location}</span>
          {farm.acreage && <span>· {farm.acreage} ac</span>}
          {farm.variety && <span>· {farm.variety}</span>}
        </div>
      )}
    </div>
  );
}

