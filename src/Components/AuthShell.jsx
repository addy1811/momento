import { useNavigate } from "react-router-dom";
import Globe3D from "./Globe3D";
import TiltCard from "./TiltCard";
import "../design/auth.css";

const MARKERS = [
  [35.68, 139.69], [48.85, 2.35], [40.71, -74.0], [28.61, 77.2],
  [-33.87, 151.21], [-22.9, -43.2], [64.14, -21.9], [-33.92, 18.42],
];

export default function AuthShell({ children }) {
  const navigate = useNavigate();
  return (
    <div className="auth-root">
      <div className="auth-bg" />
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />

      <div className="auth-shell">
        <aside className="auth-brand">
       <h2 className="auth-brand-title">The world holds your places,<br /> <em>we hold your memories.</em></h2>
       <p className="auth-brand-sub">
        Every place has a story worth keeping. Pin your favorite moments, explore your world, and relive the memories that made it yours.
         </p>

          <div className="auth-globe-wrap">
            <Globe3D markers={MARKERS} speed={0.003} />
            <span className="auth-chip auth-chip-1">📍 Kyoto · 12 photos</span>
            <span className="auth-chip auth-chip-2">✨ 14 countries lit</span>
          </div>
        </aside>

        <TiltCard className="auth-card" max={6}>
          {children}
        </TiltCard>
      </div>
    </div>
  );
}
