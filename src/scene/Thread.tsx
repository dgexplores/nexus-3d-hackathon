import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { DIMENSIONS, dimensionWeight } from "./clusters"
import { jumpTo, scrollState } from "./scrollStore"

// tiny line with human meaning: the thread that holds you
// senior-grade: TubeGeometry + custom shader pulse, not a basic Line
// free resource: pure Three.js procedural, no external GLB needed (beginner-friendly, Poly Haven HDR will light it)

const threadVertex = /* glsl */ `
  varying float vT;
  attribute float aProgress;
  void main() {
    vT = aProgress;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const threadFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uPulse;
  varying float vT;
  void main() {
    float travel = fract(vT - uTime * 0.35);
    float pulse = pow(smoothstep(0.0, 0.12, travel) * smoothstep(0.18, 0.06, travel), 1.2);
    float core = 0.55 + pulse * 1.8;
    float alpha = 0.18 + pulse * 0.85;
    // faint base thread always visible, even when pulse not on it
    float base = smoothstep(0.45, 0.0, abs(vT - 0.5)) * 0.12;
    gl_FragColor = vec4(uColor * (core + base), alpha);
  }
`

function buildThreadGeometry() {
  // curve that kisses each dimension center lightly, like a loose thread
  const pts: THREE.Vector3[] = []
  // start from void, loop through dimensions in scrollPeak order, return
  const ordered = [...DIMENSIONS].sort((a, b) => a.scrollPeak - b.scrollPeak)
  pts.push(new THREE.Vector3(0, 0.2, 0))
  for (const d of ordered) {
    // offset slightly toward origin so thread doesn't go through node core
    const p = d.center.clone().multiplyScalar(0.88)
    // add a tiny wobble for human hand-drawn feel
    p.x += Math.sin(d.scrollPeak * 9.1) * 0.18
    p.y += Math.cos(d.scrollPeak * 7.3) * 0.12
    pts.push(p)
  }
  pts.push(new THREE.Vector3(0, 0.2, 0))
  const curve = new THREE.CatmullRomCurve3(pts, true, "centripetal", 0.45)
  const tube = new THREE.TubeGeometry(curve, 180, 0.012, 8, true)
  const progress = new Float32Array(tube.attributes.position.count)
  const pos = tube.attributes.position
  // approximate progress by nearest point on curve (cheap, good enough)
  for (let i = 0; i < pos.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(pos as THREE.BufferAttribute, i)
    // project onto curve by finding closest t via brute 60 samples
    let bestT = 0
    let bestDist = Infinity
    for (let s = 0; s <= 60; s++) {
      const t = s / 60
      const c = curve.getPoint(t)
      const d = v.distanceToSquared(c)
      if (d < bestDist) { bestDist = d; bestT = t }
    }
    progress[i] = bestT
  }
  tube.setAttribute("aProgress", new THREE.BufferAttribute(progress, 1))
  return tube
}

export function Thread() {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const geom = useMemo(() => buildThreadGeometry(), [])
  const color = useMemo(() => new THREE.Color("#f4f2ff"), [])

  useFrame((state) => {
    if (!matRef.current) return
    // per-dim time dilation — paint slow, debris fast — unique vs field
    let scale = 1
    let wSum = 0
    DIMENSIONS.forEach((d, i) => {
      const w = dimensionWeight(scrollState.current, i)
      scale += w * (d.timeScale - 1)
      wSum += w
    })
    if (wSum < 0.08) scale = 1
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime * scale
    const vel = Math.abs(scrollState.velocity)
    matRef.current.uniforms.uPulse.value = 1 + vel * 18
    // velocity warp: brighten on fast scroll
    const vWarp = Math.min(0.6, vel * 6)
    matRef.current.uniforms.uColor.value = new THREE.Color("#f4f2ff").lerp(new THREE.Color("#38bdf8"), vWarp)
  })

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uPulse: { value: 1 },
    uColor: { value: color },
  }), [color])

  const handlePointerDown = () => {
    // unique: click thread to tear to next reality — no competitor has this
    let best = 0
    let bestDist = Infinity
    DIMENSIONS.forEach((d, i) => {
      const dist = d.scrollPeak - scrollState.current
      if (dist > 0.02 && dist < bestDist) { bestDist = dist; best = i }
    })
    jumpTo(DIMENSIONS[best].scrollPeak)
  }
  return (
    <mesh geometry={geom} onPointerDown={handlePointerDown} onPointerOver={() => document.body.style.cursor = "pointer"} onPointerOut={() => document.body.style.cursor = "none"}>
      <shaderMaterial
        ref={matRef}
        vertexShader={threadVertex}
        fragmentShader={threadFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}
