import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AVATAR from "../assets/avatar.jpg";
import "../design/profileEdit.css";
export default function ProfileEdit({ refreshUser }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dob, setDob] = useState("");
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(AVATAR);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
 
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/me`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setDob(data?.dob ? data.dob.split("T")[0] : "");
        setPreview(data?.photo_url || AVATAR);
      });
  }, []);
 
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };
 
  const handleSave = async () => {
    setSaving(true);
    const formData = new FormData();
    if (dob) formData.append("dob", dob);
    if (photo) formData.append("photo", photo);
 
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/me/profile`, {
      method: "POST",
      credentials: "include",
      body: formData
    });
 
    setSaving(false);
    if (res.ok) {
      await refreshUser();
      setSuccess(true);
      setTimeout(() => navigate("/memory"), 1000);
    } else {
      const err = await res.json();
      console.error(err);
    }
  };
 
  if (!user) {
    return (
      <div className="pe-root">
        <div className="pe-loading">
          <div className="pe-spinner-lg" />
          <p>Loading profile...</p>
        </div>
        <style>{`.pe-root{min-height:100vh;background:#04040f;display:flex;align-items:center;justify-content:center;font-family:'DM Sans',sans-serif;color:rgba(200,184,126,0.5);}.pe-loading{display:flex;flex-direction:column;align-items:center;gap:16px;font-size:0.9rem;}.pe-spinner-lg{width:32px;height:32px;border:2px solid rgba(212,175,55,0.15);border-top-color:#d4af37;border-radius:50%;animation:spin 0.8s linear infinite;}@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      </div>
    );
  }
 
  return (
    <div className="pe-root">
      <div className="pe-bg" />
      <div className="pe-orb pe-orb-1" />
      <div className="pe-orb pe-orb-2" />
 
      <div className="pe-card">
        <button className="pe-back" onClick={() => navigate("/memory")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to map
        </button>
 
        <div className="pe-header">
          <h1 className="pe-title">Edit Profile</h1>
          <p className="pe-sub">Update your traveler identity</p>
        </div>
 
        <div className="pe-avatar-section">
          <label className="pe-avatar-label" htmlFor="pe-photo">
            <div className="pe-avatar-wrap">
              <img src={preview} alt="avatar" className="pe-avatar" onError={e => { e.currentTarget.src = AVATAR; }} />
              <div className="pe-avatar-overlay">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
            </div>
            <input id="pe-photo" type="file" accept="image/*" hidden onChange={handleImageChange} />
          </label>
          <div className="pe-avatar-info">
            <span className="pe-avatar-name">{user.name}</span>
            <span className="pe-avatar-hint">Click to update photo</span>
          </div>
        </div>

        <div className="pe-fields">
          <div className="pe-field">
            <label className="pe-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              Full Name
            </label>
            <input className="pe-input pe-disabled" value={user.name} disabled />
            <span className="pe-field-hint">Name cannot be changed</span>
          </div>
 
          <div className="pe-field">
            <label className="pe-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Date of Birth
            </label>
            <input
              type="date"
              className="pe-input"
              value={dob}
              onChange={e => setDob(e.target.value)}
            />
          </div>
        </div>
 
        <div className="pe-actions">
          <button className="pe-cancel" onClick={() => navigate("/memory")}>Cancel</button>
          <button className="pe-save" onClick={handleSave} disabled={saving || success}>
            {success ? (
              <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg> Saved!</>
            ) : saving ? (
              <><span className="pe-spinner" /> Saving...</>
            ) : (
              <>Save Changes</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}