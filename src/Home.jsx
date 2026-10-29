import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Sparkles, Images, ArrowRight } from "lucide-react";
import Globe3D from "./Components/Globe3D";
import TiltCard from "./Components/TiltCard";
import "./design/home.css";
import homeLogo from "./assets/brand.png";

const MARKERS = [
  [35.68, 139.69], [48.85, 2.35], [40.71, -74.0], [28.61, 77.2],
  [-33.87, 151.21], [-22.9, -43.2], [64.14, -21.9], [-33.92, 18.42], [-8.4, 115.19],
];

const POLAROIDS = [
  { place: "Kyoto", note: "maple season", bg: "linear-gradient(160deg,#ff8a5b,#7a2a63)", depth: 46, rot: -9, pos: { top: "6%", left: "-4%" }, d: "0s" },
  { place: "Lisbon", note: "golden hour tram", bg: "linear-gradient(160deg,#ffb36b,#ff5f8f)", depth: 70, rot: 7, pos: { top: "52%", right: "-6%" }, d: "-2s" },
  { place: "Reykjavik", note: "chasing aurora", bg: "linear-gradient(160deg,#2dd4bf,#3b2f8f)", depth: 34, rot: -4, pos: { bottom: "-2%", left: "6%" }, d: "-4s" },
];

const FEATURES = [ 
  { icon: MapPin, title: "A Place, A Memory", text: "Some places are too special to forget. Pin your favorite moments to the places where they happened, and let every memory find its home."},
  { icon: Sparkles, title: "Your World, Your Stories", text: "Watch your adventures come alive as every place you've made memories lights up on your very own interactive globe."},
  { icon: Images, title: "Feel It All Over Again", text: "One tap, a thousand feelings. Revisit the places, faces, and little moments that made your journey unforgettable."}
];


const HEADLINE = ["Every", "place", "you've", "loved,"];
const HEADLINE_EM = ["glowing", "on", "one", "globe."];

export default function Home({ user }) {
  const navigate = useNavigate();
  const stageRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const start = () => navigate(user ? "/memory" : "/signup");

  const handleMove = (e) => {
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--px", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    el.style.setProperty("--py", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const items = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => en.isIntersecting && en.target.classList.add("in")),
      { threshold: 0.15 }
    );
    items.forEach((i) => io.observe(i));
    return () => io.disconnect();
  }, []);

  return (
    <div className="home">
      <div className="home-aurora" />
      <div className="home-dots" />

      <nav className={`home-nav ${scrolled ? "scrolled" : ""}`}>
        <button className="home-logo" onClick={() => navigate("/")}>
         <img src={homeLogo} alt="home-logo" height={60} width={80} />
        </button>
        <div className="home-nav-right">
          {user ? (
            <button className="hb hb-ember" onClick={() => navigate("/memory")}>Open your globe</button>
          ) : (
            <>
              <button className="hb hb-ghost" onClick={() => navigate("/login")}>Sign in</button>
              <button className="hb hb-ember" onClick={() => navigate("/signup")}>Get started</button>
            </>
          )}
        </div>
      </nav>

      <header className="hero">
        <div className="hero-copy">
          <h1 className="hero-title">
            {HEADLINE.map((w, i) => (
              <span key={w} className="w" style={{ "--i": i }}>{w}&nbsp;</span>
            ))}
            <br />
            <em>
              {HEADLINE_EM.map((w, i) => (
                <span key={w} className="w" style={{ "--i": i + HEADLINE.length }}>{w}&nbsp;</span>
              ))}
            </em>
          </h1>
          <p className="hero-sub">
            Every picture holds a story, every memory carries an emotion.
             Rediscover the moments you once captured and bring your cherished memories back to life.
          </p>
          <div className="hero-actions">
            <button className="hb hb-ember hb-lg" onClick={start}>
              {user ? "Open your globe" : "Start your atlas"} <ArrowRight size={18} />
            </button>
            {!user && <button className="hb hb-glass hb-lg" onClick={() => navigate("/login")}>Sign in</button>}
          </div>
         <div className="hero-stats">
  {[
    { num: "250", label: "countries to pin" },
    { num: "4,989", label: "states & regions" },
    { num: "150K+", label: "cities to choose from" },
  ].map(({ num, label }) => (
    <div key={label}>
      <b>{num}</b>
      <span>{label}</span>
    </div>
  ))}
</div>
        </div>

        <div className="hero-stage" ref={stageRef} onPointerMove={handleMove}>
          <div className="hero-globe">
            <Globe3D markers={MARKERS} />
          </div>
          {POLAROIDS.map((p) => (
            <div key={p.place} className="float" style={{ ...p.pos, "--depth": p.depth, "--rot": `${p.rot}deg` }}>
              <div className="polaroid" style={{ animationDelay: p.d }}>
                <div className="photo" style={{ "--bg": p.bg }} />
                <p className="cap"><b>{p.place}</b> · {p.note}</p>
              </div>
            </div>
          ))}
        </div>
      </header>

      <section className="section" id="how">
        <p className="eyebrow reveal">How it works</p>
      <h2 className="section-title reveal">Capture the moment. <em>Relive the magic.</em></h2>
        <div className="feat-grid">
          {FEATURES.map(({ icon: Icon, title, text }, i) => (
            <TiltCard key={title} className="feat reveal" style={{ "--rd": `${i * 0.12}s` }}>
              <span className="feat-icon"><Icon size={20} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
              <span className="feat-num">0{i + 1}</span>
            </TiltCard>
          ))}
        </div>
      </section>

      <section className="section">
        <TiltCard className="cta reveal" max={5}>
          <h2>Your world is waiting<br /><em>to be lit up.</em></h2>
      <p>Every journey has a story. Start preserving yours, one memory at a time.</p>
          <button className="hb hb-ember hb-lg" onClick={start}>
            {user ? "Open your globe" : "Create memories"} <ArrowRight size={18} />
          </button>
        </TiltCard>
      </section>

      <footer className="home-foot">
        <img src={homeLogo} alt="home-logo" height={40} width={40} /> Momento &middot; made for people who keep the little moments
      </footer>
    </div>
  );
}
