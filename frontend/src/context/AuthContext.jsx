import { createContext, useContext, useState, useEffect } from "react";
import { API_BASE } from "../constants";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("nexora_token") || null);
  const [loading, setLoading] = useState(true);

  // On mount, verify the stored token
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((u) => setUser(u))
      .catch(() => { localStorage.removeItem("nexora_token"); setToken(null); })
      .finally(() => setLoading(false));
  }, [token]);

  const login = (tok, userData) => {
    localStorage.setItem("nexora_token", tok);
    if (userData.preferred_language) {
      localStorage.setItem("nexora_lang", userData.preferred_language);
    }
    setToken(tok);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("nexora_token");
    setToken(null);
    setUser(null);
    window.location.hash = "#/login";
  };

  const updateProfile = (updatedUser) => setUser(updatedUser);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
