export const lower = (s) => String(s || "").toLowerCase();
export const round = (n, d) => Math.round(n * 10 ** d) / 10 ** d;
export const hasPin = (m) => Number.isFinite(m?.lat) && Number.isFinite(m?.lng);

const withTransform = (url, t) => (url && url.includes("/upload/") ? url.replace("/upload/", `/upload/${t}/`) : url);
export const thumb = (url, size = 96) => withTransform(url, `c_fill,g_auto,w_${size},h_${size},f_auto,q_auto`);
export const fit = (url, width = 900) => withTransform(url, `c_limit,w_${width},f_auto,q_auto`);

const dedupe = (parts) => parts.filter(Boolean).filter((p, i, a) => a.indexOf(p) === i);
export const placeLine = (m) => dedupe([m.city, m.state, m.country]).join(", ");

export function commonLabel(items) {
  if (!items.length) return "";
  const f = items[0];
  const same = (k) => f[k] && items.every((i) => i[k] === f[k]);
  if (same("city") && same("country")) return dedupe([f.city, f.state, f.country]).join(", ");
  if (same("state") && same("country")) return dedupe([f.state, f.country]).join(", ");
  if (same("country")) return f.country;
  return "Several places";
}

export async function readPhotoGps(file) {
  try {
    const mod = await import("exifr");
    const gps = mod.gps || mod.default?.gps;
    const r = gps ? await gps(file) : null;
    return r && Number.isFinite(r.latitude) && Number.isFinite(r.longitude) ? r : null;
  } catch {
    return null; 
  }
}

export const fullPlace = (m) => dedupe([m.place_name, m.city, m.state, m.country]).join(", ");

export const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const cssUrl = (v) => String(v ?? "").replace(/['"()<>\\\s]/g, (c) => encodeURIComponent(c));

export const norm = (s) => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function rankMatches(items, query) {
  const q = norm(query);
  if (!q) return items;
  const starts = [];
  const contains = [];
  for (const it of items) {
    if (it.n.startsWith(q)) starts.push(it);
    else if (it.n.includes(q)) contains.push(it);
  }
  return starts.concat(contains);
}

export function distanceKm(aLat, aLng, bLat, bLng) {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLng = (bLng - aLng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

export const formatCoords = (lat, lng) =>
  `${Math.abs(lat).toFixed(4)}\u00b0 ${lat >= 0 ? "N" : "S"}, ${Math.abs(lng).toFixed(4)}\u00b0 ${lng >= 0 ? "E" : "W"}`;

export function precisionOf(m) {
  if (m.approx || !Number.isFinite(m.lat)) return { label: "Country centre", level: 0 };
  if (m.location_source === "map" || m.location_source === "photo") return { label: "Exact pin", level: 3 };
  if (m.location_source === "browse_approx") return { label: "Approximate", level: 1 };
  if (m.city) return { label: "City centre", level: 2 };
  if (m.state) return { label: "Region centre", level: 1 };
  return { label: "Place", level: 2 };
}

export function headline(items) {
  if (!items.length) return { title: "", crumbs: [] };
  const f = items[0];
  const same = (k) => f[k] && items.every((i) => i[k] === f[k]);
  if (same("city") && same("country")) return { title: f.city, crumbs: dedupe([f.state, f.country]) };
  if (same("state") && same("country")) return { title: f.state, crumbs: [f.country] };
  if (same("country")) return { title: f.country, crumbs: [] };
  return { title: "Several places", crumbs: [] };
}
export const placeKey = (m) => m.city || m.state || m.country || "Other";
export const shortPlace = (m) => m.city || m.place_name || m.state || m.country || "Somewhere";
