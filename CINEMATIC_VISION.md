# NEXUS — Cinematic Vision & CGI Grade Specification

> **NEXUS** is a scroll-driven 3D experience built for the "3D Websites" hackathon.
> This document defines the cinematic vision, technical architecture, and CGI-grade
> roadmap so the experience reads as **real-time film VFX**, not a web demo.

---

## 1. LOGLINE

> *One connection holds four realities. You don't travel between them — you remember you were always all of them.*

A wormhole at the center of the scene tethers four clusters of glowing neural nodes,
each a parallel universe. Scrolling carries the camera between clusters while the
wormhole stays in view — the thing connecting them all. The narrative arc follows
**Ignition → Divergence → Convergence → Singularity**.

**Tone:** *Interstellar* wormhole cinematography meets *Doctor Strange* multiverse
portals. Director-grade, not widget-grade.

---

## 2. REFERENCE CINEMA

| Film / Scene | What We Borrow |
|---|---|
| *Interstellar* — Gargantua wormhole | Volumetric tunnel, accretion disk, gravity lensing |
| *Doctor Strange* — multiverse split | Dimension-shift wipes, each realm with unique physics |
| *Blade Runner 2049* — atmospheric fog | Volumetric haze, dust motes, light through mist |
| *Spider-Verse* — dimensional portal | Cartoon-deconstruction feel, frame-cut transitions |
| *Tenet* — inversion | Time-dilated clusters, reversed pulse on return |
| *Annihilation* — shimmer | Surface distortion on dimension boundary |
| *2001: A Space Odyssey* — Star Gate | Pure abstraction, light-as-language finale |

---

## 3. CORE CONCEPT — 8 DIMENSIONS

The original 4 clusters expand into **8 distinct dimensions** plus a cold-open void
and a final singularity. Each dimension has its own visual identity, physics,
lighting, and shader rules. The wormhole is not a door — it is a **projector** that
renders the viewer into each new rule-set.

### Dimension Catalog

| Index | Name | Hex | Physics | Camera | Vibe |
|---|---|---|---|---|---|
| D0 | **Void / Breath** | `#04050c` | Stillness, single heartbeat | Static wide, FOV 50 | Tension before birth |
| D1 | **Glass / Shard** | `#5b8cff` | Faceted, reflective, sharp | Dutch 12°, tele 38mm | Cold, precise |
| D2 | **Paint / Living Canvas** | `#7c5bff` | Viscous, smeared, alive | Macro 85mm, orbital lag | Warm, wet, organic |
| D3 | **Ink / Paper** | `#f4f2ff` | Flat 2D, cross-hatch | Orthographic top-down | Minimal, stark |
| D4 | **Cube / Honeycomb** | `#ffb35b` | Grid-locked, impossible geometry | Fisheye 18mm, roll 180° | Claustrophobic order |
| D5 | **Mirror / Kaleidoscope** | `#ff5bd0` | Infinite recursion, 6x radial | Vertigo dolly-zoom | Disorienting, recursive |
| D6 | **Debris / Zero-G** | `#8fa3d6` | Shattered, tumbling, wind | Handheld shake, 24fps stutter | Broken, post-collapse |
| D7 | **Fractal / Mind** | `#ffffff` | All previous skins layered translucent | Crane to god view, FOV 28mm | Unity, overwhelming |

---

## 4. TECHNICAL STACK (unchanged)

- **React 19** + **TypeScript** + **Vite**
- **@react-three/fiber** (R3F) — React renderer for Three.js
- **@react-three/drei** — useful helpers (orbit, text, environments)
- **@react-three/postprocessing** — EffectComposer pipeline
- **three** — 3D engine
- **gsap** — intro title stagger + scroll easing
- **postprocessing** — bloom, chromatic, vignette, noise passes
- **Hand-written GLSL shaders** — wormhole, synapse pulse, simplex noise

---

## 5. CURRENT STATE

### What ships today

