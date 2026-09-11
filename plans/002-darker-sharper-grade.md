# 002 — Darker, sharper grade: real shadows back via lights, fog mood, and post

- **Status**: TODO
- **Commit**: fd11dba (written against working tree with uncommitted scroll-smoothing edits; the excerpts below match those files' non-grade content. If a step doesn't match the code you find, STOP and report.)
- **Severity**: HIGH
- **Category**: Cohesion & tokens (film-grade consistency); Performance-adjacent (fewer blown pixels)
- **Estimated scope**: 2 files, ~30 lines changed

## Problem

Thirteen lights with high base intensities flatten every dimension into the same bright wash — there are no shadows left for contrast to work with. Confirmed:

```tsx
// src/scene/Scene.tsx:34-39 — current: every dim light idles at 6, peaks at 28
if (light) light.intensity = 6 + dimensionWeight(scrollState.current, i) * 22;
```

```tsx
// src/scene/Scene.tsx:43-56 — current: 9 point lights, distance 9, initial 11
<pointLight ... position={dim.center} color={dim.color} intensity={11} distance={9} decay={2} />
```

```tsx
// src/scene/Scene.tsx:75-88 — current rig
<ambientLight color="#fff7ed" intensity={0.26} />
<pointLight color="#f43f5e" intensity={2.2} distance={20} position={[-5, 2.5, 2]} />
<pointLight color="#38bdf8" intensity={2.2} distance={20} position={[5, -2, 2]} />
<hemisphereLight color="#0f172a" groundColor="#020208" intensity={0.34} />
<pointLight position={[0, 0, 0]} ... intensity={16} distance={14} decay={2} />
<directionalLight color="#fffbeb" intensity={0.42} position={[5, 8, 5]} />
```

Two per-dimension failures: Abyss's light color is near-black (`#0f172a`, `src/scene/clusters.ts:132`), so the Hollow Deep renders dead instead of dark-with-rim; Ink's is near-white (`#fefce8`, `clusters.ts:53`), so the Paper Void blows out.

Post then destroys what little range survives — Bloom fires on midtones, exposure is hot, contrast is near zero:

```tsx
// src/scene/Scene.tsx:125-143 — current
<Bloom intensity={0.85} luminanceThreshold={0.52} luminanceSmoothing={0.38} mipmapBlur />
<DepthOfField focusDistance={0.055} focalLength={0.018} bokehScale={1.15} />
<HueSaturation hue={0} saturation={0.22} />
<BrightnessContrast brightness={0.02} contrast={0.06} />
<Vignette eskil={false} offset={0.38} darkness={0.48} />
```

And the fog shifter tints fog toward the raw dimension hue at a framerate-dependent rate while the background stays fixed, producing hue wash instead of depth:

```tsx
// src/scene/SpaceExtension.tsx:377-387 — current
export function FogShifter() {
  const { scene } = useThree();
  useFrame(() => {
    const fog = (scene as { fog?: THREE.FogExp2 }).fog;
    if (!fog || !fog.color) return;
    const idx = activeDimensionIndex(scrollState.current);
    fog.color.lerp(DIMENSIONS[idx].color, 0.015);
  });
  return null;
}
```

(`scene.background` is the static `#020208` from `src/scene/Scene.tsx:72-73`; fog density there is `0.022`, exposure `1.15` on line 67.)

## Target

Deep blacks, separated jewel hues, Abyss readable as dark-with-blue-rim. Exact end state:

```tsx
// target DimensionLights — lower idle, tighter falloff, legible per-dim color
function DimensionLights() {
  // abyss #0f172a is unreadable as a light → steel blue; ink #fefce8 blows out → warm gray
  const lightColor = (key: string, color: THREE.Color) =>
    key === "abyss" ? new THREE.Color("#3b82f6") : key === "ink" ? new THREE.Color("#d6d3d1") : color;
  useFrame(() => {
    DIMENSIONS.forEach((_, i) => {
      const light = lightRefs.current[i];
      if (light) light.intensity = 2.5 + dimensionWeight(scrollState.current, i) * 20;
    });
  });
  // ... pointLight props: intensity={8} distance={7.5} decay={2}, color={lightColor(dim.key, dim.color)}
}
```

```tsx
// target rig
<ambientLight color="#fff7ed" intensity={0.14} />
<pointLight color="#f43f5e" intensity={1.4} distance={20} position={[-5, 2.5, 2]} />
<pointLight color="#38bdf8" intensity={1.4} distance={20} position={[5, -2, 2]} />
<hemisphereLight color="#0f172a" groundColor="#020208" intensity={0.20} />
<pointLight position={[0, 0, 0]} ... intensity={11} distance={12} decay={2} />
<directionalLight color="#fffbeb" intensity={0.60} position={[5, 8, 5]} />
```

