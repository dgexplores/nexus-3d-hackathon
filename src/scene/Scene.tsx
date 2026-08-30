import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom, ChromaticAberration, Vignette, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { Portal } from "./Portal";
import { NeuralCluster } from "./NeuralCluster";
import { Particles } from "./Particles";
import { CameraRig } from "./CameraRig";

export function Scene() {
  return (
    <Canvas
      gl={{ antialias: true, powerPreference: "high-performance" }}
      dpr={[1, 2]}
      camera={{ fov: 50, position: [0, 1.2, 8.2] }}
    >
      <color attach="background" args={["#04050c"]} />
      <fog attach="fog" args={["#04050c", 6, 16]} />

      <Portal />
      <NeuralCluster />
      <Particles />
      <CameraRig />

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={1.1}
          luminanceThreshold={0.35}
          luminanceSmoothing={0.3}
          mipmapBlur
        />
        <ChromaticAberration
          offset={new THREE.Vector2(0.0009, 0.0009)}
          blendFunction={BlendFunction.NORMAL}
          radialModulation={false}
          modulationOffset={0}
        />
        <Vignette eskil={false} offset={0.15} darkness={0.9} />
        <Noise opacity={0.025} blendFunction={BlendFunction.OVERLAY} />
      </EffectComposer>
    </Canvas>
  );
}
