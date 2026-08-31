import { useMemo, useRef, useEffect } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { DIMENSIONS, dimensionWeight, activeDimensionIndex } from "./clusters"
import { scrollState } from "./scrollStore"
import { fresnelVertex, fresnelFragment } from "../shaders/fresnel"

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

  useEffect(() => {
    const ch = groupRef.current?.children;
    if (!ch) return;
    for (let i = 0; i < DIMENSIONS.length; i++) {
      const inner = ch[i] as THREE.Group | undefined;
      if (!inner) continue;
      const glow = inner.children[0] as THREE.Sprite | undefined;
      const wash = inner.children[1] as THREE.Mesh | undefined;
      if (glow) (glow.material as THREE.SpriteMaterial).opacity = 0;
      if (wash) (wash.material as THREE.MeshBasicMaterial).opacity = 0;
    }
  }, []);

  useFrame((state) => {
    const ch = groupRef.current?.children;
    if (!ch) return;
    const now = state.clock.elapsedTime;
    for (let i = 0; i < DIMENSIONS.length; i++) {
      const inner = ch[i] as THREE.Group | undefined;
      if (!inner) continue;
      const glow = inner.children[0] as THREE.Sprite | undefined;
      const wash = inner.children[1] as THREE.Mesh | undefined;
      const w = dimensionWeight(scrollState.current, i);
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
              <spriteMaterial map={tex} color={hex} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
            </sprite>
            <mesh position={dim.center.clone().add(new THREE.Vector3(0, 0, -26))}>
              <planeGeometry args={[34, 34]} />
              <meshBasicMaterial map={tex} color={hex} transparent blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
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
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 1]} />
      <meshPhysicalMaterial color="#94a3b8" roughness={0.68} metalness={0.22} clearcoat={0.28} clearcoatRoughness={0.32} emissive="#475569" emissiveIntensity={0.12} />
    </instancedMesh>
  )
}

