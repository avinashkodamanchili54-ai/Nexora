import { API_BASE, LANGUAGES } from "./constants";

async function parseResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || data?.detail || "Request failed.");
  }
  return data;
}

let activeAudio = null;

export function stopRegionalSpeech() {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio = null;
  }
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export async function playRegionalSpeech(text, language, onDone) {
  stopRegionalSpeech();
  try {
    const res = await fetch(`${API_BASE}/api/voice/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language }),
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      activeAudio = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        activeAudio = null;
        if (onDone) onDone();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        activeAudio = null;
        if (onDone) onDone();
      };
      await audio.play();
      return;
    }
  } catch {
    // Fallback to browser SpeechSynthesis below
  }

  if ("speechSynthesis" in window) {
    const u = new SpeechSynthesisUtterance(text);
    const l = LANGUAGES.find((item) => item.code === language);
    u.lang = l ? l.speechLang : "en-IN";
    u.onend = () => onDone && onDone();
    u.onerror = () => onDone && onDone();
    window.speechSynthesis.speak(u);
  } else if (onDone) {
    onDone();
  }
}

export async function transcribeVoiceBlob(blob, language) {
  const fd = new FormData();
  fd.append("audio", blob, "voice.webm");
  fd.append("language", language);
  const res = await fetch(`${API_BASE}/api/voice/stt`, {
    method: "POST",
    body: fd,
  });
  return parseResponse(res);
}

export async function fetchInitialDashboard({ location, lat, lon, crop, growthStage }) {
  const q = new URLSearchParams({
    location,
    lat: String(lat),
    lon: String(lon),
    crop,
    growth_stage: growthStage,
  });

  const [weatherRes, outbreaksRes, modelsRes, historyRes, regionalRes] = await Promise.all([
    fetch(`${API_BASE}/api/weather/alerts?${q.toString()}`),
    fetch(`${API_BASE}/api/weather/outbreaks`),
    fetch(`${API_BASE}/api/models/status`),
    fetch(`${API_BASE}/api/history`),
    fetch(`${API_BASE}/api/diseases/resources/regional?location=${encodeURIComponent(location)}`),
  ]);

  const [weather, outbreaks, modelsData, history, regionalResource] = await Promise.all([
    weatherRes.ok ? weatherRes.json() : null,
    outbreaksRes.ok ? outbreaksRes.json() : [],
    modelsRes.ok ? modelsRes.json() : { models: [] },
    historyRes.ok ? historyRes.json() : [],
    regionalRes.ok ? regionalRes.json() : null,
  ]);

  return {
    weather,
    outbreaks,
    models: modelsData.models || [],
    history,
    regionalResource,
  };
}

export async function fetchRegionalResource(location) {
  const res = await fetch(
    `${API_BASE}/api/diseases/resources/regional?location=${encodeURIComponent(location)}`
  );
  return parseResponse(res);
}

export async function fetchWeatherAlert({ location, lat, lon, crop, growthStage }) {
  const q = new URLSearchParams({
    location,
    lat: String(lat),
    lon: String(lon),
    crop,
    growth_stage: growthStage,
  });
  const res = await fetch(`${API_BASE}/api/weather/alerts?${q.toString()}`);
  return parseResponse(res);
}

export async function fetchForecastingReport({ location, lat, lon, crop, growthStage }) {
  const params = {
    location: location || "Guntur, Andhra Pradesh",
    crop: crop || "Paddy (Rice)",
    growth_stage: growthStage || "Vegetative / Tillering",
  };
  if (lat !== undefined && lat !== null && !isNaN(Number(lat))) {
    params.lat = String(lat);
  }
  if (lon !== undefined && lon !== null && !isNaN(Number(lon))) {
    params.lon = String(lon);
  }
  const q = new URLSearchParams(params);
  const res = await fetch(`${API_BASE}/api/weather/forecasting?${q.toString()}`);
  return parseResponse(res);
}

export async function runDiagnoseStep(payload) {
  const res = await fetch(`${API_BASE}/api/predict/diagnose-step`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
}

export async function fetchDiseaseReports(limit = 10) {
  const res = await fetch(`${API_BASE}/api/predict/reports?limit=${limit}`);
  return parseResponse(res);
}

export async function reportOutbreakSignal(payload) {
  const res = await fetch(`${API_BASE}/api/weather/outbreaks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
}

export async function registerFarmer(payload) {
  const res = await fetch(`${API_BASE}/api/farmers/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
}

export async function predictLeafScan({
  imageFiles,
  language,
  cropMode,
  cropName,
  growthStage,
  humidityPercent,
}) {
  const formData = new FormData();
  const files = Array.isArray(imageFiles) ? imageFiles : [imageFiles];
  files.slice(0, 3).forEach((file) => formData.append("images", file));
  formData.append("language", language);
  formData.append("crop_mode", cropMode);
  formData.append("crop_name", cropName);
  formData.append("growth_stage", growthStage);
  formData.append("humidity_percent", String(humidityPercent));

  const res = await fetch(`${API_BASE}/api/predict`, {
    method: "POST",
    body: formData,
  });
  return parseResponse(res);
}

export async function refineRootCause(payload) {
  const res = await fetch(`${API_BASE}/api/investigate/refine`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
}

export async function sendAssistantMessage(payload) {
  const res = await fetch(`${API_BASE}/api/assistant/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
}

export async function verifyScanEntry(scanId, payload) {
  const res = await fetch(`${API_BASE}/api/history/${scanId}/verify`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
}

export async function clearScanHistory() {
  const res = await fetch(`${API_BASE}/api/history`, { method: "DELETE" });
  return parseResponse(res);
}
