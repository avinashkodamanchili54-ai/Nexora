import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { registerFarmer, reportOutbreakSignal } from "../api";
import { CROP_PRESETS, DISTRICT_PRESETS, UI_STRINGS } from "../constants";

function computeAcres(points) {
  if (points.length < 3) return null;
  const R = 6378137;
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    const x1 = (p1.lon * Math.PI) / 180;
    const y1 = (p1.lat * Math.PI) / 180;
    const x2 = (p2.lon * Math.PI) / 180;
    const y2 = (p2.lat * Math.PI) / 180;
    area += (x2 - x1) * (2 + Math.sin(y1) + Math.sin(y2));
  }
  const sqMeters = Math.abs((area * R * R) / 2);
  return Number((sqMeters / 4046.8564224).toFixed(2));
}

export default function FarmRiskRadarPanel({
  farmProfile,
  onFarmUpdated,
  weatherAlert,
  regionalResource,
  outbreaks,
  onOutbreakAdded,
  uiLanguage,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);
  const tileLayerRef = useRef(null);

  const [mapStyle, setMapStyle] = useState("satellite");
  const [boundary, setBoundary] = useState(farmProfile.boundary_coords || []);
  const [name, setName] = useState(farmProfile.name);
  const [phone, setPhone] = useState(farmProfile.phone);
  const [location, setLocation] = useState(farmProfile.location);
  const [crop, setCrop] = useState(farmProfile.crop);
  const [variety, setVariety] = useState(farmProfile.variety);
  const [acreage, setAcreage] = useState(farmProfile.acreage);
  const [sowingDate, setSowingDate] = useState(farmProfile.sowing_date);
  const [center, setCenter] = useState({
    lat: farmProfile.center_lat,
    lon: farmProfile.center_lon,
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [outbreakText, setOutbreakText] = useState("");

  const strings = UI_STRINGS[uiLanguage] || UI_STRINGS.en;

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([center.lat, center.lon], 15);
    const satTiles = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Tiles © Esri World Imagery" }
    ).addTo(map);

    const group = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    tileLayerRef.current = satTiles;
    layerGroupRef.current = group;

    map.on("click", (e) => {
      const pt = { lat: Number(e.latlng.lat.toFixed(6)), lon: Number(e.latlng.lng.toFixed(6)) };
      setBoundary((prev) => {
        const next = [...prev, pt];
        const acres = computeAcres(next);
        if (acres) setAcreage(acres);
        return next;
      });
      setCenter(pt);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !tileLayerRef.current) return;
    map.removeLayer(tileLayerRef.current);

    const url =
      mapStyle === "satellite"
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    const attr =
      mapStyle === "satellite" ? "Tiles © Esri World Imagery" : "© OpenStreetMap contributors";

    tileLayerRef.current = L.tileLayer(url, { attribution: attr }).addTo(map);
  }, [mapStyle]);

  useEffect(() => {
    const group = layerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    boundary.forEach((pt, idx) => {
      L.circleMarker([pt.lat, pt.lon], {
        radius: 6,
        color: "#fde047",
        weight: 2,
        fillColor: "#15803d",
        fillOpacity: 1,
      })
        .bindTooltip(`Corner ${idx + 1}`)
        .addTo(group);
    });

    if (boundary.length >= 3) {
      L.polygon(
        boundary.map((p) => [p.lat, p.lon]),
        { color: "#fde047", weight: 2.5, fillColor: "#22c55e", fillOpacity: 0.28 }
      ).addTo(group);
    }
  }, [boundary]);

  const jumpToDistrict = (preset) => {
    setLocation(preset.name);
    setCenter({ lat: preset.lat, lon: preset.lon });
    setBoundary([]);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([preset.lat, preset.lon], 14, { duration: 0.8 });
    }
  };

  const handleSaveFarm = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    try {
      const profile = await registerFarmer({
        name,
        phone,
        preferred_language: uiLanguage,
        location,
        crop,
        variety,
        acreage: Number(acreage),
        sowing_date: sowingDate,
        center_lat: center.lat,
        center_lon: center.lon,
        boundary_coords: boundary,
      });
      onFarmUpdated(profile);
      setSaveMsg(
        `Registered ${profile.crop} (${profile.acreage} acres) · Stage: ${profile.growth_stage}`
      );
    } catch (err) {
      setSaveMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReportOutbreak = async (e) => {
    e.preventDefault();
    if (!outbreakText.trim()) return;
    const sig = await reportOutbreakSignal({
      location,
      crop,
      symptom_summary: outbreakText.trim(),
      severity: "High",
    });
    onOutbreakAdded(sig);
    setOutbreakText("");
  };

  return (
    <div className="two-col-layout">
      <section className="panel-card">
        <div className="section-head">
          <div>
            <h2>Farm Registration &amp; Satellite Boundary</h2>
            <p className="muted">
              Select your region or tap corners on the satellite map to outline your field boundary.
            </p>
          </div>
          <div className="btn-group">
            <button
              type="button"
              className={`secondary-btn ${mapStyle === "satellite" ? "btn-selected" : ""}`}
              onClick={() => setMapStyle("satellite")}
            >
              Satellite
            </button>
            <button
              type="button"
              className={`secondary-btn ${mapStyle === "street" ? "btn-selected" : ""}`}
              onClick={() => setMapStyle("street")}
            >
              Street
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setBoundary((prev) => prev.slice(0, -1))}
              disabled={boundary.length === 0}
            >
              Undo
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setBoundary([])}
              disabled={boundary.length === 0}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="preset-strip" aria-label="Quick District Presets">
          {DISTRICT_PRESETS.map((d) => (
            <button
              key={d.name}
              type="button"
              className={`chip-btn ${location === d.name ? "active" : ""}`}
              onClick={() => jumpToDistrict(d)}
            >
              {d.name.split(",")[0]}
            </button>
          ))}
        </div>

        <div ref={mapRef} className="leaflet-map-box" aria-label="Satellite Field Selector Map" />

        <div className="map-stats-bar">
          <span>
            Boundary Points: <strong>{boundary.length}</strong>
          </span>
          <span>
            Area: <strong>{acreage} acres</strong>
          </span>
          <span>
            GPS: <code>{center.lat.toFixed(4)}, {center.lon.toFixed(4)}</code>
          </span>
        </div>

        <form onSubmit={handleSaveFarm} className="farm-form">
          <div className="crop-picker-label">Select Your Crop</div>
          <div className="crop-cards-row">
            {CROP_PRESETS.map((c) => (
              <button
                key={c.value}
                type="button"
                className={`crop-card-btn ${crop === c.value ? "active" : ""}`}
                onClick={() => setCrop(c.value)}
              >
                <span className="crop-avatar">{c.badge}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>

          <div className="controls-grid">
            <div className="field">
              <label htmlFor="farm-name">Farmer Name</label>
              <input id="farm-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="farm-phone">Mobile Number</label>
              <input id="farm-phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="farm-loc">Village / District</label>
              <input id="farm-loc" value={location} onChange={(e) => setLocation(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="farm-variety">Seed Variety</label>
              <input id="farm-variety" value={variety} onChange={(e) => setVariety(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="farm-acres">Acreage (Acres)</label>
              <input
                id="farm-acres"
                type="number"
                step="0.1"
                value={acreage}
                onChange={(e) => setAcreage(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="farm-sowing">Sowing Date</label>
              <input
                id="farm-sowing"
                type="date"
                value={sowingDate}
                onChange={(e) => setSowingDate(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="primary-btn full-btn" disabled={saving}>
            {saving ? "Updating Farm & Radar..." : strings.saveFarm}
          </button>
          {saveMsg ? <p className="success-banner">{saveMsg}</p> : null}
        </form>
      </section>

      <aside className="radar-column">
        <section className="panel-card">
          <div className="section-head">
            <h2>Field Risk Radar</h2>
            {weatherAlert ? (
              <span className={`sev-badge ${weatherAlert.risk_level === "High" ? "sev-high" : "sev-mod"}`}>
                Risk: {weatherAlert.risk_level}
              </span>
            ) : null}
          </div>

          {weatherAlert ? (
            <>
              <p className="muted">
                <strong>{weatherAlert.source}</strong> · {weatherAlert.location}
              </p>
              <div className="weather-metrics-grid">
                <div className="metric-tile">
                  <span>Temp</span>
                  <strong>{weatherAlert.temperature_c}°C</strong>
                </div>
                <div className="metric-tile">
                  <span>Humidity</span>
                  <strong>{weatherAlert.humidity_percent}%</strong>
                </div>
                <div className="metric-tile">
                  <span>Rain</span>
                  <strong>{weatherAlert.precipitation_mm} mm</strong>
                </div>
                <div className="metric-tile">
                  <span>Wind</span>
                  <strong>{weatherAlert.wind_kmh} km/h</strong>
                </div>
              </div>

              <div className="reminder-box">
                <strong>{weatherAlert.inspection_reminder}</strong>
                <p>{weatherAlert.recommended_action}</p>
              </div>

              <div className="threat-list">
                {weatherAlert.threat_radar.map((item, idx) => (
                  <div key={idx} className="threat-item">
                    <div className="threat-head">
                      <strong>{item.threat}</strong>
                      <span>
                        {item.probability_percent}% · {item.risk_level}
                      </span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${item.probability_percent}%` }}
                      />
                    </div>
                    <p className="muted">{item.trigger_reason}</p>
                    <p className="tip-text">Action: {item.preventive_tip}</p>
                  </div>
                ))}
              </div>

              {weatherAlert.spray_windows?.length ? (
                <div className="spray-planner">
                  <h4>5-Day Safe Spray Window</h4>
                  <div className="spray-row">
                    {weatherAlert.spray_windows.map((d) => (
                      <div key={d.date} className={`spray-day spray-${d.status.toLowerCase()}`}>
                        <strong>{d.date.slice(5)}</strong>
                        <span>{d.status}</span>
                        <small>{d.rain_mm}mm · {d.wind_kmh}km/h</small>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <p className="muted">Connecting to Open-Meteo weather telemetry...</p>
          )}
        </section>

        {regionalResource ? (
          <section className="panel-card regional-card">
            <h3>Regional Agricultural Support ({regionalResource.region})</h3>
            <p className="muted">
              <strong>{regionalResource.helpline_name}:</strong> {regionalResource.helpline_number}
            </p>
            <p className="muted">
              <strong>Center:</strong> {regionalResource.local_center}
            </p>
            <p className="tip-text">{regionalResource.safety_note}</p>
          </section>
        ) : null}

        <section className="panel-card">
          <h3>Community Outbreak Signals</h3>
          <form onSubmit={handleReportOutbreak} className="input-row">
            <input
              type="text"
              value={outbreakText}
              onChange={(e) => setOutbreakText(e.target.value)}
              placeholder="Report leaf symptoms nearby..."
            />
            <button type="submit" className="secondary-btn">
              Report
            </button>
          </form>

          <ul className="outbreak-list">
            {outbreaks.slice(0, 4).map((o) => (
              <li key={o.signal_id}>
                <strong>{o.location}</strong> ({o.crop}): {o.symptom_summary}
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}
