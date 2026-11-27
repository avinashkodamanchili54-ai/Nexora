import { useState } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE, LANGUAGES, CROP_PRESETS } from "../constants";
import { useAuth } from "../context/AuthContext";
import i18n from "../i18n";

export default function RegisterPage({ onNavigate }) {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: "", phone: "", password: "", preferred_language: "en", crop_type: "Paddy (Rice)", crop_mode: "paddy",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Registration failed");
      login(data.token, data.user);
      localStorage.setItem("nexora_lang", form.preferred_language);
      onNavigate("dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 22V10" /><path d="M12 14C12 8.5 16.5 4 21 4c0 4.5-4.5 10-9 10Z" />
            <path d="M12 11C12 6.5 8 3 3 3c0 4.5 4 8 9 8Z" />
          </svg>
          <h1>Krishi Sakhi AI</h1>
        </div>
        <h2>{t("auth.registerCta")}</h2>

        {error && <div className="auth-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="reg-name">{t("auth.name")}</label>
            <input id="reg-name" name="name" type="text" value={form.name}
              onChange={handleChange} required placeholder="Ramesh Naidu" />
          </div>
          <div className="form-group">
            <label htmlFor="reg-phone">{t("auth.phone")}</label>
            <input id="reg-phone" name="phone" type="tel" value={form.phone}
              onChange={handleChange} required placeholder="9876543210" maxLength={10} />
          </div>
          <div className="form-group">
            <label htmlFor="reg-password">{t("auth.password")}</label>
            <input id="reg-password" name="password" type="password" value={form.password}
              onChange={handleChange} required minLength={6} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reg-language">{t("auth.language")}</label>
              <select id="reg-language" name="preferred_language" value={form.preferred_language} onChange={handleChange}>
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="reg-crop">{t("auth.cropType")}</label>
              <select id="reg-crop" name="crop_type" value={form.crop_type} onChange={handleChange}>
                {CROP_PRESETS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? "Creating account…" : t("auth.registerCta")}
          </button>
        </form>
        <p className="auth-switch">
          <button type="button" className="link-btn" onClick={() => onNavigate("login")}>
            {t("auth.hasAccount")}
          </button>
        </p>
      </div>
    </div>
  );
}

