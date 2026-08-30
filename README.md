# NEXUS

A scroll-driven 3D experience built for a "3D Websites" hackathon: a swirling wormhole sits at the center of the scene, tethered to four separate clusters of glowing neural nodes, each its own "universe." Scrolling carries the camera from one cluster to the next while the wormhole stays in view as the thing connecting them all.

## Concept

Four parallel minds, one shared connection. Each cluster of nodes is wired internally by pulsing synapse-lines and tethered back to a central, ever-shifting wormhole. The scroll narrative (Ignition → Divergence → Convergence → Singularity) frames it as a journey between universes that were never really separate.

## Stack

- React + TypeScript + Vite
- [react-three-fiber](https://github.com/pmndrs/react-three-fiber) / [drei](https://github.com/pmndrs/drei) / [@react-three/postprocessing](https://github.com/pmndrs/react-postprocessing)
- Hand-written GLSL shaders (wormhole event-horizon swirl, traveling synapse pulses, simplex-noise core)
- GSAP for the intro title stagger
- Bloom, chromatic aberration, vignette, and film grain post-processing

## Running locally

```bash
npm install
npm run dev
```

## Building

```bash
npm run build
```
