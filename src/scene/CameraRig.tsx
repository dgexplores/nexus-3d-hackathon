import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "./scrollStore";

type Waypoint = { scroll: number; pos: THREE.Vector3; look: THREE.Vector3; fov: number; roll: number };

export function CameraRig() {
  const { camera, pointer } = useThree();
  const perspCamera = camera as THREE.PerspectiveCamera;

  const waypoints = useMemo<Waypoint[]>(() => [
    { scroll: 0.0, pos: new THREE.Vector3(0, 9.5, 17.5), look: new THREE.Vector3(0, 0, -3), fov: 54, roll: 0 },
    { scroll: 0.06, pos: new THREE.Vector3(1.8, 5.2, 10.2), look: new THREE.Vector3(1.2, 0.2, -2), fov: 50, roll: 2 },
    { scroll: 0.11, pos: new THREE.Vector3(3.9, 2.4, 5.6), look: new THREE.Vector3(3.4, 0.6, -2.0), fov: 42, roll: 6 },
    { scroll: 0.14, pos: new THREE.Vector3(3.4, -0.4, 2.2), look: new THREE.Vector3(3.4, 0.6, -2.0), fov: 34, roll: 8 },
    { scroll: 0.19, pos: new THREE.Vector3(0.8, 2.8, -1.2), look: new THREE.Vector3(-3.6, -0.4, -1.4), fov: 46, roll: -7 },
    { scroll: 0.27, pos: new THREE.Vector3(-3.8, 1.1, -0.6), look: new THREE.Vector3(-3.6, -0.4, -1.4), fov: 38, roll: -11 },
    { scroll: 0.33, pos: new THREE.Vector3(-1.6, 6.2, 0.8), look: new THREE.Vector3(0, 4.2, 0.3), fov: 42, roll: 4 },
    { scroll: 0.38, pos: new THREE.Vector3(0, 10.2, 0.9), look: new THREE.Vector3(0, 4.2, 0.3), fov: 28, roll: 0 },
    { scroll: 0.44, pos: new THREE.Vector3(0.6, 5.4, -1.1), look: new THREE.Vector3(0, -0.2, -3.8), fov: 44, roll: -6 },
    { scroll: 0.5, pos: new THREE.Vector3(0.1, -0.6, -3.2), look: new THREE.Vector3(0, -0.2, -3.8), fov: 48, roll: -10 },
    { scroll: 0.57, pos: new THREE.Vector3(-1.8, 2.2, -1.4), look: new THREE.Vector3(-3.0, 1.4, 2.6), fov: 46, roll: 7 },
    { scroll: 0.63, pos: new THREE.Vector3(-3.2, 2.6, 3.2), look: new THREE.Vector3(-3.0, 1.4, 2.6), fov: 38, roll: 9 },
    { scroll: 0.69, pos: new THREE.Vector3(-0.6, 0.4, 2.4), look: new THREE.Vector3(2.6, -1.6, 1.4), fov: 46, roll: -5 },
    { scroll: 0.75, pos: new THREE.Vector3(2.8, -1.8, 0.9), look: new THREE.Vector3(2.6, -1.6, 1.4), fov: 50, roll: -7 },
    { scroll: 0.81, pos: new THREE.Vector3(0.9, 3.6, -0.2), look: new THREE.Vector3(0, 2.0, -0.5), fov: 40, roll: 3 },
    { scroll: 0.87, pos: new THREE.Vector3(0, 12.5, 0.6), look: new THREE.Vector3(0, 2.0, -0.5), fov: 26, roll: 0 },
    { scroll: 0.9, pos: new THREE.Vector3(0, 7.2, 0.8), look: new THREE.Vector3(0, 2.0, -0.5), fov: 32, roll: -2 },
    { scroll: 0.92, pos: new THREE.Vector3(0, 2.2, -1.2), look: new THREE.Vector3(0, -4.5, -1.2), fov: 50, roll: 8 },
    { scroll: 0.95, pos: new THREE.Vector3(0.2, -4.2, -1.6), look: new THREE.Vector3(0, -4.5, -1.2), fov: 56, roll: -8 },
    { scroll: 0.97, pos: new THREE.Vector3(-1.1, 3.4, -2.0), look: new THREE.Vector3(-1.5, 3.8, -2.8), fov: 42, roll: 6 },
    { scroll: 1.0, pos: new THREE.Vector3(0, 10.2, 15.5), look: new THREE.Vector3(0, 0, -3), fov: 52, roll: 0 },
  ], []);

  const stateRef = useRef({
    velocity: new THREE.Vector3(),
    lookTarget: new THREE.Vector3(0, 0, -3),
    tmpPos: new THREE.Vector3(),
    tmpLook: new THREE.Vector3(),
    jitter: new THREE.Vector3(),
    pointerSmooth: new THREE.Vector2(),
    currentFov: 50,
    currentRollRad: 0,
  });

  const findBracket = (scroll: number) => {
    let idx = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      if (scroll >= waypoints[i].scroll && scroll < waypoints[i + 1].scroll) { idx = i; break; }
      if (scroll >= waypoints[i].scroll) idx = i;
    }
    const a = waypoints[idx];
    const b = waypoints[Math.min(idx + 1, waypoints.length - 1)];
    const span = b.scroll - a.scroll;
    const tRaw = span > 1e-6 ? (scroll - a.scroll) / span : 0;
    const t = THREE.MathUtils.clamp(tRaw, 0, 1);
    const smooth = t * t * (3 - 2 * t);
    return { a, b, t: smooth } as const;
  };

  useFrame((frameState, delta) => {
    const s = stateRef.current;
    const dt = Math.min(delta, 0.033);
    const damp = (a: number, b: number, lambda: number) => THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));

    scrollState.current = damp(scrollState.current, scrollState.target, 6.5);

    const { a, b, t } = findBracket(scrollState.current);

    s.tmpPos.lerpVectors(a.pos, b.pos, t);
    s.tmpLook.lerpVectors(a.look, b.look, t);
    const targetFov = THREE.MathUtils.lerp(a.fov, b.fov, t);
    const targetRollRad = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(a.roll, b.roll, t));

    s.pointerSmooth.lerp(pointer, 1 - Math.exp(-4 * dt));
    s.tmpPos.x += s.pointerSmooth.x * 0.32;
    s.tmpPos.y += s.pointerSmooth.y * 0.22;

    const sc = scrollState.current;
    if ((sc > 0.72 && sc < 0.80) || (sc > 0.86 && sc < 0.91)) {
      const tm = frameState.clock.elapsedTime;
      s.jitter.set(
        Math.sin(tm * 34) * 0.015,
        Math.cos(tm * 28) * 0.012,
        Math.sin(tm * 39) * 0.008
      );
      s.tmpPos.add(s.jitter);
    }

    const toTarget = s.tmpPos.clone().sub(camera.position);
    s.velocity.add(toTarget.multiplyScalar(7.5 * dt));
    s.velocity.multiplyScalar(Math.pow(0.12, dt * 60));
    camera.position.add(s.velocity.clone().multiplyScalar(dt * 60));

    s.lookTarget.lerp(s.tmpLook, 1 - Math.exp(-5.2 * dt));
    camera.lookAt(s.lookTarget);

    s.currentFov = damp(s.currentFov, targetFov, 4.5);
    perspCamera.fov = s.currentFov;
    perspCamera.updateProjectionMatrix();

    s.currentRollRad = damp(s.currentRollRad, targetRollRad, 5.0);
    const basePitch = camera.rotation.x;
    camera.rotation.z = s.currentRollRad;
    const vel = s.velocity.length();
    const targetTilt = THREE.MathUtils.clamp(vel * 0.22, -0.08, 0.08);
    camera.rotation.x = basePitch + targetTilt;
  });

  return null;
}