export function StarDome() {
  const ref = useRef<THREE.Points>(null)
  const geom = useMemo(() => {
    const count = 6000
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
      if (t < 0.72) { col[i * 3] = 1; col[i * 3 + 1] = 1; col[i * 3 + 2] = 1 }
      else if (t < 0.86) { col[i * 3] = 0.72; col[i * 3 + 1] = 0.82; col[i * 3 + 2] = 1 }
      else if (t < 0.93) { col[i * 3] = 1; col[i * 3 + 1] = 0.88; col[i * 3 + 2] = 0.62 }
      else { col[i * 3] = 0.9; col[i * 3 + 1] = 0.72; col[i * 3 + 2] = 1 }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3))
    g.setAttribute("color", new THREE.BufferAttribute(col, 3))
    return g
  }, [])

  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.00006
  })

  return (
    <points ref={ref} geometry={geom}>
      <pointsMaterial size={0.13} vertexColors transparent opacity={0.62} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
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
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 1]} />
      <meshPhysicalMaterial color="#cbd5e1" roughness={0.62} metalness={0.18} clearcoat={0.22} emissive="#64748b" emissiveIntensity={0.1} />
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
    const count = 800
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 2
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3))
    return g
  }, [])
  useFrame((s) => {
    if (!ref.current) return
    ref.current.rotation.y += 0.0001
    const t = s.clock.elapsedTime
    if (ref.current.material instanceof THREE.PointsMaterial) {
      ref.current.material.opacity = 0.11 + Math.sin(t * 0.3) * 0.03
    }
  })
  return (
    <points ref={ref} geometry={geom}>
      <pointsMaterial size={0.03} color="#ffd6a6" transparent opacity={0.13} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

// Deep cosmic nebula orbs — large fresnel-glow spheres behind everything
const NEBULA_ORBS = [
  { pos: new THREE.Vector3(0, 1, -22), color: "#6a4bff", radius: 5.5 },
  { pos: new THREE.Vector3(8, -3, -26), color: "#00d1ff", radius: 4.5 },
  { pos: new THREE.Vector3(-6, -5, -24), color: "#ff3bb5", radius: 5 },
  { pos: new THREE.Vector3(12, 4, -28), color: "#a78bfa", radius: 4 },
  { pos: new THREE.Vector3(-10, 2, -25), color: "#f472b6", radius: 4.5 },
  { pos: new THREE.Vector3(4, 6, -29), color: "#ff9a5c", radius: 5 },
  { pos: new THREE.Vector3(0, -4.2, -27), color: "#0a1930", radius: 6.2 },
  { pos: new THREE.Vector3(-1.2, 3.5, -26), color: "#ffb700", radius: 5.2 },
];

export function NebulaOrbs() {
  const orbs = useMemo(() => NEBULA_ORBS.map(orb => ({
    ...orb,
    uColor: new THREE.Uniform(new THREE.Color(orb.color)),
    uOpacity: new THREE.Uniform(0),
  })), []);

  useFrame((state) => {
    const now = state.clock.elapsedTime;
    orbs.forEach((orb, i) => {
      const w = dimensionWeight(scrollState.current, i % DIMENSIONS.length);
      orb.uColor.value.set(orb.color);
      orb.uOpacity.value = (0.03 + w * 0.05) * (0.8 + Math.sin(now * 0.5 + i * 1.2) * 0.2);
    });
  });

  return (
    <group>
      {orbs.map((orb, i) => (
        <mesh key={i} position={orb.pos}>
          <sphereGeometry args={[orb.radius, 24, 24]} />
          <shaderMaterial
            vertexShader={fresnelVertex}
            fragmentShader={fresnelFragment}
            uniforms={{ uColor: orb.uColor, uOpacity: orb.uOpacity }}
            transparent
            depthWrite={false}
            side={THREE.FrontSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

// Shooting stars — meteors streaking across the sky, now cinematic volume
const STREAK_TEX = (() => {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 96;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 48, 512, 48);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(0.08, "rgba(186,230,255,0.0)");
  g.addColorStop(0.28, "rgba(255,255,255,0.95)");
  g.addColorStop(0.45, "rgba(220,240,255,0.85)");
  g.addColorStop(0.62, "rgba(180,210,255,0.45)");
  g.addColorStop(1, "rgba(140,180,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 32, 512, 32);
  ctx.shadowColor = "#aaddff";
  ctx.shadowBlur = 18;
  ctx.fillRect(0, 32, 512, 28);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
})();

const METEORS = [
  { speed: 22, baseY: 2.2, baseZ: -2 },
  { speed: 26, baseY: -0.8, baseZ: -4 },
  { speed: 18, baseY: 4.2, baseZ: -1 },
  { speed: 24, baseY: -2.8, baseZ: -3 },
  { speed: 20, baseY: 1.1, baseZ: -5 },
  { speed: 28, baseY: 3.5, baseZ: -2.5 },
  { speed: 19, baseY: -1.2, baseZ: -1.5 },
];

export function ShootingStars() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const st = useMemo(() => METEORS.map(() => ({ progress: Math.random(), angle: Math.random() * Math.PI * 2, dist: 10 + Math.random() * 7 })), []);

  useFrame((_, delta) => {
    const boost = 1 + Math.abs(scrollState.velocity) * 10;
    METEORS.forEach((m, i) => {
      const s = st[i];
      s.progress += delta * m.speed * 0.09 * boost;
      if (s.progress >= 1) { s.progress = 0; s.angle = Math.random() * Math.PI * 2; s.dist = 10 + Math.random() * 7; }
      const t = Math.sin(s.progress * Math.PI);
      const fade = Math.pow(t, 0.7);
      const x = Math.cos(s.angle) * s.dist;
      const y = m.baseY + Math.sin(s.progress * Math.PI * 2) * 1.2;
      const ref = refs.current[i];
      if (!ref) return;
      ref.position.set(x, y, -4 + Math.cos(s.angle) * 1.5);
      ref.rotation.set(0, 0, s.angle + Math.PI / 2);
      const mat = ref.material as THREE.MeshBasicMaterial;
      mat.opacity = fade * 0.95;
      const sc = m.speed * 0.07 * (0.4 + fade * 0.6);
      ref.scale.set(sc, 1, 1);
      ref.visible = fade > 0.04;
    });
  });

  return (
    <group>
      {METEORS.map((_, i) => (
        <mesh key={i} ref={el => { refs.current[i] = el; }} frustumCulled={false}>
          <planeGeometry args={[3.2, 0.24]} />
          <meshBasicMaterial map={STREAK_TEX} color="#ffffff" transparent blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} depthTest={false} />
        </mesh>
      ))}
    </group>
  );
}

// Fog shifter — slowly lerp scene fog color toward active dimension
export function FogShifter() {
  const { scene } = useThree();
  useFrame(() => {
    const fog = (scene as { fog?: THREE.FogExp2 }).fog;
    if (!fog || !fog.color) return;
    const idx = activeDimensionIndex(scrollState.current);
    fog.color.lerp(DIMENSIONS[idx].color, 0.015);
  });
  return null;
}

// soft circular point texture for star clusters
const POINT_TEX = (() => {
  const c = document.createElement("canvas");
  c.width = 32; c.height = 32;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.7)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
})();

// globular star clusters scattered around each galaxy
const CLUSTER_OFFSETS: number[][] = [
  [2.8, 1.2, 1.2], [-2.4, -0.6, -1.4],
  [2.2, -1.4, 1.8], [-2.8, 1.6, -0.8],
  [3, -0.2, -2], [-2, 2, 1.5],
  [0, 0, 0],
  [1.8, -1.4, 0.9], [-1.6, 1.1, -1.0],
];

export function StarClusters() {
  const meshes = useMemo(() => {
    const arr: THREE.Points[] = [];
    DIMENSIONS.forEach((dim, i) => {
      const off = CLUSTER_OFFSETS[i];
      for (let j = 0; j < 2; j++) {
        const geom = new THREE.BufferGeometry();
        const count = 70;
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);
        for (let k = 0; k < count; k++) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const r = 0.12 + Math.random() * 0.28;
          pos[k * 3] = r * Math.sin(phi) * Math.cos(theta);
          pos[k * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
          pos[k * 3 + 2] = r * Math.cos(phi);
          const t = Math.random();
          col[k * 3] = t;
          col[k * 3 + 1] = t;
          col[k * 3 + 2] = t;
        }
        geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        geom.setAttribute("color", new THREE.BufferAttribute(col, 3));
        const mat = new THREE.PointsMaterial({
          size: 0.11, map: POINT_TEX, vertexColors: true,
          transparent: true, opacity: 0.9, depthWrite: false,
          blending: THREE.AdditiveBlending, sizeAttenuation: true,
        });
        const mesh = new THREE.Points(geom, mat);
        mesh.position.copy(dim.center).add(new THREE.Vector3(off[0], off[1], off[2]));
        arr.push(mesh);
      }
    });
    return arr;
  }, []);

  return (
    <group>
      {meshes.map((m, i) => (
        <primitive key={i} object={m} />
      ))}
    </group>
  );
}

// holographic 3D text projected near each galaxy
const HOLOGRAMS = [
  { name: "GLASS", title: "The Shard Sea", color: "#5b8cff" },
  { name: "PAINT", title: "The Wet Nebula", color: "#7c5bff" },
  { name: "INK", title: "The Paper Void", color: "#f4f2ff" },
  { name: "CUBE", title: "The Honeycomb", color: "#ffb35b" },
  { name: "MIRROR", title: "The Mirror", color: "#ff5bd0" },
  { name: "DEBRIS", title: "The Wreckage", color: "#8fa3d6" },
  { name: "FRACTAL", title: "The Singularity", color: "#ffe8a3" },
  { name: "ABYSS", title: "The Hollow Deep", color: "#1a2a4a" },
  { name: "ECHO", title: "The Afterlight", color: "#ffb700" },
];

export function GalaxyHolograms() {
  const texRefs = useRef<THREE.Sprite[]>([]);
  const textures = useMemo(() => HOLOGRAMS.map(h => {
    const c = document.createElement("canvas");
    c.width = 512; c.height = 256;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, 512, 256);
    ctx.shadowColor = h.color;
    ctx.shadowBlur = 22;
    ctx.font = "bold 40px Instrument Serif, Georgia, serif";
    ctx.fillStyle = h.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(h.title, 256, 78);
    ctx.shadowBlur = 0;
    ctx.font = "22px JetBrains Mono, monospace";
    ctx.fillStyle = h.color;
    ctx.globalAlpha = 0.85;
    ctx.fillText(h.name, 256, 148);
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = h.color;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.moveTo(110, 178);
    ctx.lineTo(398, 178);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = h.color;
    ctx.globalAlpha = 0.5;
    [110, 398].forEach(x => { ctx.beginPath(); ctx.arc(x, 178, 3, 0, Math.PI * 2); ctx.fill(); });
    ctx.globalAlpha = 1.0;
    return new THREE.CanvasTexture(c);
  }), []);

  useEffect(() => {
    texRefs.current.forEach(s => { if (s) (s.material as THREE.SpriteMaterial).opacity = 0; });
  }, []);

  useFrame((state) => {
    const now = state.clock.elapsedTime;
    texRefs.current.forEach((sprite, i) => {
      if (!sprite) return;
      const w = dimensionWeight(scrollState.current, i);
      (sprite.material as THREE.SpriteMaterial).opacity = w * 0.88;
      const pulse = 1 + Math.sin(now * 2.2 + i * 0.9) * 0.04;
      sprite.scale.set(3.6 * pulse, 1.8 * pulse, 1);
    });
  });

  return (
    <group>
      {HOLOGRAMS.map((h, i) => (
        <sprite key={i} ref={el => { texRefs.current[i] = el as THREE.Sprite; }}
          position={DIMENSIONS[i].center.clone().add(new THREE.Vector3(0, 2.9, 0))}>
          <spriteMaterial map={textures[i]} color={h.color} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
        </sprite>
      ))}
    </group>
  );
}

// ————— DEEPER DARK LAYERS —————

// ultra-far void shells — subtle depth, no blackout
export function VoidShell() {
  return (
    <group>
      <mesh position={[0, 0, -62]}>
        <sphereGeometry args={[55, 32, 32]} />
        <meshBasicMaterial color="#080818" transparent opacity={0.09} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, -78]}>
        <sphereGeometry args={[72, 32, 32]} />
        <meshBasicMaterial color="#060818" transparent opacity={0.07} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, -95]}>
        <sphereGeometry args={[90, 32, 32]} />
        <meshBasicMaterial color="#070a18" transparent opacity={0.08} side={THREE.BackSide} depthWrite={false} />
      </mesh>
    </group>
  )
}

