import { useEffect, useState } from "react";
import {
  clearScanHistory,
  fetchInitialDashboard,
  fetchRegionalResource,
  fetchWeatherAlert,
  predictLeafScan,
  refineRootCause,
} from "./api";
import AssistantChatPanel from "./components/AssistantChatPanel";
import CropHistoryPanel from "./components/CropHistoryPanel";
import FarmSatellitePage from "./components/FarmSatellitePage";
import HomePage from "./components/HomePage";
import Navbar from "./components/Navbar";
import RiskRadarPage from "./components/RiskRadarPage";
import RootCausePanel from "./components/RootCausePanel";
import SmartLeafScannerPanel from "./components/SmartLeafScannerPanel";

const DEFAULT_FARM = {
  farmer_id: "local-01",
  name: "Ramesh Naidu",
  phone: "9876543210",
  preferred_language: "te",
  location: "Guntur, Andhra Pradesh",
  crop: "Paddy (Rice)",
  variety: "BPT 5204 (Samba Mahsuri)",
  acreage: 2.5,
  sowing_date: "2026-10-15",
  center_lat: 16.3067,
  center_lon: 80.4365,
  boundary_coords: [],
  days_after_sowing: 43,
  growth_stage: "Vegetative / Tillering",
};

const VALID_PAGES = new Set(["home", "farm", "radar", "scanner", "rootcause", "assistant", "history"]);

