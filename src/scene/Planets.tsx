import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

// free PBR planets — no external GLB, procedural senior 8K detail
// adds celestial scale: planets + ring + moon — 8K feel needs foreground bodies

function Planet({ pos, radius, color, hasRing, moon }: { pos: THREE.Vector3; radius: number; color: string; hasRing?: boolean; moon?: boolean }) {
  const ref = useRef<THREE.Group>(null)
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05 }), [color])
  const ringMat = useMemo(() => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }), [color])
  useFrame((s) => {
    if (!ref.current) return
    ref.current.rotation.y += 0.0007
    ref.current.rotation.x = Math.sin(s.clock.elapsedTime * 0.08) * 0.06
  })
  return (
    <group ref={ref} position={pos}>
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
      {/* atmosphere glow */}
      <mesh scale={1.06}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.06} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.BackSide} />
      </mesh>
    </group>
  )
}

export function Planets() {
  return (
    <group>
      <Planet pos={new THREE.Vector3(-9.2, 1.8, -14)} radius={1.1} color="#8aa8ff" hasRing moon />
      <Planet pos={new THREE.Vector3(8.5, -2.8, -11)} radius={0.85} color="#ff8a5b" hasRing />
      <Planet pos={new THREE.Vector3(2.2, 6.8, -15)} radius={0.62} color="#7cf5d6" />
      <Planet pos={new THREE.Vector3(-4.2, -5.2, -9)} radius={0.48} color="#f5a3ff" moon />
    </group>
  )
}
