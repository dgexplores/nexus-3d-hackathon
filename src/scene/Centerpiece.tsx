import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { centerpieceFragment, centerpieceVertex } from "../shaders/centerpiece";
import { DIMENSIONS, dimensionWeight } from "./clusters";
import { scrollState } from "./scrollStore";

type Style = {
  geometry: () => THREE.BufferGeometry;
  amp: number;
  freq: number;
  fresnelPower: number;
  rotationSpeed: number;
};

const STYLES: Record<string, Style> = {
  glass: {
    geometry: () => new THREE.IcosahedronGeometry(1.1, 0),
    amp: 0.06,
    freq: 2.5,
    fresnelPower: 3,
    rotationSpeed: 0.05,
  },
  paint: {
    geometry: () => new THREE.SphereGeometry(1.3, 32, 32),
    amp: 0.35,
    freq: 1.0,
    fresnelPower: 1.5,
    rotationSpeed: 0.02,
  },
  ink: {
    geometry: () => new THREE.CylinderGeometry(1.3, 1.3, 0.08, 64),
    amp: 0.03,
    freq: 3,
    fresnelPower: 4,
    rotationSpeed: 0.015,
  },
  cube: {
    geometry: () => new THREE.BoxGeometry(1.6, 1.6, 1.6, 4, 4, 4),
    amp: 0.08,
    freq: 2.5,
    fresnelPower: 2,
    rotationSpeed: 0.04,
  },
  mirror: {
    geometry: () => new THREE.OctahedronGeometry(1.2, 0),
    amp: 0.05,
    freq: 2,
    fresnelPower: 5,
    rotationSpeed: 0.08,
  },
  debris: {
    geometry: () => new THREE.IcosahedronGeometry(1.1, 1),
    amp: 0.5,
    freq: 1.8,
    fresnelPower: 1,
    rotationSpeed: 0.03,
  },
  fractal: {
    geometry: () => new THREE.DodecahedronGeometry(1.2, 1),
    amp: 0.15,
    freq: 1.5,
    fresnelPower: 2.5,
    rotationSpeed: 0.015,
  },
};

function DimensionCenterpiece({ index }: { index: number }) {
  const dim = DIMENSIONS[index];
  const style = STYLES[dim.key];
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const geometry = useMemo(() => style.geometry(), [style]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmp: { value: style.amp },
      uFreq: { value: style.freq },
      uColor: { value: new THREE.Color(dim.color) },
      uColorB: { value: new THREE.Color("#ffffff") },
      uFresnelPower: { value: style.fresnelPower },
      uOpacity: { value: 0.06 },
    }),
    [dim, style],
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const weight = dimensionWeight(scrollState.current, index);

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = t;
      materialRef.current.uniforms.uOpacity.value = THREE.MathUtils.lerp(0.22, 0.95, weight);
    }
    if (meshRef.current) {
      meshRef.current.rotation.y = t * style.rotationSpeed;
      meshRef.current.rotation.x = Math.sin(t * style.rotationSpeed * 0.6) * 0.2;
      const scale = THREE.MathUtils.lerp(0.55, 1, weight);
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={meshRef} position={dim.center} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={centerpieceVertex}
        fragmentShader={centerpieceFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

export function Centerpiece() {
  return (
    <>
      {DIMENSIONS.map((dim, i) => (
        <DimensionCenterpiece key={dim.key} index={i} />
      ))}
    </>
  );
}
