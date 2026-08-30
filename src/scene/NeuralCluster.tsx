import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { synapseFragment, synapseVertex } from "../shaders/synapse";
import { DIMENSIONS, dimensionWeight } from "./clusters";
import { scrollState } from "./scrollStore";

const LINKS_PER_NODE = 2;

type Node = { pos: THREE.Vector3; cluster: number; basePos: THREE.Vector3; phase: number };

function jitterPos(center: THREE.Vector3, spread: number) {
  const dir = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
  const dist = Math.random() ** 0.5 * spread;
  return center.clone().addScaledVector(dir, dist);
}

// Each dimension builds its own node set (different counts, layouts, spreads)
// so the shared synapse system can wire whatever comes out.
function buildDimensionNodes(dim: (typeof DIMENSIONS)[number], cluster: number): Node[] {
  const nodes: Node[] = [];
  const push = (pos: THREE.Vector3) =>
    nodes.push({ pos, basePos: pos.clone(), cluster, phase: Math.random() * Math.PI * 2 });

  switch (dim.key) {
    case "glass": {
      for (let i = 0; i < 14; i++) push(jitterPos(dim.center, 0.9));
      break;
    }
    case "paint": {
      for (let i = 0; i < 13; i++) push(jitterPos(dim.center, 1.4));
      break;
    }
    case "ink": {
      for (let i = 0; i < 15; i++) {
        const x = dim.center.x + (Math.random() * 2 - 1) * 1.1;
        const z = dim.center.z + (Math.random() * 2 - 1) * 1.1;
        const y = dim.center.y + (Math.random() - 0.5) * 0.15;
        push(new THREE.Vector3(x, y, z));
      }
      break;
    }
    case "cube": {
      const step = 0.35;
      for (let i = 0; i < 14; i++) {
        const raw = jitterPos(dim.center, 1.0);
        raw.x = Math.round(raw.x / step) * step;
        raw.y = Math.round(raw.y / step) * step;
        raw.z = Math.round(raw.z / step) * step;
        push(raw);
      }
      break;
    }
    case "mirror": {
      const base: THREE.Vector3[] = [];
      for (let i = 0; i < 7; i++) {
        const dir = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
        const dist = Math.random() ** 0.5 * 0.85;
        base.push(dir.multiplyScalar(dist));
      }
      base.forEach((offset) => {
        push(dim.center.clone().add(offset));
        push(dim.center.clone().add(new THREE.Vector3(-offset.x, offset.y, offset.z)));
        push(dim.center.clone().add(new THREE.Vector3(offset.x, offset.y, -offset.z)));
        push(dim.center.clone().add(new THREE.Vector3(-offset.x, offset.y, -offset.z)));
      });
      break;
    }
    case "debris": {
      for (let i = 0; i < 13; i++) push(jitterPos(dim.center, 1.8));
      break;
    }
    case "fractal": {
      for (let i = 0; i < 14; i++) push(jitterPos(dim.center, 1.1));
      break;
    }
    default: {
      for (let i = 0; i < 14; i++) push(jitterPos(dim.center, 1.25));
    }
  }
  return nodes;
}

