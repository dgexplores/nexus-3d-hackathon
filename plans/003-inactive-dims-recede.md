# 003 — Push inactive dimensions into shadow so the active one has depth

- **Status**: TODO
- **Commit**: fd11dba (written against working tree with uncommitted scroll-smoothing edits; excerpts below are unaffected by those. If a step doesn't match the code you find, STOP and report.)
- **Severity**: HIGH
- **Category**: Cohesion & tokens (depth consistency); Performance (less additive overdraw glow)
- **Estimated scope**: 2 files, ~12 lines changed

## Problem

Inactive galaxies never recede: nine additive point-clouds all render at high minimum opacity simultaneously, stacking into gray-white mud that kills color sharpness and any sense of depth. Confirmed in the per-frame weight block:

```tsx
// src/scene/Galaxies.tsx:192-193 — current: dimmest non-fractal galaxy still 14% core-lit
const w = dimensionWeight(scrollState.current, spec.dimIndex)
const opacity = isFractal ? 0.22 + w * 0.38 : 0.14 + w * 0.26
```

```tsx
// src/scene/Galaxies.tsx:219 — current: star points idle at 0.38/0.45
if (matRef.current) matRef.current.opacity = (isFractal ? 0.45 + w * 0.32 : 0.38 + w * 0.30)
```

```tsx
// src/scene/Galaxies.tsx:220-225 — current: satellite clusters idle at 0.45
clusterRefs.forEach((r) => {
  if (r.current) {
    const m = r.current.material as THREE.ShaderMaterial
    m.opacity = 0.45 + w * 0.55
  }
})
```

The background washes compound it: nebula planes, atmosphere washes, and space-fill shells all idle too bright for an additive stack:

```tsx
// src/scene/Galaxies.tsx:375 — current nebula alpha
gl_FragColor = vec4(uColor, m * 0.12);
```

```tsx
// src/scene/SpaceExtension.tsx:55-57 — current atmosphere wash
if (wash) {
  (wash.material as THREE.MeshBasicMaterial).opacity = w * 0.06;
}
```

```tsx
// src/scene/SpaceExtension.tsx:967-990 — current fills (0.13 / 0.11 / 0.12 / 0.10 / 0.035)
<meshBasicMaterial color="#1a0b4a" transparent opacity={0.13} ... />
<meshBasicMaterial color="#0a1e5a" transparent opacity={0.11} ... />
<meshBasicMaterial color="#4a1040" transparent opacity={0.12} ... />
<meshBasicMaterial color="#0e1a4a" transparent opacity={0.10} ... />
<meshBasicMaterial color="#2a1800" transparent opacity={0.035} ... />
```

## Target

Inactive content sinks toward black; focus peaks stay as bright as today. Exact end state (focused `w=1` values in brackets):

- Galaxy cores: fractal `0.22 + w*0.38` → `0.10 + w*0.42` [0.52]; others `0.14 + w*0.26` → `0.06 + w*0.34` [0.40]
- Star points: fractal `0.45 + w*0.32` → `0.18 + w*0.55` [0.73]; others `0.38 + w*0.30` → `0.16 + w*0.50` [0.66]
- Satellite clusters: `0.45 + w*0.55` → `0.12 + w*0.60` [0.72]
- Nebula alpha: `m * 0.12` → `m * 0.09`
- Atmosphere wash: `w * 0.06` → `w * 0.035` (glow `w * 0.3` on line 51 untouched)
- Space fills: `0.13→0.10`, `0.11→0.08`, `0.12→0.09`, `0.10→0.075`, `0.035→0.025`

## Repo conventions to follow

- Weight-gating to zero when unfocused is already the file's correct pattern — imitate it, don't invent a new one. Exemplar:
  ```tsx
  // src/scene/Galaxies.tsx:236-239 — mandalas, the model citizen
  const mo = w * 0.32
  ```
  This plan extends the same idea (low idle + full peak) to cores, stars, and clusters.
- `dimensionWeight(scrollState.current, i)` with `FOCUS_FALLOFF = 0.068` (`src/scene/clusters.ts:164-169`) is the single focus signal — reuse `w`, never add a second one.

## Steps

1. `src/scene/Galaxies.tsx:193` — replace with `const opacity = isFractal ? 0.10 + w * 0.42 : 0.06 + w * 0.34`.
2. `src/scene/Galaxies.tsx:219` — replace with `if (matRef.current) matRef.current.opacity = (isFractal ? 0.18 + w * 0.55 : 0.16 + w * 0.50)`.
3. `src/scene/Galaxies.tsx:223` — replace with `m.opacity = 0.12 + w * 0.60`.
4. `src/scene/Galaxies.tsx:375` — replace `m * 0.12` with `m * 0.09` in the nebula fragment shader string.
5. `src/scene/SpaceExtension.tsx:56` — replace `w * 0.06` with `w * 0.035`. Leave line 51 (`w * 0.3` glow) alone.
6. `src/scene/SpaceExtension.tsx:967-990` — scale the five `SpaceFill` opacities: `0.13→0.10`, `0.11→0.08`, `0.12→0.09`, `0.10→0.075`, `0.035→0.025`. Keep colors, geometry, blending.

## Boundaries

- Do NOT touch mandala/glyph opacity (lines 236-243, already correct), halo/disk/flare/dust opacities, rotation speeds, geometry builders, palettes, or counts.
- Do NOT touch lights, fog, post-processing, camera, scroll, overlay, or CSS — those belong to plans 001/002.
- Do NOT change blending modes or `depthWrite` flags.
- If a step doesn't match the code you find (drift since the commit stamp), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npm run build` passes; `npm run dev`, open `http://localhost:5173/`.
- **Feel check**: at any dimension's peak, confirm that dimension's galaxy is vivid while the other eight are barely-there ghosts — scroll slowly Glass→Paint and watch Glass sink as Paint rises (a clean handoff, no double-bright overlap).
- Confirm the Fractal mandala rings still appear only at focus (unchanged exemplar behavior) and background nebulae read as faint color breath, never gray veil.
- In DevTools Animations panel at 10% playback, confirm no popping: opacity tracks scroll weight continuously.
- **Done when**: one dimension owns the frame at a time, cross-blends stay dark and hue-clean, and additive stacking never washes to white.
