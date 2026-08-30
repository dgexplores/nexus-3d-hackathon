import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "./scrollStore";
import { CLUSTER_CENTERS } from "./clusters";

// One waypoint per chapter: an approach toward that chapter's universe,
// with the shared wormhole (at the origin) always kept roughly in frame.
const WAYPOINTS: { pos: THREE.Vector3; look: THREE.Vector3 }[] = [
  { pos: new THREE.Vector3(0, 1.2, 8.2), look: new THREE.Vector3(0, 0, 0) },
  {
    pos: CLUSTER_CENTERS[1].clone().multiplyScalar(0.55).add(new THREE.Vector3(1.4, 0.6, 2.4)),
    look: CLUSTER_CENTERS[1].clone().multiplyScalar(0.4),
  },
  {
    pos: CLUSTER_CENTERS[2].clone().multiplyScalar(0.55).add(new THREE.Vector3(-1.2, 0.5, 2.6)),
    look: CLUSTER_CENTERS[2].clone().multiplyScalar(0.4),
  },
  { pos: new THREE.Vector3(0, 3.0, 6.4), look: new THREE.Vector3(0, 0.4, 0) },
];

const tmpPos = new THREE.Vector3();
const tmpLook = new THREE.Vector3();
const lookTarget = new THREE.Vector3();

export function CameraRig() {
  const { camera, pointer } = useThree();

  useFrame(() => {
    scrollState.current = THREE.MathUtils.lerp(scrollState.current, scrollState.target, 0.06);

    const scaled = scrollState.current * (WAYPOINTS.length - 1);
    const index = Math.min(WAYPOINTS.length - 2, Math.floor(scaled));
    const t = scaled - index;
    const a = WAYPOINTS[index];
    const b = WAYPOINTS[index + 1];

    tmpPos.lerpVectors(a.pos, b.pos, t);
    tmpLook.lerpVectors(a.look, b.look, t);

    // subtle parallax from the pointer, layered on top of the scroll path
    tmpPos.x += pointer.x * 0.25;
    tmpPos.y += pointer.y * 0.15;

    camera.position.lerp(tmpPos, 0.08);
    lookTarget.lerp(tmpLook, 0.08);
    camera.lookAt(lookTarget);
  });

  return null;
}
