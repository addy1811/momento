import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import LocationPicker from "./Components/LocationPicker";
import { readPhotoGps } from "./utils/geo";
import { reversePlace, placeFields } from "./utils/places";
import "./design/createMemory.css";
import "./design/gallery.css";

const MAX_BYTES = 5 * 1024 * 1024;

export default function CreateMemory() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const [place, setPlace] = useState(routerLocation.state?.place || null);
  const [photoHint, setPhotoHint] = useState(null);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const removeImage = () => {
    setImage(null);
    setPreview(null);
    setPhotoHint(null);
    setPlace((p) => (p?.source === "photo" ? null : p));
    setError(null);
    if (fileInput.current) fileInput.current.value = ""; 
  };

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError("Image must be under 5 MB.");
      return;
    }
    setError(null);
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setPhotoHint(null);

    const gps = await readPhotoGps(file);
    if (!gps) return;
    const found = await reversePlace(gps.latitude, gps.longitude).catch(() => null);
    const fromPhoto = {
      ...(found || { name: "Photo location", label: `${gps.latitude.toFixed(4)}, ${gps.longitude.toFixed(4)}`, type: "other", country: null }),
      lat: gps.latitude,
      lng: gps.longitude,
      source: "photo",
    };
    setPhotoHint(fromPhoto);
    setPlace((prev) => prev || fromPhoto);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!image) return setError("Please select an image.");
    if (!place) return setError("Please choose where this memory was made (at least a country).");

    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(placeFields(place)).forEach(([k, v]) => formData.append(k, v));
      formData.append("description", description);
      formData.append("image", image);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/memories`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
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
        <button className="cm-back" onClick={() => navigate("/memory")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to map
        </button>

        <div className="cm-header">
              <h1 className="cm-title">Upload a Memory</h1>
          <p className="cm-sub">Capture a moment, place it on your world</p>
        </div>

        <form onSubmit={handleSubmit} className="cm-form">
          <div className="cm-field">
            <label className="cm-label">
              <span className="cm-step">1</span>
              Photo
            </label>
            <div
              className={`cm-dropzone ${dragOver ? "cm-dropzone-active" : ""} ${preview ? "cm-dropzone-filled" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => fileInput.current?.click()}
            >
              {preview ? (
                <img src={preview} alt="preview" className="cm-preview-img" />
              ) : (
                <div className="cm-dropzone-inner">
                  <div className="cm-upload-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
                      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                    </svg>
                  </div>
                  <p className="cm-dropzone-text">Drop your photo here</p>
                  <p className="cm-dropzone-hint">or click to browse · max 5 MB</p>
                </div>
              )}
              {preview && <div className="cm-preview-overlay"><span>Change photo</span></div>}
              {preview && (
                <button type="button" className="cm-remove" aria-label="Remove photo" title="Remove photo" onClick={(e) => { e.stopPropagation(); removeImage(); }}>
                  <X size={16} />
                </button>
              )}
            </div>
            <input id="cm-file" ref={fileInput} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { handleFile(e.target.files[0]); e.target.value = ""; }} />
            {image && (
              <div className="cm-file-row">
                <p className="cm-filename">{image.name}</p>
                <button type="button" className="cm-remove-link" onClick={removeImage}>Remove photo</button>
              </div>
            )}
          </div>

          <div className="cm-field">
            <label className="cm-label">
              <span className="cm-step">2</span>
              Where was this?
              <span className="cm-label-opt">Country › state › city</span>
            </label>
            {photoHint && place?.source !== "photo" && (
              <button type="button" className="cm-photo-hint" onClick={() => setPlace(photoHint)}>
                📸 Your photo was taken near <b>{photoHint.label}</b>. Use it
              </button>
            )}
            <LocationPicker value={place} onChange={setPlace} />
          </div>

          <div className="cm-field">
            <label className="cm-label">
              <span className="cm-step">3</span>
              Your story
              <span className="cm-label-opt">Optional</span>
            </label>
            <textarea className="cm-textarea" placeholder="What made this moment special?" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
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
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="20 6 9 17 4 12" /></svg> Save Memory</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
