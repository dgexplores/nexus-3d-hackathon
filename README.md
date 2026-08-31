# NEXUS — Jumping Through Minds

> **Live:** https://nexus-3d-hackathon.vercel.app · **Stack:** React 19 + R3F + GLSL + GSAP

A cinematic, scroll-driven 3D journey through **9 dimensions** — Glass, Paint, Ink, Cube, Mirror, Debris, Fractal, Abyss, Echo — stitched by a central wormhole. Inspired by *Doctor Strange* multiverse traversal and PeachWeb premium landing craft. Built for the **3D Websites** hackathon.

![NEXUS](https://img.shields.io/badge/3D-R3F%20%2B%20drei-black) ![Shaders](https://img.shields.io/badge/shaders-GLSL%20%2B%20postprocessing-8b5cf6) ![Motion](https://img.shields.io/badge/motion-GSAP%20%2B%20Lenis-38bdf8)

## What judges see

- **Travel cinematic camera** — 21 monotonic waypoints with spring inertia, pointer parallax, handheld jitter on Debris/Fractal, roll + velocity-tilt. No accumulation, delta-based damping.
- **Premium palette** — ACES film grading per dimension (jewel blues, amber lattice, rose chrome, stone, prismatic gold, abyss slate) with Bloom `0.85/0.52`, ACESFilmic, vignette.
- **Motion after-effects** — Close asteroids `18× icosahedron 2`, inner belt `180×`, shard storm `26× octahedron`, comet darts `11×` with glowing heads + 512px tails, shooting stars `7×` with streak texture, all additive and scroll-velocity boosted.
- **Minimal typography with motion** — chapter titles stagger per-word with ScrollTrigger, eyebrow slide, dimension tracker `I GLASS → IX ECHO` at bottom-left, sprocket rail navigation.

## Quick start

```bash
npm install
npm run dev    # http://localhost:5173
npm run build  # tsc -b && vite build
npm run preview
```

## Project structure

```
src/
  App.tsx            # Lenis + GSAP + scroll tracking
  Overlay.tsx        # 9 chapters, sprocket rail, dimension tracker
  scene/
    CameraRig.tsx    # optimized travel waypoints
    clusters.ts      # 9 dimensions, colors, scrollPeaks
    Galaxies.tsx     # shader galaxies + mandalas
    Planets.tsx      # PBR planets with atmosphere/cloud shaders
    SpaceExtension.tsx # asteroids / comets / meteors / fills
    Scene.tsx        # Canvas, lights, EffectComposer
  shaders/           # portal, fresnel, noise, planetAtmosphere
```

## Deployment

Auto-deployed on Vercel from `main`:

```
https://nexus-3d-hackathon.vercel.app
```

## Credits

Real-time film VFX with React Three Fiber, hand-written GLSL, and GSAP. No templates.
