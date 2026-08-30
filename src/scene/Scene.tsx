import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  EffectComposer,
  Bloom,
  DepthOfField,
  ChromaticAberration,
  Vignette,
  Noise,
  HueSaturation,
  BrightnessContrast,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { Portal } from "./Portal";
import { NeuralCluster } from "./NeuralCluster";
import { Particles } from "./Particles";
import { CameraRig } from "./CameraRig";
import { Thread } from "./Thread";
import { Galaxies, Nebulae } from "./Galaxies";
import { DIMENSIONS, VOID_COLOR, dimensionWeight } from "./clusters";
import { scrollState } from "./scrollStore";

const WORMHOLE_LIGHT_COLOR = new THREE.Color("#9b7cff").lerp(new THREE.Color("#ff6b9d"), 0.5);

// Boosts each dimension's practical light while the camera is inside it, so
// the active dimension pops and the rest recede, without touching the scene
// background/fog objects directly (kept static, that path caused issues).
function DimensionLights() {
  const lightRefs = useRef<(THREE.PointLight | null)[]>([]);

  useFrame(() => {
    DIMENSIONS.forEach((_, i) => {
      const light = lightRefs.current[i];
      if (light) light.intensity = 6 + dimensionWeight(scrollState.current, i) * 22;
    });
  });

  return (
    <>
      {DIMENSIONS.map((dim, i) => (
        <pointLight
          key={dim.key}
          ref={(el) => {
            lightRefs.current[i] = el;
          }}
          position={dim.center}
          color={dim.color}
          intensity={11}
          distance={9}
          decay={2}
        />
      ))}
    </>
  );
}

export function Scene() {
  return (
    <Canvas
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
      }}
      dpr={[1, 2]}
      camera={{ fov: 50, position: [0, 1.2, 8.2] }}
    >
      <color attach="background" args={[VOID_COLOR.getHex()]} />
      <fogExp2 attach="fog" args={[VOID_COLOR.getHex(), 0.04]} />

      <ambientLight color="#0a0e1a" intensity={0.3} />
      <hemisphereLight color="#0a0e1a" groundColor="#0c0610" intensity={0.4} />
      <pointLight
        position={[0, 0, 0]}
        color={WORMHOLE_LIGHT_COLOR}
        intensity={30}
        distance={12}
        decay={2}
      />
      <DimensionLights />
      <directionalLight color="#ffffff" intensity={0.5} position={[5, 8, 5]} />

      <mesh position={[0, -6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[40, 64]} />
        <meshStandardMaterial color="#06070d" roughness={0.95} metalness={0} />
      </mesh>

      {/* celestial layer behind — galaxies + nebulae, multi-orbit cinematic */}
      <Nebulae />
      <Galaxies />
      <Portal />
      <Thread />
      <NeuralCluster />
      <Particles />
      <CameraRig />

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={0.85}
          luminanceThreshold={0.45}
          luminanceSmoothing={0.3}
          mipmapBlur
        />
        <DepthOfField focusDistance={0.06} focalLength={0.02} bokehScale={1.4} />
        <ChromaticAberration
          offset={new THREE.Vector2(0.001, 0.001)}
          blendFunction={BlendFunction.NORMAL}
          radialModulation={false}
          modulationOffset={0}
        />
        <HueSaturation hue={0} saturation={-0.12} />
        <BrightnessContrast brightness={-0.03} contrast={0.12} />
        <Vignette eskil={false} offset={0.28} darkness={1.2} />
        <Noise opacity={0.03} blendFunction={BlendFunction.OVERLAY} />
      </EffectComposer>
    </Canvas>
  );
}
