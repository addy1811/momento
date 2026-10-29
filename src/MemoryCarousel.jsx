import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Trash2, Crosshair } from "lucide-react";
import { fit, formatCoords, precisionOf } from "./utils/geo";

const variants = {
  enter: (d) => ({ opacity: 0, x: d * 48, scale: 1.04 }),
  center: { opacity: 1, x: 0, scale: 1 },
  exit: (d) => ({ opacity: 0, x: d * -48 }),
};

export default function MemoryCarousel({ images = [], onDelete, onEditPlace }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  if (!images.length) return <div className="mc-empty">No memories here</div>;

  const i = Math.min(index, images.length - 1); // stays valid after a delete / filter
  const current = images[i];
  const go = (d) => { setDirection(d); setIndex((i + d + images.length) % images.length); };

  return (
    <div className="mc">
      <div className="mc-frame">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.img
            key={current.id}
            src={fit(current.photo_url, 900)}
            alt={current.description || "memory"}
            className="mc-img"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          />
        </AnimatePresence>
        <div className="mc-shade" />
        {images.length > 1 && <span className="mc-count">{i + 1} / {images.length}</span>}
        {onDelete && (
          <button className="mc-delete" title="Delete memory" onClick={() => onDelete(current.id)}>
            <Trash2 size={14} />
          </button>
        )}
        {images.length > 1 && (
          <>
            <button className="mc-nav mc-prev" onClick={() => go(-1)} aria-label="Previous"><ChevronLeft size={18} /></button>
            <button className="mc-nav mc-next" onClick={() => go(1)} aria-label="Next"><ChevronRight size={18} /></button>
          </>
        )}
      </div>

      {current.place_name && current.place_name !== current.city && <p className="mc-title">{current.place_name}</p>}
      <div className="mc-crumbs">
        {current.city && <span className="mc-crumb mc-city">{current.city}</span>}
        {current.state && <span className="mc-crumb mc-state">{current.state}</span>}
        {current.country && <span className="mc-crumb mc-country">{current.country}</span>}
        <span className={`mc-prec p${precisionOf(current).level}`}>{precisionOf(current).label}</span>
      </div>
      <div className="mc-meta">
        <span title="Latitude, longitude">
          <Crosshair size={12} /> {formatCoords(current._lat ?? current.lat, current._lng ?? current.lng)}
        </span>
        {onEditPlace && (
          <button className="mc-edit" onClick={() => onEditPlace(current)}>
            {current.approx ? "Set exact place" : "Edit place"}
          </button>
        )}
      </div>
      {current.description && <p className="mc-desc">{current.description}</p>}

      {images.length > 1 && (
        <div className="mc-dots">
          {images.map((m, idx) => (
            <button
              key={m.id}
              aria-label={`Memory ${idx + 1}`}
              className={`mc-dot ${idx === i ? "on" : ""}`}
              onClick={() => { setDirection(idx > i ? 1 : -1); setIndex(idx); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
