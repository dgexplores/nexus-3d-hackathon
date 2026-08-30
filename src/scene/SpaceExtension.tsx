import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

// free extension: asteroid belt + star dome + lens dust — Poly Haven style procedural, no GLB fetch
// hackathon key: creativity/aesthetics/wow > tech complexity — this is pure visual wonder, beginner-friendly Three.js

export function AsteroidBelt() {
  const ref = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const count = 280
  const data = useMemo(() => {
    const arr: { pos: THREE.Vector3; rot: THREE.Euler; scale: number; axis: THREE.Vector3; speed: number }[] = []
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 9 + Math.random() * 4.5
      const y = (Math.random() - 0.5) * 1.8
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      arr.push({
        pos: new THREE.Vector3(x, y, z),
        rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
        scale: 0.04 + Math.random() * 0.09,
        axis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
        speed: 0.08 + Math.random() * 0.22,
      })
    }
    return arr
  }, [])

  useFrame((_, delta) => {
    if (!ref.current) return
    data.forEach((d, i) => {
      dummy.position.copy(d.pos)
      // orbital drift
      const angle = Math.atan2(d.pos.z, d.pos.x) + delta * d.speed * 0.04
      const r = Math.hypot(d.pos.x, d.pos.z)
      dummy.position.x = Math.cos(angle) * r
      dummy.position.z = Math.sin(angle) * r
      dummy.rotation.set(d.rot.x + delta * d.speed * 0.5, d.rot.y + delta * d.speed * 0.3, d.rot.z)
      dummy.scale.setScalar(d.scale)
      dummy.updateMatrix()
      ref.current!.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#8a92a8" roughness={0.95} metalness={0.08} />
    </instancedMesh>
  )
}

export function StarDome() {
  const ref = useRef<THREE.Points>(null)
  const geom = useMemo(() => {
    const count = 4000
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 38 + Math.random() * 6
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.85
      pos[i * 3 + 2] = r * Math.cos(phi)
      // 8K color mix: warm + cool stars
      const t = Math.random()
      if (t < 0.55) { col[i * 3] = 1; col[i * 3 + 1] = 1; col[i * 3 + 2] = 1 }
      else if (t < 0.75) { col[i * 3] = 0.7; col[i * 3 + 1] = 0.82; col[i * 3 + 2] = 1 }
      else if (t < 0.88) { col[i * 3] = 1; col[i * 3 + 1] = 0.78; col[i * 3 + 2] = 0.55 }
      else { col[i * 3] = 0.9; col[i * 3 + 1] = 0.6; col[i * 3 + 2] = 1 }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3))
    g.setAttribute("color", new THREE.BufferAttribute(col, 3))
    return g
  }, [])

  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.00008
  })

  return (
    <points ref={ref} geometry={geom}>
      <pointsMaterial size={0.14} vertexColors transparent opacity={0.9} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

export function LensDust() {
  // free graphics: subtle floating dust motes with color — Poly Haven dust feel
  const ref = useRef<THREE.Points>(null)
  const geom = useMemo(() => {
    const count = 600
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 18
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10
      pos[i * 3 + 2] = (Math.random() - 0.5) * 18 - 2
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3))
    return g
  }, [])
  useFrame((s) => {
    if (!ref.current) return
    ref.current.rotation.y += 0.00012
    const t = s.clock.elapsedTime
    if (ref.current.material instanceof THREE.PointsMaterial) {
      ref.current.material.opacity = 0.18 + Math.sin(t * 0.3) * 0.06
    }
  })
  return (
    <points ref={ref} geometry={geom}>
      <pointsMaterial size={0.035} color="#ffd6a6" transparent opacity={0.22} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}
