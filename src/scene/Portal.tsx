import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { lensFragment, portalFragment, portalVertex } from "../shaders/portal";
import { DIMENSIONS } from "./clusters";

const CYCLE_COLORS = DIMENSIONS.map((d) => d.color);

export function Portal() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const lensMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  const diskRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(CYCLE_COLORS[0]) },
      uTurbulence: { value: 0.5 },
      uFresnelPower: { value: 2.0 },
      uEmissiveIntensity: { value: 1.0 },
    }),
    [],
  );

  const lensUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(CYCLE_COLORS[0]) },
    }),
    [],
  );

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = t;
      const cycle = (t * 0.05) % CYCLE_COLORS.length;
      const i = Math.floor(cycle);
      const next = (i + 1) % CYCLE_COLORS.length;
      const color = materialRef.current.uniforms.uColor.value as THREE.Color;
      color.lerpColors(CYCLE_COLORS[i], CYCLE_COLORS[next], cycle - i);
      if (lensMaterialRef.current) {
        lensMaterialRef.current.uniforms.uTime.value = t;
        (lensMaterialRef.current.uniforms.uColor.value as THREE.Color).copy(color);
      }
    }
    if (groupRef.current) {
      groupRef.current.rotation.z = t * 0.02;
    }
    if (diskRef.current) {
      diskRef.current.rotation.z += delta * 0.1;
    }
  });

  return (
    <group ref={groupRef} rotation={[Math.PI / 2.6, 0, 0]}>
      <mesh ref={diskRef} position={[0, 0, -0.05]}>
        <torusGeometry args={[2.6, 0.08, 16, 128]} />
        <meshBasicMaterial
          color="#ff8c40"
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 0, -0.1]}>
        <ringGeometry args={[2.7, 3.2, 96]} />
        <shaderMaterial
          ref={lensMaterialRef}
          vertexShader={portalVertex}
          fragmentShader={lensFragment}
          uniforms={lensUniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
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
    </group>
  );
}
