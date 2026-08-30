import { Suspense, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Scene } from "./scene/Scene";
import { Overlay } from "./Overlay";
import { Cursor } from "./Cursor";
import { initScrollTracking } from "./scene/scrollStore";
import "./nexus.css";

function App() {
  const [ready, setReady] = useState(false);
  const introRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stopScroll = initScrollTracking();
    const timer = setTimeout(() => setReady(true), 400);
    return () => {
      stopScroll();
      clearTimeout(timer);
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
        <span>NEXUS</span>
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
