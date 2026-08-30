import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { snoise } from "../shaders/noise"
import { DIMENSIONS, dimensionWeight } from "./clusters"
import { scrollState } from "./scrollStore"

// senior galaxy: procedural spiral points + core glow, no external GLB (free, hackathon-safe)
// each galaxy is a celestial element with own rotation, color, scale — cinematic multi-orbit

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
    // slow orbital drift
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
    float a = smoothstep(0.5, 0.18, d) * vAlpha;
    // soft core glow
    float core = pow(smoothstep(0.5, 0.0, d), 1.8);
    gl_FragColor = vec4(vColor + core * 0.35, a);
  }
`

type GalaxySpec = { center: THREE.Vector3; color: THREE.Color; count: number; radius: number; arms: number; spin: number; scale: number; dimIndex: number }

// anchored behind each dimension's cluster, so text "blue giant behind" is literally there
const SPECS: GalaxySpec[] = [
  { center: DIMENSIONS[0].center.clone().add(new THREE.Vector3(0.3, 0.4, -6.5)), color: new THREE.Color("#8aa8ff"), count: 1800, radius: 2.2, arms: 2, spin: 0.08, scale: 1, dimIndex: 0 },
  { center: DIMENSIONS[1].center.clone().add(new THREE.Vector3(-0.4, 0.2, -6.2)), color: new THREE.Color("#ff7ac4"), count: 1500, radius: 2.0, arms: 2, spin: 0.05, scale: 0.88, dimIndex: 1 },
  { center: DIMENSIONS[3].center.clone().add(new THREE.Vector3(0.6, 0.8, -5.8)), color: new THREE.Color("#ffb86a"), count: 1600, radius: 1.9, arms: 3, spin: -0.06, scale: 0.92, dimIndex: 3 },
  { center: DIMENSIONS[5].center.clone().add(new THREE.Vector3(1.2, 0.6, -5.5)), color: new THREE.Color("#7cf5d6"), count: 1400, radius: 1.6, arms: 2, spin: 0.07, scale: 0.78, dimIndex: 5 },
]

function buildGalaxy(spec: GalaxySpec) {
  const pos = new Float32Array(spec.count * 3)
  const col = new Float32Array(spec.count * 3)
  const scales = new Float32Array(spec.count)
  const seeds = new Float32Array(spec.count)
  const inner = spec.color.clone()
  const outer = spec.color.clone().lerp(new THREE.Color("#ffffff"), 0.35).multiplyScalar(0.85)
  for (let i = 0; i < spec.count; i++) {
    const r = Math.pow(Math.random(), 0.85) * spec.radius
    const arm = Math.floor(Math.random() * spec.arms)
    const theta = (arm / spec.arms) * Math.PI * 2 + r * 1.9 + (Math.random() - 0.5) * 0.9
    const spread = (Math.random() - 0.5) * (0.28 + r * 0.18)
    const y = (Math.random() - 0.5) * (0.22 + r * 0.12)
    const x = Math.cos(theta) * r + spread
    const z = Math.sin(theta) * r + spread
    pos[i * 3] = x
    pos[i * 3 + 1] = y
    pos[i * 3 + 2] = z
    const t = r / spec.radius
    const c = inner.clone().lerp(outer, Math.pow(t, 0.7))
    col[i * 3] = c.r
    col[i * 3 + 1] = c.g
    col[i * 3 + 2] = c.b
    scales[i] = (0.9 + Math.random() * 1.4) * (1 - t * 0.35)
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
  const geom = useMemo(() => buildGalaxy(spec), [spec])
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])
  useFrame((s) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = s.clock.elapsedTime
    if (ref.current) ref.current.rotation.y += spec.spin * 0.0015
    // aesthetic tie to text: galaxy brightens when its chapter is in view (dimensionWeight)
    const w = dimensionWeight(scrollState.current, spec.dimIndex)
    const opacity = 0.14 + w * 0.22
    const scale = 1 + w * 0.12
    if (coreRef.current) {
      const m = coreRef.current.material as THREE.MeshBasicMaterial
      m.opacity = opacity
      coreRef.current.scale.setScalar(scale)
    }
    if (matRef.current) matRef.current.opacity = 0.55 + w * 0.45
  })
  return (
    <group position={spec.center} scale={spec.scale}>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshBasicMaterial color={spec.color} transparent opacity={0.14} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <points ref={ref} geometry={geom}>
        <shaderMaterial
          ref={matRef}
          vertexShader={galaxyVertex}
          fragmentShader={galaxyFragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexColors
        />
      </points>
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
  // two large translucent nebula planes behind galaxies, procedural snoise
  const mat1 = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color("#6a4bff") } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
      uniform float uTime; uniform vec3 uColor; varying vec2 vUv;
      ${snoise}
      void main(){
        vec2 p = vUv - 0.5;
        float n = snoise(vec3(p*3.2, uTime*0.04)) * 0.5 + 0.5;
        float n2 = snoise(vec3(p*1.4 + 0.6, uTime*0.02)) * 0.5 + 0.5;
        float m = pow(n * n2, 1.25);
        gl_FragColor = vec4(uColor, m * 0.14);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  }), [])
  const mat2 = useMemo(() => mat1.clone(), [mat1])
  mat2.uniforms.uColor.value = new THREE.Color("#00d1ff")
  const ref1 = useRef<THREE.Mesh>(null)
  const ref2 = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    const t = s.clock.elapsedTime
    if (ref1.current) (ref1.current.material as THREE.ShaderMaterial).uniforms.uTime.value = t
    if (ref2.current) (ref2.current.material as THREE.ShaderMaterial).uniforms.uTime.value = t * 0.85
  })
  return (
    <>
      <mesh ref={ref1} position={[0, 0.8, -18]} scale={[22, 14, 1]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <primitive object={mat1} attach="material" />
      </mesh>
      <mesh ref={ref2} position={[4, -2, -16]} scale={[18, 11, 1]} rotation={[0, 0, 0.08]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <primitive object={mat2} attach="material" />
      </mesh>
    </>
  )
}
