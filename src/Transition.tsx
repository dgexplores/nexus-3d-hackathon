import { useEffect, useRef } from "react";
import { scrollState } from "./scene/scrollStore";
import { DIMENSIONS } from "./scene/clusters";

// A quick iris wipe every time scroll crosses the midpoint between two
// dimensions, so entering a new one reads as passing through a portal cut
// rather than the camera just drifting to a different part of one big scene.
const BAND = 0.028;

function computeBoundaries(): number[] {
  const peaks = [0, ...DIMENSIONS.map((d) => d.scrollPeak), 1];
  const bounds: number[] = [];
  for (let i = 0; i < peaks.length - 1; i++) {
    bounds.push((peaks[i] + peaks[i + 1]) / 2);
  }
  return bounds;
}

const BOUNDARIES = computeBoundaries();

export function Transition() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;

    const tick = () => {
      const scroll = scrollState.current;
      let closeness = 0;
      BOUNDARIES.forEach((b) => {
        const c = Math.max(0, 1 - Math.abs(scroll - b) / BAND);
        if (c > closeness) closeness = c;
      });

      if (ref.current) {
        const eased = closeness * closeness;
        const openPercent = (1 - eased) * 78 + 1.5;
        ref.current.style.clipPath = `circle(${openPercent}% at 50% 50%)`;
        ref.current.style.opacity = eased > 0.015 ? "1" : "0";
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <div ref={ref} className="portal-transition" aria-hidden="true" />;
}
