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

// Deep cosmic nebula orbs — large fresnel-glow spheres behind everything
const NEBULA_ORBS = [
  { pos: new THREE.Vector3(0, 1, -22), color: "#6a4bff", radius: 5.5 },
  { pos: new THREE.Vector3(8, -3, -26), color: "#00d1ff", radius: 4.5 },
  { pos: new THREE.Vector3(-6, -5, -24), color: "#ff3bb5", radius: 5 },
  { pos: new THREE.Vector3(12, 4, -28), color: "#a78bfa", radius: 4 },
  { pos: new THREE.Vector3(-10, 2, -25), color: "#f472b6", radius: 4.5 },
  { pos: new THREE.Vector3(4, 6, -29), color: "#ff9a5c", radius: 5 },
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

// Shooting stars — meteors streaking across the sky
const STREAK_TEX = (() => {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 32, 256, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.15, "rgba(255,255,255,0.9)");
  g.addColorStop(0.5, "rgba(255,255,255,0.3)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 64);
  return new THREE.CanvasTexture(c);
})();

const METEORS = [
  { speed: 18, baseY: 2, baseZ: -4 },
  { speed: 22, baseY: -1, baseZ: -6 },
  { speed: 15, baseY: 4, baseZ: -3 },
  { speed: 20, baseY: -3, baseZ: -5 },
  { speed: 17, baseY: 1, baseZ: -7 },
];

export function ShootingStars() {
  const refs = useRef<THREE.Mesh[]>([]);
  const st = useMemo(() => METEORS.map(() => ({ progress: Math.random(), angle: Math.random() * Math.PI * 2, dist: 18 + Math.random() * 8 })), []);

  useFrame((_, delta) => {
    METEORS.forEach((m, i) => {
      const s = st[i];
      s.progress += delta * m.speed * 0.12;
      if (s.progress >= 1) { s.progress = 0; s.angle = Math.random() * Math.PI * 2; s.dist = 18 + Math.random() * 8; }
      const t = Math.sin(s.progress * Math.PI);
      const x = Math.cos(s.angle) * s.dist;
      const y = m.baseY + Math.sin(s.progress * Math.PI) * 3;
      const ref = refs.current[i];
      if (!ref) return;
      ref.position.set(x, y, -5 + Math.cos(s.angle) * 2);
      ref.rotation.z = s.angle + Math.PI / 2;
      (ref.material as THREE.MeshBasicMaterial).opacity = t * 0.9;
      ref.scale.set(m.speed * 0.04 * (0.5 + t * 0.5), 1, 1);
    });
  });

  return (
    <group>
      {METEORS.map((_, i) => (
        <mesh key={i} ref={el => { refs.current[i] = el as THREE.Mesh; }}>
          <planeGeometry args={[2, 0.15]} />
          <meshBasicMaterial map={STREAK_TEX} color="#ffffff" transparent blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
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
        geom.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
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
  { name: "FRACTAL", title: "One Sky", color: "#ffffff" },
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

// Rich colored space fill — nebula washes at the very back to replace dead black
export function SpaceFill() {
  return (
    <group>
      <mesh position={[0, 0.5, -42]}>
        <sphereGeometry args={[38, 24, 24]} />
        <meshBasicMaterial color="#2a1060" transparent opacity={0.10} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh position={[3, -1, -48]}>
        <sphereGeometry args={[32, 24, 24]} />
        <meshBasicMaterial color="#0a2060" transparent opacity={0.08} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh position={[-2, 1.5, -38]}>
        <sphereGeometry args={[34, 24, 24]} />
        <meshBasicMaterial color="#601840" transparent opacity={0.09} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh position={[-1, -0.5, -52]}>
        <sphereGeometry args={[40, 24, 24]} />
        <meshBasicMaterial color="#182858" transparent opacity={0.07} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}