// dark filament planes — subtle depth, no blackout
export function DarkFilaments() {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!ref.current) return
    const sc = scrollState.current
    ref.current.position.z = -18 - sc * 4
    ref.current.rotation.z = sc * 0.04
  })
  return (
    <group ref={ref}>
      {/* horizontal dark rift — much subtler */}
      <mesh position={[0, 0.8, -14]} rotation={[0, 0, 0.12]}>
        <planeGeometry args={[42, 3.2]} />
        <meshBasicMaterial color="#0a0a1a" transparent opacity={0.18} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {/* diagonal rift */}
      <mesh position={[1.2, -1.2, -16]} rotation={[0, 0, -0.22]}>
        <planeGeometry args={[36, 2]} />
        <meshBasicMaterial color="#080a18" transparent opacity={0.14} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {/* abyss trench */}
      <mesh position={[0, -3.8, -12]} rotation={[0.12, 0, 0]}>
        <planeGeometry args={[28, 4.2]} />
        <meshBasicMaterial color="#070a14" transparent opacity={0.16} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// ABYSS CORE — black hole at the hollow deep, only visible on weight
export function AbyssCore() {
  const groupRef = useRef<THREE.Group>(null)
  const diskRef = useRef<THREE.Mesh>(null)
  const photonRef = useRef<THREE.Mesh>(null)
  const abyssPos = DIMENSIONS[7].center.clone().add(new THREE.Vector3(0, 0, -5.5))
  useFrame((s) => {
    const w = dimensionWeight(scrollState.current, 7)
    const t = s.clock.elapsedTime
    if (groupRef.current) {
      groupRef.current.visible = w > 0.01
      groupRef.current.scale.setScalar(0.85 + w * 0.35)
    }
    if (diskRef.current) {
      const m = diskRef.current.material as THREE.MeshBasicMaterial
      m.opacity = w * 0.42
      diskRef.current.rotation.z = t * 0.18
    }
    if (photonRef.current) {
      const m = photonRef.current.material as THREE.MeshBasicMaterial
      m.opacity = w * 0.55
      const pulse = 1 + Math.sin(t * 1.1) * 0.02
      photonRef.current.scale.setScalar(pulse)
    }
  })
  return (
    <group ref={groupRef} position={abyssPos}>
      {/* event horizon — pure black */}
      <mesh>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      {/* photon ring — thin lensed rim */}
      <mesh ref={photonRef}>
        <ringGeometry args={[0.62, 0.68, 64]} />
        <meshBasicMaterial color="#8ab4ff" transparent opacity={0} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* accretion disk — edge-on */}
      <mesh ref={diskRef} rotation={[Math.PI / 2.15, 0, 0]}>
        <ringGeometry args={[0.85, 1.95, 64, 1]} />
        <meshBasicMaterial color="#ff3b30" transparent opacity={0} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* secondary outer disk */}
      <mesh rotation={[Math.PI / 2.05, 0.35, 0]}>
        <ringGeometry args={[2.0, 2.22, 64, 1]} />
        <meshBasicMaterial color="#1a2a5a" transparent opacity={0.08} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* gravitational lens halo */}
      <mesh>
        <sphereGeometry args={[0.78, 24, 24]} />
        <meshBasicMaterial color="#0a1930" transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ECHO VEIL — pale afterlight haze for the final dimension, weight-controlled
