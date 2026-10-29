import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import socket from "../socket/socket";
import "../design/login.css";

export default function VerifyEmail({ refreshUser }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError(data.error || "Verification failed.");
      await refreshUser();
      socket.connect();
      navigate("/memory", { replace: true });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setInfo(null);
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setInfo("A new code has been sent.");
      setCooldown(60);
    } catch {
      setError("Network error. Please try again.");
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-bg" />
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-card">
        <button className="back-btn" onClick={() => navigate("/signup")}>← Back</button>
        <div className="auth-header">
          <div className="auth-icon">✦</div>
          <h1 className="auth-title">Verify your email</h1>
          <p className="auth-sub">We sent a 6-digit code to {email}</p>
        </div>
        <form className="auth-form" onSubmit={handleVerify}>
          <div className="field-group">
            <label className="field-label">Verification code</label>
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
          {info && (
            <div className="error-msg" style={{ color: "#86efac", borderColor: "rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.08)" }}>
              {info}
            </div>
          )}
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="submit-btn" disabled={loading || code.length !== 6}>
            {loading ? <span className="spinner" /> : "Verify"}
          </button>
        </form>
        <p className="auth-footer" style={{ marginTop: 16 }}>
          Didn't get it?{" "}
          {cooldown > 0 ? (
            <span>Resend in {cooldown}s</span>
          ) : (
            <span className="auth-link" onClick={handleResend}>Resend code</span>
          )}
        </p>
      </div>
    </div>
  );
}
