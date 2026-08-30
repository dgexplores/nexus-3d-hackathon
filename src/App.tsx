import { Suspense, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Scene } from "./scene/Scene";
import { Overlay } from "./Overlay";
import { Cursor } from "./Cursor";
import { initScrollTracking } from "./scene/scrollStore";
import "./nexus.css";

function App() {
  const [ready, setReady] = useState(false);
  const [percent, setPercent] = useState(0);
  const introRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stopScroll = initScrollTracking();
    const start = performance.now();
    const duration = 400;
    let frame: number;
    const tick = (now: number) => {
      const elapsed = now - start;
      setPercent(Math.min(100, Math.round((elapsed / duration) * 100)));
      if (elapsed < duration) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    const timer = setTimeout(() => setReady(true), duration);
    return () => {
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
