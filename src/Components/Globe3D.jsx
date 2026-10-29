import  { useEffect, useRef } from "react";
import createGlobe from "cobe";

export default function Globe3D({ markers = [], className = "", speed = 0.0035, interactive = true }) {
  const canvasRef = useRef(null);
  const drag = useRef({ active: false, x: 0, y: 0 });
  const rot = useRef({ phi: 3.6, theta: 0.28, vel: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let width = canvas.offsetWidth;
    const onResize = () => { width = canvas.offsetWidth; };
    window.addEventListener("resize", onResize);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: rot.current.phi,
      theta: rot.current.theta,
      dark: 1,
      diffuse: 1.4,
      mapSamples: 18000,
      mapBrightness: 6,
      baseColor: [0.1, 0.13, 0.32],
      markerColor: [1, 0.55, 0.36],
      glowColor: [0.16, 0.55, 0.62],
      markers: markers.map(([lat, lng, size = 0.06]) => ({ location: [lat, lng], size })),
      onRender: (state) => {
        const r = rot.current;
        if (!drag.current.active) {
          r.phi += reduce ? 0 : speed + r.vel;
          r.vel *= 0.94;
        }
        state.phi = r.phi;
        state.theta = r.theta;
        state.width = width * 2;
        state.height = width * 2;
      },
    });
    canvas.style.opacity = "1";

    return () => {
      window.removeEventListener("resize", onResize);
      globe.destroy();
    };
  }, [markers, speed]);

  const down = (e) => {
    if (!interactive) return;
    drag.current = { active: true, x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    e.currentTarget.style.cursor = "grabbing";
  };
  const move = (e) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    drag.current.x = e.clientX;
    drag.current.y = e.clientY;
    const r = rot.current;
    r.phi += dx / 200;
    r.vel = (dx / 200) * 0.15;
    r.theta = Math.max(-0.8, Math.min(0.8, r.theta + dy / 300));
  };
  const up = (e) => {
    drag.current.active = false;
    e.currentTarget.style.cursor = interactive ? "grab" : "default";
  };

  return (
    <canvas
      ref={canvasRef}
      className={`globe3d ${className}`}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      style={{
        width: "100%",
        aspectRatio: "1",
        display: "block",
        opacity: 0,
        transition: "opacity 1.2s ease",
        cursor: interactive ? "grab" : "default",
        touchAction: "pan-y",
      }}
    />
  );
}