| File | Role | Status |
|---|---|---|
| `App.tsx` | Loader, canvas, overlay, cursor, scroll init | ✅ Working |
| `Overlay.tsx` | Hero + 4 chapter sections + CTA | ✅ Working (expand to 8) |
| `Cursor.tsx` | Dot + ring trailing pointer | ✅ Working |
| `Scene.tsx` | Canvas, fog, portal, cluster, particles, camera rig, post | ✅ Working (needs tone mapping, shadows, lights) |
| `CameraRig.tsx` | 4 waypoints, lerp camera + lookAt | ⚠️ Needs FOV keyframes, roll, focus distance |
| `Portal.tsx` | Circle mesh, swirl shader, color lerp | ⚠️ Flat 2D circle — needs raymarched volume |
| `NeuralCluster.tsx` | 56 nodes (14×4), instanced icosahedron, synapse lines | ⚠️ Basic geometry — needs PBR + halos |
| `Particles.tsx` | 1400 points, noise displacement | ⚠️ Single layer — needs 3-layer split |
| `scrollStore.ts` | Passive scroll listener, target/current state | ✅ Working |
| `clusters.ts` | 4 centers + 4 colors | ⚠️ Expand to 8 + light config |
| `shaders/portal.ts` | Swirl bands, rim, core | ⚠️ Upgrade to raymarched tunnel |
| `shaders/synapse.ts` | Traveling pulse | ⚠️ Upgrade to energy tube |
| `shaders/particles.ts` | Noise displacement + soft dot | ✅ Working |
| `shaders/noise.ts` | Simplex noise (Ashima Arts) | ✅ Working |
| `nexus.css` | Dark theme, cursor, loader, chapters, CTA | ✅ Working (redesign UI) |
| `index.html` | Space Grotesk + Inter fonts | ✅ Working |

### Post-processing chain today

```
Bloom → ChromaticAberration → Vignette → Noise
```

**Missing:** Depth of Field, film grain, color grade LUT, glitch pass, volumetric god rays.

---

## 6. CGI GRADE — THE FOUR PILLARS

Senior CGI looks like film because four things are true:

### 6.1 Volumetric Light
Light is not a value — it is a **medium**. In film VFX, fog is not a uniform gradient
overlay. It is a volume that light travels *through*, scattering and attenuating.

**Implementation:**
- Replace flat `<color args={...} />` with `fogExp2` + linear fog layered front/back
- Add dust layer: 5000 tiny particles, size 0.02, slow drift, lit from below
- Add energy wisps: 800 spiral-trajectory particles orbiting wormhole, cluster-colored
- Add sparks: 200 fast bright particles flying toward wormhole — debris/energy
- Each cluster gets a `PointLight` matching its color — light actually reaches other objects
- Wormhole interior is a `PointLight` (intensity 40) — the scene is literally lit by the portal

### 6.2 Motivated Lighting
Every light in the scene has a **source**. No orphan lights. No ambient fill that
solves everything.

**Light rig:**
| Light | Type | Color | Intensity | Role |
|---|---|---|---|---|
| `ambientLight` | Ambient | `#0a0e1a` | 0.3 | Moonlight fill (never pure black) |
| `hemisphereLight` | Hemisphere | sky `#0a0e1a` / ground `#0c0610` | 0.4 | Subtle top-bottom gradient |
| `wormholeLight` | Point | `#9b7cff` + `#ff6b9d` | 40 / 20 | Portal is the sun |
| `clusterLights[4]` | Point | `CLUSTER_COLORS` | 12 each | Each universe is a practical light |
| `rimLight` | Directional | `#ffffff` | 0.5 | Edge definition on clusters |
| `ground` | Mesh | `#06070d`, roughness 0.95 | receives shadows | Anchors scale, gives weight |

**Rule:** If a surface is visible, it is lit by at least one of these. No material exists in a vacuum.

### 6.3 Film Optics
A camera lens is not perfect. Real optics have character: chromatic fringing at
edges, softness wide open, film grain, bokeh on out-of-focus elements.

**Lens properties:**
- **Focal length animation** — 35mm wide → 85mm portrait → 24mm wide → 18mm fisheye
  - Animate `camera.fov` per dimension with `THREE.MathUtils.lerp(current, target, 0.06)`
  - `camera.updateProjectionMatrix()` every frame
