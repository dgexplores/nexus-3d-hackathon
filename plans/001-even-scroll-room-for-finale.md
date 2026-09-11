# 001 — Give every dimension equal scroll room so the finale can't be skipped

- **Status**: TODO
- **Commit**: fd11dba (written against working tree that already holds uncommitted scroll-smoothing edits: Lenis `duration 2.2`, camera scroll damp `2.6`, chapter `175vh` heights. If any excerpt below doesn't match the code you find, STOP and report.)
- **Severity**: HIGH
- **Category**: Purpose & frequency (scroll pacing); Easing & duration
- **Estimated scope**: 4 files, ~40 lines changed

## Problem

The last three dimensions are crammed into the final 13% of scroll, so a normal flick skips the finale. Evidence (all confirmed):

```ts
// src/scene/clusters.ts:119 — fractal peak
scrollPeak: 0.87,
// src/scene/clusters.ts:135 — abyss peak
scrollPeak: 0.93,
// src/scene/clusters.ts:151 — echo peak
scrollPeak: 0.97,
// src/scene/clusters.ts:164
const FOCUS_FALLOFF = 0.068;
```

Abyss→Echo gap is `0.04`, smaller than `FOCUS_FALLOFF` (`0.068`), so both weights are high at once — muddy overlap, no dwell. The camera has 6 waypoint keys in `0.87–1.00`:

```tsx
// src/scene/CameraRig.tsx:27-33 — current
{ scroll: 0.81, ... }, { scroll: 0.87, ... }, { scroll: 0.9, ... },
{ scroll: 0.92, ... }, { scroll: 0.95, ... }, { scroll: 0.97, ... },
{ scroll: 1.0, ... },
```

And the scroll follower lags the target, so hitting the page bottom strands the camera mid-flight:

```ts
// src/scene/CameraRig.tsx:69 — current
scrollState.current = damp(scrollState.current, scrollState.target, 2.6);
```

Finally, the outro CTA teleports instead of gliding, which reads as a jarring cut under Lenis smoothing:

```tsx
// src/Overlay.tsx:128-132 — current
{index === CHAPTERS.length - 1 && (
  <a className="cta magnetic" href="#top">
    Return to universe zero
  </a>
)}
```

## Target

Even 0.10 spacing between dimension peaks with an 8% settle zone after Echo; the camera pull-back completes while the outro is on screen; the CTA glides home.

```ts
// target peaks in src/scene/clusters.ts (glass → echo)
0.12, 0.22, 0.32, 0.42, 0.53, 0.63, 0.73, 0.83, 0.92
```

```tsx
// target Lenis in src/App.tsx — slower wheel gain, longer glide
lenis = new Lenis({
  duration: 2.6,
  easing: (t: number) => 1 - Math.pow(1 - t, 3),
  smoothWheel: true,
  wheelMultiplier: 0.60,
  touchMultiplier: 1.35,
  gestureOrientation: "vertical",
  syncTouch: false,
  infinite: false,
});
```

```tsx
// target CTA in src/Overlay.tsx — jumpTo is already imported on line 6
{index === CHAPTERS.length - 1 && (
  <button type="button" className="cta magnetic" onClick={() => jumpTo(0)}>
    Return to universe zero
  </button>
)}
```

## Repo conventions to follow

- Waypoint vectors (`pos`/`look`/`fov`/`roll`) are hand-tuned film framing — retime their `scroll` keys only, never touch the vectors. Exemplar of the pattern to preserve: `src/scene/CameraRig.tsx:12-34`.
- Long scroll dwell already exists as a working-tree convention: `src/nexus.css:361-371` (`.chapter { min-height: 175vh; }`, echo `230vh`, abyss `195vh`) plus a `130vh` `.credits` settle zone. Verify those rules are present; if missing, re-add them as step 0.
- Easing convention is the iOS-like drawer curve `cubic-bezier(0.32,0.72,0,1)` used across `src/nexus.css` — do not rename or retoken easings in this plan.

## Steps

1. `src/scene/clusters.ts` — set the nine `scrollPeak` values to `0.12, 0.22, 0.32, 0.42, 0.53, 0.63, 0.73, 0.83, 0.92` (glass → echo in file order, lines ~23–151). Leave `FOCUS_FALLOFF = 0.068` and every `lut` untouched.
2. `src/scene/CameraRig.tsx` — retime the 21 waypoint `scroll` keys, keeping every `pos`/`look`/`fov`/`roll` vector byte-identical, to:
   `0.00, 0.06, 0.10, 0.12, 0.17, 0.22, 0.27, 0.32, 0.37, 0.42, 0.48, 0.53, 0.58, 0.63, 0.68, 0.73, 0.78, 0.83, 0.88, 0.92, 1.00`
   (index 19, the `-1.1, 3.4, -2.0` Echo-core frame, lands on `0.92`; index 20 stays the wide pull-back at `1.00`).
3. `src/scene/CameraRig.tsx:69` — raise the scroll follower `2.6` → `3.2` so tracking keeps up over the longer page while staying smooth:
   `scrollState.current = damp(scrollState.current, scrollState.target, 3.2);`
4. `src/scene/CameraRig.tsx` — raise gaze tracking to match: look lerp `2.4` → `2.8` (line ~104), FOV damp `2.0` → `2.4` (line ~107), roll damp `2.6` → `2.8` (line ~111). Touch nothing else in the frame loop (spring `3.2`, pointer, jitter stay).
5. `src/App.tsx:26-35` — set Lenis `duration: 2.2` → `2.6` and `wheelMultiplier: 0.72` → `0.60`. Keep the cubic-out easing and all other options.
6. `src/Overlay.tsx:128-132` — replace the `<a href="#top">` CTA with the `<button onClick={() => jumpTo(0)}>` target above. `jumpTo` is already imported (line 6); add no imports.
7. `src/nexus.css` — verify (don't redesign): `.chapter { min-height: 175vh; }`, `.chapter[data-dim="echo"] { min-height: 230vh; }`, `.chapter[data-dim="abyss"] { min-height: 195vh; }`, `.credits { min-height: 130vh; }` all present. Re-add any missing line verbatim in the existing style; change no other CSS.

## Boundaries

- Do NOT touch waypoint vectors, `findBracket`, the smootherstep, spring physics, pointer parallax, or jitter.
- Do NOT touch `src/scene/Scene.tsx`, post-processing, lights, fog, or any galaxy/particle file.
- Do NOT change markup, copy, chapter order, or visual design — scroll mapping and the CTA element type only.
- Do NOT add dependencies. Do NOT rename easings or introduce tokens.
- If a step doesn't match the code you find (drift since the commit stamp), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npm run build` passes (`tsc -b && vite build`); `npm run dev`, open `http://localhost:5173/`.
- **Feel check**: scroll slowly top→bottom and confirm each of the 9 dimensions visibly dwells (tracker `I GLASS → IX ECHO` steps once per chapter, never skips a numeral).
- Flick hard to the bottom and confirm: the Echo core frame arrives, then the wide pull-back completes, all while the credits/outro block is on screen — the scene never freezes mid-flight behind the footer.
- Click each sprocket-rail dot and confirm the camera lands on that dimension's core framing, not between two dims.
- Toggle `prefers-reduced-motion` and confirm Lenis stays off (existing `App.tsx:20` behavior unchanged).
- **Done when**: Abyss and Echo each hold focus alone (no muddy cross-blend), the finale plays fully on a fast scroll, and the CTA glides to the top instead of cutting.
