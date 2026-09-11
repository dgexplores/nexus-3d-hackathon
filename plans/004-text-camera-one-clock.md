# 004 — Lock text and camera to one clock so the scene is never late

- **Status**: TODO
- **Commit**: fd11dba (excerpts match working tree with uncommitted scroll-smoothing edits. If a step doesn't match the code you find, STOP and report.)
- **Severity**: HIGH
- **Category**: Purpose & frequency (two clocks telling different times); Interruptibility; Cohesion
- **Estimated scope**: 3 files, ~45 lines changed
- **Depends on**: 001 (uses its peak spacing `0.12→0.92` and follower damp `3.2` as the base; execute 001 first)

## Problem

Text runs on DOM position while the camera runs on a lagged scroll value — two different clocks, so one is always late. Confirmed:

```tsx
// src/Overlay.tsx:38-50 — current: chapter "active" fires from element visibility
const observer = new IntersectionObserver(
  ([entry]) => {
    el.classList.toggle("in-view", entry.isIntersecting);
    setInView(entry.isIntersecting);
  },
  { threshold: 0.4 },
);
```

```tsx
// src/Overlay.tsx:177-187 — current: sprocket highlight follows that DOM signal
window.addEventListener("nexus-chapter-active", onActive);
```

```tsx
// src/scene/CameraRig.tsx:69 — current working tree (post-001 target: 3.2)
scrollState.current = damp(scrollState.current, scrollState.target, 2.6);
```

Meanwhile the one component already on the camera's clock is the dimension tracker:

```tsx
// src/Overlay.tsx:144-159 — exemplar: rAF reading scrollState.current every frame
const tick = () => {
  const idx = activeDimensionIndex(scrollState.current);
  ...
  raf = requestAnimationFrame(tick);
};
```

So today the tracker numeral, the sprocket highlight, and the chapter text can all disagree mid-scroll — and with `2.6` lag the camera arrives after the text has fully played (900ms CSS + 0.9s GSAP), which reads as "the animation is late."

Second, the landing has no shared entrance: the camera starts exactly on waypoint 0 while the hero text staggers in over 1.1s:

```tsx
// src/App.tsx:50-54 — current intro
gsap.fromTo(
  introRef.current.querySelectorAll(".gsap-in"),
  { opacity: 0, y: 24 },
  { opacity: 1, y: 0, duration: 1.1, ease: "power3.out", stagger: 0.12 },
);
```

```tsx
// src/scene/CameraRig.tsx:12-13 — current: no entrance move, starts parked
{ scroll: 0.0, pos: new THREE.Vector3(0, 9.5, 17.5), look: new THREE.Vector3(0, 0, -3), fov: 54, roll: 0 },
{ scroll: 0.06, pos: new THREE.Vector3(1.8, 5.2, 10.2), ... },
```

And text entrances are slow enough to trail the camera even when clocks agree:

```css
/* src/nexus.css:376-384 — current */
.chapter-inner {
  ...
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 900ms cubic-bezier(0.32,0.72,0,1), transform 900ms cubic-bezier(0.32,0.72,0,1);
}
```

```tsx
// src/Overlay.tsx:59-86 — current GSAP entrances
duration: 0.9, ease: "power3.out", stagger: 0.055,
  scrollTrigger: { trigger: el, start: "top 70%", once: true, }
{ opacity: 1, x: 0, duration: 0.7, ease: "power2.out",
  scrollTrigger: { trigger: el, start: "top 75%", once: true } }
{ opacity: 1, y: 0, duration: 0.7, ease: "power2.out", delay: 0.3,
  scrollTrigger: { trigger: el, start: "top 75%", once: true } }
```

## Target

One clock (`scrollState.current`, the camera's own value) drives tracker, sprocket, and emphasis; text entrances are quicker and fire earlier so they complete as the camera settles; the landing opens with a 1.8s camera glide matched to a tighter 0.9s text stagger.

```tsx
// target SprocketProgress — same rAF-clock pattern as DimensionTracker, no DOM events
function SprocketProgress() {
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const idx = activeDimensionIndex(scrollState.current);
      if (idx !== activeRef.current) { activeRef.current = idx; setActive(idx); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  // ... unchanged nav markup
}
```

```css
/* target chapter entrance — 650ms, same drawer curve */
.chapter-inner {
  ...
  transition: opacity 650ms cubic-bezier(0.32,0.72,0,1), transform 650ms cubic-bezier(0.32,0.72,0,1);
}
```

```tsx
// target GSAP entrances — shorter, earlier triggers (larger "top %" = fires earlier on entry)
duration: 0.7, ease: "power3.out", stagger: 0.04,
  scrollTrigger: { trigger: el, start: "top 78%", once: true, }
{ opacity: 1, x: 0, duration: 0.55, ease: "power2.out",
  scrollTrigger: { trigger: el, start: "top 80%", once: true } }
{ opacity: 1, y: 0, duration: 0.55, ease: "power2.out", delay: 0.15,
  scrollTrigger: { trigger: el, start: "top 80%", once: true } }
```

```tsx
// target intro — tighter stagger, same power3.out
{ opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.09 },
```

```tsx
// target CameraRig entrance — pulled-back glide decaying over ~1.8s, additive to tmpPos
// inside useFrame, after pointer parallax, before jitter:
const introT = THREE.MathUtils.clamp(frameState.clock.elapsedTime / 1.8, 0, 1);
const introEase = 1 - Math.pow(1 - introT, 3);
const introK = (1 - introEase) * (1 - introEase);
s.tmpPos.x += 0.0 * introK;
s.tmpPos.y += 1.2 * introK;
s.tmpPos.z += 3.8 * introK;
```

## Repo conventions to follow

- The rAF-on-`scrollState` pattern is the file's own exemplar (`src/Overlay.tsx:144-159`, DimensionTracker). SprocketProgress imitates it exactly — same `activeDimensionIndex` import (already imported line 4), same cleanup shape.
- GSAP `power2/3.out` entrances are correct per AUDIT §2 (entering → `ease-out`) — keep the easings, only retime durations/triggers.
- The drawer curve `cubic-bezier(0.32,0.72,0,1)` stays as-is (no token work in this plan).

## Steps

1. `src/Overlay.tsx:177-187` — replace the `nexus-chapter-active` listener in `SprocketProgress` with the rAF target block above. Keep the nav markup and `jumpTo` clicks byte-identical. `useRef`/`useEffect`/`useState` are already imported (line 1); add no imports.
2. `src/Overlay.tsx:104-108` — leave the `nexus-chapter-active` dispatch in place (harmless, other consumers may exist); do not rewire `ChapterSection` state. Boundary: observer threshold `0.4` → `0.3` on line 46 only, so `.in-view` text starts a touch earlier on tall chapters.
3. `src/nexus.css:384` — `900ms` → `650ms` on both `opacity` and `transform` in `.chapter-inner`. Nothing else on that rule.
4. `src/Overlay.tsx:59-86` — apply the three GSAP target blocks verbatim (title `0.9→0.7`, stagger `0.055→0.04`, start `top 70%→top 78%`; eyebrow/body `0.7→0.55`, starts `top 75%→top 80%`; body `delay 0.3→0.15`). CTA tween (lines 88-98) untouched.
5. `src/App.tsx:50-54` — `duration: 1.1` → `0.9`, `stagger: 0.12` → `0.09`. Keep selector, from-values, `power3.out`.
6. `src/scene/CameraRig.tsx` — insert the intro-glide block after the pointer-parallax lines (`s.tmpPos.x += ...` ~lines 81-83) and before the jitter block. Uses `frameState` (already a param) and `THREE` (imported). No other rig changes — 001 owns damps/waypoints.

## Boundaries

- Do NOT remove the `IntersectionObserver` or the `in-view` class mechanism — only the threshold value changes.
- Do NOT touch the loader timing, waypoint vectors, spring physics, lights, fog, post, galaxies, fonts, or type sizes (005 owns static type).
- Do NOT change GSAP easings, only durations/delays/triggers/stagger.
- Do NOT add dependencies.
- If a step doesn't match the code you find (drift since the commit stamp), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npm run build` passes; `npm run dev`, open `http://localhost:5173/`.
- **Feel check**: on load, confirm the camera visibly glides in (scene pushes forward ~4 units over ~2s) while the three hero lines stagger up — both settle together around the 1s mark, neither waiting on the other.
- Scroll Glass→Paint slowly and confirm the sprocket highlight, tracker numeral, and chapter text all switch on the same frame the camera commits to the new dimension (record with screen capture if unsure — they must never disagree).
- Flick through two chapters fast and confirm text entrances complete as the camera settles, never trailing a full second behind.
- In DevTools Animations panel at 10% playback, confirm title words rise with blur clearing over 0.7s, no late pop.
- **Done when**: text and camera feel like one dolly move with captions — the scene is never "still arriving" after the words finish.