- **Roll** — `Math.sin(scroll * Math.PI) * 1.5°` on fast transitions = subconscious unease
- **Focus pull** — `DepthOfFieldPass` focusDistance keyframed per dimension
  - D1 glass: shallow DOF, f/1.4 — isolating single node
  - D7 god: infinite DOF — everything sharp, overwhelming scale
- **Chromatic aberration** — `offset` mapped to scroll velocity. Fast scroll = more fringing
- **Vignette** — heavy, film-frame style. `darkness: 1.4`, `offset: 0.3`
- **Film grain** — 35mm stock, `opacity: 0.12`, animated seed per frame

### 6.4 Atmosphere
Nothing floats in void. Senior CGI always has **air**: dust, mist, moisture, heat haze.
This gives the eye reference points and sells scale.

**Atmosphere layers:**
1. **Front mist** — 5000 dust motes near camera, slow drift, shallow depth
2. **Mid haze** — `fogExp2` medium density, clusters fade into it
3. **Back haze** — `fog` far plane, clusters dissolve at distance
4. **Energy wisps** — 800 spiral particles lit by cluster colors, orbiting wormhole
5. **Sparks** — 200 bright fast particles flying toward wormhole on scroll

---

## 7. THE 10 POST-PROCESSING PASSES (IN ORDER)

```
RenderPass
  → UnrealBloomPass    (strength 1.4, radius 0.6, threshold 0.2)
  → LuminosityHighPass  (separate bright blooms)
  → DepthOfFieldPass   (focusDistance per dimension)
  → ChromaticPass      (offset mapped to scroll velocity)
  → VignetteShader     (darkness 1.4, offset 0.3)
  → ColorGradePass     (per-dimension LUT, lift blacks +0.02)
  → GlitchPass         (D6 debris only, duration 0.3, strength 0.04)
  → FilmGrainPass      (opacity 0.12, animated seed)
  → OutputPass
```

**Why this order matters:** Bloom before DOF = bokeh gets bloomed correctly.
Grain last = grain sits on top of everything like real film. Glitch only on D6 =
targeted effect, not global noise.

---

## 8. COLOR GRADING PER DIMENSION

Each dimension gets a **color grade LUT** — not just a tint, but a full cinematic look.

| Dimension | Highlights | Midtones | Shadows | LUT Feel |
|---|---|---|---|---|
| D0 Void | `#ffffff` | `#1a1a2e` | `#04050c` | No color, pure black |
| D1 Glass | `#b8d4ff` | `#5b8cff` | `#0a1a3c` | Cold blue Teal |
| D2 Paint | `#ffc8e0` | `#7c5bff` | `#2a0a3c` | Warm magenta Purple |
| D3 Ink | `#ffffff` | `#1a1a1a` | `#000000` | B/W, high contrast |
| D4 Cube | `#fff4d6` | `#ffb35b` | `#2a1a00` | Amber warm Tungsten |
| D5 Mirror | `#ffffff` | `#ff5bd0` | `#1a0010` | Prism, split complement |
| D6 Debris | `#8fa3d6` | `#4a5a7a` | `#1a1a2a` | Desaturated Cold |
| D7 Singularity | `#ffffff` (blowout) | `#ffffff` | `#04050c` | Pure white highlight compression |

**Implementation:** `ShaderPass` with custom fragment shader:
```glsl
uniform sampler2D tDiffuse;
uniform vec3 uHighlight;
uniform vec3 uMidtone;
uniform vec3 uShadow;
uniform float uShadowLift;

void main() {
  vec4 color = texture2D(tDiffuse, vUv);
  color.rgb = mix(uShadow * uShadowLift, uMidtone, color.r);
  color.rgb = mix(uMidtone, uHighlight, color.r);
  gl_FragColor = color;
}
```

---

## 9. CAMERAGE — DIRECTOR'S SHOT LIST

### 9.1 Waypoints — 9 positions mapped to scroll 0.0 → 1.0

