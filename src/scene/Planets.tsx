import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { DIMENSIONS, dimensionWeight } from "./clusters"
import { scrollState } from "./scrollStore"
import { planetAtmVertex, planetAtmFragment, planetCloudVertex, planetCloudFragment } from "../shaders/planetAtmosphere"

function Planet({ pos, radius, color, hasRing, moon, dimIndex }: { pos: THREE.Vector3; radius: number; color: string; hasRing?: boolean; moon?: boolean; dimIndex: number }) {
  const ref = useRef<THREE.Group>(null)
  const groupRef = useRef<THREE.Group>(null)
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null)
  const atmUniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(color) },
    uRimColor: { value: new THREE.Color(color).lerp(new THREE.Color("#ffffff"), 0.45) },
    uOpacity: { value: 0.045 },
    uTime: { value: 0 },
  }), [])
  const cloudUniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(color).lerp(new THREE.Color("#ffffff"), 0.25) },
    uOpacity: { value: 0.018 },
    uTime: { value: 0 },
  }), [])
  const ringMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color, transparent: true, opacity: 0.18, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, depthWrite: false,
    roughness: 0.6, metalness: 0.1, clearcoat: 0.2,
  }), [color])
  const emissiveColor = useMemo(() => new THREE.Color(color).multiplyScalar(0.12), [color])
  const sheenColor = useMemo(() => new THREE.Color(color).lerp(new THREE.Color("#ffffff"), 0.3), [color])

  useFrame((s) => {
    if (!ref.current) return
    ref.current.rotation.y += 0.0007
    ref.current.rotation.x = Math.sin(s.clock.elapsedTime * 0.08) * 0.06
    const w = dimensionWeight(scrollState.current, dimIndex)
    if (groupRef.current) {
      groupRef.current.visible = w > 0.02
      const sc = 1 + w * 0.08
      groupRef.current.scale.setScalar(sc)
    }
    if (matRef.current) {
      matRef.current.emissiveIntensity = 0.2 + w * 0.4
      matRef.current.opacity = 0.85 + w * 0.15
      matRef.current.transparent = true
    }
    atmUniforms.uTime.value = s.clock.elapsedTime
    atmUniforms.uOpacity.value = (0.03 + w * 0.04) * (0.8 + Math.sin(s.clock.elapsedTime * 0.8 + dimIndex) * 0.2)
    cloudUniforms.uTime.value = s.clock.elapsedTime * 0.3
    cloudUniforms.uOpacity.value = (0.012 + w * 0.025) * (0.7 + Math.sin(s.clock.elapsedTime * 0.5 + dimIndex * 2) * 0.3)
  })
  return (
    <group ref={groupRef} position={pos}>
      <group ref={ref}>
        <mesh>
          <sphereGeometry args={[radius, 48, 48]} />
          <meshPhysicalMaterial
            ref={matRef}
            color={color}
            roughness={0.42}
            metalness={0.06}
            clearcoat={0.35}
            clearcoatRoughness={0.18}
            sheen={0.35}
            sheenRoughness={0.45}
            sheenColor={sheenColor}
            emissive={emissiveColor}
            emissiveIntensity={0.2}
          />
        </mesh>
        <mesh scale={1.075}>
          <sphereGeometry args={[radius, 24, 24]} />
          <shaderMaterial
            vertexShader={planetAtmVertex}
            fragmentShader={planetAtmFragment}
            uniforms={atmUniforms}
            transparent
            depthWrite={false}
            side={THREE.FrontSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <mesh scale={1.14}>
          <sphereGeometry args={[radius, 20, 20]} />
          <shaderMaterial
            vertexShader={planetCloudVertex}
            fragmentShader={planetCloudFragment}
            uniforms={cloudUniforms}
            transparent
            depthWrite={false}
            side={THREE.FrontSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        {hasRing && (
          <mesh rotation={[Math.PI / 2.4, 0, 0]}>
            <ringGeometry args={[radius * 1.35, radius * 1.95, 64]} />
            <primitive object={ringMat} attach="material" />
          </mesh>
        )}
        {moon && (
          <mesh position={[radius * 1.9, 0.5, 0]}>
            <sphereGeometry args={[radius * 0.28, 24, 24]} />
            <meshPhysicalMaterial color="#e2e8f0" roughness={0.85} metalness={0.05} clearcoat={0.15} emissive="#ffffff" emissiveIntensity={0.05} />
          </mesh>
        )}
      </group>
    </group>
  )
}

export function Planets() {
  return (
    <group>
      <Planet pos={DIMENSIONS[2].center.clone().add(new THREE.Vector3(1.8, 2.2, -4))} radius={0.62} color="#e2e8f0" dimIndex={2} />
      <Planet pos={DIMENSIONS[3].center.clone().add(new THREE.Vector3(1.2, 0.6, -5.2))} radius={0.95} color="#ffb86a" hasRing dimIndex={3} />
      <Planet pos={DIMENSIONS[5].center.clone().add(new THREE.Vector3(1.0, 0.4, -4.8))} radius={0.72} color="#7cf5d6" dimIndex={5} />
      <Planet pos={DIMENSIONS[6].center.clone().add(new THREE.Vector3(-1.6, 0.8, -6))} radius={0.88} color="#8aa8ff" hasRing moon dimIndex={6} />
      <Planet pos={new THREE.Vector3(-11, 2.5, -22)} radius={0.38} color="#f5a3ff" dimIndex={4} />
      <Planet pos={new THREE.Vector3(9, 1.2, -20)} radius={0.42} color="#7dd3fc" moon dimIndex={0} />
      <Planet pos={new THREE.Vector3(4, -5, -18)} radius={0.32} color="#fde68a" dimIndex={1} />
      <Planet pos={new THREE.Vector3(-6, -4, -19)} radius={0.28} color="#a7f3d0" dimIndex={5} />
    </group>
  )
}