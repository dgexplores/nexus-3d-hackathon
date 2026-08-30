import * as THREE from "three";

// Four parallel "universes", each a cluster of brain-nodes, arranged around
// the central wormhole. CameraRig reuses these centers for its flight path.
export const CLUSTER_CENTERS = [
  new THREE.Vector3(0, 0.9, -3.1),
  new THREE.Vector3(3.3, -0.5, 1.1),
  new THREE.Vector3(-3.1, 0.7, 1.5),
  new THREE.Vector3(0.2, -1.1, 3.6),
];

export const CLUSTER_COLORS = [
  new THREE.Color("#5b8cff"),
  new THREE.Color("#7c5bff"),
  new THREE.Color("#ff5bd0"),
  new THREE.Color("#ffb35b"),
];