export function EchoVeil() {
  const veilRef = useRef<THREE.Mesh>(null)
  const ptsRef = useRef<THREE.Points>(null)
  const geom = useMemo(() => {
    const count = 700
    const pos = new Float32Array(count * 3)
    const eCenter = DIMENSIONS[8].center.clone().add(new THREE.Vector3(-0.2, 0, -6))
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2
      const r = Math.pow(Math.random(), 0.7) * 2.8
      pos[i * 3] = eCenter.x + Math.cos(ang) * r + (Math.random() - 0.5) * 0.6
      pos[i * 3 + 1] = eCenter.y + Math.sin(ang) * r * 0.55 + (Math.random() - 0.5) * 0.6
      pos[i * 3 + 2] = eCenter.z + (Math.random() - 0.5) * 1.6
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3))
    return g
  }, [])
  useFrame((s) => {
    const w = dimensionWeight(scrollState.current, 8)
    if (veilRef.current) (veilRef.current.material as THREE.MeshBasicMaterial).opacity = w * 0.022
    if (ptsRef.current) {
      const m = ptsRef.current.material as THREE.PointsMaterial
      m.opacity = w * 0.14
      ptsRef.current.rotation.y += 0.0006
    }
    if (veilRef.current) {
      const sc = 1 + w * 0.12 + Math.sin(s.clock.elapsedTime * 0.45) * 0.01
      veilRef.current.scale.setScalar(sc)
    }
  })
  return (
    <group>
      <mesh ref={veilRef} position={DIMENSIONS[8].center.clone().add(new THREE.Vector3(-0.2, 0, -6))}>
        <sphereGeometry args={[3.2, 24, 24]} />
        <meshBasicMaterial color="#ffb700" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <points ref={ptsRef} geometry={geom}>
        <pointsMaterial size={0.07} color="#ffd479" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
      </points>
    </group>
  )
}

