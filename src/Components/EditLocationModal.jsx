import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import LocationPicker from "./LocationPicker";
import { placeFields } from "../utils/places";
import { fullPlace, hasPin } from "../utils/geo";
import "../design/memoryLocations.css";

function placeFromMemory(m) {
  const lat = hasPin(m) ? m.lat : m._lat;
  const lng = hasPin(m) ? m.lng : m._lng;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const type = m.place_name && m.place_name !== m.city ? "other" : m.city ? "city" : m.state ? "state" : "country";
  return {
    name: m.place_name || m.city || m.state || m.country,
    label: fullPlace(m),
    type,
    city: m.city,
    state: m.state,
    country: m.country,
    countryCode: m.country_code,
    lat,
    lng,
    approx: !hasPin(m),
    source: m.location_source || "browse",
  };
}


export default function EditLocationModal({ memory, onClose, onSaved }) {
  const initial = useMemo(() => placeFromMemory(memory), [memory]);
  const [place, setPlace] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const bias = useMemo(() => (initial ? { lat: initial.lat, lng: initial.lng } : undefined), [initial]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const changed = !!place && place !== initial;

  const save = async () => {
    if (!changed || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/memories/${memory.id}/location`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(placeFields(place)),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not save the place.");
      onSaved?.(data);
      onClose?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="elm-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="elm" role="dialog" aria-modal="true" aria-label="Edit place">
        <button type="button" className="elm-close" onClick={onClose} aria-label="Close"><X size={16} /></button>
        <h3>{initial?.approx || !initial ? "Set exact place" : "Edit place"}</h3>
        <p>Choose where this memory was made, then fine-tune the pin on the map.</p>

        <LocationPicker value={place} onChange={setPlace} bias={bias} />

        {error && <div className="elm-error">{error}</div>}
        <div className="elm-actions">
          <button type="button" className="elm-cancel" onClick={onClose}>Cancel</button>
          <button type="button" className="elm-save" onClick={save} disabled={!changed || saving}>
            {saving ? "Saving…" : "Save place"}
          </button>
        </div>
      </div>
    </div>
  );
}