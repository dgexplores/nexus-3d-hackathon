import * as THREE from "three";

// Seven populated dimensions (D1..D7) orbiting the wormhole, per
// CINEMATIC_VISION.md section 3. D0 (the cold-open void) and the final
// "Tag" loop-back have no node cluster of their own.
export type Dimension = {
  id: number;
  key: string;
  name: string;
  color: THREE.Color;
  center: THREE.Vector3;
  vibe: string;
  lut: { highlight: THREE.Color; midtone: THREE.Color; shadow: THREE.Color; shadowLift: number };
};

export const DIMENSIONS: Dimension[] = [
  {
    id: 1,
    key: "glass",
    name: "Glass / Shard",
    color: new THREE.Color("#5b8cff"),
    center: new THREE.Vector3(3.4, 0.6, -2.0),
    vibe: "Cold, precise, faceted",
    lut: {
      highlight: new THREE.Color("#b8d4ff"),
      midtone: new THREE.Color("#5b8cff"),
      shadow: new THREE.Color("#0a1a3c"),
      shadowLift: 0.02,
    },
  },
  {
    id: 2,
    key: "paint",
    name: "Paint / Living Canvas",
    color: new THREE.Color("#7c5bff"),
    center: new THREE.Vector3(-3.6, -0.4, -1.4),
    vibe: "Warm, wet, organic",
    lut: {
      highlight: new THREE.Color("#ffc8e0"),
      midtone: new THREE.Color("#7c5bff"),
      shadow: new THREE.Color("#2a0a3c"),
      shadowLift: 0.02,
    },
  },
  {
    id: 3,
    key: "ink",
    name: "Ink / Paper",
    color: new THREE.Color("#f4f2ff"),
    center: new THREE.Vector3(0, 4.2, 0.3),
    vibe: "Minimal, stark, flat",
    lut: {
      highlight: new THREE.Color("#ffffff"),
      midtone: new THREE.Color("#1a1a1a"),
      shadow: new THREE.Color("#000000"),
      shadowLift: 0.0,
    },
  },
  {
    id: 4,
    key: "cube",
    name: "Cube / Honeycomb",
    color: new THREE.Color("#ffb35b"),
    center: new THREE.Vector3(0, -0.2, -3.8),
    vibe: "Grid-locked, impossible order",
    lut: {
      highlight: new THREE.Color("#fff4d6"),
      midtone: new THREE.Color("#ffb35b"),
      shadow: new THREE.Color("#2a1a00"),
      shadowLift: 0.02,
    },
  },
  {
    id: 5,
    key: "mirror",
    name: "Mirror / Kaleidoscope",
    color: new THREE.Color("#ff5bd0"),
    center: new THREE.Vector3(-3.0, 1.4, 2.6),
    vibe: "Disorienting, recursive",
    lut: {
      highlight: new THREE.Color("#ffffff"),
      midtone: new THREE.Color("#ff5bd0"),
      shadow: new THREE.Color("#1a0010"),
      shadowLift: 0.02,
    },
  },
  {
    id: 6,
    key: "debris",
    name: "Debris / Zero-G",
    color: new THREE.Color("#8fa3d6"),
    center: new THREE.Vector3(2.6, -1.6, 1.4),
    vibe: "Broken, post-collapse",
    lut: {
      highlight: new THREE.Color("#8fa3d6"),
      midtone: new THREE.Color("#4a5a7a"),
      shadow: new THREE.Color("#1a1a2a"),
      shadowLift: 0.02,
    },
  },
  {
    id: 7,
    key: "fractal",
    name: "Fractal / Mind",
    color: new THREE.Color("#ffffff"),
    center: new THREE.Vector3(0, 2.0, -0.5),
    vibe: "Unity, overwhelming scale",
    lut: {
      highlight: new THREE.Color("#ffffff"),
      midtone: new THREE.Color("#ffffff"),
      shadow: new THREE.Color("#04050c"),
      shadowLift: 0.03,
    },
  },
];

export const VOID_COLOR = new THREE.Color("#04050c");