| Scroll | Act | Position | Look At | FOV | Roll | Notes |
|---|---|---|---|---|---|---|
| 0.00 | Cold Open | `[0, 1.2, 8.2]` | `[0, 0, 0]` | 50 | 0 | Static, tension |
| 0.08 | D0→D1 | `[0.3, 0.8, 6.0]` | `[0, 0, 0]` | 48 | 0 | Slow push-in |
| 0.14 | D1 Glass | `[1.0, 0.4, 4.5]` | `[0.5, 0, 0]` | 38 | 2 | Tele, Dutch 12° |
| 0.27 | D2 Paint | `[2.5, -0.3, 3.0]` | `[1.5, 0, 0]` | 82 | -1 | Macro, laggy |
| 0.38 | D3 Ink | `[0, 6, 0.2]` | `[0, 0, 0]` | ortho | 0 | Top-down, snap |
| 0.50 | D4 Cube | `[0, 0, 4.0]` | `[0, 0, 0]` | 18 | 180° | Fisheye, impossible |
| 0.63 | D5 Mirror | `[-2.0, 1.0, 5.0]` | `[-1, 0, 0]` | 38→78 | 3 | Vertigo dolly-zoom |
| 0.75 | D6 Debris | `[1.5, -1.0, 3.0]` | `[0, 0, 0]` | 50 | 5 | Shake, handheld |
| 0.87 | D7 God | `[0, 11, 0.1]` | `[0, 0, 0]` | 28 | 0 | Crane up, reveal all |
| 1.00 | Tag | `[0, 1.2, 8.2]` | `[0, 0, 0]` | 50 | 0 | Loop back to start |

### 9.2 Camera Motion Principles

- **Never linear lerp.** Use `gsap.to(camera.position, { x, y, z, duration: 2, ease: "power3.out" })`
- **Inertia:** Camera has mass. `velocity += (target - current) * 0.08; velocity *= 0.82; current += velocity`
- **Parallax:** Pointer offset `pointer.x * 0.25, pointer.y * 0.15` layered on scroll path
- **Settle:** On arrival, `spring` overshoot then settle (0.82 damping) = real camera feel
- **Whip-pan:** 90°+ yaw in 0.3 scroll units + `MotionBlurPass` = speed
- **Dolly-zoom (Vertigo):** pos z back while FOV increases — classic Nolan

---

## 10. WORMHOLE — HERO VFX SHOT

The wormhole is the **hero asset**. It is the first thing judges see and the last thing
they remember. Current flat circle = cardboard. Target: raymarched 3D tunnel.

### 10.1 Fragment Shader Upgrade

```glsl
uniform float uTime;
uniform float uInnerRadius;
uniform float uOuterRadius;
uniform float uTurbulence;
uniform float uFresnelPower;
uniform float uEmissiveIntensity;
uniform vec3 uColor;
varying vec2 vUv;

void main() {
  vec2 p = vUv - 0.5;
  float r = length(p) * 2.0;
  float angle = atan(p.y, p.x);

  // 3D tunnel: rings recede into depth
  float depth = uTime * 0.5 + r * 2.0;
  float swirl = angle + depth * 0.3;
  float bands = pow(sin(swirl * 6.0 + uTime * 0.55) * 0.5 + 0.5, 2.0);
  float bands2 = pow(sin(swirl * 13.0 + uTime * 0.3 + 1.7) * 0.5 + 0.5, 3.0);

  // Turbulence — volumetric distortion
  float turb = snoise(vec3(p * 3.0, uTime * 0.2)) * uTurbulence;
  bands += turb * 0.3;

  // Fresnel rim — deep purple edge
  float rim = smoothstep(0.0, 0.15, r) * smoothstep(1.0, 0.4, r);
  float fresnel = pow(1.0 - r, uFresnelPower);

  vec3 color = uColor * (rim * (0.55 + bands * 0.9 + bands2 * 0.5) + fresnel * 0.8);
  color = mix(color, vec3(0.0), smoothstep(0.24, 0.0, r));

  // Accretion disk glow at edges
  float disk = smoothstep(0.9, 0.7, r) * smoothstep(1.0, 1.05, r);
  color += vec3(1.0, 0.85, 0.6) * disk * 0.5;

  float alpha = smoothstep(1.0, 0.62, r) * (1.0 - smoothstep(0.24, 0.0, r) * 0.15);
  gl_FragColor = vec4(color * uEmissiveIntensity, alpha);
}
```

