import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../design/login.css";

const API = import.meta.env.VITE_API_URL;
const post = (path, body) =>
  fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendCode = async (e) => {
    e?.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await post("/api/forgot-password", { email });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return setError(data.error || "Could not send the code. Please try again.");
      }
      setStep(2);
      setInfo("If that email is registered, a code has been sent.");
      setCooldown(60);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    try {
      const res = await post("/api/reset-password", { email, code, password });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError(data.error || "Reset failed.");
      setInfo("Password updated. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const okStyle = { color: "#86efac", borderColor: "rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.08)" };

  return (
    <div className="auth-root">
      <div className="auth-bg" />
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-card">
        <button className="back-btn" onClick={() => navigate("/login")}>← Back to login</button>
        <div className="auth-header">
          <div className="auth-icon">✦</div>
          <h1 className="auth-title">{step === 1 ? "Forgot password?" : "Reset password"}</h1>
          <p className="auth-sub">
            {step === 1 ? "Enter your email and we'll send a code" : `Enter the code sent to ${email}`}
          </p>
        </div>

        {step === 1 ? (
          <form className="auth-form" onSubmit={sendCode}>
            <div className="field-group">
              <label className="field-label">Email</label>
              <div className="field-wrap">
                <input
                  type="email"
                  className="field-input"
                  style={{ paddingLeft: 14 }}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            {error && <div className="error-msg">{error}</div>}
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? <span className="spinner" /> : "Send code"}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={resetPassword}>
            <div className="field-group">
              <label className="field-label">6-digit code</label>
              <div className="field-wrap">
                <input
                  className="field-input"
                  style={{ paddingLeft: 14, letterSpacing: "0.5em", textAlign: "center", fontSize: "1.2rem" }}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="------"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  required
                />
              </div>
            </div>
            <div className="field-group">
              <label className="field-label">New password</label>
              <div className="field-wrap">
                <input
                  type="password"
                  className="field-input"
                  style={{ paddingLeft: 14 }}
                  placeholder="Min. 8 characters"
                  maxLength={72}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="field-group">
              <label className="field-label">Confirm password</label>
              <div className="field-wrap">
                <input
                  type="password"
                  className="field-input"
                  style={{ paddingLeft: 14 }}
                  maxLength={72}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>
            </div>
            {info && <div className="error-msg" style={okStyle}>{info}</div>}
            {error && <div className="error-msg">{error}</div>}
            <button type="submit" className="submit-btn" disabled={loading || code.length !== 6}>
              {loading ? <span className="spinner" /> : "Update password"}
            </button>
            <p className="auth-footer">
              {cooldown > 0 ? (
                <span>Resend code in {cooldown}s</span>
              ) : (
                <span className="auth-link" onClick={sendCode}>Resend code</span>
              )}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
