import * as THREE from "three";

export type Dimension = {
  id: number;
  key: string;
  name: string;
  color: THREE.Color;
  center: THREE.Vector3;
  vibe: string;
  lut: { highlight: THREE.Color; midtone: THREE.Color; shadow: THREE.Color; shadowLift: number };
  scrollPeak: number;
  timeScale: number;
};

export const DIMENSIONS: Dimension[] = [
  {
    id: 1,
    key: "glass",
    name: "Glass / Shard",
    color: new THREE.Color("#60a5fa"),
    center: new THREE.Vector3(3.4, 0.6, -2.0),
    vibe: "Cold, precise, faceted — diamond dust in vacuum",
    scrollPeak: 0.14,
    timeScale: 0.55,
    lut: {
      highlight: new THREE.Color("#dbeafe"),
      midtone: new THREE.Color("#60a5fa"),
      shadow: new THREE.Color("#0f172a"),
      shadowLift: 0.03,
    },
  },
  {
    id: 2,
    key: "paint",
    name: "Paint / Living Canvas",
    color: new THREE.Color("#a78bfa"),
    center: new THREE.Vector3(-3.6, -0.4, -1.4),
    vibe: "Warm, wet, oil-slick — pigment that breathes",
    scrollPeak: 0.27,
    timeScale: 0.32,
    lut: {
      highlight: new THREE.Color("#fce7f3"),
      midtone: new THREE.Color("#a78bfa"),
      shadow: new THREE.Color("#1e1b4b"),
      shadowLift: 0.04,
    },
  },
  {
    id: 3,
    key: "ink",
    name: "Ink / Paper",
    color: new THREE.Color("#fefce8"),
    center: new THREE.Vector3(0, 4.2, 0.3),
    vibe: "Minimal, stark, flat — sumi on washi",
    scrollPeak: 0.38,
    timeScale: 0.45,
    lut: {
      highlight: new THREE.Color("#ffffff"),
      midtone: new THREE.Color("#1c1917"),
      shadow: new THREE.Color("#000000"),
      shadowLift: 0.0,
    },
  },
  {
    id: 4,
    key: "cube",
    name: "Cube / Honeycomb",
    color: new THREE.Color("#fbbf24"),
    center: new THREE.Vector3(0, -0.2, -3.8),
    vibe: "Grid-locked, impossible order — amber lattice",
    scrollPeak: 0.5,
    timeScale: 0.68,
    lut: {
      highlight: new THREE.Color("#fef3c7"),
      midtone: new THREE.Color("#f59e0b"),
      shadow: new THREE.Color("#451a03"),
      shadowLift: 0.03,
    },
  },
  {
    id: 5,
    key: "mirror",
    name: "Mirror / Kaleidoscope",
    color: new THREE.Color("#f472b6"),
    center: new THREE.Vector3(-3.0, 1.4, 2.6),
    vibe: "Disorienting, recursive — rose chrome",
    scrollPeak: 0.63,
    timeScale: 0.52,
    lut: {
      highlight: new THREE.Color("#ffffff"),
      midtone: new THREE.Color("#ec4899"),
      shadow: new THREE.Color("#4a044e"),
      shadowLift: 0.03,
    },
  },
  {
    id: 6,
    key: "debris",
    name: "Debris / Zero-G",
    color: new THREE.Color("#a1a1aa"),
    center: new THREE.Vector3(2.6, -1.6, 1.4),
    vibe: "Broken, post-collapse — stone and rust in orbit",
    scrollPeak: 0.75,
    timeScale: 1.7,
    lut: {
      highlight: new THREE.Color("#e7e5e4"),
      midtone: new THREE.Color("#78716c"),
      shadow: new THREE.Color("#0c0a09"),
      shadowLift: 0.02,
    },
  },
  {
    id: 7,
    key: "fractal",
    name: "Fractal / Mind",
    color: new THREE.Color("#fde68a"),
    center: new THREE.Vector3(0, 2.0, -0.5),
    vibe: "Prismatic singularity — every mind at once",
    scrollPeak: 0.87,
    timeScale: 0.92,
    lut: {
      highlight: new THREE.Color("#fffbeb"),
      midtone: new THREE.Color("#f59e0b"),
      shadow: new THREE.Color("#1c0a00"),
      shadowLift: 0.05,
    },
  },
  {
    id: 8,
    key: "abyss",
    name: "Abyss / Hollow",
    color: new THREE.Color("#0f172a"),
    center: new THREE.Vector3(0, -4.5, -1.2),
    vibe: "Crushing depth — light drowns here",
    scrollPeak: 0.93,
    timeScale: 1.75,
    lut: {
      highlight: new THREE.Color("#334155"),
      midtone: new THREE.Color("#0f172a"),
      shadow: new THREE.Color("#020617"),
      shadowLift: 0.015,
    },
  },
  {
    id: 9,
    key: "echo",
    name: "Echo / Afterlight",
    color: new THREE.Color("#f59e0b"),
    center: new THREE.Vector3(-1.5, 3.8, -2.8),
    vibe: "Legend ember — the universe crowns itself",
    scrollPeak: 0.97,
    timeScale: 0.52,
    lut: {
      highlight: new THREE.Color("#fef3c7"),
      midtone: new THREE.Color("#f59e0b"),
      shadow: new THREE.Color("#431407"),
      shadowLift: 0.06,
    },
  },
];

export const VOID_COLOR = new THREE.Color("#020208");

const FOCUS_FALLOFF = 0.068;

export function dimensionWeight(scroll: number, index: number): number {
  const dist = Math.abs(scroll - DIMENSIONS[index].scrollPeak);
  return THREE.MathUtils.clamp(1 - dist / FOCUS_FALLOFF, 0, 1);
}

export function activeDimensionIndex(scroll: number): number {
  let best = 0;
  let bestDist = Infinity;
  DIMENSIONS.forEach((dim, i) => {
    const dist = Math.abs(scroll - dim.scrollPeak);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  });
  return best;
}