### 10.2 Accretion Disk

- `TorusGeometry(2.6, 0.08, 16, 128)` behind portal mesh
- `MeshBasicMaterial` color `#ff8c40`, additive blending
- Slow spin `rotation.z = uTime * 0.1`
- Pulse intensity with `uEmissiveIntensity` on dimension transition

### 10.3 Gravity Lens

- Curved plane behind portal, `ShaderMaterial` with UV distortion
- `vec2 distortedUV = uv + snoise(uv * 20.0 + uTime * 0.3) * 0.02`
- Bends background stars — sells "massive gravity well"

---

## 11. NODE & SYNAPSE CGI UPGRADE

### 11.1 Node Micro-Structure

**Current:** `icosahedronGeometry(0.05, 1)` + `meshBasicMaterial`
**Target:** `DodecahedronGeometry(0.06, 1)` + `MeshStandardMaterial`

```ts
<instancedMesh args={[undefined, undefined, nodes.length]}>
  <dodecahedronGeometry args={[0.06, 1]} />
  <meshStandardMaterial
    emissive={clusterColor}
    emissiveIntensity={0.8}
    roughness={0.2}
    metalness={0.8}
  />
</instancedMesh>
```

**Halo ring** around each node:
```ts
<instancedMesh args={[undefined, undefined, nodes.length]}>
  <torusGeometry args={[0.09, 0.01, 8, 32]} />
  <meshBasicMaterial color={clusterColor} transparent opacity={0.4} />
</instancedMesh>
```

**Emissive pulse:** `emissiveIntensity = 0.4 + Math.sin(t * 2 + phase) * 0.6`

### 11.2 Synapse Energy Tube

**Current:** Line + `shaderMaterial` with flat color + pulse
**Target:** Tube with bright energy core + outer aura

```glsl
// synapseFragment upgrade
float core = pow(wave, 8.0);       // sharp bright streak
float aura = pow(wave, 2.0);       // soft glow around it
vec3 color = vColor * (aura + core * 2.0);
float alpha = 0.2 + core * 0.8 + aura * 0.3;
```

**Traveling pulse:** UV offset driven by `uTime * 3.0` — visible energy streak moves
along each synapse line. Per-cluster phase offset = staggered pulse across clusters.

---

## 12. PARTICLE SYSTEM — 3 LAYERS

### Layer 1: Atmospheric Dust
- Count: 5000
- Distribution: sphere radius 9
- Size: 0.02, soft circle
- Color: white, `opacity: 0.3`
- Motion: `snoise(pos * 0.4 + time * 0.05)` displacement + slow Y rotation
- Blend: `AdditiveBlending`, depthWrite: false
- **Purpose:** Air. Gives scale reference. Fills the void.

### Layer 2: Energy Wisps
- Count: 800
- Distribution: spiral orbit around wormhole origin
- Size: 0.04, cluster-colored
- Color: `CLUSTER_COLORS[clusterIndex]`
- Motion: spiral trajectory `angle = time * 0.5 + seed`, radius oscillates
- Blend: `AdditiveBlending`, transparent
- **Purpose:** Volume light. Wormhole energy leaking into space.

### Layer 3: Sparks
- Count: 200
- Distribution: random, near clusters
- Size: 0.06–0.1, bright white
- Color: white with cluster tint
- Motion: fast fly toward wormhole, fade on arrival, respawn at cluster
- Blend: `AdditiveBlending`, `depthWrite: false`
- **Purpose:** Debris/energy. Scroll-speed-linked density.

---

## 13. SOUND DESIGN

Sound completes the cinematic feel. A silent CGI scene reads as demo. Sound reads as film.

### Audio Architecture