// parallax far stars — ultra-faint depth behind everything, slow drift
export function ParallaxLayers() {
  const refA = useRef<THREE.Points>(null)
  const refB = useRef<THREE.Points>(null)
  const geomA = useMemo(() => {
    const count = 2500
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const th = Math.random() * Math.PI * 2
      const ph = Math.acos(2 * Math.random() - 1)
      const r = 58 + Math.random() * 14
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th)
      pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.9
      pos[i * 3 + 2] = r * Math.cos(ph)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3))
    return g
  }, [])
  const geomB = useMemo(() => {
    const count = 1800
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const th = Math.random() * Math.PI * 2
      const ph = Math.acos(2 * Math.random() - 1)
      const r = 72 + Math.random() * 18
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th)
      pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.9
      pos[i * 3 + 2] = r * Math.cos(ph)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3))
    return g
  }, [])
  useFrame(() => {
    if (refA.current) refA.current.rotation.y += 0.00004
    if (refB.current) refB.current.rotation.y -= 0.000025
  })
  return (
    <group>
      <points ref={refA} geometry={geomA}>
        <pointsMaterial size={0.09} color="#ffffff" transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
      </points>
      <points ref={refB} geometry={geomB}>
        <pointsMaterial size={0.11} color="#b8c6ff" transparent opacity={0.09} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
      </points>
    </group>
  )
}

