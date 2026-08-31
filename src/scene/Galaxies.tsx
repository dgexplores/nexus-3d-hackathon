import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { snoise } from "../shaders/noise"
import { DIMENSIONS, dimensionWeight } from "./clusters"
import { scrollState } from "./scrollStore"

const galaxyVertex = /* glsl */ `
  attribute float aScale;
  attribute float aSeed;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vAlpha;
  uniform float uTime;
  ${snoise}
  void main() {
    vColor = aColor;
    vec3 pos = position;
    float t = uTime * 0.05 + aSeed * 6.2831;
    float n = snoise(pos * 0.18 + t * 0.12) * 0.35;
    pos += normalize(pos) * n * 0.22;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aScale * (58.0 / -mv.z);
    vAlpha = smoothstep(4.2, 0.0, length(pos) * 0.42) * 0.95;
  }
`

const galaxyFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.20, d) * vAlpha;
    float core = pow(smoothstep(0.5, 0.0, d), 2.1);
    // jewel core — keep hue, no white wash
    gl_FragColor = vec4(vColor + core * 0.18 + core * vColor * 0.10, a);
  }
`

type GalaxySpec = { center: THREE.Vector3; color: THREE.Color; count: number; radius: number; arms: number; spin: number; scale: number; dimIndex: number }

const SPECS: GalaxySpec[] = [
  { center: DIMENSIONS[0].center.clone().add(new THREE.Vector3(0.3, 0.4, -6.5)), color: new THREE.Color("#60a5fa"), count: 1800, radius: 2.2, arms: 2, spin: 0.08, scale: 1, dimIndex: 0 },
  { center: DIMENSIONS[1].center.clone().add(new THREE.Vector3(-0.4, 0.2, -6.2)), color: new THREE.Color("#a78bfa"), count: 1500, radius: 2.0, arms: 2, spin: 0.05, scale: 0.88, dimIndex: 1 },
  { center: DIMENSIONS[2].center.clone().add(new THREE.Vector3(0.2, 0.2, -6.8)), color: new THREE.Color("#fefce8"), count: 1400, radius: 1.6, arms: 2, spin: 0.04, scale: 0.82, dimIndex: 2 },
  { center: DIMENSIONS[3].center.clone().add(new THREE.Vector3(0.6, 0.8, -5.8)), color: new THREE.Color("#fbbf24"), count: 1600, radius: 1.9, arms: 3, spin: -0.06, scale: 0.92, dimIndex: 3 },
  { center: DIMENSIONS[4].center.clone().add(new THREE.Vector3(-0.6, 0.3, -6.0)), color: new THREE.Color("#f472b6"), count: 1700, radius: 2.1, arms: 2, spin: 0.06, scale: 0.9, dimIndex: 4 },
  { center: DIMENSIONS[5].center.clone().add(new THREE.Vector3(1.2, 0.6, -5.5)), color: new THREE.Color("#a1a1aa"), count: 1400, radius: 1.6, arms: 2, spin: 0.07, scale: 0.78, dimIndex: 5 },
  // FRACTAL FINALE — prismatic singularity: gold-white core → spectral arms, much larger, 5-fold mandala
  { center: DIMENSIONS[6].center.clone().add(new THREE.Vector3(0.2, 0.2, -6.8)), color: new THREE.Color("#ffe8a3"), count: 3400, radius: 3.1, arms: 5, spin: 0.018, scale: 1.55, dimIndex: 6 },
  // ABYSS — collapsed dark galaxy, tattered, slow, swallowed
  { center: DIMENSIONS[7].center.clone().add(new THREE.Vector3(0.4, -0.3, -5.8)), color: new THREE.Color("#1a2a4a"), count: 1100, radius: 2.4, arms: 2, spin: 0.01, scale: 1.35, dimIndex: 7 },
  // ECHO — LEGEND EMBER, not pale: molten gold core → violet crown
  { center: DIMENSIONS[8].center.clone().add(new THREE.Vector3(-0.3, 0.3, -6.0)), color: new THREE.Color("#ffb700"), count: 2600, radius: 2.7, arms: 3, spin: -0.018, scale: 1.42, dimIndex: 8 },
  // deep background galaxies — fill frame like 8K movie, always faint
  { center: new THREE.Vector3(-12, 3, -28), color: new THREE.Color("#6a8cff"), count: 900, radius: 1.4, arms: 2, spin: 0.025, scale: 0.62, dimIndex: 0 },
  { center: new THREE.Vector3(11, -2, -26), color: new THREE.Color("#ff9a5c"), count: 800, radius: 1.3, arms: 2, spin: -0.02, scale: 0.58, dimIndex: 3 },
  { center: new THREE.Vector3(5, 6, -29), color: new THREE.Color("#ff6ec7"), count: 850, radius: 1.35, arms: 2, spin: 0.02, scale: 0.6, dimIndex: 1 },
  { center: new THREE.Vector3(-7, -5, -25), color: new THREE.Color("#5cf5d6"), count: 750, radius: 1.25, arms: 2, spin: 0.03, scale: 0.55, dimIndex: 5 },
  { center: new THREE.Vector3(0, -7, -24), color: new THREE.Color("#c4b5fd"), count: 950, radius: 1.5, arms: 3, spin: -0.018, scale: 0.64, dimIndex: 4 },
  { center: new THREE.Vector3(14, 2, -30), color: new THREE.Color("#ffffff"), count: 700, radius: 1.2, arms: 2, spin: 0.015, scale: 0.52, dimIndex: 6 },
  { center: new THREE.Vector3(-9, -3, -32), color: new THREE.Color("#0a1930"), count: 600, radius: 1.1, arms: 2, spin: 0.008, scale: 0.48, dimIndex: 7 },
  { center: new THREE.Vector3(10, 5, -31), color: new THREE.Color("#ff8c42"), count: 650, radius: 1.15, arms: 2, spin: -0.01, scale: 0.5, dimIndex: 8 },
]

function buildGalaxy(spec: GalaxySpec) {
  const pos = new Float32Array(spec.count * 3)
  const col = new Float32Array(spec.count * 3)
  const scales = new Float32Array(spec.count)
  const seeds = new Float32Array(spec.count)
  const isFractal = spec.dimIndex === 6
  // richer, darker palette — no more white wash
  const inner = spec.color.clone()
  const deep = spec.color.clone().lerp(new THREE.Color("#0a0a1e"), 0.72).multiplyScalar(0.45)
  const core = new THREE.Color("#ffffff")
  const edgeWarm = new THREE.Color("#ff8c42")
  const edgeCool = new THREE.Color("#7c5bff")
  // fractal spectral palette — gold → peach → magenta → violet → cyan
  const fractalPalette = [
    new THREE.Color("#ffffff"),
    new THREE.Color("#ffe8a3"),
    new THREE.Color("#ff8c42"),
    new THREE.Color("#ff3bb5"),
    new THREE.Color("#8b5bff"),
    new THREE.Color("#00e5ff"),
  ]
  for (let i = 0; i < spec.count; i++) {
    const r = Math.pow(Math.random(), isFractal ? 0.78 : 0.85) * spec.radius
    const arm = Math.floor(Math.random() * spec.arms)
    const theta = (arm / spec.arms) * Math.PI * 2 + r * (isFractal ? 1.35 : 1.9) + (Math.random() - 0.5) * (isFractal ? 0.55 : 0.9)
    const spread = (Math.random() - 0.5) * (0.28 + r * (isFractal ? 0.14 : 0.18))
    const y = (Math.random() - 0.5) * (isFractal ? 0.14 + r * 0.09 : 0.22 + r * 0.12)
    const x = Math.cos(theta) * r + spread
    const z = Math.sin(theta) * r + spread
    pos[i * 3] = x
    pos[i * 3 + 1] = y
    pos[i * 3 + 2] = z
    const t = r / spec.radius
    let c: THREE.Color
    if (isFractal) {
      // spectral sweep: core white → gold → magenta → violet → cyan, with arm hue offset
      const hueShift = (arm / spec.arms) * 0.12
      const tt = Math.min(1, t + hueShift * 0.3)
      if (tt < 0.18) c = fractalPalette[0].clone().lerp(fractalPalette[1], tt / 0.18)
      else if (tt < 0.35) c = fractalPalette[1].clone().lerp(fractalPalette[2], (tt - 0.18) / 0.17)
      else if (tt < 0.55) c = fractalPalette[2].clone().lerp(fractalPalette[3], (tt - 0.35) / 0.2)
      else if (tt < 0.75) c = fractalPalette[3].clone().lerp(fractalPalette[4], (tt - 0.55) / 0.2)
      else c = fractalPalette[4].clone().lerp(fractalPalette[5], (tt - 0.75) / 0.25)
      // add slight per-arm cyan/violet tint at rim
      if (t > 0.7) c.lerp(fractalPalette[5], (t - 0.7) / 0.3 * 0.35)
    } else {
      if (t < 0.22) c = core.clone().lerp(inner, t / 0.22)
      else if (t < 0.58) c = inner.clone()
      else if (t < 0.82) c = inner.clone().lerp(edgeWarm, (t - 0.58) / 0.24)
      else c = edgeWarm.clone().lerp(edgeCool, (t - 0.82) / 0.18)
    }
    // fade slightly to deep jewel at extreme edge — keep bright, not scattered
    const darken = isFractal ? Math.pow(t, 1.6) * 0.18 : Math.pow(t, 1.9) * 0.20
    const final = c.clone().lerp(deep, darken)
    // bright punch for inner 50% — keep vivid
    if (t < 0.5) final.multiplyScalar(1 + (0.5 - t) * 0.42)
    col[i * 3] = final.r
    col[i * 3 + 1] = final.g
    col[i * 3 + 2] = final.b
    // fractal stars are finer and more uniform — mandala precision
    scales[i] = (isFractal ? 0.75 + Math.random() * 1.1 : 0.9 + Math.random() * 1.4) * (1 - t * (isFractal ? 0.22 : 0.35))
    seeds[i] = Math.random()
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3))
  g.setAttribute("aColor", new THREE.BufferAttribute(col, 3))
  g.setAttribute("aScale", new THREE.BufferAttribute(scales, 1))
  g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1))
  return g
}

function buildCluster(spec: GalaxySpec, offsetAngle: number) {
  const count = 120
  const pos = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)
  const scales = new Float32Array(count)
  const seeds = new Float32Array(count)
  const baseAngle = (offsetAngle / spec.arms) * Math.PI * 2
  const r = spec.radius * (0.62 + Math.random() * 0.18)
  for (let i = 0; i < count; i++) {
    const rr = r + (Math.random() - 0.5) * 0.45
    const theta = baseAngle + rr * 0.2 + (Math.random() - 0.5) * 0.35
    const x = Math.cos(theta) * rr + (Math.random() - 0.5) * 0.22
    const z = Math.sin(theta) * rr + (Math.random() - 0.5) * 0.22
    const y = (Math.random() - 0.5) * 0.18
    pos[i * 3] = x
    pos[i * 3 + 1] = y
    pos[i * 3 + 2] = z
    col[i * 3] = 1
    col[i * 3 + 1] = 1
    col[i * 3 + 2] = 1
    scales[i] = 0.7 + Math.random() * 0.9
    seeds[i] = Math.random()
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3))
  g.setAttribute("aColor", new THREE.BufferAttribute(col, 3))
  g.setAttribute("aScale", new THREE.BufferAttribute(scales, 1))
  g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1))
  return g
}

function Galaxy({ spec }: { spec: GalaxySpec }) {
  const ref = useRef<THREE.Points>(null)
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const coreRef = useRef<THREE.Mesh>(null)
  const coreHaloRef = useRef<THREE.Mesh>(null)
  const dustRef = useRef<THREE.Mesh>(null)
  const mandalaARef = useRef<THREE.Mesh>(null)
  const mandalaBRef = useRef<THREE.Mesh>(null)
  const mandalaCRef = useRef<THREE.Mesh>(null)
  const glyphARef = useRef<THREE.Mesh>(null)
  const glyphBRef = useRef<THREE.Mesh>(null)
  const diskRef = useRef<THREE.Mesh>(null)
  const flareRef = useRef<THREE.Mesh>(null)
  const geom = useMemo(() => buildGalaxy(spec), [spec])
  const clusters = useMemo(() => [0, 1, 2].map((k) => buildCluster(spec, k)), [spec])
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])
  const clusterRefs = [useRef<THREE.Points>(null), useRef<THREE.Points>(null), useRef<THREE.Points>(null)]
  const isFractal = spec.dimIndex === 6

  useFrame((s) => {
    const t = s.clock.elapsedTime
    if (matRef.current) matRef.current.uniforms.uTime.value = s.clock.elapsedTime
    if (ref.current) ref.current.rotation.y += spec.spin * 0.0015
    const w = dimensionWeight(scrollState.current, spec.dimIndex)
    const opacity = isFractal ? 0.22 + w * 0.38 : 0.14 + w * 0.26
    const scale = 1 + w * (isFractal ? 0.18 : 0.14)
    if (coreRef.current) {
      const m = coreRef.current.material as THREE.MeshBasicMaterial
      m.opacity = opacity
      coreRef.current.scale.setScalar(scale * (isFractal ? 1.18 : 1.08))
      if (isFractal) coreRef.current.rotation.y += 0.002
    }
    if (coreHaloRef.current) {
      const m = coreHaloRef.current.material as THREE.MeshBasicMaterial
      m.opacity = (0.08 + w * 0.16) * (0.85 + Math.sin(s.clock.elapsedTime * 1.4) * 0.15)
      coreHaloRef.current.scale.setScalar(scale * 1.35)
    }
    if (diskRef.current) {
      const m = diskRef.current.material as THREE.MeshBasicMaterial
      m.opacity = (0.04 + w * 0.1) * (0.8 + Math.sin(s.clock.elapsedTime * 1.1) * 0.2)
      diskRef.current.rotation.z = t * 0.25
    }
    if (flareRef.current) {
      const m = flareRef.current.material as THREE.MeshBasicMaterial
      m.opacity = (0.3 + w * 0.5) * (0.8 + Math.sin(s.clock.elapsedTime * 2.0) * 0.2)
    }
    if (dustRef.current) {
      const m = dustRef.current.material as THREE.MeshBasicMaterial
      m.opacity = (isFractal ? 0.03 + w * 0.07 : 0.06 + w * 0.11)
    }
    if (matRef.current) matRef.current.opacity = (isFractal ? 0.45 + w * 0.32 : 0.38 + w * 0.30)
    clusterRefs.forEach((r) => {
      if (r.current) {
        const m = r.current.material as THREE.ShaderMaterial
        m.opacity = 0.45 + w * 0.55
      }
    })
    // fractal mandalas — slow counter-rotation
    if (mandalaARef.current) mandalaARef.current.rotation.z = t * 0.12
    if (mandalaBRef.current) mandalaBRef.current.rotation.z = -t * 0.08
    if (mandalaCRef.current) mandalaCRef.current.rotation.z = t * 0.05
    // breathe mandala scale with weight
    const ms = 1 + w * 0.08 + Math.sin(t * 0.9) * 0.015
    if (mandalaARef.current) mandalaARef.current.scale.setScalar(ms)
    if (mandalaBRef.current) mandalaBRef.current.scale.setScalar(ms * 0.98)
    if (mandalaCRef.current) mandalaCRef.current.scale.setScalar(ms * 1.02)
    // mandala opacity — fully hidden when not focused
    const mo = w * 0.32
    if (mandalaARef.current) (mandalaARef.current.material as THREE.MeshBasicMaterial).opacity = mo
    if (mandalaBRef.current) (mandalaBRef.current.material as THREE.MeshBasicMaterial).opacity = mo * 0.75
    if (mandalaCRef.current) (mandalaCRef.current.material as THREE.MeshBasicMaterial).opacity = mo * 0.55
    if (glyphARef.current) (glyphARef.current.material as THREE.MeshBasicMaterial).opacity = w * 0.18
    if (glyphBRef.current) (glyphBRef.current.material as THREE.MeshBasicMaterial).opacity = w * 0.11
    // also hide core halo when not focused
    if (coreHaloRef.current && w < 0.01) (coreHaloRef.current.material as THREE.MeshBasicMaterial).opacity = 0
  })

  return (
    <group position={spec.center} scale={spec.scale}>
      {/* core — fractal has double core: solid singularity + halo */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[isFractal ? 0.38 : 0.26, 24, 24]} />
        <meshBasicMaterial color={isFractal ? "#fff8e7" : spec.color} transparent opacity={0.14} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {isFractal && (
        <>
          <mesh ref={coreHaloRef}>
            <sphereGeometry args={[0.62, 24, 24]} />
            <meshBasicMaterial color="#ffd18a" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          <mesh ref={diskRef} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.55, 1.8, 64, 1]} />
            <meshBasicMaterial color="#ffca6b" transparent opacity={0.08} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          <mesh rotation={[Math.PI / 2.05, 0.35, 0]}>
            <ringGeometry args={[2.0, 2.3, 64, 1]} />
            <meshBasicMaterial color="#1a2a5a" transparent opacity={0.06} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          <mesh ref={flareRef}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        </>
      )}
      {/* dust lane — dark ring inside galaxy */}
      <mesh ref={dustRef} rotation={[Math.PI / 2.2, 0, 0]}>
        <ringGeometry args={[spec.radius * (isFractal ? 0.52 : 0.42), spec.radius * (isFractal ? 0.68 : 0.58), 64, 1]} />
        <meshBasicMaterial color={isFractal ? "#050510" : "#0a0a14"} transparent opacity={isFractal ? 0.05 : 0.08} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* secondary dust lane — hidden for fractal to keep mandala clean */}
      {!isFractal && (
        <mesh rotation={[Math.PI / 2.6, 0.7, 0.5]}>
          <ringGeometry args={[spec.radius * 0.35, spec.radius * 0.5, 64, 1]} />
          <meshBasicMaterial color="#060610" transparent opacity={0.05} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
      {/* FRACTAL MANDALA — Doctor-Strange spell rings, only visible on weight */}
      {isFractal && (
        <>
          <mesh ref={mandalaARef} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.85, 0.015, 16, 180]} />
            <meshBasicMaterial color="#ffca6b" transparent opacity={0.0} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          <mesh ref={mandalaBRef} rotation={[Math.PI / 2, 0, 0.35]}>
            <torusGeometry args={[2.35, 0.011, 16, 180]} />
            <meshBasicMaterial color="#8b7cff" transparent opacity={0.0} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          <mesh ref={mandalaCRef} rotation={[Math.PI / 2.4, 0.6, 0]}>
            <torusGeometry args={[1.35, 0.009, 16, 140]} />
            <meshBasicMaterial color="#00e5ff" transparent opacity={0.0} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          {/* inner glyph — now weight-controlled */}
          <mesh ref={glyphARef} rotation={[0, 0, 0]}>
            <ringGeometry args={[0.72, 0.74, 64]} />
            <meshBasicMaterial color="#ffe8a3" transparent opacity={0} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          <mesh ref={glyphBRef} rotation={[0, 0, Math.PI / 4]}>
            <ringGeometry args={[0.78, 0.795, 64]} />
            <meshBasicMaterial color="#fff8e7" transparent opacity={0} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        </>
      )}
      <points ref={ref} geometry={geom}>
        <shaderMaterial
          ref={matRef}
          vertexShader={galaxyVertex}
          fragmentShader={galaxyFragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      {clusters.map((g, i) => (
        <points key={i} ref={clusterRefs[i]} geometry={g}>
          <shaderMaterial
          vertexShader={galaxyVertex}
          fragmentShader={galaxyFragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
        </points>
      ))}
    </group>
  )
}

export function Galaxies() {
  return (
    <group>
      {SPECS.map((s, i) => (
        <Galaxy key={i} spec={s} />
      ))}
    </group>
  )
}

export function Nebulae() {
  const specs = [
    { pos: new THREE.Vector3(0, 0.8, -18) as THREE.Vector3, scale: [22, 14, 1] as [number, number, number], color: "#6a4bff", dim: 0 },
    { pos: new THREE.Vector3(4, -2, -16) as THREE.Vector3, scale: [18, 11, 1] as [number, number, number], color: "#00d1ff", dim: 1 },
    { pos: new THREE.Vector3(-4, 0.6, -17) as THREE.Vector3, scale: [16, 9, 1] as [number, number, number], color: "#ffb86a", dim: 3 },
    { pos: new THREE.Vector3(2, -3, -15) as THREE.Vector3, scale: [15, 10, 1] as [number, number, number], color: "#7cf5d6", dim: 5 },
    { pos: new THREE.Vector3(0, 5, -20) as THREE.Vector3, scale: [22, 13, 1] as [number, number, number], color: "#ff8c42", dim: 6 },
    { pos: new THREE.Vector3(-9, 1, -19) as THREE.Vector3, scale: [20, 12, 1] as [number, number, number], color: "#ff3bb5", dim: 4 },
    { pos: new THREE.Vector3(7, 3, -21) as THREE.Vector3, scale: [17, 10, 1] as [number, number, number], color: "#a78bfa", dim: 2 },
    { pos: new THREE.Vector3(-2, -4, -16) as THREE.Vector3, scale: [14, 8, 1] as [number, number, number], color: "#f472b6", dim: 1 },
  ]

  return (
    <>
      {specs.map((s, i) => {
        const Mat = () => {
          const mat = useMemo(() => new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(s.color) } },
            vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
            fragmentShader: `
              uniform float uTime; uniform vec3 uColor; varying vec2 vUv;
              ${snoise}
              void main(){
                vec2 p = vUv - 0.5;
                float n = snoise(vec3(p*3.2, uTime*0.04)) * 0.5 + 0.5;
                float n2 = snoise(vec3(p*1.4 + 0.6, uTime*0.02)) * 0.5 + 0.5;
                float m = pow(n * n2, 1.25);
                gl_FragColor = vec4(uColor, m * 0.12);
              }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
          }), [])
          const ref = useRef<THREE.Mesh>(null)
          useFrame((state) => {
            const t = state.clock.elapsedTime
            if (ref.current) (ref.current.material as THREE.ShaderMaterial).uniforms.uTime.value = t * (0.85 + i * 0.07)
            const w = dimensionWeight(scrollState.current, s.dim)
            if (ref.current) {
              ref.current.scale.set(s.scale[0] * (1 + w * 0.08), s.scale[1] * (1 + w * 0.08), 1)
            }
          })
          return (
            <mesh key={i} ref={ref} position={s.pos} scale={s.scale} rotation={[0, 0, i * 0.07]}>
              <planeGeometry args={[1, 1, 1, 1]} />
              <primitive object={mat} attach="material" />
            </mesh>
          )
        }
        return <Mat key={i} />
      })}
    </>
  )
}
