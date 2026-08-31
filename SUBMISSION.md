# NEXUS — Jumping Through Minds | Judges Submission

> **One wormhole. Nine dimensions. One endless scroll.**

**Live Demo (Vercel):** https://nexus-3d-hackathon.vercel.app  
**Latest Deployment:** https://nexus-3d-hackathon-l6aazv7he-deepaklearn7878-6255s-projects.vercel.app  
**GitHub:** https://github.com/dgexplores/nexus-3d-hackathon  
**Video Walkthrough (YouTube):** https://www.youtube.com/watch?v=q2od9aj5VQ0

[![Watch Demo](https://img.youtube.com/vi/q2od9aj5VQ0/0.jpg)](https://www.youtube.com/watch?v=q2od9aj5VQ0)

---

## Screenshots

> Attach 3-4 premium captures before submitting to Devpost. Suggested frames below — replace `screenshots/*` with your exports (1920×1080, no UI chrome).

| Hero — Cold Open | Glass Shard Sea | Fractal Mandala | Abyss + Echo |
|---|---|---|---|
| ![Hero](screenshots/hero.png) | ![Glass](screenshots/glass.png) | ![Fractal](screenshots/fractal.png) | ![Echo](screenshots/echo.png) |

**Tip:** Scroll to ~`14% Glass`, `50% Cube`, `87% Fractal`, `97% Echo` and capture with sprocket rail visible for judges.

---

## What judges see in 30s

Scroll = flight. 21-waypoint travel rig with spring inertia pulls you through 9 film-graded worlds — **Glass · Paint · Ink · Cube · Mirror · Debris · Fractal · Abyss · Echo**. Comets knife past your lens (`11×` tails), asteroids tumble at arm's length (`18×` + `180×`), shards glitter like broken glass (`26×`). Typography staggers per-word. No video. All real-time WebGL ~60fps.

## Why this wins

- **Cinematic, not widgety** — Strange-grade folds + PeachWeb premium taste. Every dimension is its own film still.
- **Engineered** — delta-based damping `$1-e^{-\\lambda \\Delta t}$`, smoothstep waypoints, `vertexColors` fix, additive `512px` tails, ACES filmic.
- **Lean & shippable** — 1.39MB JS, no dead assets (removed 3.3MB unused), auto-deployed on Vercel from `main`.

## Quick start for judges

```bash
git clone https://github.com/dgexplores/nexus-3d-hackathon.git
cd nexus-3d-hackathon
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build
```

## Tech

React 19, TypeScript, Vite, Three.js / R3F / drei, GLSL, GSAP ScrollTrigger, Lenis, postprocessing (Bloom/Chromatic/Vignette), Vercel

---

**Team:** DGExplores · Contact via GitHub · Video: https://www.youtube.com/watch?v=q2od9aj5VQ0
