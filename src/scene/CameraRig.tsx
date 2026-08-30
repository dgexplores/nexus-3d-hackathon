import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "./scrollStore";
import { DIMENSIONS } from "./clusters";

type Waypoint = { scroll: number; pos: THREE.Vector3; look: THREE.Vector3; fov: number; roll: number };

function dimLook(index: number): THREE.Vector3 {
  return DIMENSIONS[index].center.clone().multiplyScalar(0.5);
}

// Director's Shot List, CINEMATIC_VISION.md section 9.1: nine keyframes from
// cold open through the seven dimensions and back to the loop tag. Scroll
// thresholds are not evenly spaced, so interpolation below finds the actual
// bracketing pair instead of assuming a uniform step.
const WAYPOINTS: Waypoint[] = [
  { scroll: 0.0, pos: new THREE.Vector3(0, 1.2, 8.2), look: new THREE.Vector3(0, 0, 0), fov: 50, roll: 0 },
  { scroll: 0.08, pos: new THREE.Vector3(0.3, 0.8, 6.0), look: new THREE.Vector3(0, 0, 0), fov: 48, roll: 0 },
  { scroll: 0.14, pos: new THREE.Vector3(1.0, 0.4, 4.5), look: dimLook(0), fov: 38, roll: 12 },
  { scroll: 0.27, pos: new THREE.Vector3(2.5, -0.3, 3.0), look: dimLook(1), fov: 82, roll: -6 },
  { scroll: 0.38, pos: new THREE.Vector3(0, 6.0, 0.2), look: dimLook(2), fov: 14, roll: 0 },
  { scroll: 0.5, pos: new THREE.Vector3(0, 0, 4.0), look: dimLook(3), fov: 18, roll: 180 },
  { scroll: 0.63, pos: new THREE.Vector3(-2.0, 1.0, 5.0), look: dimLook(4), fov: 58, roll: 3 },
  { scroll: 0.75, pos: new THREE.Vector3(1.5, -1.0, 3.0), look: dimLook(5), fov: 50, roll: 5 },
  { scroll: 0.87, pos: new THREE.Vector3(0, 11.0, 0.1), look: dimLook(6), fov: 28, roll: 0 },
  { scroll: 1.0, pos: new THREE.Vector3(0, 1.2, 8.2), look: new THREE.Vector3(0, 0, 0), fov: 50, roll: 0 },
];

const tmpPos = new THREE.Vector3();
const tmpLook = new THREE.Vector3();
const lookTarget = new THREE.Vector3();
const velocity = new THREE.Vector3();
const jitter = new THREE.Vector3();
let currentFov = WAYPOINTS[0].fov;
let currentRoll = WAYPOINTS[0].roll;

function findBracket(scroll: number): [Waypoint, Waypoint, number] {
  let index = 0;
  for (let i = 0; i < WAYPOINTS.length - 1; i++) {
    if (scroll >= WAYPOINTS[i].scroll) index = i;
  }
  const a = WAYPOINTS[index];
  const b = WAYPOINTS[Math.min(index + 1, WAYPOINTS.length - 1)];
  const span = b.scroll - a.scroll;
  const t = span > 0 ? THREE.MathUtils.clamp((scroll - a.scroll) / span, 0, 1) : 0;
  return [a, b, t];
}

export function CameraRig() {
  const { camera, pointer } = useThree();
  const perspCamera = camera as THREE.PerspectiveCamera;

  useFrame((state) => {
    scrollState.current = THREE.MathUtils.lerp(scrollState.current, scrollState.target, 0.06);

    const [a, b, t] = findBracket(scrollState.current);

    tmpPos.lerpVectors(a.pos, b.pos, t);
    tmpLook.lerpVectors(a.look, b.look, t);
    const targetFov = THREE.MathUtils.lerp(a.fov, b.fov, t);
    const targetRoll = THREE.MathUtils.lerp(a.roll, b.roll, t);

    // subtle parallax from the pointer, layered on top of the scroll path
    tmpPos.x += pointer.x * 0.25;
    tmpPos.y += pointer.y * 0.15;

    // handheld jitter, only during the 0.70-0.80 beat
    if (scrollState.current > 0.7 && scrollState.current < 0.8) {
      const time = state.clock.elapsedTime;
      jitter.set(
        Math.sin(time * 37.1) * 0.015,
        Math.cos(time * 29.3) * 0.015,
        Math.sin(time * 41.7) * 0.01,
      );
      tmpPos.add(jitter);
    }

    // spring-based camera inertia (CINEMATIC_VISION.md section 9.2)
    velocity.add(tmpPos.clone().sub(camera.position).multiplyScalar(0.08));
    velocity.multiplyScalar(0.82);
    camera.position.add(velocity);

    lookTarget.lerp(tmpLook, 0.08);
    camera.lookAt(lookTarget);

    currentFov = THREE.MathUtils.lerp(currentFov, targetFov, 0.06);
    perspCamera.fov = currentFov;
    perspCamera.updateProjectionMatrix();

    currentRoll = THREE.MathUtils.lerp(currentRoll, targetRoll, 0.06);
    camera.rotateZ(THREE.MathUtils.degToRad(currentRoll));
  });

  return null;
}
