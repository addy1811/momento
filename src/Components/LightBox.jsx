import  { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Trash2, Pencil, Crosshair } from "lucide-react";
import { fit, thumb, formatCoords, precisionOf } from "../utils/geo";

const slide = {
  enter: (d) => ({ opacity: 0, x: d * 60 }),
  center: { opacity: 1, x: 0 },
  exit: (d) => ({ opacity: 0, x: d * -60 }),
};

export default function Lightbox({ items, activeId, onChange, onClose, onDelete, onEditPlace }) {
  const idx = Math.max(0, items.findIndex((m) => m.id === activeId));
  const m = items[idx];
  const [dir, setDir] = useState(1);
  const stripRef = useRef(null);

  const go = useCallback(
    (d) => {
      if (items.length < 2) return;
      setDir(d);
      onChange(items[(idx + d + items.length) % items.length].id);
    },
    [idx, items, onChange]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // warm the cache for the neighbours and keep the active thumbnail in view
  useEffect(() => {
    [items[idx - 1], items[idx + 1]].filter(Boolean).forEach((n) => { new Image().src = fit(n.photo_url, 1600); });
    stripRef.current?.querySelector(".on")?.scrollIntoView?.({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [idx, items]);

  if (!m) return null;
  const prec = precisionOf(m);

  return (
    <div className="lb" role="dialog" aria-modal="true" aria-label="Photo viewer">
      <div className="lb-backdrop" onClick={onClose} />
      <button className="lb-close" onClick={onClose} aria-label="Close viewer"><X size={20} /></button>

      <div className="lb-main">
        <div className="lb-stage">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.img
              key={m.id}
              src={fit(m.photo_url, 1600)}
              alt={m.description || m.city || "memory"}
              className="lb-img"
              custom={dir}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              draggable={false}
            />
          </AnimatePresence>
          {items.length > 1 && (
            <>
              <button className="lb-nav lb-prev" onClick={() => go(-1)} aria-label="Previous photo"><ChevronLeft size={22} /></button>
              <button className="lb-nav lb-next" onClick={() => go(1)} aria-label="Next photo"><ChevronRight size={22} /></button>
            </>
          )}
          <span className="lb-count">{idx + 1} / {items.length}</span>
        </div>

        <aside className="lb-info">
          <p className="lb-kicker">Taken in</p>
          <h3 className="lb-title">{m.place_name && m.place_name !== m.city ? m.place_name : m.city || m.state || m.country}</h3>
          <div className="lb-crumbs">
            {m.city && m.place_name && m.place_name !== m.city && <span className="mc-crumb mc-city">{m.city}</span>}
            {m.state && <span className="mc-crumb mc-state">{m.state}</span>}
            {m.country && <span className="mc-crumb mc-country">{m.country}</span>}
          </div>
          <p className="lb-coords"><Crosshair size={13} /> {formatCoords(m._lat ?? m.lat, m._lng ?? m.lng)} <em className={`mc-prec p${prec.level}`}>{prec.label}</em></p>
          {m.description ? <p className="lb-desc">{m.description}</p> : <p className="lb-desc lb-desc-empty">No story added for this photo.</p>}
          <div className="lb-actions">
            <button className="lb-btn" onClick={() => onEditPlace(m)}><Pencil size={14} /> {m.approx ? "Set exact place" : "Edit place"}</button>
            <button className="lb-btn lb-danger" onClick={() => onDelete(m)}><Trash2 size={14} /> Delete photo</button>
          </div>
        </aside>
      </div>

      {items.length > 1 && (
        <div className="lb-strip" ref={stripRef}>
          {items.map((t, i) => (
            <button
              key={t.id}
              className={t.id === m.id ? "on" : ""}
              onClick={() => { setDir(i > idx ? 1 : -1); onChange(t.id); }}
              aria-label={`Photo ${i + 1}`}
            >
              <img src={thumb(t.photo_url, 120)} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
