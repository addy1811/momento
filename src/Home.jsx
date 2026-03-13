import React, { useEffect, useRef } from "react";
import GlobeSection from "./GlobalSection";
import { useNavigate } from "react-router-dom";
import Starfield from "./Components/StarField";
import "./design/home.css";

export default function Home({ user, handleLogin, handleLogout }) {
  const navigate = useNavigate();
  const titleRef = useRef(null);
 
  useEffect(() => {
    const letters = titleRef.current?.querySelectorAll(".letter");
    letters?.forEach((el, i) => {
      el.style.animationDelay = `${i * 0.06}s`;
    });
  }, []);
 
  const title = "Momento";
 
  return (
    <div className="home-root">
      <Starfield speedFactor={0.06} backgroundColor="#04040f" starColor={[180, 200, 255]} starCount={3500} />
 
      {/* Nebula background blobs */}
      <div className="nebula nebula-1" />
      <div className="nebula nebula-2" />
      <div className="nebula nebula-3" />
 
      {/* Nav */}
      <nav className="home-nav">
        <div className="home-logo">
          <span className="logo-dot" />
          <span className="logo-text">Momento</span>
        </div>
        <div className="home-nav-right">
          {user ? (
            <>
              <img src={user.photoURL} alt="Profile" className="nav-avatar" />
              <button className="btn-ghost" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <button className="btn-ghost" onClick={() => navigate("/login")}>Sign In</button>
              <button className="btn-primary" onClick={() => navigate("/signup")}>Get Started</button>
            </>
          )}
        </div>
      </nav>
 
      {/* Hero */}
      <main className="home-hero">
        <div className="hero-badge">
          <span className="badge-dot" />
          <span>Your memories, mapped across the world</span>
        </div>
 
        <h1 className="hero-title" ref={titleRef}>
          {title.split("").map((l, i) => (
            <span key={i} className="letter">{l === " " ? "\u00A0" : l}</span>
          ))}
        </h1>
 
        <p className="hero-sub">
          Pin your travel memories on a living world map.<br />
          Relive every journey, share every story.
        </p>
 
        <div className="hero-actions">
          <button className="btn-cta" onClick={() => navigate("/signup")}>
            <span>Start Your Journey</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
          <button className="btn-outline" onClick={() => navigate("/login")}>
            Sign In
          </button>
        </div>
 
        {/* Globe */}
        <div className="globe-wrapper">
          <div className="globe-glow" />
          <GlobeSection />
        </div>
 
        {/* Stats */}
        <div className="stats-row">
          {[
            { num: "195+", label: "Countries" },
            { num: "∞", label: "Memories" },
            { num: "1", label: "World Map" },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <span className="stat-num">{s.num}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </main>
      </div>
  );
}