| Element | Source | Trigger |
|---|---|---|
| **Sub-bass drone** | `OscillatorNode(55hz + 88hz, sine)` | On mount, modulated by `scrollState.current` |
| **Dimension whoosh** | `WhiteNoiseBuffer` + `BiquadFilter(bandpass)` | On dimension transition (scroll threshold crossed) |
| **Synapse tick** | `OscillatorNode(freq, square)` burst | Per cluster hit, pitched by `CLUSTER_COLORS[index]` |
| **Wormhole hum** | `OscillatorNode(120hz, triangle)` + filter | Continuous, intensity = `uTime` |
| **Silence on transition** | `GainNode` duck 0.3s → swell | During wormhole crossing |

**Implementation:** `src/audio.ts` — native Web Audio API, zero dependencies.
- Context created on first user interaction (browser policy)
- Gain nodes lerp on transition = smooth crossfade between dimensions
- Volume duck: `0 → 0.3 silence → swell to target over 0.5s`

---

## 14. UI — FILM, NOT WEB

### 14.1 Progress Indicator

Replace generic scroll hint with **film sprocket holes** — small dark rectangles with
light passing through on the active one.

```tsx
// 8 segments, SVG circle or horizontal bar
// Active segment glows with cluster color
// Hovered segments pulse ahead
// Current scroll progress drives fill
```

### 14.2 Chapter Typography

- `Space Grotesk` uppercase, wide tracking `0.28em`
- Left-aligned, bottom-third of viewport
- Split-line stagger `clip-path: inset()` wipe between chapters (film cut)
- Active chapter highlighted with `box-shadow: 0 0 20px rgba(color, 0.3)` — practical light glow

### 14.3 CTA

- Film reel button: rounded rectangle with sprocket holes on sides
- Hover: background warm + border glow + translateY(-2px)

### 14.4 Loader

- Film reel frame-by-frame animation (4 frames, rotating reel)
- Percentage counter "LOADING 00%"
- "LOADING NEXUS" typewriter effect

### 14.5 Transition Style

- No fade, no slide — **wipe** and **iris**
- `clip-path: inset()` with easing
- D3 ink = instant cut (no transition)
- D7 god = whiteout iris (full flash 0.5s → cut)

---

## 15. INTERACTION & SHARING

### 15.1 Node Raycasting
- `Raycaster` per frame against `InstancedMesh`
- Decode instance matrix → get cluster index
- On hover: node emissive bump + tooltip DOM float above node
- On click: trigger mini-dimension zoom (skip scroll to that cluster)

### 15.2 Persist Scroll Position
- `localStorage.setItem('nexus-scroll', scrollState.current)` on unmount
- Restore on mount → judges can re-watch exact path without starting over
- `?frame=3` URL param → jump to dimension 3 (shareable demo link)

### 15.3 Export Keyframe
- `renderer.domElement.toDataURL()` on demand (keybinding or button)
- Adds `?share=frame1` URL param to deep-link specific dimension
- Judges can screenshot + share favorite moment

### 15.4 Accessibility
- `prefers-reduced-motion: reduce` → disable all shader `uTime`, reduce particles to 500, camera static
- Keyboard nav: Tab through CTAs, Enter triggers dimension jump
- `aria-label` on all interactive elements
- `cursor: auto` on touch devices (already implemented)

---

## 16. PERFORMANCE TARGETS

| Target | Value |
|---|---|
| Frame rate | 60fps desktop, 30fps mobile |
| Pixel ratio | `dpr={[1, 1.5]}` — cap on low-end |
| Particles | 5000 dust + 800 wisps + 200 sparks = 6000 total |
| Nodes | 56 instanced meshes (LOD beyond 12 units) |
| Shadows | `PCFSoftShadowMap` 2048, cluster lights only |
| `prefers-reduced-motion` | 300 particles, no shader time, camera static |
| Dispose | All geometries/materials on unmount |
| `frustumCulled` | `true` explicit on all meshes |
| `powerPreference` | `"high-performance"` on Canvas |

---

## 17. FILE MAP — WHAT TO CREATE / MODIFY

### Modify

