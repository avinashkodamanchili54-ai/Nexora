import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { registerFarmer } from "../api";
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

export default function FarmSatellitePage({
  farmProfile = {},
  onFarmUpdated,
  onSaveFarm,
  uiLanguage,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);
  const baseLayerRef = useRef(null);
  const labelsLayerRef = useRef(null);

  const [mapStyle, setMapStyle] = useState("hybrid"); // hybrid | satellite | street
  const [selectingPoints, setSelectingPoints] = useState(false);
  const [walking, setWalking] = useState(false);
  const [largeMap, setLargeMap] = useState(false);
  const selectingRef = useRef(false);
  const watchIdRef = useRef(null);
  const [searchCity, setSearchCity] = useState("");
  const [searching, setSearching] = useState(false);
  const [geoStatus, setGeoStatus] = useState("");

  const [boundary, setBoundary] = useState(farmProfile.boundary_coords || farmProfile.polygon || []);
  const [name, setName] = useState(farmProfile.name || "");
  const [phone, setPhone] = useState(farmProfile.phone || "");
  const [location, setLocation] = useState(farmProfile.location || "");
  const [crop, setCrop] = useState(farmProfile.crop || "Paddy (Rice)");
  const [variety, setVariety] = useState(farmProfile.variety || "");
  const [acreage, setAcreage] = useState(farmProfile.acreage || farmProfile.acres || 1);
  const [sowingDate, setSowingDate] = useState(farmProfile.sowing_date || "");
  const [center, setCenter] = useState({
    lat: Number(farmProfile.center_lat ?? farmProfile.lat ?? 20.5937),
    lon: Number(farmProfile.center_lon ?? farmProfile.lon ?? 78.9629),
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const strings = UI_STRINGS[uiLanguage] || UI_STRINGS.en;

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([center.lat, center.lon], 15);
    const sat = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Tiles © Esri World Imagery" }
    ).addTo(map);
    const labels = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Labels © Esri" }
    ).addTo(map);

    const group = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    baseLayerRef.current = sat;
    labelsLayerRef.current = labels;
    layerGroupRef.current = group;

    map.on("click", (e) => {
      if (!selectingRef.current) return;
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
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    selectingRef.current = selectingPoints;
  }, [selectingPoints]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map) {
      setTimeout(() => map.invalidateSize(), 150);
    }
  }, [largeMap]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseLayerRef.current) map.removeLayer(baseLayerRef.current);
    if (labelsLayerRef.current) {
      map.removeLayer(labelsLayerRef.current);
      labelsLayerRef.current = null;
    }

    if (mapStyle === "street") {
      baseLayerRef.current = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);
    } else {
      baseLayerRef.current = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "Tiles © Esri World Imagery" }
      ).addTo(map);
      if (mapStyle === "hybrid") {
        labelsLayerRef.current = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
          { attribution: "Labels © Esri" }
        ).addTo(map);
      }
    }
  }, [mapStyle]);

  useEffect(() => {
    const group = layerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (boundary.length === 0) {
      L.circleMarker([center.lat, center.lon], {
        radius: 8,
        color: "#ffffff",
        weight: 2.5,
        fillColor: "#16a34a",
        fillOpacity: 0.95,
      })
        .bindTooltip(location)
        .addTo(group);
    }

    boundary.forEach((pt, idx) => {
      const icon = L.divIcon({
        className: "boundary-pin",
        html: `<span>${idx + 1}</span>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      const marker = L.marker([pt.lat, pt.lon], { icon, draggable: true })
        .bindTooltip(`Corner ${idx + 1} (drag to adjust)`)
        .addTo(group);

      marker.on("dragend", (evt) => {
        const { lat, lng } = evt.target.getLatLng();
        setBoundary((prev) => {
          const next = prev.map((p, i) =>
            i === idx ? { lat: Number(lat.toFixed(6)), lon: Number(lng.toFixed(6)) } : p
          );
          const acres = computeAcres(next);
          if (acres) setAcreage(acres);
          return next;
        });
      });
    });

    if (boundary.length >= 3) {
      L.polygon(
        boundary.map((p) => [p.lat, p.lon]),
        { color: "#fde047", weight: 2.5, fillColor: "#22c55e", fillOpacity: 0.28 }
      ).addTo(group);
    }
  }, [boundary, center, location]);

  const navigateMap = (lat, lon, label, zoom = 14) => {
    setCenter({ lat, lon });
    setLocation(label);
    setBoundary([]);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lon], zoom, { duration: 0.9 });
    }
  };

  const handleCitySearch = async (e) => {
    e.preventDefault();
    const q = searchCity.trim();
    if (!q) return;
    setSearching(true);
    setGeoStatus("");
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en&format=json`
      );
      const data = await res.json();
      const hit = data?.results?.[0];
      if (!hit) {
        setGeoStatus(`Could not find "${q}". Try another city or village name.`);
        return;
      }
      const label = [hit.name, hit.admin1, hit.country].filter(Boolean).slice(0, 2).join(", ");
      navigateMap(hit.latitude, hit.longitude, label, 14);
      setGeoStatus(`Navigated to ${label}`);
    } catch {
      setGeoStatus("City search failed. Check your internet connection.");
    } finally {
      setSearching(false);
    }
  };

  const toggleWalkField = () => {
    if (walking) {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setWalking(false);
      setGeoStatus("Walk finished! Review or drag any corner pin to fine-tune your field boundary.");
      return;
    }

    if (!navigator.geolocation) {
      setGeoStatus("Geolocation is not supported by this browser.");
      return;
    }

    setSelectingPoints(false);
    setBoundary([]);
    setWalking(true);
    setGeoStatus("Walk Around My Field started—walk along your field boundary...");

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lon = Number(pos.coords.longitude.toFixed(6));
        const acc = Math.round(pos.coords.accuracy || 0);

        setBoundary((prev) => {
          const last = prev[prev.length - 1];
          // Skip jittery points closer than ~3 meters
          if (last && Math.hypot(lat - last.lat, lon - last.lon) < 0.00003) {
            return prev;
          }
          const next = [...prev, { lat, lon }];
          const acres = computeAcres(next);
          if (acres) setAcreage(acres);
          return next;
        });

        setCenter({ lat, lon });
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo([lat, lon]);
        }
        setGeoStatus(`Walking: recording GPS (±${acc}m accuracy). Tap Finish Walk when back at start.`);
      },
      () => {
        setWalking(false);
        setGeoStatus("GPS signal unavailable. You can tap 'Select Field Points' to mark corners manually.");
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
  };

  const handleLiveLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus("Geolocation is not supported by this browser.");
      return;
    }
    setGeoStatus("Detecting your live GPS location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lon = Number(pos.coords.longitude.toFixed(6));
        navigateMap(lat, lon, `Live GPS (${lat.toFixed(3)}, ${lon.toFixed(3)})`, 16);
        setGeoStatus(`Centered on your live GPS (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
      },
      () => {
        setGeoStatus("Location permission denied. You can search a city instead.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
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
      if (onFarmUpdated) onFarmUpdated(profile);
      if (onSaveFarm) onSaveFarm(profile);
      setSaveMsg(
        `Saved ${profile.crop} (${profile.acreage} acres) · Growth Stage: ${profile.growth_stage}`
      );
    } catch (err) {
      setSaveMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stack-layout">
      <section className="panel-card">
        <div className="section-head">
          <div>
            <h2>Satellite Field Selector &amp; Live Location</h2>
            <p className="muted">
              Search any city/village, use Live GPS, or tap corners on the satellite map to outline your farm.
            </p>
          </div>
          <div className="btn-group">
            <button
              type="button"
              className={`secondary-btn ${mapStyle === "hybrid" ? "btn-selected" : ""}`}
              onClick={() => setMapStyle("hybrid")}
            >
              Satellite + Labels
            </button>
            <button
              type="button"
              className={`secondary-btn ${mapStyle === "satellite" ? "btn-selected" : ""}`}
              onClick={() => setMapStyle("satellite")}
            >
              Pure Satellite
            </button>
            <button
              type="button"
              className={`secondary-btn ${mapStyle === "street" ? "btn-selected" : ""}`}
              onClick={() => setMapStyle("street")}
            >
              Street Map
            </button>
          </div>
        </div>

        <div className="map-toolbar">
          <form onSubmit={handleCitySearch} className="input-row" style={{ flex: 1 }}>
            <input
              type="search"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              placeholder="Search city or village (e.g., Vijayawada, Tirupati, Nagpur)..."
              aria-label="Search city or village"
            />
            <button type="submit" className="primary-btn" disabled={searching}>
              {searching ? "Finding..." : "Go to City"}
            </button>
          </form>

          <div className="btn-group">
            <button
              type="button"
              className={`secondary-btn ${walking ? "btn-walking" : ""}`}
              onClick={toggleWalkField}
            >
              {walking ? "Finish Walk" : "Walk Around My Field"}
            </button>
            <button
              type="button"
              className={`secondary-btn ${selectingPoints ? "btn-selected" : ""}`}
              onClick={() => setSelectingPoints((v) => !v)}
            >
              {selectingPoints ? "Done Selecting Points" : "Select Field Points"}
            </button>
            <button
              type="button"
              className={`secondary-btn ${largeMap ? "btn-selected" : ""}`}
              onClick={() => setLargeMap((v) => !v)}
            >
              {largeMap ? "Normal Map Size" : "Large Screen View"}
            </button>
            <button type="button" className="voice-btn" onClick={handleLiveLocation}>
              Use Live GPS
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setBoundary((prev) => prev.slice(0, -1))}
              disabled={boundary.length === 0}
            >
              Undo Point
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
              onClick={() => navigateMap(d.lat, d.lon, d.name, 14)}
            >
              {d.name.split(",")[0]}
            </button>
          ))}
        </div>

        {geoStatus ? <p className="muted" style={{ marginBottom: "8px" }}>{geoStatus}</p> : null}

        <div
          ref={mapRef}
          className={`leaflet-map-box ${largeMap ? "satellite-xlarge" : "satellite-tall"} ${selectingPoints ? "selecting-cursor" : ""}`}
          aria-label="Satellite Field Selector Map"
        />

        <div className="map-stats-bar">
          <span>Location: <strong>{location}</strong></span>
          <span>Boundary Corners: <strong>{boundary.length}</strong></span>
          <span>Calculated Area: <strong>{acreage} acres</strong></span>
          <span>GPS: <code>{center.lat.toFixed(4)}, {center.lon.toFixed(4)}</code></span>
        </div>
      </section>

      <section className="panel-card">
        <h3>Farmer &amp; Crop Details</h3>
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
            {saving ? "Saving Farm..." : strings.saveFarm}
          </button>
          {saveMsg ? <p className="success-banner">{saveMsg}</p> : null}
        </form>
      </section>
    </div>
  );
}
