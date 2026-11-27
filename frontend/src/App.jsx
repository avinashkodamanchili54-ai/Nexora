import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AlertsProvider } from "./context/AlertsContext";
import {
  clearScanHistory,
  fetchInitialDashboard,
  fetchRegionalResource,
  fetchWeatherAlert,
  predictLeafScan,
  refineRootCause,
} from "./api";
import AlertsPanel from "./components/AlertsPanel";
import AssistantChatPanel from "./components/AssistantChatPanel";
import CropHistoryPanel from "./components/CropHistoryPanel";
import FarmSatellitePage from "./components/FarmSatellitePage";
import Navbar from "./components/Navbar";
import RiskRadarPage from "./components/RiskRadarPage";
import RootCausePanel from "./components/RootCausePanel";
import SmartLeafScannerPanel from "./components/SmartLeafScannerPanel";
import HomeDashboard from "./pages/HomeDashboard";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";

// ─── Page routing ─────────────────────────────────────────────────────────────
const AUTH_PAGES = new Set(["login", "register"]);
const VALID_PAGES = new Set(["dashboard", "home", "farm", "radar", "scanner", "rootcause", "assistant", "history", "profile"]);

function getPageFromHash() {
  const raw = window.location.hash.replace(/^#\/?/, "").trim();
  if (AUTH_PAGES.has(raw)) return raw;
  return VALID_PAGES.has(raw) ? raw : "dashboard";
}

// ─── Main authenticated shell ─────────────────────────────────────────────────
function AppShell() {
  const { user, loading, logout } = useAuth();
  const { i18n } = useTranslation();
  const [page, setPageState] = useState(getPageFromHash);
  const [alertsOpen, setAlertsOpen] = useState(false);

  const setPage = (p) => {
    window.location.hash = `#/${p}`;
    setPageState(p);
    setAlertsOpen(false);
  };

  useEffect(() => {
    const onHashChange = () => {
      const p = getPageFromHash();
      setPageState(p);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Redirect logic
  useEffect(() => {
    if (loading) return;
    if (!user && !AUTH_PAGES.has(page)) setPage("login");
    if (user && AUTH_PAGES.has(page)) setPage("dashboard");
  }, [user, loading, page]);

  // Farm profile from user
  const farmProfile = {
    farmer_id: user?.user_id || "local-01",
    name: user?.name || "Farmer",
    phone: user?.phone || "",
    preferred_language: user?.preferred_language || "en",
    location: user?.farm_profile?.location || "India",
    crop: user?.crop_type || "Paddy (Rice)",
    variety: user?.farm_profile?.variety || "",
    acreage: user?.farm_profile?.acreage || 1,
    sowing_date: user?.farm_profile?.sowing_date || "",
    center_lat: user?.farm_profile?.center_lat || 20.5937,
    center_lon: user?.farm_profile?.center_lon || 78.9629,
    boundary_coords: user?.farm_profile?.boundary_coords || [],
    days_after_sowing: user?.farm_profile?.days_after_sowing || 0,
    growth_stage: user?.farm_profile?.growth_stage || "Vegetative",
  };

  const [models, setModels] = useState([]);
  const [weatherAlert, setWeatherAlert] = useState(null);
  const [regionalResource, setRegionalResource] = useState(null);
  const [outbreaks, setOutbreaks] = useState([]);
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("krishi_sakhi_history") || "[]"); } catch { return []; }
  });
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [scanPreviewUrl, setScanPreviewUrl] = useState("");
  const [refining, setRefining] = useState(false);
  const [selectedScanCrop, setSelectedScanCrop] = useState(farmProfile.crop || "Paddy (Rice)");
  const [cropMode, setCropMode] = useState(() => {
    const isPaddy = (farmProfile.crop || "").toLowerCase().includes("paddy") || (farmProfile.crop || "").toLowerCase().includes("rice");
    return isPaddy ? "paddy" : "general";
  });

  useEffect(() => {
    if (user) {
      const userCrop = user.crop_type || farmProfile.crop || "Paddy (Rice)";
      setSelectedScanCrop(userCrop);
      const isPaddy = userCrop.toLowerCase().includes("paddy") || userCrop.toLowerCase().includes("rice") || user.crop_mode === "paddy";
      setCropMode(isPaddy ? "paddy" : "general");
    }
  }, [user?.crop_type, user?.crop_mode]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    fetchInitialDashboard({
      location: farmProfile.location, lat: farmProfile.center_lat, lon: farmProfile.center_lon,
      crop: farmProfile.crop, growthStage: farmProfile.growth_stage,
    }).then((data) => {
      if (!active) return;
      setWeatherAlert(data.weather);
      setRegionalResource(data.regionalResource);
      setOutbreaks(data.outbreaks);
      setModels(data.models);
      if (data.history.length > 0) {
        setHistory(data.history);
        localStorage.setItem("krishi_sakhi_history", JSON.stringify(data.history));
      }
    }).catch(() => null);
    return () => { active = false; };
  }, [user?.user_id]);

  const handleFarmUpdated = async (profile) => {
    const [alert, regional] = await Promise.all([
      fetchWeatherAlert({ location: profile.location, lat: profile.center_lat, lon: profile.center_lon, crop: profile.crop, growthStage: profile.growth_stage }).catch(() => null),
      fetchRegionalResource(profile.location).catch(() => null),
    ]);
    if (alert) setWeatherAlert(alert);
    if (regional) setRegionalResource(regional);
  };

  const handleScan = async (imageFiles) => {
    const files = Array.isArray(imageFiles) ? imageFiles : imageFiles ? [imageFiles] : [];
    if (!files.length) { setScanError("Please select or capture at least one leaf image."); return; }
    setScanLoading(true); setScanError(""); setScanPreviewUrl(URL.createObjectURL(files[0]));
    try {
      const activeCrop = selectedScanCrop || farmProfile.crop || "Paddy (Rice)";
      const isPaddy = activeCrop.toLowerCase().includes("paddy") || activeCrop.toLowerCase().includes("rice");
      const activeMode = isPaddy ? "paddy" : "general";

      const res = await predictLeafScan({
        imageFiles: files,
        language: farmProfile.preferred_language,
        cropMode: activeMode,
        cropName: activeCrop,
        growthStage: farmProfile.growth_stage,
        humidityPercent: weatherAlert?.humidity_percent ?? 78,
      });
      setScanResult(res);
      const entry = {
        scan_id: res.scan_id, timestamp: new Date().toISOString(), filename: files[0].name,
        crop_mode: res.crop_mode, disease_id: res.disease_id, disease_name: res.disease_name,
        confidence: res.confidence, severity: res.severity, language: res.language,
        quality_score: res.image_quality.quality_score, expert_status: "Pending Review",
      };
      const updated = [entry, ...history];
      setHistory(updated);
      localStorage.setItem("krishi_sakhi_history", JSON.stringify(updated));
      setPage("rootcause");
    } catch (err) {
      setScanError(err.message || "Scan failed.");
    } finally { setScanLoading(false); }
  };

  const handleRefine = async (answers) => {
    if (!scanResult) return;
    setRefining(true);
    try {
      const updatedInv = await refineRootCause({
        scan_id: scanResult.scan_id, disease_id: scanResult.disease_id, confidence: scanResult.confidence,
        crop: farmProfile.crop, growth_stage: farmProfile.growth_stage, language: scanResult.language, answers,
      });
      setScanResult((prev) => prev ? { ...prev, investigation: updatedInv } : prev);
    } finally { setRefining(false); }
  };

  const handleHistoryUpdated = (updated) =>
    setHistory((prev) => prev.map((h) => h.scan_id === updated.scan_id ? updated : h));

  const handleClearHistory = async () => {
    await clearScanHistory().catch(() => null);
    setHistory([]); localStorage.removeItem("krishi_sakhi_history");
  };

  if (loading) {
    return (
      <div className="splash-screen">
        <div className="splash-logo">🌾</div>
        <p>Loading Krishi Sakhi AI…</p>
      </div>
    );
  }

  // ── Auth pages (no navbar) ──────────────────────────────────────────────────
  if (page === "login") return <LoginPage onNavigate={setPage} />;
  if (page === "register") return <RegisterPage onNavigate={setPage} />;
  if (!user) return <LoginPage onNavigate={setPage} />;

  // ── Authenticated shell ─────────────────────────────────────────────────────
  const readyModels = models.filter((m) => m.loaded).length;
  const appTab = ["home", "farm", "radar", "scanner", "rootcause", "assistant", "history"].includes(page) ? page : "home";

  return (
    <div className="app-shell">
      <Navbar
        activeTab={appTab}
        onSelectTab={setPage}
        models={models}
        onOpenAlerts={() => setAlertsOpen((v) => !v)}
        onOpenProfile={() => setPage("profile")}
      />

      {alertsOpen && (
        <>
          <div className="alerts-backdrop" onClick={() => setAlertsOpen(false)} aria-hidden="true" />
          <AlertsPanel onClose={() => setAlertsOpen(false)} onNavigate={setPage} />
        </>
      )}

      {/* Profile page — full screen, no tabs */}
      {page === "profile" ? (
        <main className="main-content">
          <ProfilePage onNavigate={setPage} />
        </main>
      ) : (
        <main className="main-content">
          {/* KPI strip */}
          <section className="kpi-strip" aria-label="Farm Health Overview">
            <div className="kpi-card">
              <span className="kpi-label">Registered Farm</span>
              <strong>{farmProfile.crop} ({farmProfile.acreage} ac)</strong>
              <span className="kpi-sub">{farmProfile.growth_stage}</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Live Weather Risk</span>
              <strong>{weatherAlert ? `${weatherAlert.risk_level} Risk` : "Syncing..."}</strong>
              <span className="kpi-sub">
                {weatherAlert
                  ? `${weatherAlert.temperature_c}°C · ${weatherAlert.humidity_percent}% RH`
                  : farmProfile.location}
              </span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">AI Engine</span>
              <strong>{readyModels}/2 Models · Gemini LLM</strong>
              <span className="kpi-sub">PlantVillage · Paddy Doctor</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Recent Scans</span>
              <strong>{history.length} Recorded</strong>
              <span className="kpi-sub">{scanResult ? `Latest: ${scanResult.disease_name}` : "Ready for SmartScan"}</span>
            </div>
          </section>

          <div className="tab-stage" key={page}>
            {(page === "dashboard" || page === "home") && (
              <HomeDashboard onNavigate={setPage} onOpenAlerts={() => setAlertsOpen(true)} />
            )}
            {page === "farm" && (
              <FarmSatellitePage farmProfile={farmProfile} onFarmUpdated={handleFarmUpdated} uiLanguage={farmProfile.preferred_language} />
            )}
            {page === "radar" && (
              <RiskRadarPage farmProfile={farmProfile} weatherAlert={weatherAlert} regionalResource={regionalResource}
                outbreaks={outbreaks} onOutbreakAdded={(sig) => setOutbreaks((p) => [sig, ...p])} selectedLanguage={farmProfile.preferred_language} />
            )}
            {page === "scanner" && (
              <SmartLeafScannerPanel
                language={farmProfile.preferred_language}
                onLanguageChange={() => {}}
                cropMode={cropMode}
                onCropModeChange={setCropMode}
                selectedCrop={selectedScanCrop}
                onSelectedCropChange={(crop) => {
                  setSelectedScanCrop(crop);
                  const isPaddy = crop.toLowerCase().includes("paddy") || crop.toLowerCase().includes("rice");
                  setCropMode(isPaddy ? "paddy" : "general");
                }}
                onScan={handleScan}
                loading={scanLoading}
                error={scanError}
                scanResult={scanResult}
              />
            )}
            {page === "rootcause" && (
              <RootCausePanel scanResult={scanResult} scanPreviewUrl={scanPreviewUrl}
                regionalResource={regionalResource} selectedLanguage={farmProfile.preferred_language}
                onRefine={handleRefine} refining={refining} onAskAssistant={() => setPage("assistant")} />
            )}
            {page === "assistant" && (
              <AssistantChatPanel farmProfile={farmProfile} latestDiagnosis={scanResult?.disease_name}
                initialLang={farmProfile.preferred_language} />
            )}
            {page === "history" && (
              <CropHistoryPanel history={history} models={models} onHistoryUpdated={handleHistoryUpdated} onClear={handleClearHistory} />
            )}
          </div>
        </main>
      )}
    </div>
  );
}

// ─── Root with providers ──────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AlertsProviderWrapper />
    </AuthProvider>
  );
}

function AlertsProviderWrapper() {
  return (
    <AlertsProvider>
      <AppShell />
    </AlertsProvider>
  );
}