| File | Change | Priority |
|---|---|---|
| `Scene.tsx` | toneMapping, shadows, ground mesh, light rig, fog layers, DOF | 🔴 P0 |
| `CameraRig.tsx` | 9 waypoints + FOV keyframes + roll + focus distance + inertia | 🔴 P0 |
| `Portal.tsx` | raymarched cylinder shader + accretion disk + gravity lens | 🔴 P0 |
| `NeuralCluster.tsx` | PBR dodecahedron nodes + halo rings + energy tube synapse | 🟠 P1 |
| `Particles.tsx` | 3-layer split (dust + wisps + sparks) | 🟠 P1 |
| `Overlay.tsx` | sprocket progress + film credit typography + wipe transitions | 🟠 P1 |
| `clusters.ts` | expand 4→8 + light + fog config per dimension | 🟠 P1 |
| `nexus.css` | film credit style + sprocket UI + loader redesign | 🟡 P2 |
| `synapse.ts` | energy tube shader + bright core + traveling pulse | 🟠 P1 |
| `postprocessing chain` | add DOF, film grain, color grade, glitch passes | 🔴 P0 |

### Create

| File | Purpose | Priority |
|---|---|---|
| `src/audio.ts` | Web Audio drone + whoosh + tick | 🟠 P1 |
| `src/shaders/colorGrade.ts` | per-dimension LUT shader | 🟡 P2 |
| `src/shaders/volumetricFog.ts` | raymarched fog volume (optional, expensive) | 🟡 P2 |
| `src/shaders/filmGrain.ts` | 35mm grain overlay shader | 🟡 P2 |

---

## 18. IMPLEMENTATION PHASES

### Phase 1 — Foundation (P0, ship first)
1. `Scene.tsx` — tone mapping + shadows + ground + lights + fog
2. `CameraRig.tsx` — 9 waypoints + FOV keyframes + inertia
3. `clusters.ts` — expand to 8 + light config per dimension
4. `Overlay.tsx` — 8 chapters + sprocket progress indicator
5. Post-processing chain — DOF + film grain + color grade + glitch

### Phase 2 — Volumetrics (P1, wow factor)
6. `Portal.tsx` — raymarched wormhole + accretion disk + gravity lens
7. `Particles.tsx` — 3-layer split (dust + wisps + sparks)
8. `NeuralCluster.tsx` — PBR nodes + halo rings + energy synapse
9. `synapse.ts` — energy tube shader + traveling pulse

### Phase 3 — Polish (P1-P2, premium finish)
10. `audio.ts` — sub-bass drone + whoosh + synapse tick
11. `nexus.css` — film credit typography + sprocket UI + loader
12. Raycasting + node hover/tooltip + click jump
13. Persist scroll + `?frame=` deep link + export keyframe
14. `prefers-reduced-motion` + dispose cleanup + error boundary

### Phase 4 — Optional / Advanced (P2)
15. `volumetricFog.ts` — raymarched fog volume (heavy, GPU-intensive)
16. Environment map for glass dimension (`drei` `Environment`)
17. 3D text for NEXUS title (`drei` `Text` geometry in D0 void)
18. Temporal accumulation bloom (frame buffer, multi-frame)

---

## 19. JUDGE IMPACT MAP

| Judge Concern | How NEXUS Addresses It |
|---|---|
| "Is this just a web demo?" | Sound + film grain + lens breathing = cinematic |
| "Can they actually build this?" | Clean architecture + typed shaders + modular components |
| "Does it feel polished?" | 10-pass post-processing + color grade per dimension |
| "Is it original?" | 8 distinct dimensions, each with unique physics + visuals |
| "Will it run?" | Performance targets documented, LOD + dpr cap + reduced-motion |
| "Can they ship?" | Phase map = clear implementation plan, not just vision |
| "Does it move them?" | Narrative arc + sound + volumetric light = emotional |

---

## 20. ONE-LINE VISION

> **NEXUS reads as real-time film VFX because light has a source, air has texture,
> lens has character, and movement has weight.**

---

*Spec version: 1.0*
*Target: "3D Websites" hackathon — senior CGI grade*
*Stack: React + Three.js (R3F) + GLSL + GSAP*
