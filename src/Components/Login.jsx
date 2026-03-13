import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket/socket";
 import "../design/login.css";
 export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
 
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password })
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Invalid credentials");
      return;
    }
    socket.connect();
    navigate("/memory", { replace: true });
  };
 
  const handleGoogle = () => { window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`; };
 
  return (
    <div className="auth-root">
      <div className="auth-bg" />
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
 
      <div className="auth-card">
        <button className="back-btn" onClick={() => navigate("/")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          Back
        </button>
 
        <div className="auth-header">
          <div className="auth-icon">✦</div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-sub">Sign in to continue your journey</p>
        </div>
 
        <div className="social-btns">
          <button className="social-btn" onClick={handleGoogle}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          <button className="social-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="#f0e6c8"/>
            </svg>
            Continue with X
          </button>
        </div>
 
        <div className="divider"><span>or sign in with email</span></div>
 
        <form className="auth-form" onSubmit={handleLogin}>
          <div className="field-group">
            <label className="field-label">Email</label>
            <div className="field-wrap">
              <svg className="field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
              <input type="email" className="field-input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">Password</label>
            <div className="field-wrap">
              <svg className="field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input type={showPass ? "text" : "password"} className="field-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>{showPass ? "Hide" : "Show"}</button>
            </div>
          </div>
          {error && (
            <div className="error-msg">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? <span className="spinner" /> : "Sign In"}
          </button>
        </form>
 
        <p className="auth-footer">
          Don't have an account?{" "}
          <span className="auth-link" onClick={() => navigate("/signup")}>Sign up</span>
        </p>
      </div>
    </div>
  );
}