```tsx
// target canvas + fog density + exposure
toneMappingExposure: 1.05,
<fogExp2 attach="fog" args={["#020208", 0.030]} />
```

```tsx
// target FogShifter — mood from each dim's OWN shadow LUT (clusters.ts:10-12 defines lut.shadow),
// delta-corrected, background synced so fog and backdrop never disagree
export function FogShifter() {
  const { scene } = useThree();
  const target = useMemo(() => new THREE.Color(), []);
  useFrame((_, delta) => {
    const fog = (scene as { fog?: THREE.FogExp2 }).fog;
    if (!fog || !fog.color) return;
    const dt = Math.min(delta, 0.033);
    const k = 1 - Math.exp(-1.6 * dt);
    const idx = activeDimensionIndex(scrollState.current);
    target.set("#020208").lerp(DIMENSIONS[idx].lut.shadow, 0.55);
    fog.color.lerp(target, k);
    const bg = scene.background as THREE.Color | null;
    if (bg && (bg as THREE.Color).isColor) (bg as THREE.Color).lerp(target, k);
  });
  return null;
}
```

```tsx
// target post — bloom only on highlights, real contrast, heavier vignette
<Bloom intensity={0.62} luminanceThreshold={0.60} luminanceSmoothing={0.50} mipmapBlur />
<DepthOfField focusDistance={0.055} focalLength={0.018} bokehScale={0.9} />
<HueSaturation hue={0} saturation={0.14} />
<BrightnessContrast brightness={-0.01} contrast={0.14} />
<Vignette eskil={false} offset={0.30} darkness={0.62} />
```

## Repo conventions to follow

- Per-dimension LUTs already exist as the grade source of truth: `src/scene/clusters.ts:10-12` (`lut: { highlight, midtone, shadow, shadowLift }`, e.g. glass shadow `#0f172a` at lines 26-30). The fog target reuses `lut.shadow` — introduce no new palette.
- `useMemo` + `useFrame` for per-frame shader/uniform work is the file's own pattern (exemplar: `src/scene/SpaceExtension.tsx:23-25`, `makeGlowTexture` memoized once). The `target` color object follows it — no per-frame allocation.
- The drawer-curve easing `cubic-bezier(0.32,0.72,0,1)` in `src/nexus.css` is unrelated — do not touch CSS in this plan.

## Steps

1. `src/scene/Scene.tsx:34-39` — change the per-frame intensity to `2.5 + dimensionWeight(scrollState.current, i) * 20`.
2. `src/scene/Scene.tsx:43-56` — set `intensity={8}`, `distance={7.5}`, and `color` via the `lightColor` helper (abyss → `#3b82f6`, ink → `#d6d3d1`, else `dim.color`). Add the helper above the component; import nothing new (`THREE` is imported).
3. `src/scene/Scene.tsx:75-88` — set ambient `0.26→0.14`, both jewel points `2.2→1.4`, hemisphere `0.34→0.20`, wormhole `16→11` with `distance 14→12`, directional `0.42→0.60`. Keep all colors and positions.
4. `src/scene/Scene.tsx:67` — exposure `1.15→1.05`. `src/scene/Scene.tsx:73` — fog density `0.022→0.030`. Keep background `#020208`.
5. `src/scene/SpaceExtension.tsx:377-387` — replace `FogShifter` with the target block above (add `useMemo` to the existing `import { useMemo, useRef, useEffect }` on line 1 — `useMemo` is already imported; confirm before editing).
6. `src/scene/Scene.tsx:125-143` — apply the exact post values from the target block. Keep component order and all other props.

## Boundaries

- Do NOT touch camera, waypoints, Lenis, scroll peaks, galaxies, particles, portal, thread, overlay, or CSS.
- Do NOT enable real shadow maps or add lights — fake depth via falloff + grade only (perf budget).
- Do NOT invent palette colors: fog uses `lut.shadow`, lights use the two stated overrides, nothing else.
- Do NOT change `DepthOfField` focus/focal lengths, `Noise`, or `ChromaticAberration`.
- If a step doesn't match the code you find (drift since the commit stamp), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npm run build` passes; `npm run dev`, open `http://localhost:5173/`.
- **Feel check**: scroll to Glass — blues read jewel-cold with black between shards, not milky. Scroll to Abyss — shapes stay readable with a steel-blue rim instead of vanishing. Scroll to Ink — paper reads warm gray, not clipped white.
- Fast-scroll the full journey and confirm hues separate per dimension (no gray-white mud in cross-blends) and the frame edges fall to near-black (vignette) while cores still glow (bloom on highlights only).
- In DevTools Animations panel at 10% playback, confirm fog/background transitions are smooth with no hue popping.
- **Done when**: blacks are deep in every dimension, each dim's hue is distinct, Abyss is legible, and nothing clips to white outside the Fractal/Echo cores.
