import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
 
export default function MemoryCarousel({ images = [], onDelete }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
 
  if (!images.length) return (
    <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(200,184,126,0.4)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem' }}>
      No memories yet
    </div>
  );
 
  const handleNext = () => { setDirection(1); setIndex(prev => (prev + 1) % images.length); };
  const handlePrev = () => { setDirection(-1); setIndex(prev => (prev - 1 + images.length) % images.length); };
 
  const current = images[index];
 
  return (
    <div style={{
      width: '300px',
      background: 'rgba(4,4,15,0.97)',
      borderRadius: '14px',
      overflow: 'hidden',
      fontFamily: 'DM Sans, sans-serif',
      boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
    }}>
 
      <div style={{ position: 'relative', height: '200px', background: '#0a0a1a', overflow: 'hidden' }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.img
            key={current.id}
            custom={direction}
            src={current.photo_url}
            alt="memory"
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </AnimatePresence>

        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(4,4,15,0.8) 0%, transparent 50%)',
          pointerEvents: 'none'
        }} />

        {images.length > 1 && (
          <div style={{
            position: 'absolute', top: 10, left: 12,
            background: 'rgba(4,4,15,0.75)',
            border: '1px solid rgba(212,175,55,0.2)',
            borderRadius: '100px',
            padding: '3px 10px',
            fontSize: '0.7rem',
            color: 'rgba(200,184,126,0.8)',
            backdropFilter: 'blur(8px)',
          }}>
            {index + 1} / {images.length}
          </div>
        )}

        {onDelete && (
          <button
            onClick={() => onDelete(current.id)}
            style={{
              position: 'absolute', top: 10, right: 10,
              background: 'rgba(239,68,68,0.2)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px',
              width: '30px', height: '30px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              color: '#f87171',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
            title="Delete memory"
          >
            <Trash2 size={14} />
          </button>
        )}
 
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(4,4,15,0.7)',
                border: '1px solid rgba(212,175,55,0.15)',
                borderRadius: '50%',
                width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#f0e6c8',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.2)'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(4,4,15,0.7)'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.15)'; }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNext}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(4,4,15,0.7)',
                border: '1px solid rgba(212,175,55,0.15)',
                borderRadius: '50%',
                width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#f0e6c8',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.2)'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(4,4,15,0.7)'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.15)'; }}
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>
 
      <div style={{ padding: '14px 16px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          marginBottom: current.description ? '8px' : '0',
        }}>
          <div style={{
            width: '6px', height: '6px',
            background: '#d4af37',
            borderRadius: '50%',
            boxShadow: '0 0 6px rgba(212,175,55,0.6)',
            flexShrink: 0,
          }} />
          <span style={{ fontSize: '0.78rem', color: 'rgba(212,175,55,0.7)', fontWeight: '500', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {current.country || 'Memory'}
          </span>
        </div>
 
        {current.description && (
          <p style={{
            fontSize: '0.83rem',
            color: 'rgba(200,184,126,0.65)',
            lineHeight: '1.5',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {current.description}
          </p>
        )}
 
        {images.length > 1 && (
          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginTop: '12px' }}>
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i); }}
                style={{
                  width: i === index ? '18px' : '5px',
                  height: '5px',
                  borderRadius: '100px',
                  background: i === index ? '#d4af37' : 'rgba(212,175,55,0.2)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.25s',
                  padding: 0,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}