# NEXUS — Cinematic Galaxy With Things Inside — Deep Plan

## Goal
Make every scroll section feel like you are **inside a galaxy**, not looking at one. Text data must match what you see. Space must feel 8K dense with things.

## Audit — What's There vs Missing
**There:** 4 galaxies (blue/amber/pink/mint), 2 nebulae, 4 planets, star dome 4000, asteroid belt 280, wormhole double torus, thread, 7 clusters (56 nodes), particles.
**Missing for "galaxy with things inside":**
- Galaxies are behind, not around — you don't feel inside
- Nebulae only 2, static wash, not inside galaxies
- No dust lanes inside spiral arms
- No star clusters / open clusters inside arms
- Text says "14 shards • blue giant" but no data panel shows star count/radius/arms — feels thrown, not tied
- Story is poetic, not human — needs a traveler, a why

## Plan — 3 Layers

### Layer 1 — Expand Space (more galaxies + nebulae, anchored)
- Galaxies 4→7: one per dimension (Glass 1800 blue 2-arm 2.2r, Paint 1500 pink 2-arm 2.0r, Ink 1400 white 2-arm 1.6r, Cube 1600 amber 3-arm 1.9r, Mirror 1700 purple 2-arm 2.1r, Debris 1400 mint 2-arm 1.6r, Fractal 2000 white 3-arm 2.4r)
- Each galaxy at dim.center + -6.5z, scale 0.78-1.0, spin 0.05-0.08, core 0.22 + dust lane ring
- Nebulae 2→5: one per dim where text mentions nebula/wash (Glass purple #6a4bff, Paint pink #ff7ac4, Cube amber #ffb86a, Debris mint #7cf5d6, Fractal white), each 18x11 plane at dim behind -9z to -16z, opacity weight-driven
- Keep StarDome 4000 + AsteroidBelt 280 + LensDust 600 as outer shell

### Layer 2 — Things Inside Galaxies (cinematic interior)
- **Dust lane:** thin torus 1.05× radius, dark 0.08 opacity, inside each galaxy
- **Star clusters:** 3 small Points clusters per galaxy (120 pts each) at arm tips, bright white
- **Core glow:** already 0.22 sphere, enhance to 0.28 for 8K
- **Planet integration:** already 4 planets anchored to Ink/Cube/Debris/Fractal — add 3 more for Glass/Paint/Mirror (small 0.5r) so every galaxy has a planet/moon inside
- **Thread:** already connects — enhance to pulse brighter when inside galaxy (weight)

### Layer 3 — Relevant Text Data + Story Elements (human)
**Text relevance fix:** Each chapter gets a `Data HUD` panel (mono 10px) showing live data of the galaxy you are inside:
```
GALAXY — Glass Shard Sea
STARS 1800  ARMS 2  RADIUS 2.2 ly  CORE #8aa8ff
NODES 14 shards  DUST lane 0.08  PLANET — 6.5 ly behind
THREAD tension 0.42
```
Data matches Galaxy spec + Planet spec + Thread weight — no longer irrelevant.

**Story elements (human, not tech):**
- Prologue hero: add traveler line "You left to find another you. You found seven."
- Per chapter: 1-sentence human hook (e.g., Glass: "You came for clarity. Glass cuts if you hold it too tight.")
- Epilogue: "Pull back — one sky holds all" + CTA "Return holding the thread"
- Add `StoryAnchor` component: tiny floating label near wormhole core "Origin 0,0,0" — grounds space

## Execution Order
1. Galaxies 4→7 + dust lane + star clusters
2. Nebulae 2→5 anchored
3. Planets 4→7 (add 3)
4. Overlay data HUD per chapter + story hooks
5. Build → push → preview 5174

## Success — Looks Like 8K Galaxy
- Scroll Glass: you are inside blue 2-arm spiral, dust lane dark, 14 shards around, core glows, HUD says 1800 stars — you believe it
- Scroll Paint: pink 2-arm smear, viscous nodes, HUD 1500 stars, thread syrup slow timeScale 0.32
- Every section has something to look at behind, inside, around — not one orbit, a galaxy with things

## Tech — Free, Hackathon-legal
- All procedural Three.js Points/Shader (no external GLB), snoise from existing noise.ts, Poly Haven palette, GSAP/Lenis already, R3F/drei
