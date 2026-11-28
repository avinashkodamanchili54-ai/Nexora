import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE, LANGUAGES, CROP_PRESETS } from "../constants";
import { useAuth } from "../context/AuthContext";
import i18n from "../i18n";

export default function ProfilePage({ onNavigate }) {
  const { t } = useTranslation();
  const { user, token, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    preferred_language: user?.preferred_language || "en",
    crop_type: user?.crop_type || "Paddy (Rice)",
    crop_mode: user?.crop_mode || "paddy",
    farm_profile: user?.farm_profile || {},
  });
  const [farmLocation, setFarmLocation] = useState(user?.farm_profile?.location || "");
  const [acreage, setAcreage] = useState(user?.farm_profile?.acreage || "");
  const [variety, setVariety] = useState(user?.farm_profile?.variety || "");
  const [sowingDate, setSowingDate] = useState(user?.farm_profile?.sowing_date || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState({
    lat: user?.farm_profile?.center_lat || 20.5937,
    lon: user?.farm_profile?.center_lon || 78.9629,
  });
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markerRef = useRef(null);

  // Init Leaflet map
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;
    import("leaflet").then((L) => {
      const map = L.map(mapRef.current).setView([mapCenter.lat, mapCenter.lon], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const marker = L.marker([mapCenter.lat, mapCenter.lon], { draggable: true }).addTo(map);
      marker.on("dragend", (e) => {
        const { lat, lng } = e.target.getLatLng();
        setMapCenter({ lat, lon: lng });
      });
      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setMapCenter({ lat, lon: lng });
      });

      leafletMapRef.current = map;
      markerRef.current = marker;
    });
    return () => { if (leafletMapRef.current) { leafletMapRef.current.remove(); leafletMapRef.current = null; } };
  }, []);

  // Keep map synced when center changes externally
  useEffect(() => {
    if (leafletMapRef.current && markerRef.current) {
      leafletMapRef.current.setView([mapCenter.lat, mapCenter.lon], 13);
      markerRef.current.setLatLng([mapCenter.lat, mapCenter.lon]);
    }
  }, [mapCenter]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "preferred_language") i18n.changeLanguage(value);
    if (name === "crop_type") {
      const preset = CROP_PRESETS.find((c) => c.value === value);
      setForm((f) => ({ ...f, [name]: value, crop_mode: preset?.mode || "general" }));
      return;
    }
    setForm((f) => ({ ...f, [name]: value }));
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const locStr = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        setMapCenter({ lat: latitude, lon: longitude });
        setFarmLocation(locStr);
        const farm_profile = {
          ...(form.farm_profile || {}),
          location: locStr,
          acreage: parseFloat(acreage) || null,
          variety,
          sowing_date: sowingDate,
          center_lat: latitude,
          center_lon: longitude,
        };
        try {
          const res = await fetch(`${API_BASE}/api/auth/update-profile`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ...form, farm_profile }),
          });
          if (res.ok) {
            const data = await res.json();
            updateProfile(data);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
          }
        } finally {
          setLocLoading(false);
        }
      },
      () => setLocLoading(false),
      { enableHighAccuracy: true }
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const farm_profile = {
      ...(form.farm_profile || {}),
      location: farmLocation,
      acreage: parseFloat(acreage) || null,
      variety,
      sowing_date: sowingDate,
      center_lat: mapCenter.lat,
      center_lon: mapCenter.lon,
    };
    try {
      const res = await fetch(`${API_BASE}/api/auth/update-profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, farm_profile }),
      });
      const data = await res.json();
      if (res.ok) {
        updateProfile(data);
        localStorage.setItem("nexora_lang", form.preferred_language);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="avatar-large">{(user?.name || "F").charAt(0).toUpperCase()}</div>
        <div>
          <h2>{user?.name}</h2>
          <p className="profile-phone">📞 {user?.phone}</p>
        </div>
      </div>

      <div className="profile-sections">
        {/* Account section */}
        <section className="profile-section">
          <h3>Account Details</h3>
          <div className="form-group">
            <label htmlFor="p-name">{t("auth.name")}</label>
            <input id="p-name" name="name" value={form.name} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="p-email">{t("auth.email")}</label>
            <input id="p-email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="e.g. farmer@example.com" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="p-language">{t("auth.language")}</label>
              <select id="p-language" name="preferred_language" value={form.preferred_language} onChange={handleChange}>
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="p-crop">{t("auth.cropType")}</label>
              <select id="p-crop" name="crop_type" value={form.crop_type} onChange={handleChange}>
                {CROP_PRESETS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.icon || "🌱"} {c.label} ({c.mode === "paddy" ? "Paddy Model" : "PlantVillage Multi-Crop"})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{
            marginTop: "12px",
            padding: "8px 12px",
            borderRadius: "8px",
            background: form.crop_mode === "paddy" ? "#f0fdf4" : "#eff6ff",
            border: `1px solid ${form.crop_mode === "paddy" ? "#86efac" : "#bfdbfe"}`,
            fontSize: "0.8125rem",
            color: form.crop_mode === "paddy" ? "#166534" : "#1e40af"
          }}>
            <strong>🧠 Conditional Probability Diagnosis:</strong>{" "}
            {form.crop_mode === "paddy"
              ? "Paddy Doctor Specialist engages 10 rice conditions with P(Disease | Paddy)."
              : `PlantVillage 38-class AI evaluates P(Disease | ${form.crop_type}) specifically across ${form.crop_type} diseases.`}
          </div>
        </section>

        {/* Farm location section */}
        <section className="profile-section">
          <h3>{t("profile.location")}</h3>
          <div className="location-row">
            <input
              placeholder="Enter address or village name"
              value={farmLocation}
              onChange={(e) => setFarmLocation(e.target.value)}
              className="location-input"
            />
            <button type="button" className="btn-secondary" onClick={useMyLocation} disabled={locLoading}>
              {locLoading ? "Locating…" : `📍 ${t("profile.useMyLocation")}`}
            </button>
          </div>
          <div className="map-container" ref={mapRef} aria-label="Farm location map" />
          <p className="map-hint">Click on the map or drag the pin to set your exact farm location.</p>
        </section>

        {/* Farm details section */}
        <section className="profile-section">
          <h3>Farm Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="p-acreage">Farm Size (acres)</label>
              <input id="p-acreage" type="number" min="0.1" step="0.1" value={acreage}
                onChange={(e) => setAcreage(e.target.value)} placeholder="2.5" />
            </div>
            <div className="form-group">
              <label htmlFor="p-sowing">Sowing Date</label>
              <input id="p-sowing" type="date" value={sowingDate} onChange={(e) => setSowingDate(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="p-variety">Crop Variety</label>
            <input id="p-variety" value={variety} onChange={(e) => setVariety(e.target.value)}
              placeholder="e.g. BPT 5204, Hybrid 123" />
          </div>
        </section>
      </div>

      <div className="profile-actions">
        <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : t("profile.save")}
        </button>
        {saved && <span className="save-success">✅ Saved successfully!</span>}
        <button type="button" className="btn-ghost" onClick={() => onNavigate("dashboard")}>
          ← Back to Dashboard
        </button>
      </div>
      <div style={{ marginTop: "1.5rem" }}>
        <FarmSatellitePage
          farmProfile={{
            name: form.name,
            phone: form.phone,
            location: farmLocation,
            lat: mapCenter.lat,
            lon: mapCenter.lon,
            crop: form.crop_type,
            growth_stage: form.farm_profile?.growth_stage || "Vegetative / Tillering",
            acres: parseFloat(acreage) || form.farm_profile?.acreage || 2.5,
            soil_type: form.farm_profile?.soil_type || "Alluvial / Clay Loam",
            irrigation: form.farm_profile?.irrigation || "Canal / Borewell",
            polygon: form.farm_profile?.polygon || [],
          }}
          onSaveFarm={async (updatedFarm) => {
            const farm_profile = {
              ...(form.farm_profile || {}),
              ...updatedFarm,
              center_lat: updatedFarm.lat ?? mapCenter.lat,
              center_lon: updatedFarm.lon ?? mapCenter.lon,
              acreage: updatedFarm.acres ?? (parseFloat(acreage) || null),
            };
            const res = await fetch(`${API_BASE}/api/auth/update-profile`, {
              method: "PUT",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ ...form, crop_type: updatedFarm.crop || form.crop_type, farm_profile }),
            });
            if (res.ok) {
              const data = await res.json();
              updateProfile(data);
              setSaved(true);
              setTimeout(() => setSaved(false), 3000);
            }
          }}
          selectedLanguage={form.preferred_language}
        />
      </div>
    </div>
  );
}

