import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { DIMENSIONS, dimensionWeight } from "./clusters"
import { scrollState } from "./scrollStore"

function makeGlowTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.18, "rgba(255,255,255,0.75)");
  g.addColorStop(0.5, "rgba(255,255,255,0.2)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

// Cinematic atmospheric glow behind each dimension cluster — movie lighting gel + color wash
export function DimensionAtmosphere() {
  const tex = useMemo(makeGlowTexture, []);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const ch = groupRef.current?.children;
    if (!ch) return;
    const now = state.clock.elapsedTime;
    for (let i = 0; i < DIMENSIONS.length; i++) {
      const w = dimensionWeight(scrollState.current, i);
      const glow = ch[i * 2] as THREE.Sprite | undefined;
      const wash = ch[i * 2 + 1] as THREE.Mesh | undefined;
      if (glow) {
        (glow.material as THREE.SpriteMaterial).opacity = w * 0.3;
        const scale = 1 + w * 0.25 + Math.sin(now * 1.8 + i * 0.9) * 0.04;
        glow.scale.set(20 * scale, 20 * scale, 1);
      }
      if (wash) {
        (wash.material as THREE.MeshBasicMaterial).opacity = w * 0.06;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {DIMENSIONS.map((dim) => {
        const hex = `#${dim.color.getHexString()}`;
        return (
          <group key={dim.key}>
            <sprite position={dim.center.clone().add(new THREE.Vector3(0, 0, -10))}>
              <spriteMaterial map={tex} color={hex} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
            </sprite>
            <mesh position={dim.center.clone().add(new THREE.Vector3(0, 0, -26))}>
              <planeGeometry args={[34, 34]} />
              <meshBasicMaterial map={tex} color={hex} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

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
    const count = 8000
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 38 + Math.random() * 9
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.85
      pos[i * 3 + 2] = r * Math.cos(phi)
      const t = Math.random()
      if (t < 0.52) { col[i * 3] = 1; col[i * 3 + 1] = 1; col[i * 3 + 2] = 1 }
      else if (t < 0.72) { col[i * 3] = 0.68; col[i * 3 + 1] = 0.8; col[i * 3 + 2] = 1 }
      else if (t < 0.86) { col[i * 3] = 1; col[i * 3 + 1] = 0.76; col[i * 3 + 2] = 0.48 }
      else { col[i * 3] = 0.88; col[i * 3 + 1] = 0.62; col[i * 3 + 2] = 1 }
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

export function InnerBelt() {
  const ref = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const count = 180
  const data = useMemo(() => {
    const arr: { pos: THREE.Vector3; rot: THREE.Euler; scale: number; axis: THREE.Vector3; speed: number }[] = []
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 6.2 + Math.random() * 1.8
      const y = (Math.random() - 0.5) * 0.9
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      arr.push({
        pos: new THREE.Vector3(x, y, z),
        rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
        scale: 0.022 + Math.random() * 0.045,
        axis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
        speed: 0.12 + Math.random() * 0.18,
      })
    }
    return arr
  }, [])
  useFrame((_, delta) => {
    if (!ref.current) return
    data.forEach((d, i) => {
      dummy.position.copy(d.pos)
      const angle = Math.atan2(d.pos.z, d.pos.x) + delta * d.speed * 0.06
      const r = Math.hypot(d.pos.x, d.pos.z)
      dummy.position.x = Math.cos(angle) * r
      dummy.position.z = Math.sin(angle) * r
      dummy.rotation.set(d.rot.x + delta * d.speed * 0.6, d.rot.y + delta * d.speed * 0.4, d.rot.z)
      dummy.scale.setScalar(d.scale)
      dummy.updateMatrix()
      ref.current!.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <tetrahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#a8b0c2" roughness={0.92} metalness={0.06} />
    </instancedMesh>
  )
}

export function DeepGalaxies() {
  const specs = useMemo(() => [
    { pos: new THREE.Vector3(-14, 4, -28), color: "#8aa8ff", scale: 0.42 },
    { pos: new THREE.Vector3(13, -3, -26), color: "#ffb86a", scale: 0.38 },
    { pos: new THREE.Vector3(6, 7, -30), color: "#ff7ac4", scale: 0.35 },
    { pos: new THREE.Vector3(-8, -6, -24), color: "#7cf5d6", scale: 0.33 },
    { pos: new THREE.Vector3(0, -8, -22), color: "#c4b5fd", scale: 0.4 },
  ], [])
  return (
    <group>
      {specs.map((s, i) => (
        <mesh key={i} position={s.pos} scale={s.scale}>
          <sphereGeometry args={[1.2, 24, 24]} />
          <meshBasicMaterial color={s.color} transparent opacity={0.09} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

export function LensDust() {
  const ref = useRef<THREE.Points>(null)
  const geom = useMemo(() => {
    const count = 1200
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 22
      pos[i * 3 + 1] = (Math.random() - 0.5) * 14
      pos[i * 3 + 2] = (Math.random() - 0.5) * 22 - 2
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
