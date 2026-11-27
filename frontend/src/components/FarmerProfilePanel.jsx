import { useState } from "react";
import { LANGUAGES } from "../constants";
import { registerFarmer } from "../api";

export default function FarmerProfilePanel({ language, location, onProfileSaved }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState(language);
  const [district, setDistrict] = useState(location);
  const [saving, setSaving] = useState(false);
  const [savedProfile, setSavedProfile] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const profile = await registerFarmer({
        name,
        phone,
        preferred_language: preferredLanguage,
        location: district,
      });
      setSavedProfile(profile);
      onProfileSaved(profile);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel-card">
      <h2>Farmer Registration &amp; Preferences</h2>
      <p className="muted">
        Save your preferred language and district locally for personalized weather alerts and voice guidance.
      </p>

      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="controls-grid">
          <div className="field">
            <label htmlFor="farmer-name">Farmer Name</label>
            <input
              id="farmer-name"
              type="text"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Ramesh Naidu"
            />
          </div>

          <div className="field">
            <label htmlFor="farmer-phone">Mobile Number</label>
            <input
              id="farmer-phone"
              type="tel"
              required
              minLength={8}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g., 9876543210"
            />
          </div>

          <div className="field">
            <label htmlFor="farmer-lang">Preferred Language</label>
            <select
              id="farmer-lang"
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="farmer-loc">District / Village</label>
            <input
              id="farmer-loc"
              type="text"
              required
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            />
          </div>
        </div>

        <button type="submit" className="primary-btn" disabled={saving}>
          {saving ? "Saving..." : "Save Farmer Profile"}
        </button>

        {error ? <p className="error-banner">{error}</p> : null}
        {savedProfile ? (
          <div className="success-banner" role="status">
            Saved profile for <strong>{savedProfile.name}</strong> (ID: {savedProfile.farmer_id}). Language and weather location updated!
          </div>
        ) : null}
      </form>
    </section>
  );
}