function getPageFromHash() {
  const raw = window.location.hash.replace(/^#\/?/, "").trim();
  return VALID_PAGES.has(raw) ? raw : "home";
}

export default function App() {
  const [activeTab, setActiveTabState] = useState(getPageFromHash);
  const [uiLanguage, setUiLanguage] = useState("te");

  const setActiveTab = (page) => {
    window.location.hash = `#/${page}`;
    setActiveTabState(page);
  };

  useEffect(() => {
    const onHashChange = () => setActiveTabState(getPageFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  const [scanLanguage, setScanLanguage] = useState("te");
  const [cropMode, setCropMode] = useState("general");

  const [farmProfile, setFarmProfile] = useState(() => {
    try {
      const saved = localStorage.getItem("krishi_sakhi_farm");
      return saved ? JSON.parse(saved) : DEFAULT_FARM;
    } catch {
      return DEFAULT_FARM;
    }
  });

  const [models, setModels] = useState([]);
  const [weatherAlert, setWeatherAlert] = useState(null);
  const [regionalResource, setRegionalResource] = useState(null);
  const [outbreaks, setOutbreaks] = useState([]);
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("krishi_sakhi_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [scanPreviewUrl, setScanPreviewUrl] = useState("");
  const [refining, setRefining] = useState(false);

  useEffect(() => {
    let active = true;
    fetchInitialDashboard({
      location: farmProfile.location,
      lat: farmProfile.center_lat,
      lon: farmProfile.center_lon,
      crop: farmProfile.crop,
      growthStage: farmProfile.growth_stage,
    })
      .then((data) => {
        if (!active) return;
        setWeatherAlert(data.weather);
        setRegionalResource(data.regionalResource);
        setOutbreaks(data.outbreaks);
        setModels(data.models);
        if (data.history.length > 0) {
          setHistory(data.history);
          localStorage.setItem("krishi_sakhi_history", JSON.stringify(data.history));
        }
      })
      .catch(() => null);

    return () => {
      active = false;
    };
  }, []);

  const handleFarmUpdated = async (profile) => {
    setFarmProfile(profile);
    localStorage.setItem("krishi_sakhi_farm", JSON.stringify(profile));
    const [alert, regional] = await Promise.all([
      fetchWeatherAlert({
        location: profile.location,
        lat: profile.center_lat,
        lon: profile.center_lon,
        crop: profile.crop,
        growthStage: profile.growth_stage,
      }).catch(() => null),
      fetchRegionalResource(profile.location).catch(() => null),
    ]);
    if (alert) setWeatherAlert(alert);
    if (regional) setRegionalResource(regional);
  };

  const handleScan = async (imageFiles) => {
    const files = Array.isArray(imageFiles) ? imageFiles : imageFiles ? [imageFiles] : [];
    if (files.length === 0) {
      setScanError("Please select or capture at least one leaf image.");
      return;
    }
    setScanLoading(true);
    setScanError("");
    setScanPreviewUrl(URL.createObjectURL(files[0]));
    try {
      const res = await predictLeafScan({
        imageFiles: files,
        language: scanLanguage,
        cropMode,
        cropName: farmProfile.crop,
        growthStage: farmProfile.growth_stage,
        humidityPercent: weatherAlert?.humidity_percent ?? 78,
      });
      setScanResult(res);

      const newEntry = {
        scan_id: res.scan_id,
        timestamp: new Date().toISOString(),
        filename: files[0].name,
        crop_mode: res.crop_mode,
        disease_id: res.disease_id,
        disease_name: res.disease_name,
        confidence: res.confidence,
        severity: res.severity,
        language: res.language,
        quality_score: res.image_quality.quality_score,
        expert_status: "Pending Review",
      };
      const updatedHist = [newEntry, ...history];
      setHistory(updatedHist);
      localStorage.setItem("krishi_sakhi_history", JSON.stringify(updatedHist));
      setActiveTab("rootcause");
    } catch (err) {
      setScanError(err.message || "Scan failed.");
    } finally {
      setScanLoading(false);
    }
  };

  const handleRefine = async (answers) => {
    if (!scanResult) return;
    setRefining(true);
    try {
      const updatedInv = await refineRootCause({
        scan_id: scanResult.scan_id,
        disease_id: scanResult.disease_id,
        confidence: scanResult.confidence,
        crop: farmProfile.crop,
        growth_stage: farmProfile.growth_stage,
        language: scanResult.language,
        answers,
      });
      setScanResult((prev) => (prev ? { ...prev, investigation: updatedInv } : prev));
    } finally {
      setRefining(false);
    }
  };

  const handleHistoryUpdated = (updatedEntry) => {
    const next = history.map((h) => (h.scan_id === updatedEntry.scan_id ? updatedEntry : h));
    setHistory(next);
    localStorage.setItem("krishi_sakhi_history", JSON.stringify(next));
  };

  const handleClearHistory = async () => {
    await clearScanHistory().catch(() => null);
    setHistory([]);
    localStorage.removeItem("krishi_sakhi_history");
  };

  const readyModels = models.filter((m) => m.loaded).length;

  return (
    <div className="app-shell">
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        models={models}
        uiLanguage={uiLanguage}
        onUiLanguageChange={(lang) => {
          setUiLanguage(lang);
          setScanLanguage(lang);
        }}
        farmProfile={farmProfile}
      />

      <main className="main-content">
        <section className="kpi-strip" aria-label="Farm Health Overview">
          <div className="kpi-card">
            <span className="kpi-label">Registered Farm</span>
            <strong>{farmProfile.crop} ({farmProfile.acreage} ac)</strong>
            <span className="kpi-sub">{farmProfile.growth_stage} · Day {farmProfile.days_after_sowing}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Live Weather Risk</span>
            <strong>{weatherAlert ? `${weatherAlert.risk_level} Risk` : "Syncing..."}</strong>
            <span className="kpi-sub">
              {weatherAlert
                ? `${weatherAlert.temperature_c}°C · ${weatherAlert.humidity_percent}% RH · ${weatherAlert.location.split(",")[0]}`
                : farmProfile.location}
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">AI &amp; Voice Engine</span>
            <strong>{readyModels}/3 ML + Gemini LLM</strong>
            <span className="kpi-sub">Neural Voice: EN · TE · HI · TA · KN</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Recent Crop Scans</span>
            <strong>{history.length} Recorded</strong>
            <span className="kpi-sub">
              {scanResult ? `Latest: ${scanResult.disease_name}` : "Ready for SmartScan"}
            </span>
          </div>
        </section>

        <div className="tab-stage" key={activeTab}>
          {activeTab === "home" ? (
            <HomePage
              onNavigate={setActiveTab}
              farmProfile={farmProfile}
              weatherAlert={weatherAlert}
              models={models}
            />
          ) : null}

          {activeTab === "farm" ? (
            <FarmSatellitePage
              farmProfile={farmProfile}
              onFarmUpdated={handleFarmUpdated}
              uiLanguage={uiLanguage}
            />
          ) : null}

          {activeTab === "radar" ? (
            <RiskRadarPage
              farmProfile={farmProfile}
              weatherAlert={weatherAlert}
              regionalResource={regionalResource}
              outbreaks={outbreaks}
              onOutbreakAdded={(sig) => setOutbreaks((prev) => [sig, ...prev])}
              selectedLanguage={uiLanguage}
            />
          ) : null}

          {activeTab === "scanner" ? (
            <SmartLeafScannerPanel
              language={scanLanguage}
              onLanguageChange={setScanLanguage}
              cropMode={cropMode}
              onCropModeChange={setCropMode}
              onScan={handleScan}
              loading={scanLoading}
              error={scanError}
              scanResult={scanResult}
            />
          ) : null}

          {activeTab === "rootcause" ? (
            <RootCausePanel
              scanResult={scanResult}
              scanPreviewUrl={scanPreviewUrl}
              regionalResource={regionalResource}
              selectedLanguage={uiLanguage}
              onRefine={handleRefine}
              refining={refining}
              onAskAssistant={() => setActiveTab("assistant")}
            />
          ) : null}

          {activeTab === "assistant" ? (
            <AssistantChatPanel
              farmProfile={farmProfile}
              latestDiagnosis={scanResult?.disease_name}
              initialLang={uiLanguage}
            />
          ) : null}

          {activeTab === "history" ? (
            <CropHistoryPanel
              history={history}
              models={models}
              onHistoryUpdated={handleHistoryUpdated}
              onClear={handleClearHistory}
            />
          ) : null}
        </div>
      </main>
    </div>
  );
}
