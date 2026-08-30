import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { synapseFragment, synapseVertex } from "../shaders/synapse";
import { CLUSTER_CENTERS, CLUSTER_COLORS } from "./clusters";

const NODES_PER_CLUSTER = 14;
const SPREAD = 1.25;
const LINKS_PER_NODE = 2;

type Node = { pos: THREE.Vector3; cluster: number; basePos: THREE.Vector3; phase: number };

function buildNodes(): Node[] {
  const nodes: Node[] = [];
  CLUSTER_CENTERS.forEach((center, cluster) => {
    for (let i = 0; i < NODES_PER_CLUSTER; i++) {
      const dir = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
      ).normalize();
      const dist = Math.random() ** 0.5 * SPREAD;
      const pos = center.clone().addScaledVector(dir, dist);
      nodes.push({ pos, basePos: pos.clone(), cluster, phase: Math.random() * Math.PI * 2 });
    }
  });
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
  CLUSTER_CENTERS.forEach((_, cluster) => {
    const members = nodes.filter((n) => n.cluster === cluster);
    members.forEach((node) => {
      for (let l = 0; l < LINKS_PER_NODE; l++) {
        const other = members[Math.floor(Math.random() * members.length)];
        if (other !== node) pushSegment(node.basePos, other.basePos, CLUSTER_COLORS[cluster]);
      }
    });
  });

  // long tethers: every cluster stays wired to the shared wormhole at the origin
  CLUSTER_CENTERS.forEach((center, cluster) => {
    const anchor = center.clone().normalize().multiplyScalar(1.6);
    pushSegment(center, anchor, CLUSTER_COLORS[cluster]);
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("aProgress", new THREE.Float32BufferAttribute(progress, 1));
  geometry.setAttribute("aPhase", new THREE.Float32BufferAttribute(phase, 1));
  geometry.setAttribute("aColor", new THREE.Float32BufferAttribute(colors, 3));
  return geometry;
}

export function NeuralCluster() {
  const nodes = useMemo(() => buildNodes(), []);
  const lineGeometry = useMemo(() => buildLines(nodes), [nodes]);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const lineMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const synapseUniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useEffect(() => {
    if (!meshRef.current) return;
    nodes.forEach((node, i) => {
      meshRef.current!.setColorAt(i, CLUSTER_COLORS[node.cluster]);
    });
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [nodes]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (lineMaterialRef.current) lineMaterialRef.current.uniforms.uTime.value = t;

    if (meshRef.current) {
      nodes.forEach((node, i) => {
        dummy.position.copy(node.basePos);
        dummy.position.y += Math.sin(t * 0.8 + node.phase) * 0.06;
        dummy.position.x += Math.cos(t * 0.6 + node.phase) * 0.04;
        const s = 1 + Math.sin(t * 1.6 + node.phase) * 0.25;
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <instancedMesh ref={meshRef} args={[undefined, undefined, nodes.length]}>
        <icosahedronGeometry args={[0.05, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
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
