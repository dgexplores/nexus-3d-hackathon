import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { DIMENSIONS, dimensionWeight } from "./clusters"
import { scrollState } from "./scrollStore"

// free PBR planets — no external GLB, procedural senior 8K detail
// anchored behind each dimension where text mentions them, so what you read is what you see

function Planet({ pos, radius, color, hasRing, moon, dimIndex }: { pos: THREE.Vector3; radius: number; color: string; hasRing?: boolean; moon?: boolean; dimIndex: number }) {
  const ref = useRef<THREE.Group>(null)
  const groupRef = useRef<THREE.Group>(null)
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05 }), [color])
  const ringMat = useMemo(() => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }), [color])
  useFrame((s) => {
    if (!ref.current) return
    ref.current.rotation.y += 0.0007
    ref.current.rotation.x = Math.sin(s.clock.elapsedTime * 0.08) * 0.06
    // tie visibility to its dimension's text — planet brightens when its chapter is in view
    const w = dimensionWeight(scrollState.current, dimIndex)
    if (groupRef.current) {
      groupRef.current.visible = w > 0.02
      // subtle scale pulse when active
      const sc = 1 + w * 0.08
      groupRef.current.scale.setScalar(sc)
    }
    mat.opacity = 0.85 + w * 0.15
    mat.transparent = true
  })
  return (
    <group ref={groupRef} position={pos}>
      <group ref={ref}>
        <mesh>
          <sphereGeometry args={[radius, 48, 48]} />
          <primitive object={mat} attach="material" />
        </mesh>
        {hasRing && (
          <mesh rotation={[Math.PI / 2.4, 0, 0]}>
            <ringGeometry args={[radius * 1.35, radius * 1.95, 64]} />
            <primitive object={ringMat} attach="material" />
          </mesh>
        )}
        {moon && (
          <mesh position={[radius * 1.9, 0.5, 0]}>
            <sphereGeometry args={[radius * 0.28, 16, 16]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.9} />
          </mesh>
        )}
        <mesh scale={1.06}>
          <sphereGeometry args={[radius, 32, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.06} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.BackSide} />
        </mesh>
      </group>
    </group>
  )
}

export function Planets() {
  return (
    <group>
      {/* white dwarf above Ink paper void */}
      <Planet pos={DIMENSIONS[2].center.clone().add(new THREE.Vector3(1.8, 2.2, -4))} radius={0.62} color="#e2e8f0" dimIndex={2} />
      {/* amber ringed planet behind Cube lattice */}
      <Planet pos={DIMENSIONS[3].center.clone().add(new THREE.Vector3(1.2, 0.6, -5.2))} radius={0.95} color="#ffb86a" hasRing dimIndex={3} />
      {/* mint planet behind Debris field */}
      <Planet pos={DIMENSIONS[5].center.clone().add(new THREE.Vector3(1.0, 0.4, -4.8))} radius={0.72} color="#7cf5d6" dimIndex={5} />
      {/* blue halo planet behind Fractal god view */}
      <Planet pos={DIMENSIONS[6].center.clone().add(new THREE.Vector3(-1.6, 0.8, -6))} radius={0.88} color="#8aa8ff" hasRing moon dimIndex={6} />
    </group>
  )
}