// ============ CINEMATIC DIVERSIONS — movie flybys ============

// Close asteroid divert — huge rocks whistling past the lens, constant parallax — optimized
export function CloseAsteroidDivert() {
  const ref = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const count = 18
  const data = useMemo(() => {
    const arr: { x: number; y: number; z: number; rot: THREE.Euler; scale: number; speed: number; tumble: THREE.Vector3 }[] = []
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 10,
        y: (Math.random() - 0.5) * 7,
        z: -18 - Math.random() * 22,
        rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
        scale: 0.32 + Math.random() * 0.55,
        speed: 4.2 + Math.random() * 6.5,
        tumble: new THREE.Vector3((Math.random() - 0.5) * 2.2, (Math.random() - 0.5) * 1.9, (Math.random() - 0.5) * 1.6),
      })
    }
    return arr
  }, [])
  useFrame((_, delta) => {
    if (!ref.current) return
    const boost = 1 + Math.abs(scrollState.velocity) * 22
    const active = activeDimensionIndex(scrollState.current)
    data.forEach((d, i) => {
      d.z += delta * d.speed * boost
      d.rot.x += delta * d.tumble.x
      d.rot.y += delta * d.tumble.y
      d.rot.z += delta * d.tumble.z * 0.5
      if (d.z > 11) {
        d.z = -20 - Math.random() * 16
        d.x = (Math.random() - 0.5) * 11
        d.y = (Math.random() - 0.5) * 7.5
        d.scale = 0.32 + Math.random() * 0.62
      }
      dummy.position.set(d.x, d.y, d.z)
      dummy.rotation.set(d.rot.x, d.rot.y, d.rot.z)
      const scale = d.scale * (active === 5 ? 1.35 : active === 7 ? 1.2 : 1)
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      ref.current!.setMatrixAt(i, dummy.matrix)
      const col = active === 7 ? new THREE.Color("#475569") : active === 1 ? new THREE.Color("#c4b5fd") : active === 6 ? new THREE.Color("#fde68a") : active === 3 ? new THREE.Color("#fcd34d") : new THREE.Color("#cbd5e1")
      ref.current!.setColorAt(i, col)
    })
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 2]} />
      <meshPhysicalMaterial roughness={0.58} metalness={0.28} clearcoat={0.42} clearcoatRoughness={0.28} emissive="#64748b" emissiveIntensity={0.14} transparent opacity={0.92} color="#e2e8f0" vertexColors />
    </instancedMesh>
  )
}

