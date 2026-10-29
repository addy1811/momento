import { useMemo } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { thumb, placeKey, shortPlace } from "../utils/geo";

export default function PlaceGallery({ title, crumbs, items, total, chips, filter, onFilter, onOpen, onDelete, onAdd, onClose }) {
  const sections = useMemo(() => {
    const by = new Map();
    items.forEach((m) => { const k = placeKey(m); (by.get(k) || by.set(k, []).get(k)).push(m); });
    return [...by.entries()].map(([name, list]) => ({ name, list }));
  }, [items]);
  const showHeads = sections.length > 1;

  return (
    <aside className="pg" aria-label={`Photos from ${title}`}>
      <button className="pg-close" onClick={onClose} aria-label="Close"><X size={16} /></button>

      <header className="pg-head">
        <p className="pg-kicker">Memories from</p>
        <h2 className="pg-title">{title}</h2>
        {crumbs.length > 0 && (
          <div className="pg-crumbs">
            {crumbs.map((c, i) => <span key={c} className={`mc-crumb ${i === crumbs.length - 1 ? "mc-country" : "mc-state"}`}>{c}</span>)}
          </div>
        )}
        <p className="pg-meta">{total} {total === 1 ? "photo" : "photos"}{chips.length ? ` · ${chips.length} places` : ""}</p>
      </header>

      {chips.length > 0 && (
        <div className="mem-chips">
          <button className={!filter ? "on" : ""} onClick={() => onFilter(null)}>All</button>
          {chips.map(([name, n]) => (
            <button key={name} className={filter === name ? "on" : ""} onClick={() => onFilter(name)}>{name} <i>{n}</i></button>
          ))}
        </div>
      )}

      <div className="pg-body">
        {sections.map((sec) => (
          <section key={sec.name} className="pg-sec">
            {showHeads && <h4 className="pg-sec-head">{sec.name} <span>{sec.list.length}</span></h4>}
            <div className="pg-grid">
              {sec.list.map((m, i) => (
                <div key={m.id} className={`pg-tile ${i === 0 && sec.list.length >= 3 ? "feature" : ""}`}>
                  <button className="pg-open" onClick={() => onOpen(m.id)} aria-label={`Open photo from ${shortPlace(m)}`}>
                    <img src={thumb(m.photo_url, i === 0 && sec.list.length >= 3 ? 640 : 360)} alt={m.description || shortPlace(m)} loading="lazy" decoding="async" />
                    <span className="pg-shade" />
                    <span className="pg-cap">{shortPlace(m)}{m.approx ? " ≈" : ""}</span>
                  </button>
                  <button className="pg-del" onClick={() => onDelete(m)} aria-label="Delete photo" title="Delete photo"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <button className="mem-drawer-add" onClick={onAdd}><Plus size={15} /> Add another memory here</button>
    </aside>
  );
}
