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
import { Planets } from "./Planets";
import { AsteroidBelt, InnerBelt, StarDome, DeepGalaxies, LensDust, DimensionAtmosphere, NebulaOrbs, ShootingStars, FogShifter, StarClusters, GalaxyHolograms, SpaceFill, VoidShell, DarkFilaments, AbyssCore, EchoVeil, ParallaxLayers, CloseAsteroidDivert, CometDarts, PlanetDivert, ShardStorm } from "./SpaceExtension";
import { DIMENSIONS, dimensionWeight } from "./clusters";
import { scrollState } from "./scrollStore";

const WORMHOLE_LIGHT_COLOR = new THREE.Color("#a78bfa").lerp(new THREE.Color("#f472b6"), 0.5);

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
        toneMappingExposure: 1.15,
      }}
      dpr={[1, 2]}
      camera={{ fov: 50, position: [0, 1.2, 8.2] }}
    >
      <color attach="background" args={["#020208"]} />
      <fogExp2 attach="fog" args={["#020208", 0.022]} />

      <ambientLight color="#fff7ed" intensity={0.26} />
      {/* premium jewel rig — rose + sky, film-graded */}
      <pointLight color="#f43f5e" intensity={2.2} distance={20} position={[-5, 2.5, 2]} />
      <pointLight color="#38bdf8" intensity={2.2} distance={20} position={[5, -2, 2]} />
      <hemisphereLight color="#0f172a" groundColor="#020208" intensity={0.34} />
      <pointLight
        position={[0, 0, 0]}
        color={WORMHOLE_LIGHT_COLOR}
        intensity={16}
        distance={14}
        decay={2}
      />
      <DimensionLights />
      <directionalLight color="#fffbeb" intensity={0.42} position={[5, 8, 5]} />

      <mesh position={[0, -6.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[44, 64]} />
        <meshPhysicalMaterial color="#020208" roughness={0.96} metalness={0.04} clearcoat={0.08} />
      </mesh>

      <ParallaxLayers />
      <VoidShell />
      <StarDome />
      <DeepGalaxies />
      <SpaceFill />
      <DimensionAtmosphere />
      <Nebulae />
      <NebulaOrbs />
      <DarkFilaments />
      <Galaxies />
      <StarClusters />
      <GalaxyHolograms />
      <AbyssCore />
      <EchoVeil />
      <Planets />
      <PlanetDivert />
      <CloseAsteroidDivert />
      <ShardStorm />
      <AsteroidBelt />
      <InnerBelt />
      <CometDarts />
      <LensDust />
      <Portal />
      <Thread />
      <NeuralCluster />
      <Particles />
      <ShootingStars />
      <CameraRig />
      <FogShifter />

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={0.85}
          luminanceThreshold={0.52}
          luminanceSmoothing={0.38}
          mipmapBlur
        />
        <DepthOfField focusDistance={0.055} focalLength={0.018} bokehScale={1.15} />
        <ChromaticAberration
          offset={new THREE.Vector2(0.0006, 0.0006)}
          blendFunction={BlendFunction.NORMAL}
          radialModulation={false}
          modulationOffset={0}
        />
        <HueSaturation hue={0} saturation={0.22} />
        <BrightnessContrast brightness={0.02} contrast={0.06} />
        <Vignette eskil={false} offset={0.38} darkness={0.48} />
        <Noise opacity={0.015} blendFunction={BlendFunction.OVERLAY} />
      </EffectComposer>
    </Canvas>
  );
}
