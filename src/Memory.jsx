import React, { useState, useEffect, useRef } from "react";
import AVATAR from "./assets/avatar.jpg";
import "./design/memory.css";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import { centroid } from "@turf/turf";
import L from "leaflet";
import MemoryCarousel from "./MemoryCarousel";
import socket from "./socket/socket";
import "./design/memory.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: '', iconUrl: '', shadowUrl: '' });
 
const pinIcon = new L.DivIcon({
  className: '',
  html: `<div style="
    width:28px;height:28px;
    background:linear-gradient(135deg,#d4af37,#9a7b20);
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    box-shadow:0 4px 16px rgba(212,175,55,0.6);
    border:2px solid rgba(255,255,255,0.2);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -32]
});
 
export default function Memory({ user, refreshUser, onLogout }) {
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [memories, setMemories] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();
  const navigate = useNavigate();
 
  useEffect(() => {
    fetch("/countries.geojson")
      .then(res => res.json())
      .then(setGeoJsonData)
      .catch(console.error);
  }, []);
 
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/memories`, { credentials: "include" })
      .then(res => res.json())
      .then(setMemories)
      .catch(console.error);
  }, []);
 
  useEffect(() => {
    if (!user) return;
    socket.connect();
    socket.on("memory:created", (memory) => {
      if (memory.user_id === user?.id) {
        setMemories(prev => [...prev, memory]);
      }
    });
    socket.on("memory:deleted", ({ id }) => setMemories(prev => prev.filter(m => m.id !== Number(id))));
    return () => {
      socket.off("memory:created");
      socket.off("memory:deleted");
      socket.disconnect();
    };
  }, [user]);
 
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
 
  const deleteMemory = async (id) => {
    if (!window.confirm("Delete this memory?")) return;
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/memories/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) setMemories(prev => prev.filter(m => m.id !== id));
  };
 
  function getCountryCentroid(countryName) {
    if (!geoJsonData) return null;
    const feature = geoJsonData.features.find(
      f => f.properties.name?.toLowerCase() === countryName.toLowerCase()
    );
    if (!feature) return null;
    const center = centroid(feature);
    return [center.geometry.coordinates[1], center.geometry.coordinates[0]];
  }
 
  const memoriesByCountry = memories.reduce((acc, memory) => {
    if (!acc[memory.country]) acc[memory.country] = [];
    acc[memory.country].push(memory);
    return acc;
  }, {});
 
  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#04040f', overflow: 'hidden' }}>
 
      <div className="mem-header">
        <div className="mem-logo">
          <span className="mem-logo-dot" />
          <span className="mem-logo-text">Momento</span>
        </div>
 
        <div className="mem-header-center">
          <h1 className="mem-title">World of Memories</h1>
        </div>
 
        <div ref={dropdownRef} className="mem-user-area">
          <button className="mem-avatar-btn" onClick={() => setDropdownOpen(v => !v)}>
            <img
              src={user?.photo_url || AVATAR}
              alt="profile"
              className="mem-avatar"
              onError={e => { e.currentTarget.src = AVATAR; }}
            />
            <svg
              style={{ transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2.5"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
 
          {dropdownOpen && (
            <div className="mem-dropdown">
              <div className="mem-dropdown-user">
                <img src={user?.photo_url || AVATAR} alt="" className="mem-dropdown-avatar" onError={e => { e.currentTarget.src = AVATAR; }} />
                <div>
                  <div className="mem-dropdown-name">{user?.name || 'Traveler'}</div>
                  <div className="mem-dropdown-email">{user?.email || ''}</div>
                </div>
              </div>
              <div className="mem-dropdown-divider" />
              <button className="mem-dropdown-item" onClick={() => { setDropdownOpen(false); navigate("/editProfile"); }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                Edit Profile
              </button>
              <button className="mem-dropdown-item mem-dropdown-logout" onClick={() => { onLogout(); navigate("/"); }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
 
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        scrollWheelZoom={true}
        style={{ height: "100vh", width: "100vw", filter: "brightness(1.1) contrast(1.05) saturate(0.9)" }}
        attributionControl={false}
        zoomControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
 
        {geoJsonData && (
          <GeoJSON
            data={geoJsonData}
            style={() => ({
              weight: 0.8,
              color: "rgba(212,175,55,0.5)",
              opacity: 1,
              fillOpacity: 0,
            })}
          />
        )}
 
        {geoJsonData && Object.entries(memoriesByCountry).map(([country, memoryList]) => {
          const coords = getCountryCentroid(country);
          if (!coords) return null;
          return (
            <Marker key={country} position={coords} icon={pinIcon}>
              <Popup maxWidth={310} className="mem-popup">
                <MemoryCarousel images={memoryList} onDelete={deleteMemory} />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
 
      <div className="mem-stats">
        <span className="mem-stat">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2">
            <circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 14 8 14s8-8.75 8-14a8 8 0 0 0-8-8z"/>
          </svg>
          {Object.keys(memoriesByCountry).length} countries
        </span>
        <span className="mem-stat-divider" />
        <span className="mem-stat">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
          {memories.length} memories
        </span>
      </div>
 
      <button className="mem-fab" onClick={() => navigate("/create-memory")}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>New Memory</span>
      </button>
    </div>
  );
}