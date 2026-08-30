import { Suspense, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Lenis from "lenis";
import { Scene } from "./scene/Scene";
import { Overlay } from "./Overlay";
import { Cursor } from "./Cursor";
import { initScrollTracking } from "./scene/scrollStore";
import "./nexus.css";

function NavIsland() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="nav-island-wrap">
        <div className="nav-island">
          <div className="nav-island-brand">
            <div className="nav-island-mark">◈</div>
            <span className="nav-island-name">NEXUS</span>
          </div>
          <nav className="nav-island-links">
            <a href="#top">Intro</a>
            <a href="#top">Dimensions</a>
            <a href="#top">Gallery</a>
          </nav>
          <div className="nav-island-cta">
            <a href="#top" className="nav-island-login">Login</a>
            <a href="#top" className="nav-island-get">
              Enter <span>→</span>
            </a>
          </div>
          <button className={`nav-island-hamburger ${open ? "is-open" : ""}`} onClick={() => setOpen(!open)} aria-label="menu">
            <i />
          </button>
        </div>
      </div>
      <div className={`nav-overlay ${open ? "is-open" : ""}`} onClick={() => setOpen(false)}>
        <div className="nav-overlay-inner" onClick={(e) => e.stopPropagation()}>
          {[
            { k: "01", t: "Glass / Shard", d: "Cold, faceted" },
            { k: "02", t: "Paint / Canvas", d: "Wet, smeared" },
            { k: "03", t: "Ink / Paper", d: "Flat, stark" },
            { k: "04", t: "Cube / Honeycomb", d: "Grid-locked" },
            { k: "05", t: "Mirror", d: "Kaleidoscope" },
            { k: "06", t: "Debris", d: "Zero-G wreckage" },
            { k: "07", t: "Fractal / Mind", d: "All at once" },
          ].map((it, i) => (
            <a key={it.k} href="#top" className="nav-overlay-link" style={{ transitionDelay: `${i * 45}ms` }} onClick={() => setOpen(false)}>
              <span>{it.k}</span>
              <strong>{it.t}</strong>
              <em>{it.d}</em>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}

function App() {
  const [ready, setReady] = useState(false);
  const [percent, setPercent] = useState(0);
  const introRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.15, easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    let raf = 0;
    const tick = (time: number) => { lenis.raf(time); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    const stopScroll = initScrollTracking();
    const start = performance.now();
    const duration = 400;
    let frame: number;
    const upd = (now: number) => {
      const elapsed = now - start;
      setPercent(Math.min(100, Math.round((elapsed / duration) * 100)));
      if (elapsed < duration) frame = requestAnimationFrame(upd);
    };
    frame = requestAnimationFrame(upd);
    const timer = setTimeout(() => setReady(true), duration);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      stopScroll();
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!ready || !introRef.current) return;
    gsap.fromTo(
      introRef.current.querySelectorAll(".gsap-in"),
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 1.1, ease: "power3.out", stagger: 0.12 },
    );
  }, [ready]);

  return (
    <div id="top">
      <div className={`loader ${ready ? "loader-hidden" : ""}`}>
        <div className="loader-inner">
          <span>NEXUS</span>
          <span className="loader-percent">LOADING {percent.toString().padStart(2, "0")}%</span>
        </div>
      </div>

      <NavIsland />

      <div className="canvas-fixed">
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </div>

      <div ref={introRef}>
        <Overlay />
      </div>

      <Cursor />
    </div>
  );
}

export default App;
