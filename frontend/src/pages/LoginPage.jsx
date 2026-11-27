import { useState } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE } from "../constants";
import { useAuth } from "../context/AuthContext";
import i18n from "../i18n";

export default function LoginPage({ onNavigate }) {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [form, setForm] = useState({ phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Login failed");
      if (data.user?.preferred_language) {
        i18n.changeLanguage(data.user.preferred_language);
        localStorage.setItem("nexora_lang", data.user.preferred_language);
      }
      login(data.token, data.user);
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
        <h2>{t("auth.loginCta")}</h2>

        {error && <div className="auth-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="login-phone">{t("auth.phone")}</label>
            <input id="login-phone" name="phone" type="tel" value={form.phone}
              onChange={handleChange} required placeholder="9876543210" autoComplete="tel" />
          </div>
          <div className="form-group">
            <label htmlFor="login-password">{t("auth.password")}</label>
            <input id="login-password" name="password" type="password" value={form.password}
              onChange={handleChange} required autoComplete="current-password" />
          </div>
          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? "Logging in…" : t("auth.loginCta")}
          </button>
        </form>
        <p className="auth-switch">
          <button type="button" className="link-btn" onClick={() => onNavigate("register")}>
            {t("auth.noAccount")}
          </button>
        </p>
      </div>
    </div>
  );
}
