import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./design/createMemory.css";

export default function CreateMemory() {
  const navigate = useNavigate();
  const locationRouter = useLocation();
  const prefillCountry = locationRouter.state?.country || "";
  const [country, setCountry] = useState(prefillCountry);
  const [countries, setCountries] = useState([]);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
 
  useEffect(() => {
    fetch("/countries.geojson")
      .then(res => res.json())
      .then(data => {
        const names = data.features
          .map(f => ({ name: f.properties.name || f.properties.ADMIN, value: f.properties.ADMIN }))
          .filter(Boolean)
          .sort((a, b) => a.name?.localeCompare(b.name));
        setCountries(names);
      })
      .catch(console.error);
  }, []);
 
  const handleFile = (file) => {
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!country) return setError("Please select a country.");
    if (!image) return setError("Please select an image.");
 
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("country", country);
      formData.append("description", description);
      formData.append("image", image);
 
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/memories`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
 
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : data.error?.message || "Upload failed");
      navigate("/memory");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="cm-root">
      <div className="cm-bg" />
      <div className="cm-orb cm-orb-1" />
      <div className="cm-orb cm-orb-2" />
 
      <div className="cm-card">
        {/* Back */}
        <button className="cm-back" onClick={() => navigate("/memory")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to map
        </button>
 
        <div className="cm-header">
          <div className="cm-icon">📍</div>
          <h1 className="cm-title">Pin a Memory</h1>
          <p className="cm-sub">Capture a moment, place it on your world</p>
        </div>
 
        <form onSubmit={handleSubmit} className="cm-form">
          {/* Country */}
          <div className="cm-field">
            <label className="cm-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 14 8 14s8-8.75 8-14a8 8 0 0 0-8-8z"/>
              </svg>
              Country
            </label>
            <div className="cm-select-wrap">
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                required
                className="cm-select"
              >
                <option value="" disabled>Select a country...</option>
                {countries.map((c, i) => (
                  <option key={i} value={c.value}>{c.name}</option>
                ))}
              </select>
              <svg className="cm-select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
 
          {/* Image upload */}
          <div className="cm-field">
            <label className="cm-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
              Photo
            </label>
 
            <div
              className={`cm-dropzone ${dragOver ? 'cm-dropzone-active' : ''} ${preview ? 'cm-dropzone-filled' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => document.getElementById('cm-file').click()}
            >
              {preview ? (
                <img src={preview} alt="preview" className="cm-preview-img" />
              ) : (
                <div className="cm-dropzone-inner">
                  <div className="cm-upload-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                    </svg>
                  </div>
                  <p className="cm-dropzone-text">Drop your photo here</p>
                  <p className="cm-dropzone-hint">or click to browse</p>
                </div>
              )}
              {preview && (
                <div className="cm-preview-overlay">
                  <span>Change photo</span>
                </div>
              )}
            </div>
            <input
              id="cm-file"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])}
            />
            {image && <p className="cm-filename">{image.name}</p>}
          </div>
 
          {/* Description */}
          <div className="cm-field">
            <label className="cm-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/>
              </svg>
              Description
              <span className="cm-label-opt">Optional</span>
            </label>
            <textarea
              className="cm-textarea"
              placeholder="What made this moment special?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>
 
          {error && (
            <div className="cm-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}
 
          <div className="cm-actions">
            <button type="button" className="cm-cancel" onClick={() => navigate("/memory")}>Cancel</button>
            <button type="submit" className="cm-submit" disabled={loading}>
              {loading ? (
                <><span className="cm-spinner" /> Saving...</>
              ) : (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="20 6 9 17 4 12" />
                </svg> Save Memory</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
 
