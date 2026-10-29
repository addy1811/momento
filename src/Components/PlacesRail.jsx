import  { useMemo, useState } from "react";
import { Search, ChevronRight, Layers, X } from "lucide-react";
import { thumb, norm, shortPlace } from "../utils/geo";

export default function PlacesRail({ tree, activeKey, onOpenCountry, onOpenGroup, onClose }) {
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState(() => new Set());
  const nq = norm(q);

  const rows = useMemo(() => {
    if (!nq) return tree;
    return tree
      .map((c) => {
        const countryHit = norm(c.name).includes(nq);
        const groups = countryHit ? c.groups : c.groups.filter((g) => norm(shortPlace(g.items[0])).includes(nq));
        return countryHit || groups.length ? { ...c, groups } : null;
      })
      .filter(Boolean);
  }, [tree, nq]);

  const toggle = (key) => setExpanded((s) => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n; });

  return (
    <aside className="pr" aria-label="Your places">
      <header className="pr-head">
        <h3><Layers size={15} /> Your places</h3>
        <button className="pr-x" onClick={onClose} aria-label="Hide places"><X size={15} /></button>
      </header>
      <label className="pr-search">
        <Search size={14} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a country or city" aria-label="Find a place" />
      </label>

      <div className="pr-list">
        {rows.length === 0 && <p className="pr-empty">{tree.length ? "No place matches." : "Pinned places will show up here."}</p>}
        {rows.map((c) => {
          const open = nq ? true : expanded.has(c.key);
          return (
            <div key={c.key} className="pr-country">
              <div className={`pr-row ${activeKey === `country|${c.key}` ? "on" : ""}`}>
                <button className="pr-main" onClick={() => onOpenCountry(c)}>
                  <img src={thumb(c.cover, 72)} alt="" loading="lazy" />
                  <span><b>{c.name}</b><small>{c.ids.length} {c.ids.length === 1 ? "photo" : "photos"} · {c.groups.length} {c.groups.length === 1 ? "place" : "places"}</small></span>
                </button>
                {c.groups.length > 0 && (
                  <button className={`pr-chev ${open ? "open" : ""}`} onClick={() => toggle(c.key)} aria-label={open ? "Collapse" : "Expand"} aria-expanded={open}>
                    <ChevronRight size={15} />
                  </button>
                )}
              </div>
              {open && (
                <ul className="pr-places">
                  {c.groups.map((g) => (
                    <li key={g.key}>
                      <button className={`pr-place ${activeKey === g.key ? "on" : ""}`} onClick={() => onOpenGroup(g)}>
                        <img src={thumb(g.items[0].photo_url, 56)} alt="" loading="lazy" />
                        <span>{shortPlace(g.items[0])}{g.items[0].approx ? " ≈" : ""}</span>
                        <i>{g.count}</i>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