// Comet darts — icy streaks knifing across foreground, diagonal, with luminous heads — optimized
export function CometDarts() {
  const refs = useRef<(THREE.Mesh | null)[]>([])
  const glowRefs = useRef<(THREE.Sprite | null)[]>([])
  const cometData = useMemo(() => Array.from({ length: 11 }, () => ({
    x: (Math.random() - 0.5) * 13,
    y: (Math.random() - 0.5) * 8 + 1.2,
    z: -16 - Math.random() * 14,
    speed: 11 + Math.random() * 13,
    drift: (Math.random() - 0.5) * 1.4,
    ang: -0.85 + Math.random() * 0.4,
    scale: 1.35 + Math.random() * 1.8,
  })), [])
  const tailTex = useMemo(() => {
    const c = document.createElement("canvas")
    c.width = 512; c.height = 96
    const ctx = c.getContext("2d")!
    const g = ctx.createLinearGradient(0, 48, 512, 48)
    g.addColorStop(0, "rgba(120,200,255,0)")
    g.addColorStop(0.14, "rgba(160,225,255,0.0)")
    g.addColorStop(0.32, "rgba(255,255,255,1)")
    g.addColorStop(0.48, "rgba(220,240,255,0.95)")
    g.addColorStop(0.68, "rgba(160,200,255,0.55)")
    g.addColorStop(1, "rgba(100,160,255,0)")
    ctx.fillStyle = g
    ctx.fillRect(0, 34, 512, 28)
    ctx.shadowBlur = 22; ctx.shadowColor = "#bfdbfe"
    ctx.fillRect(0, 34, 512, 24)
    const t = new THREE.CanvasTexture(c)
    t.needsUpdate = true
    return t
  }, [])
  const glowTex = useMemo(() => {
    const c = document.createElement("canvas")
    c.width = 128; c.height = 128
    const ctx = c.getContext("2d")!
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0, "rgba(255,255,255,1)")
    g.addColorStop(0.12, "rgba(219,234,254,1)")
    g.addColorStop(0.28, "rgba(147,197,253,0.9)")
    g.addColorStop(0.5, "rgba(96,165,250,0.45)")
    g.addColorStop(1, "rgba(59,130,246,0)")
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    const t = new THREE.CanvasTexture(c)
    t.needsUpdate = true
    return t
  }, [])
  useFrame((_, delta) => {
    const boost = 1 + Math.abs(scrollState.velocity) * 16
    cometData.forEach((d, i) => {
      d.z += delta * d.speed * boost
      d.x += delta * d.drift
      if (d.z > 9) {
        d.z = -18 - Math.random() * 12
        d.x = (Math.random() - 0.5) * 13
        d.y = (Math.random() - 0.5) * 8 + 1.2
      }
      const m = refs.current[i]
      if (!m) return
      m.position.set(d.x, d.y, d.z)
      m.rotation.z = d.ang
      m.scale.set(d.scale, 0.95, 1)
      const w = dimensionWeight(scrollState.current, 8) * 0.5 + dimensionWeight(scrollState.current, 1) * 0.6 + 0.32
      ;(m.material as THREE.MeshBasicMaterial).opacity = 0.42 + w * 0.58
      const g = glowRefs.current[i]
      if (g) {
        g.position.set(d.x + Math.cos(d.ang) * 0.9 * d.scale, d.y + Math.sin(d.ang) * 0.9 * d.scale, d.z + 0.05)
        g.scale.setScalar(1.2 + w * 0.9)
        ;(g.material as THREE.SpriteMaterial).opacity = 0.72 + w * 0.28
      }
    })
  })
  return (
    <group>
      {cometData.map((_, i) => (
        <group key={i}>
          <mesh ref={el => { refs.current[i] = el }} frustumCulled={false}>
            <planeGeometry args={[5.2, 0.34]} />
            <meshBasicMaterial map={tailTex} transparent blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false} side={THREE.DoubleSide} />
          </mesh>
          <sprite ref={el => { glowRefs.current[i] = el }}>
            <spriteMaterial map={glowTex} transparent blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false} color="#ffffff" />
          </sprite>
        </group>
      ))}
    </group>
  )
}

// Planet close-pass — one colossal planet that looms then recedes, for CUBE/ABYSS beats
export function PlanetDivert() {
  const ref = useRef<THREE.Group>(null)
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    if (!ref.current) return
    const sc = scrollState.current
    // appears around cube (0.5) and abyss (0.93), otherwise far away
    const wCube = dimensionWeight(sc, 3)
    const wAbyss = dimensionWeight(sc, 7)
    const w = Math.max(wCube, wAbyss * 1.1)
    ref.current.visible = w > 0.02
    // swoop trajectory: from +14x → -12x across, z holds near
    const t = THREE.MathUtils.clamp((sc - 0.46) / 0.08, 0, 1) * (1 - wAbyss) + THREE.MathUtils.clamp((sc - 0.88) / 0.07, 0, 1) * wAbyss
    // fallback simple
    ref.current.position.set(14 - t * 26, 1.2 + Math.sin(s.clock.elapsedTime * 0.22) * 0.15, -6.5 - w * 2.5)
    ref.current.rotation.y += 0.0012
    if (matRef.current) matRef.current.opacity = 0.35 + w * 0.65
    if (ringRef.current) (ringRef.current.material as THREE.MeshBasicMaterial).opacity = w * 0.22
    const sac = 1 + w * 0.18
    ref.current.scale.setScalar(sac)
  })
  return (
    <group ref={ref} position={[14, 1, -8]}>
      <mesh>
        <sphereGeometry args={[2.2, 48, 48]} />
        <meshPhysicalMaterial ref={matRef} color="#fbbf24" roughness={0.38} metalness={0.12} clearcoat={0.42} clearcoatRoughness={0.18} sheen={0.32} sheenColor="#fde68a" emissive="#d97706" emissiveIntensity={0.18} transparent opacity={0.88} />
      </mesh>
      <mesh ref={ringRef} rotation={[Math.PI / 2.35, 0, 0]}>
        <ringGeometry args={[2.95, 4.1, 64]} />
        <meshBasicMaterial color="#fde68a" transparent opacity={0} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh scale={1.06}>
        <sphereGeometry args={[2.2, 32, 32]} />
        <meshBasicMaterial color="#ff8c42" transparent opacity={0.07} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.BackSide} />
      </mesh>
    </group>
  )
}