function buildLines(nodes: Node[]) {
  const positions: number[] = [];
  const progress: number[] = [];
  const phase: number[] = [];
  const colors: number[] = [];

  const pushSegment = (a: THREE.Vector3, b: THREE.Vector3, color: THREE.Color) => {
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    progress.push(0, 1);
    const p = Math.random() * Math.PI * 2;
    phase.push(p, p);
    colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
  };

  // intra-cluster synapses: each node links to a couple of nearby cluster-mates
  DIMENSIONS.forEach((dim, cluster) => {
    const members = nodes.filter((n) => n.cluster === cluster);
    members.forEach((node) => {
      for (let l = 0; l < LINKS_PER_NODE; l++) {
        const other = members[Math.floor(Math.random() * members.length)];
        if (other !== node) pushSegment(node.basePos, other.basePos, dim.color);
      }
    });
  });

  // long tethers: every cluster stays wired to the shared wormhole at the origin
  DIMENSIONS.forEach((dim) => {
    const anchor = dim.center.clone().normalize().multiplyScalar(1.6);
    pushSegment(dim.center, anchor, dim.color);
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("aProgress", new THREE.Float32BufferAttribute(progress, 1));
  geometry.setAttribute("aPhase", new THREE.Float32BufferAttribute(phase, 1));
  geometry.setAttribute("aColor", new THREE.Float32BufferAttribute(colors, 3));
  return geometry;
}

function useFocusWeight(index: number) {
  const ref = useRef(0.15);
  useFrame(() => {
    const target = dimensionWeight(scrollState.current, index);
    ref.current = target;
  });
  return ref;
}

function useColorSetup(
  nodes: Node[],
  color: THREE.Color,
  meshRef: React.RefObject<THREE.InstancedMesh | null>,
  haloRef?: React.RefObject<THREE.InstancedMesh | null>,
) {
  useEffect(() => {
    if (!meshRef.current) return;
    nodes.forEach((_, i) => {
      meshRef.current!.setColorAt(i, color);
      haloRef?.current?.setColorAt(i, color);
    });
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    if (haloRef?.current?.instanceColor) haloRef.current.instanceColor.needsUpdate = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes]);
}

type ClusterProps = { index: number; nodes: Node[] };

function GlassCluster({ index, nodes }: ClusterProps) {
  const dim = DIMENSIONS[index];
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const weight = useFocusWeight(index);
  useColorSetup(nodes, dim.color, meshRef);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const w = weight.current;
    const scale = THREE.MathUtils.lerp(0.6, 1, w);
    if (materialRef.current) materialRef.current.opacity = THREE.MathUtils.lerp(0.15, 1, w);
    if (!meshRef.current) return;
    nodes.forEach((node, i) => {
      dummy.position.copy(node.basePos);
      dummy.rotation.set(t * 0.2 + node.phase, t * 0.15 + node.phase, 0);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, nodes.length]}>
      <icosahedronGeometry args={[0.07, 0]} />
      <meshStandardMaterial
        ref={materialRef}
        color="#ffffff"
        metalness={0.9}
        roughness={0.05}
        transparent
      />
    </instancedMesh>
  );
}

function PaintCluster({ index, nodes }: ClusterProps) {
  const dim = DIMENSIONS[index];
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const weight = useFocusWeight(index);
  useColorSetup(nodes, dim.color, meshRef);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const w = weight.current;
    const scaleMul = THREE.MathUtils.lerp(0.6, 1, w);
    if (materialRef.current) materialRef.current.opacity = THREE.MathUtils.lerp(0.15, 1, w);
    if (!meshRef.current) return;
    nodes.forEach((node, i) => {
      dummy.position.copy(node.basePos);
      dummy.position.y += Math.sin(t * 0.5 + node.phase) * 0.16;
      dummy.position.x += Math.cos(t * 0.4 + node.phase) * 0.1;
      const breathe = 1 + Math.sin(t * 0.6 + node.phase) * 0.4;
      dummy.scale.setScalar(breathe * scaleMul);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, nodes.length]}>
      <sphereGeometry args={[0.09, 12, 12]} />
      <meshStandardMaterial
        ref={materialRef}
        color="#ffffff"
        metalness={0.05}
        roughness={0.85}
        transparent
      />
    </instancedMesh>
  );
}

function InkCluster({ index, nodes }: ClusterProps) {
  const dim = DIMENSIONS[index];
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const weight = useFocusWeight(index);
  useColorSetup(nodes, dim.color, meshRef);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const w = weight.current;
    const scale = THREE.MathUtils.lerp(0.6, 1, w);
    if (materialRef.current) materialRef.current.opacity = THREE.MathUtils.lerp(0.15, 1, w);
    if (!meshRef.current) return;
    nodes.forEach((node, i) => {
      dummy.position.copy(node.basePos);
      dummy.rotation.y = Math.sin(t * 0.1 + node.phase) * 0.05;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, nodes.length]}>
      <boxGeometry args={[0.1, 0.012, 0.1]} />
      <meshStandardMaterial ref={materialRef} color="#f4f2ff" roughness={1} metalness={0} transparent />
    </instancedMesh>
  );
}

function CubeCluster({ index, nodes }: ClusterProps) {
  const dim = DIMENSIONS[index];
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const weight = useFocusWeight(index);
  useColorSetup(nodes, dim.color, meshRef);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const w = weight.current;
    const scaleMul = THREE.MathUtils.lerp(0.6, 1, w);
    if (materialRef.current) materialRef.current.opacity = THREE.MathUtils.lerp(0.15, 1, w);
    if (!meshRef.current) return;
    nodes.forEach((node, i) => {
      dummy.position.copy(node.basePos);
      const step = Math.floor(Math.sin(t * 2 + node.phase) * 2);
      const s = (1 + step * 0.15) * scaleMul;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, nodes.length]}>
      <boxGeometry args={[0.09, 0.09, 0.09]} />
      <meshStandardMaterial ref={materialRef} color="#ffffff" metalness={0.4} roughness={0.3} transparent />
    </instancedMesh>
  );
}

function MirrorCluster({ index, nodes }: ClusterProps) {
  const dim = DIMENSIONS[index];
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const weight = useFocusWeight(index);
  useColorSetup(nodes, dim.color, meshRef);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const w = weight.current;
    const scale = THREE.MathUtils.lerp(0.6, 1, w);
    if (materialRef.current) materialRef.current.opacity = THREE.MathUtils.lerp(0.15, 1, w);
    if (!meshRef.current) return;
    nodes.forEach((node, i) => {
      dummy.position.copy(node.basePos);
      // reflected copies (odd index within each group of 4) spin the opposite way
      const dir = i % 4 === 0 ? 1 : -1;
      dummy.rotation.set(t * 0.9 * dir + node.phase, t * 0.7 * dir + node.phase, 0);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, nodes.length]}>
      <icosahedronGeometry args={[0.05, 1]} />
      <meshStandardMaterial ref={materialRef} color="#ffffff" metalness={0.7} roughness={0.15} transparent />
    </instancedMesh>
  );
}

