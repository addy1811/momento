import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, GeoJSON, Marker, ZoomControl, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Globe from "react-globe.gl";
import Supercluster from "supercluster";
import { centroid } from "@turf/turf";
import { Globe as GlobeIcon, Map as MapIcon, Plus, LogOut, User, ChevronDown, MapPin, Images, Building2, Layers } from "lucide-react";
import AVATAR from "./assets/avatar.jpg";
import PlaceGallery from "./Components/PlaceGallery";
import PlacesRail from "./Components/PlacesRail";
import Lightbox from "./Components/LightBox";
import ConfirmDialog from "./Components/ConfirmDialog";
import EditLocationModal from "./Components/EditLocationModal";
import socket from "./socket/socket";
import { lower, norm, round, hasPin, thumb, commonLabel, headline, placeKey, esc, cssUrl } from "./utils/geo";
import homeLogo from "./assets/brand.png";
import "./design/memory.css";
import "./design/memoryLocations.css";
import "./design/gallery.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: "", iconUrl: "", shadowUrl: "" });

const TOTAL_COUNTRIES = 195;
const TILES = `https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?key=${import.meta.env.VITE_CARTO_API_KEY}`;


const iconCache = new Map();
function photoIcon(url, count) {
  const key = `${url}|${count}`;
  if (!iconCache.has(key)) {
    const safe = cssUrl(thumb(url, 88));
    iconCache.set(
      key,
      L.divIcon({
        className: "mem-photo-pin",
        iconSize: [38, 46],
        iconAnchor: [19, 42], 
        html: `<span class="mpp"><span class="mpp-img" style="background-image:url('${safe}')"></span>${count > 1 ? `<b class="mpp-count">${count}</b>` : ""}</span>`,
      })
    );
  }
  return iconCache.get(key);
}

function ClusterLayer({ points, byId, onOpen }) {
  const map = useMap();
  const index = useMemo(() => {
    const sc = new Supercluster({ radius: 56, maxZoom: 16 });
    sc.load(points.map((m) => ({ type: "Feature", properties: { id: m.id }, geometry: { type: "Point", coordinates: [m._lng, m._lat] } })));
    return sc;
  }, [points]);

  const [view, setView] = useState(null);
  const sync = useCallback(() => {
    const b = map.getBounds();
    setView({ bbox: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()], zoom: Math.round(map.getZoom()) });
  }, [map]);
  useEffect(() => { sync(); }, [sync]);
  useMapEvents({ moveend: sync, zoomend: sync });

  const items = useMemo(() => (view ? index.getClusters(view.bbox, view.zoom) : []), [index, view]);

  const clickCluster = (id, lat, lng) => {
    const z = index.getClusterExpansionZoom(id);
    if (z > view.zoom && z <= 16) map.flyTo([lat, lng], z, { duration: 0.7 });
    else onOpen(index.getLeaves(id, Infinity).map((l) => l.properties.id));
  };
  const clickPoint = (m) => {
    const near = points.filter((p) => Math.abs(p._lat - m._lat) < 0.0004 && Math.abs(p._lng - m._lng) < 0.0004).map((p) => p.id);
    onOpen(near);
  };

  return items.map((f) => {
    const [lng, lat] = f.geometry.coordinates;
    if (f.properties.cluster) {
      const id = f.properties.cluster_id;
      const first = byId.get(index.getLeaves(id, 1)[0].properties.id);
      return <Marker key={`c${id}`} position={[lat, lng]} icon={photoIcon(first.photo_url, f.properties.point_count)} eventHandlers={{ click: () => clickCluster(id, lat, lng) }} />;
    }
    const m = byId.get(f.properties.id);
    return <Marker key={`p${m.id}`} position={[lat, lng]} icon={photoIcon(m.photo_url, 1)} eventHandlers={{ click: () => clickPoint(m) }} />;
  });
}