// Shard storm — glass/paint dimension crystal divert, razor fragments — optimized
export function ShardStorm() {
  const ref = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const count = 26
  const data = useMemo(() => Array.from({ length: count }, () => ({
    pos: new THREE.Vector3((Math.random() - 0.5) * 11, (Math.random() - 0.5) * 7, -18 - Math.random() * 18),
    vel: new THREE.Vector3((Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.55, 5 + Math.random() * 8),
    rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
    rotVel: new THREE.Vector3((Math.random() - 0.5) * 3.2, (Math.random() - 0.5) * 2.8, (Math.random() - 0.5) * 2.2),
    scl: 0.18 + Math.random() * 0.42,
  })), [])
  useFrame((_, delta) => {
    if (!ref.current) return
    const boost = 1 + Math.abs(scrollState.velocity) * 20
    const wGlass = dimensionWeight(scrollState.current, 0)
    const wPaint = dimensionWeight(scrollState.current, 1)
    const w = Math.max(wGlass, wPaint * 0.75)
    data.forEach((d, i) => {
      d.pos.addScaledVector(d.vel, delta * boost * (1 + w * 0.7))
      d.rot.x += d.rotVel.x * delta
      d.rot.y += d.rotVel.y * delta
      if (d.pos.z > 9) {
        d.pos.set((Math.random() - 0.5) * 11, (Math.random() - 0.5) * 7, -19 - Math.random() * 12)
        d.vel.set((Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.55, 5 + Math.random() * 7)
      }
      dummy.position.copy(d.pos)
      dummy.rotation.set(d.rot.x, d.rot.y, d.rot.z)
      dummy.scale.setScalar(d.scl * (0.72 + w * 0.65))
      dummy.updateMatrix()
      ref.current!.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
      <octahedronGeometry args={[1, 0]} />
      <meshPhysicalMaterial color="#dbeafe" roughness={0.18} metalness={0.42} clearcoat={0.55} clearcoatRoughness={0.12} emissive="#60a5fa" emissiveIntensity={0.42} transparent opacity={0.92} />
    </instancedMesh>
  )
}

// Rich colored space fill — deep jewel washes on true black
export function SpaceFill() {
  return (
    <group>
      <mesh position={[0, 0.5, -42]}>
        <sphereGeometry args={[38, 24, 24]} />
        <meshBasicMaterial color="#1a0b4a" transparent opacity={0.13} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh position={[3, -1, -48]}>
        <sphereGeometry args={[32, 24, 24]} />
        <meshBasicMaterial color="#0a1e5a" transparent opacity={0.11} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh position={[-2, 1.5, -38]}>
        <sphereGeometry args={[34, 24, 24]} />
        <meshBasicMaterial color="#4a1040" transparent opacity={0.12} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh position={[-1, -0.5, -52]}>
        <sphereGeometry args={[40, 24, 24]} />
        <meshBasicMaterial color="#0e1a4a" transparent opacity={0.10} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* fractal finale wash — subtle warm gold behind singularity */}
      <mesh position={[0.2, 2.2, -46]}>
        <sphereGeometry args={[22, 24, 24]} />
        <meshBasicMaterial color="#2a1800" transparent opacity={0.035} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}
