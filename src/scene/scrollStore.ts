// Mutable, module-level scroll/pointer state shared between the DOM (App)
// and R3F's render loop (CameraRig, Core, Particles) without triggering
// React re-renders on every scroll/pointer event.
export const scrollState = {
  target: 0, // 0..1 raw scroll progress
  current: 0, // eased/lerped value read inside useFrame
  velocity: 0, // added for velocity warp unique move
};

let cleanup: (() => void) | null = null;

export function jumpTo(scroll: number) {
  scrollState.target = Math.min(1, Math.max(0, scroll))
  const max = document.documentElement.scrollHeight - window.innerHeight
  window.scrollTo({ top: scroll * max, behavior: "smooth" })
}

export function initScrollTracking() {
  const onScroll = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const prev = scrollState.target
    scrollState.target = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    // raw delta capped + smoothed — prevents boost spikes that made comets/shards flash
    const raw = scrollState.target - prev
    const capped = Math.max(-0.02, Math.min(0.02, raw))
    scrollState.velocity += (capped - scrollState.velocity) * 0.18
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  cleanup = () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
  };
  return () => cleanup?.();
}
