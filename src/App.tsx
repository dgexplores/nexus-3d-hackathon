import { Suspense, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Lenis from "lenis";
import { Scene } from "./scene/Scene";
import { Overlay } from "./Overlay";
import { Cursor } from "./Cursor";
import { ErrorBoundary } from "./ErrorBoundary";
import { initScrollTracking } from "./scene/scrollStore";
import "./nexus.css";

function App() {
  const [ready, setReady] = useState(false);
  const [percent, setPercent] = useState(0);
  const introRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lenis: Lenis | null = null;
    let raf = 0;
    if (!reduceMotion) {
      lenis = new Lenis({ duration: 1.15, easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
      const tick = (time: number) => { lenis!.raf(time); raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick);
    }
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
      lenis?.destroy();
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
    <ErrorBoundary>
      <div id="top">
        <div className={`loader ${ready ? "loader-hidden" : ""}`}>
          <div className="loader-inner">
            <span>NEXUS</span>
            <span className="loader-percent">LOADING {percent.toString().padStart(2, "0")}%</span>
          </div>
        </div>

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
    </ErrorBoundary>
  );
}

export default App;
