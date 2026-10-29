import { round } from "./geo";

const PHOTON = "https://photon.komoot.io";
const COARSE = new Set(["city", "district", "locality", "state", "country"]);

const dedupe = (parts) => parts.filter(Boolean).filter((p, i, a) => a.indexOf(p) === i);

function toPlace(f, { coarse = false } = {}) {
  const p = f?.properties || {};
  const [lng, lat] = f?.geometry?.coordinates || [];
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  let type = p.type || "other";
  if (type === "county") type = "state"; 

  const city = type === "city" ? p.name : p.city || null;
  const state = type === "state" ? p.name : p.state || null;
  const country = type === "country" ? p.name : p.country || null;

  const area = p.city || p.locality || p.district || p.state || p.country;
  const street = [p.street, p.housenumber].filter(Boolean).join(" ");
  const name = (coarse && !COARSE.has(type) ? area : p.name) || street || area || "Dropped pin";

  return {
    id: `${p.osm_type || ""}${p.osm_id || `${lat},${lng}`}`,
    name,
    label: dedupe([name, city, state, country]).join(", "),
    type,
    city,
    state,
    country,
    countryCode: p.countrycode ? String(p.countrycode).toUpperCase() : null,
    lat,
    lng,
  };
}

async function photon(path, params, signal) {
  let res;
  try {
    res = await fetch(`${PHOTON}${path}?${params}`, { signal });
  } catch (e) {
    if (e.name === "AbortError") throw e;
    throw new Error("Could not reach the place search. Check your connection, or use Browse.");
  }
  if (!res.ok) throw new Error("Place search is busy right now. Try Browse, or drop a pin on the map.");
  return res.json();
}

export async function searchPlaces(query, signal, bias) {
  const params = new URLSearchParams({ q: query, limit: "8", lang: "en" });
  if (Number.isFinite(bias?.lat) && Number.isFinite(bias?.lng)) {
    params.set("lat", bias.lat);
    params.set("lon", bias.lng);
  }
  const data = await photon("/api/", params, signal);
  const seen = new Set();
  return (data.features || [])
    .map((f) => toPlace(f))
    .filter((p) => p && !seen.has(p.id + p.label) && seen.add(p.id + p.label));
}

export async function reversePlace(lat, lng, signal) {
  const params = new URLSearchParams({ lat, lon: lng, lang: "en", limit: "1" });
  const data = await photon("/reverse", params, signal);
  return toPlace(data.features?.[0], { coarse: true });
}

export function placeFields(place) {
  const source =
    place.approx && (!place.source || place.source === "browse") ? "browse_approx" : place.source;
  const fields = {
    lat: Number.isFinite(place.lat) ? round(place.lat, 6) : null,
    lng: Number.isFinite(place.lng) ? round(place.lng, 6) : null,
    placeName: place.type === "country" || place.type === "state" ? null : place.name,
    city: place.city,
    state: place.state,
    country: place.country,
    countryCode: place.countryCode,
    locationSource: source,
  };
  return Object.fromEntries(
    Object.entries(fields)
      .filter(([, v]) => v !== null && v !== undefined && v !== "")
      .map(([k, v]) => [k, String(v)])
  );
}