import { Canvas } from "@react-three/fiber";
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
import { DIMENSIONS, VOID_COLOR } from "./clusters";

const WORMHOLE_LIGHT_COLOR = new THREE.Color("#9b7cff").lerp(new THREE.Color("#ff6b9d"), 0.5);

export function Scene() {
  return (
    <Canvas
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
      }}
      shadows="soft"
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
      {DIMENSIONS.map((dim, i) => (
        <pointLight
          key={dim.key}
          position={dim.center}
          color={dim.color}
          intensity={11}
          distance={8}
          decay={2}
          castShadow={i < 3}
        />
      ))}
      <directionalLight color="#ffffff" intensity={0.5} position={[5, 8, 5]} />

      <mesh position={[0, -6, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[40, 64]} />
        <meshStandardMaterial color="#06070d" roughness={0.95} metalness={0} />
      </mesh>

      <Portal />
      <NeuralCluster />
      <Particles />
      <CameraRig />

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={1.15}
          luminanceThreshold={0.3}
          luminanceSmoothing={0.3}
          mipmapBlur
        />
        <DepthOfField focusDistance={0.02} focalLength={0.05} bokehScale={3} />
        <ChromaticAberration
          offset={new THREE.Vector2(0.001, 0.001)}
          blendFunction={BlendFunction.NORMAL}
          radialModulation={false}
          modulationOffset={0}
        />
        <HueSaturation hue={0} saturation={0.08} />
        <BrightnessContrast brightness={-0.02} contrast={0.06} />
        <Vignette eskil={false} offset={0.28} darkness={1.2} />
        <Noise opacity={0.03} blendFunction={BlendFunction.OVERLAY} />
      </EffectComposer>
    </Canvas>
  );
}
