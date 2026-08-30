import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { portalFragment, portalVertex } from "../shaders/portal";
import { CLUSTER_COLORS } from "./clusters";

export function Portal() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(CLUSTER_COLORS[0]) },
    }),
    [],
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = t;
      const cycle = (t * 0.05) % CLUSTER_COLORS.length;
      const i = Math.floor(cycle);
      const next = (i + 1) % CLUSTER_COLORS.length;
      (materialRef.current.uniforms.uColor.value as THREE.Color).lerpColors(
        CLUSTER_COLORS[i],
        CLUSTER_COLORS[next],
        cycle - i,
      );
    }
    if (groupRef.current) {
      groupRef.current.rotation.z = t * 0.02;
    }
  });

  return (
    <group ref={groupRef} rotation={[Math.PI / 2.6, 0, 0]}>
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