type DebrisNode = Node & { axis: THREE.Vector3; speed: number; drift: THREE.Vector3 };

function DebrisCluster({ index, nodes: baseNodes }: ClusterProps) {
  const dim = DIMENSIONS[index];
  const nodes = useMemo(() => {
    return baseNodes.map((n) => ({
      ...n,
      axis: new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize(),
      speed: 0.3 + Math.random() * 0.6,
      drift: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.05),
    })) as DebrisNode[];
  }, [baseNodes]);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const dummies = useMemo(() => nodes.map(() => new THREE.Object3D()), [nodes]);
  const weight = useFocusWeight(index);
  useColorSetup(nodes, dim.color, meshRef);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const w = weight.current;
    const scale = THREE.MathUtils.lerp(0.6, 1, w);
    if (materialRef.current) materialRef.current.opacity = THREE.MathUtils.lerp(0.15, 1, w);
    if (!meshRef.current) return;
    nodes.forEach((node, i) => {
      const dummy = dummies[i];
      dummy.position.copy(node.basePos).addScaledVector(node.drift, Math.sin(t * 0.2 + node.phase));
      dummy.rotateOnAxis(node.axis, node.speed * delta);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, nodes.length]}>
      <tetrahedronGeometry args={[0.08, 0]} />
      <meshStandardMaterial ref={materialRef} color="#ffffff" metalness={0.3} roughness={0.6} transparent />
    </instancedMesh>
  );
}

const FRACTAL_HALO_RADII = [0.1, 0.15, 0.2];

function FractalCluster({ index, nodes }: ClusterProps) {
  const dim = DIMENSIONS[index];
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const haloRefs = [useRef<THREE.InstancedMesh>(null), useRef<THREE.InstancedMesh>(null), useRef<THREE.InstancedMesh>(null)];
  const haloMatRefs = [
    useRef<THREE.MeshBasicMaterial>(null),
    useRef<THREE.MeshBasicMaterial>(null),
    useRef<THREE.MeshBasicMaterial>(null),
  ];
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const weight = useFocusWeight(index);
  useColorSetup(nodes, dim.color, meshRef, haloRefs[0]);
  useColorSetup(nodes, dim.color, meshRef, haloRefs[1]);
  useColorSetup(nodes, dim.color, meshRef, haloRefs[2]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const w = weight.current;
    const scale = THREE.MathUtils.lerp(0.6, 1, w);
    if (materialRef.current) materialRef.current.opacity = THREE.MathUtils.lerp(0.15, 1, w);
    haloMatRefs.forEach((ref, ringIdx) => {
      if (ref.current) ref.current.opacity = THREE.MathUtils.lerp(0.05, 0.35 - ringIdx * 0.1, w);
    });
    if (!meshRef.current) return;
    nodes.forEach((node, i) => {
      dummy.position.copy(node.basePos);
      dummy.rotation.set(t * 0.15, t * 0.1, 0);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      haloRefs.forEach((ref) => ref.current?.setMatrixAt(i, dummy.matrix));
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    haloRefs.forEach((ref) => {
      if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
    });
  });

  return (
    <>
      <instancedMesh ref={meshRef} args={[undefined, undefined, nodes.length]}>
        <dodecahedronGeometry args={[0.07, 1]} />
        <meshStandardMaterial ref={materialRef} color="#ffffff" emissive="#404040" emissiveIntensity={0.6} roughness={0.2} metalness={0.6} transparent />
      </instancedMesh>
      {FRACTAL_HALO_RADII.map((r, i) => (
        <instancedMesh key={r} ref={haloRefs[i]} args={[undefined, undefined, nodes.length]}>
          <torusGeometry args={[r, 0.008, 8, 32]} />
          <meshBasicMaterial
            ref={haloMatRefs[i]}
            transparent
            opacity={0.2}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </instancedMesh>
      ))}
    </>
  );
}

const CLUSTER_BY_KEY: Record<string, (props: ClusterProps) => React.ReactElement> = {
  glass: GlassCluster,
  paint: PaintCluster,
  ink: InkCluster,
  cube: CubeCluster,
  mirror: MirrorCluster,
  debris: DebrisCluster,
  fractal: FractalCluster,
};

export function NeuralCluster() {
  const perClusterNodes = useMemo(
    () => DIMENSIONS.map((dim, index) => buildDimensionNodes(dim, index)),
    [],
  );
  const allNodes = useMemo(() => perClusterNodes.flat(), [perClusterNodes]);
  const lineGeometry = useMemo(() => buildLines(allNodes), [allNodes]);
  const lineMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const synapseUniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame((state) => {
    if (lineMaterialRef.current) lineMaterialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
  });

  return (
    <>
      {DIMENSIONS.map((dim, index) => {
        const Cluster = CLUSTER_BY_KEY[dim.key];
        return Cluster ? <Cluster key={dim.id} index={index} nodes={perClusterNodes[index]} /> : null;
      })}
      <lineSegments geometry={lineGeometry}>
        <shaderMaterial
          ref={lineMaterialRef}
          vertexShader={synapseVertex}
          fragmentShader={synapseFragment}
          uniforms={synapseUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </>
  );
}
