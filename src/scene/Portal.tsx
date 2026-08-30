import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { portalFragment, portalVertex } from "../shaders/portal";
import { DIMENSIONS, activeDimensionIndex, dimensionWeight } from "./clusters";
import { scrollState } from "./scrollStore";

const CYCLE_COLORS = DIMENSIONS.map((d) => d.color);
// the portal's own resting hue when no dimension is currently in focus
// (cold open, or mid-transit between two dimensions), never void-black.
const WORMHOLE_BASE_COLOR = new THREE.Color("#9b7cff").lerp(new THREE.Color("#5b8cff"), 0.5);

export function Portal() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(WORMHOLE_BASE_COLOR) },
      uColorB: { value: new THREE.Color(CYCLE_COLORS[0]) },
      uTurbulence: { value: 0.5 },
      uFresnelPower: { value: 2.0 },
      uEmissiveIntensity: { value: 1.1 },
    }),
    [],
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = t;

      const activeIndex = activeDimensionIndex(scrollState.current);
      const nextIndex = (activeIndex + 1) % CYCLE_COLORS.length;
      const weight = dimensionWeight(scrollState.current, activeIndex);

      const targetA = new THREE.Color(WORMHOLE_BASE_COLOR).lerp(CYCLE_COLORS[activeIndex], weight);
      const targetB = new THREE.Color(CYCLE_COLORS[nextIndex]).lerp(CYCLE_COLORS[activeIndex], 1 - weight);

      const colorA = materialRef.current.uniforms.uColor.value as THREE.Color;
      const colorB = materialRef.current.uniforms.uColorB.value as THREE.Color;
      colorA.lerp(targetA, 0.05);
      colorB.lerp(targetB, 0.05);

      materialRef.current.uniforms.uEmissiveIntensity.value = 1.0 + weight * 0.5;
    }
    if (groupRef.current) {
      groupRef.current.rotation.z = t * 0.03;
    }
  });

  return (
    <group ref={groupRef} rotation={[0.12, 0, 0]}>
      <mesh>
        <circleGeometry args={[2.3, 96]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={portalVertex}
          fragmentShader={portalFragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* multiverse nested rings — inspiration second HTML: outer electric blue + inner crimson */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.6, 0.08, 30, 200]} />
        <meshStandardMaterial color="#00d2ff" emissive="#0066ff" emissiveIntensity={1.5} roughness={0.1} metalness={0.9} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.9, 0.06, 30, 200]} />
        <meshStandardMaterial color="#ff0033" emissive="#ff0022" emissiveIntensity={2.0} roughness={0.1} metalness={0.9} />
      </mesh>
    </group>
  );
}
