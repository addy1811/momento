import  { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, MapPin, Building2, Flag, Landmark, Crosshair, X, ListTree } from "lucide-react";
import RegionPicker from "./RegionPicker";
import { searchPlaces, reversePlace } from "../utils/places";
import { distanceKm, formatCoords } from "../utils/geo";
import "../design/locationPicker.css";

const pin = L.divIcon({
  className: "lp-pin",
  html: '<span class="lp-pin-pulse"></span><span class="lp-pin-dot"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const typeIcon = (t) =>
  t === "city" || t === "locality" || t === "district" ? Building2 : t === "country" || t === "state" ? Flag : t === "other" ? Landmark : MapPin;
const zoomFor = (t) => (t === "country" ? 4 : t === "state" ? 6 : t === "city" ? 11 : 14);
const KEEP_NAMES_WITHIN_KM = 25; 

function Recenter({ place }) {
  const map = useMap();
  useEffect(() => {
    if (place.source === "map") return; // user dragged: don't fight them
    map.flyTo([place.lat, place.lng], zoomFor(place.type), { duration: 0.8 });
  }, [place.lat, place.lng, place.type, place.source, map]);
  return null;
}
function ClickToPlace({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

export default function LocationPicker({ value, onChange, bias }) {
  const [mode, setMode] = useState("browse");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busyPin, setBusyPin] = useState(false);
  const wrapRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (mode !== "search") return;
    const q = query.trim();
    if (q.length < 3) { setResults([]); setError(null); return; }
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      setError(null);
      try {
        setResults(await searchPlaces(q, ctrl.signal, bias));
        setOpen(true);
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message);
      } finally {
        if (abortRef.current === ctrl) setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query, bias, mode]);

  useEffect(() => {
    const close = (e) => wrapRef.current && !wrapRef.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const choose = (r) => {
    onChange({ ...r, approx: false, source: "search" });
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  const dropAt = async (lat, lng) => {
    const prev = value;
    const moved = prev ? distanceKm(prev.lat, prev.lng, lat, lng) : Infinity;
    if (prev && moved <= KEEP_NAMES_WITHIN_KM) {
      onChange({ ...prev, lat, lng, approx: false, source: "map" });
      return;
    }
    onChange({ ...(prev || {}), lat, lng, approx: false, source: "map" });
    setBusyPin(true);
    try {
      const r = await reversePlace(lat, lng);
      onChange(
        r
          ? { ...r, lat, lng, approx: false, source: "map" }
          : { name: "Dropped pin", label: formatCoords(lat, lng), type: "other", country: null, lat, lng, approx: false, source: "map" }
      );
    } catch {
    } finally {
      setBusyPin(false);
    }
  };

  return (
    <div className="lp" ref={wrapRef}>
      <div className="lp-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={mode === "browse"} className={mode === "browse" ? "on" : ""} onClick={() => setMode("browse")}>
          <ListTree size={14} /> Browse
        </button>
        <button type="button" role="tab" aria-selected={mode === "search"} className={mode === "search" ? "on" : ""} onClick={() => setMode("search")}>
          <Search size={14} /> Search
        </button>
      </div>

      {mode === "browse" ? (
        <RegionPicker value={value} onChange={onChange} />
      ) : (
        <>
          <div className="lp-search">
            <Search size={16} className="lp-search-icon" />
            <input
              className="lp-input"
              placeholder="A landmark, neighbourhood, village or address…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length && setOpen(true)}
              aria-label="Search for a place"
            />
            {loading && <span className="lp-spin" />}
            {open && results.length > 0 && (
              <ul className="lp-results" role="listbox">
                {results.map((r) => {
                  const Icon = typeIcon(r.type);
                  return (
                    <li key={r.id + r.label}>
                      <button type="button" className="lp-result" onClick={() => choose(r)}>
                        <Icon size={16} />
                        <span>
                          <b>{r.name}</b>
                          <small>{[r.city !== r.name && r.city, r.state !== r.name && r.state, r.country !== r.name && r.country].filter(Boolean).join(", ") || r.type}</small>
                        </span>
                      </button>
                    </li>
                  );
                })}
                <li className="lp-credit">Search by OpenStreetMap contributors · Photon</li>
              </ul>
            )}
          </div>
          {error && <p className="lp-error">{error}</p>}
          {query.trim().length >= 3 && !loading && !error && results.length === 0 && (
            <p className="lp-hint">No matches. Try Browse, or drop a pin on the map below.</p>
          )}
        </>
      )}

      {value && (
        <>
          <div className="lp-chosen">
            <div className="lp-chosen-main">
              <MapPin size={16} />
              <div>
                <b>{value.name || "Chosen place"}</b>
                <small>{value.label || ""}</small>
              </div>
              <button type="button" className="lp-clear" onClick={() => onChange(null)} aria-label="Clear location"><X size={14} /></button>
            </div>
            <div className="lp-chips">
              {value.country && <span className="lp-lvl lp-lvl-country">{value.country}</span>}
              {value.state && <span className="lp-lvl lp-lvl-state">{value.state}</span>}
              {value.city && <span className="lp-lvl lp-lvl-city">{value.city}</span>}
              <span className="lp-coords"><Crosshair size={11} /> {formatCoords(value.lat, value.lng)}</span>
              {value.source === "photo" && <span className="lp-tag">from photo</span>}
              {value.source === "map" && <span className="lp-tag">exact pin</span>}
              {busyPin && <span className="lp-tag">updating…</span>}
            </div>
            {value.approx && (
              <p className="lp-note">This place has no exact coordinates in the list, so the pin sits at its {value.type === "city" ? "region" : "country"} centre. Drag it to the right spot.</p>
            )}
          </div>

          <div className="lp-map">
            <MapContainer center={[value.lat, value.lng]} zoom={zoomFor(value.type)} minZoom={2} scrollWheelZoom={false} attributionControl={false} style={{ height: "100%", width: "100%" }}>
              <TileLayer url={`https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?key=${import.meta.env.VITE_CARTO_API_KEY}`} />
              <Recenter place={value} />
              <ClickToPlace onPick={dropAt} />
              <Marker
                position={[value.lat, value.lng]}
                icon={pin}
                draggable
                eventHandlers={{ dragend: (e) => { const p = e.target.getLatLng(); dropAt(p.lat, p.lng); } }}
              />
            </MapContainer>
            <span className="lp-map-tip">Drag the pin or click the map for an exact spot</span>
          </div>
        </>
      )}
    </div>
  );
}
