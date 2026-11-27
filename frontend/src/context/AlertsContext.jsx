import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { API_BASE } from "../constants";
import { useAuth } from "./AuthContext";

const AlertsContext = createContext(null);

export function AlertsProvider({ children }) {
  const { user, token } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchAlerts = useCallback(async () => {
    if (!user) return;
    const farm = user.farm_profile || {};
    const params = new URLSearchParams({
      crop: user.crop_type || "Paddy (Rice)",
      growth_stage: farm.growth_stage || "Vegetative",
      ...(farm.center_lat ? { lat: farm.center_lat, lon: farm.center_lon } : {}),
      ...(farm.location ? { location: farm.location } : {}),
    });
    try {
      const res = await fetch(`${API_BASE}/api/alerts?${params}`);
      if (res.ok) {
        const data = await res.json();
        const readIds = JSON.parse(localStorage.getItem("nexora_read_alerts") || "[]");
        const enriched = data.alerts.map((a) => ({ ...a, read: readIds.includes(a.id) }));
        setAlerts(enriched);
        setUnreadCount(enriched.filter((a) => !a.read).length);
      }
    } catch { /* network unavailable, keep last state */ }
  }, [user]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000); // poll every 5 min
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const markAllRead = () => {
    const ids = alerts.map((a) => a.id);
    localStorage.setItem("nexora_read_alerts", JSON.stringify(ids));
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    setUnreadCount(0);
  };

  return (
    <AlertsContext.Provider value={{ alerts, unreadCount, markAllRead, refetch: fetchAlerts }}>
      {children}
    </AlertsContext.Provider>
  );
}

export function useAlerts() {
  const ctx = useContext(AlertsContext);
  if (!ctx) throw new Error("useAlerts must be inside AlertsProvider");
  return ctx;
}