export default function Memory({ user, onLogout }) {
  const navigate = useNavigate();
  const globeRef = useRef();
  const mapRef = useRef();
  const dropdownRef = useRef();

  const [geoJsonData, setGeoJsonData] = useState(null);
  const [memories, setMemories] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState("globe");
  const [open, setOpen] = useState(null); 
  const [filter, setFilter] = useState(null);
  const [viewerId, setViewerId] = useState(null); 
  const [confirm, setConfirm] = useState(null); 
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(null);
  const [railOpen, setRailOpen] = useState(() => window.innerWidth >= 1100);
  const [toast, setToast] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    fetch("/countries.geojson").then((r) => r.json()).then(setGeoJsonData).catch(console.error);
  }, []);
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/memories`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => setMemories(Array.isArray(rows) ? rows : []))
      .catch(console.error)
      .finally(() => setLoaded(true));
  }, []);
  useEffect(() => {
    if (!user) return;
    const onCreated = (m) => setMemories((p) => (p.some((x) => x.id === m.id) ? p : [...p, m]));
    const onUpdated = (m) => setMemories((p) => p.map((x) => (x.id === m.id ? { ...x, ...m } : x)));
    const onDeleted = ({ id }) => setMemories((p) => p.filter((m) => m.id !== Number(id)));
    socket.connect();
    socket.on("memory:created", onCreated);
    socket.on("memory:updated", onUpdated);
    socket.on("memory:deleted", onDeleted);
    return () => {
      socket.off("memory:created", onCreated);
      socket.off("memory:updated", onUpdated);
      socket.off("memory:deleted", onDeleted);
    };
  }, [user]);
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  useEffect(() => {
    const h = (e) => dropdownRef.current && !dropdownRef.current.contains(e.target) && setDropdownOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const codeByName = useMemo(() => {
    const m = new Map();
    geoJsonData?.features.forEach((f) => m.set(lower(f.properties.name), f.properties.iso_a2_eh));
    return m;
  }, [geoJsonData]);
  const countryKey = useCallback((m) => m.country_code || codeByName.get(lower(m.country)) || lower(m.country), [codeByName]);

  const enriched = useMemo(() => {
    const centroids = new Map();
    const centreOf = (country) => {
      const k = lower(country);
      if (!centroids.has(k)) {
        const f = geoJsonData?.features.find((x) => lower(x.properties.name) === k);
        centroids.set(k, f ? centroid(f).geometry.coordinates : null);
      }
      return centroids.get(k);
    };
    return memories
      .map((m) => {
        if (hasPin(m)) return { ...m, _lat: m.lat, _lng: m.lng, approx: false };
        const c = geoJsonData && centreOf(m.country);
        return c ? { ...m, _lat: c[1], _lng: c[0], approx: true } : null;
      })
      .filter(Boolean);
  }, [memories, geoJsonData]);
  const byId = useMemo(() => new Map(enriched.map((m) => [m.id, m])), [enriched]);
  const groups = useMemo(() => {
    const acc = new Map();
    enriched.forEach((m) => {
      const key = m.approx
        ? `c|${countryKey(m)}`
        : m.city
        ? `city|${norm(m.city)}|${norm(m.state)}|${countryKey(m)}`
        : m.state && m.location_source?.startsWith("browse")
        ? `state|${norm(m.state)}|${countryKey(m)}`
        : `pt|${round(m._lat, 2)}|${round(m._lng, 2)}`;
      (acc.get(key) || acc.set(key, []).get(key)).push(m);
    });
    return [...acc.entries()].map(([key, items]) => ({
      key,
      items,
      ids: items.map((i) => i.id),
      count: items.length,
      lat: items.reduce((s, i) => s + i._lat, 0) / items.length,
      lng: items.reduce((s, i) => s + i._lng, 0) / items.length,
      label: commonLabel(items),
    }));
  }, [enriched, countryKey]);

  const tree = useMemo(() => {
    const c = new Map();
    groups.forEach((g) => {
      const m0 = g.items[0];
      const k = countryKey(m0);
      if (!c.has(k)) c.set(k, { key: k, name: m0.country || "Unknown", ids: [], groups: [], cover: m0.photo_url });
      const e = c.get(k);
      e.ids.push(...g.ids);
      e.groups.push(g);
    });
    return [...c.values()]
      .map((e) => ({ ...e, groups: e.groups.sort((a, b) => b.count - a.count) }))
      .sort((a, b) => b.ids.length - a.ids.length || a.name.localeCompare(b.name));
  }, [groups, countryKey]);

  const countryStats = useMemo(() => {
    const c = new Map();
    enriched.forEach((m) => c.set(countryKey(m), (c.get(countryKey(m)) || 0) + 1));
    return c;
  }, [enriched, countryKey]);
  const visitedFeatures = useMemo(
    () => (geoJsonData ? geoJsonData.features.filter((f) => countryStats.has(f.properties.iso_a2_eh) || countryStats.has(lower(f.properties.name))) : []),
    [geoJsonData, countryStats]
  );
  const visitedKey = useMemo(() => [...countryStats.keys()].sort().join("|"), [countryStats]);
  const cityCount = useMemo(() => new Set(enriched.filter((m) => m.city).map((m) => `${norm(m.city)}|${norm(m.state)}|${countryKey(m)}`)).size, [enriched, countryKey]);
  const pct = Math.round((countryStats.size / TOTAL_COUNTRIES) * 100);

  const drawerAll = useMemo(() => (open ? open.ids.map((id) => byId.get(id)).filter(Boolean) : []), [open, byId]);
  const chips = useMemo(() => {
    const c = new Map();
    drawerAll.forEach((m) => c.set(placeKey(m), (c.get(placeKey(m)) || 0) + 1));
    return c.size > 1 ? [...c.entries()] : [];
  }, [drawerAll]);
  const drawerItems = useMemo(() => (filter ? drawerAll.filter((m) => placeKey(m) === filter) : drawerAll), [drawerAll, filter]);
  const head = useMemo(() => (open?.title ? { title: open.title, crumbs: [] } : headline(drawerAll)), [open, drawerAll]);

  useEffect(() => { if (open && drawerAll.length === 0) setOpen(null); }, [open, drawerAll.length]);
  useEffect(() => { if (viewerId && !drawerItems.some((m) => m.id === viewerId)) setViewerId(null); }, [viewerId, drawerItems]);

  const openIds = useCallback(
    (ids, { title, key, fly = true } = {}) => {
      const items = ids.map((id) => byId.get(id)).filter(Boolean);
      if (!items.length) return;
      setOpen({ ids, title, key });
      setFilter(null);
      if (!fly) return;
      const lat = items.reduce((s, i) => s + i._lat, 0) / items.length;
      const lng = items.reduce((s, i) => s + i._lng, 0) / items.length;
      if (view === "globe") globeRef.current?.pointOfView({ lat, lng, altitude: items.length > 1 ? 1.9 : 1.4 }, 1000);
      else mapRef.current?.flyTo([lat, lng], Math.max(mapRef.current.getZoom(), items.length > 1 ? 5 : 8), { duration: 0.9 });
    },
    [byId, view]
  );
  const openCountryFeature = (f) => {
    const k = f.properties.iso_a2_eh;
    const ids = enriched.filter((m) => countryKey(m) === k || countryKey(m) === lower(f.properties.name)).map((m) => m.id);
    openIds(ids, { title: f.properties.name, key: `country|${k}` });
  };

  const doDelete = async () => {
    const m = confirm;
    if (!m) return;
    setDeleting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/memories/${m.id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error();
      if (viewerId === m.id) { 
        const i = drawerItems.findIndex((x) => x.id === m.id);
        const next = drawerItems[i + 1] || drawerItems[i - 1];
        setViewerId(next ? next.id : null);
      }
      setMemories((p) => p.filter((x) => x.id !== m.id));
      setToast("Photo deleted");
    } catch {
      setToast("Could not delete that photo. Please try again.");
    } finally {
      setDeleting(false);
      setConfirm(null);
    }
  };

  const handleGlobeReady = () => {
    const g = globeRef.current;
    if (!g) return;
    const c = g.controls();
    c.autoRotate = true;
    c.autoRotateSpeed = 0.4;
    c.minDistance = 140;
    c.maxDistance = 520;
    g.pointOfView({ lat: 22, lng: 20, altitude: 2.3 }, 0);
  };
  useEffect(() => {
    const g = globeRef.current;
    if (view === "globe" && g?.controls) g.controls().autoRotate = !open;
  }, [open, view]);

  const addFromHere = () => {
    const first = drawerAll.find((m) => !m.approx);
    navigate("/create-memory", {
      state: first ? { place: { name: first.city || first.place_name || first.country, label: [first.city, first.state, first.country].filter(Boolean).join(", "), type: first.city ? "city" : "other", city: first.city, state: first.state, country: first.country, countryCode: first.country_code, lat: first.lat, lng: first.lng, source: "search" } } : undefined,
    });
  };

  const avatar = user?.photo_url || AVATAR;
  const tip = (title, n) => `<div class="mem-tip"><b>${esc(title)}</b><br/>${n} ${n === 1 ? "photo" : "photos"}</div>`;

  return (
    <div className="mem-root">
      <div className="mem-aurora" />

      <div className="mem-stage">
        {view === "globe" ? (
          <Globe
            ref={globeRef}
            width={size.w}
            height={size.h}
            backgroundColor="rgba(0,0,0,0)"
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
            bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
            showAtmosphere
            atmosphereColor="#2dd4bf"
            atmosphereAltitude={0.22}
            onGlobeReady={handleGlobeReady}
            polygonsData={visitedFeatures}
            polygonCapColor={() => "rgba(255,138,91,0.28)"}
            polygonSideColor={() => "rgba(255,95,143,0.15)"}
            polygonStrokeColor={() => "#ffb36b"}
            polygonAltitude={0.01}
            polygonLabel={(f) => tip(f.properties.name, countryStats.get(f.properties.iso_a2_eh) || countryStats.get(lower(f.properties.name)) || 0)}
            onPolygonClick={openCountryFeature}
            pointsData={groups}
            pointLat="lat"
            pointLng="lng"
            pointAltitude={(g) => 0.025 + Math.min(g.count, 10) * 0.01}
            pointRadius={0.28}
            pointColor={() => "#ffd29a"}
            pointLabel={(g) => tip(g.label, g.count)}
            onPointClick={(g) => openIds(g.ids, { key: g.key })}
            ringsData={groups}
            ringLat="lat"
            ringLng="lng"
            ringColor={() => (t) => `rgba(255,179,107,${1 - t})`}
            ringMaxRadius={2.2}
            ringPropagationSpeed={1.6}
            ringRepeatPeriod={2000}
          />
        ) : (
          <MapContainer ref={mapRef} center={[20, 0]} zoom={2} minZoom={2} worldCopyJump scrollWheelZoom zoomControl={false} attributionControl={false} className="mem-map">
            <TileLayer url={TILES} />
            {geoJsonData && (
              <GeoJSON
                key={visitedKey}
                data={geoJsonData}
                style={(f) =>
                  countryStats.has(f.properties.iso_a2_eh) || countryStats.has(lower(f.properties.name))
                    ? { color: "#ffb36b", weight: 1, fillColor: "#ff8a5b", fillOpacity: 0.16 }
                    : { color: "rgba(255,255,255,0.12)", weight: 0.6, fillOpacity: 0 }
                }
              />
            )}
            <ClusterLayer points={enriched} byId={byId} onOpen={(ids) => openIds(ids, { fly: false })} />
            <ZoomControl position="bottomright" />
          </MapContainer>
        )}
      </div>

      <header className="mem-header">
        <button className="mem-logo" onClick={() => navigate("/")}>
          <img src={homeLogo} alt="homeLogo" width={60} height={50} />
        </button>
        <div className="mem-toggle" role="tablist" aria-label="View">
          <span className="mem-toggle-pill" style={{ transform: `translateX(${view === "globe" ? 0 : 100}%)` }} />
          <button className={view === "globe" ? "on" : ""} onClick={() => setView("globe")}><GlobeIcon size={15} /> Globe</button>
          <button className={view === "map" ? "on" : ""} onClick={() => setView("map")}><MapIcon size={15} /> Map</button>
        </div>
        <div ref={dropdownRef} className="mem-user">
          <button className="mem-avatar-btn" onClick={() => setDropdownOpen((v) => !v)}>
            <img src={avatar} alt="profile" className="mem-avatar" onError={(e) => { e.currentTarget.src = AVATAR; }} />
            <ChevronDown size={14} style={{ transition: "transform .2s", transform: dropdownOpen ? "rotate(180deg)" : "none" }} />
          </button>
          {dropdownOpen && (
            <div className="mem-dropdown">
              <div className="mem-dropdown-user">
                <img src={avatar} alt="" className="mem-dropdown-avatar" onError={(e) => { e.currentTarget.src = AVATAR; }} />
                <div>
                  <div className="mem-dropdown-name">{user?.name || "Traveler"}</div>
                  <div className="mem-dropdown-email">{user?.email || ""}</div>
                </div>
              </div>
              <div className="mem-dropdown-divider" />
              <button className="mem-dropdown-item" onClick={() => { setDropdownOpen(false); navigate("/editProfile"); }}><User size={15} /> Edit profile</button>
              <button className="mem-dropdown-item mem-dropdown-logout" onClick={() => { onLogout(); navigate("/"); }}><LogOut size={15} /> Log out</button>
            </div>
          )}
        </div>
      </header>
      {railOpen ? (
        <PlacesRail
          tree={tree}
          activeKey={open?.key}
          onOpenCountry={(c) => openIds(c.ids, { title: c.name, key: `country|${c.key}` })}
          onOpenGroup={(g) => openIds(g.ids, { key: g.key })}
          onClose={() => setRailOpen(false)}
        />
      ) : (
        <button className="pr-toggle" onClick={() => setRailOpen(true)}><Layers size={15} /> Your places <i>{tree.length}</i></button>
      )}

      <div className="mem-stats">
        <div className="mem-stats-row">
          <span><MapPin size={14} /> <b>{countryStats.size}</b> countries</span>
          <span><Building2 size={14} /> <b>{cityCount}</b> cities</span>
          <span><Images size={14} /> <b>{memories.length}</b></span>
        </div>
        <div className="mem-bar"><i style={{ width: `${Math.max(pct, countryStats.size ? 3 : 0)}%` }} /></div>
        <small>{pct}% of the world lit up</small>
      </div>

      {loaded && memories.length === 0}

      {open && drawerAll.length > 0 && (
        <PlaceGallery
          title={head.title}
          crumbs={head.crumbs}
          items={drawerItems}
          total={drawerAll.length}
          chips={chips}
          filter={filter}
          onFilter={setFilter}
          onOpen={setViewerId}
          onDelete={setConfirm}
          onAdd={addFromHere}
          onClose={() => setOpen(null)}
        />
      )}

      {viewerId && (
        <Lightbox items={drawerItems} activeId={viewerId} onChange={setViewerId} onClose={() => setViewerId(null)} onDelete={setConfirm} onEditPlace={setEditing} />
      )}

      {editing && (
        <EditLocationModal
          memory={editing}
          onClose={() => setEditing(null)}
          onSaved={(row) => setMemories((p) => p.map((m) => (m.id === row.id ? { ...m, ...row } : m)))}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title="Delete this photo?"
          text={`This permanently removes the photo${confirm.city ? ` from ${confirm.city}` : ""} and its story. You can't undo it.`}
          confirmLabel="Delete photo"
          busy={deleting}
          onConfirm={doDelete}
          onCancel={() => setConfirm(null)}
        />
      )}

      {toast && <div className="mem-toast" role="status">{toast}</div>}

      <button className="mem-fab" onClick={() => navigate("/create-memory")}>
        <Plus size={18} /> <span>New memory</span>
      </button>
    </div>
  );
}
