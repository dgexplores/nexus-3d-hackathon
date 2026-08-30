import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  particlesFragment,
  particlesVertex,
  sparkFragment,
  sparkVertex,
  wispFragment,
  wispVertex,
} from "../shaders/particles";
import { DIMENSIONS } from "./clusters";

const DUST_COUNT = 4000;
const DUST_RADIUS = 9;

const WISP_COUNT = 700;
const WISP_BASE_RADIUS = 4.5;

const SPARK_COUNT = 180;
const SPARK_SPEED = 2.2;
const SPARK_LIFE = 2.4;

function makeDustGeometry() {
  const positions = new Float32Array(DUST_COUNT * 3);
  const scales = new Float32Array(DUST_COUNT);
  const seeds = new Float32Array(DUST_COUNT);

  for (let i = 0; i < DUST_COUNT; i++) {
    const r = DUST_RADIUS * (0.3 + Math.random() * 0.7);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    scales[i] = 0.3 + Math.random() * 0.6;
    seeds[i] = Math.random();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  return geometry;
}

function Dust() {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const geometry = useMemo(() => makeDustGeometry(), []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uColor: { value: new THREE.Color("#ffffff") },
      uOpacity: { value: 0.3 },
    }),
    [],
  );

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.015;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={particlesVertex}
        fragmentShader={particlesFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function makeWispGeometry() {
  const seeds = new Float32Array(WISP_COUNT);
  const colors = new Float32Array(WISP_COUNT * 3);
  const scales = new Float32Array(WISP_COUNT);
  const positions = new Float32Array(WISP_COUNT * 3);

  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < WISP_COUNT; i++) {
    seeds[i] = i * goldenAngle;
    const color = DIMENSIONS[i % DIMENSIONS.length].color;
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
    scales[i] = 0.5 + Math.random() * 0.8;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
  return geometry;
}

function EnergyWisps() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const geometry = useMemo(() => makeWispGeometry(), []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uBaseRadius: { value: WISP_BASE_RADIUS },
    }),
    [],
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <points geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={wispVertex}
        fragmentShader={wispFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

type Spark = { pos: THREE.Vector3; velocity: THREE.Vector3; life: number; maxLife: number; tint: THREE.Color };

function spawnSpark(spark: Spark) {
  const dim = DIMENSIONS[Math.floor(Math.random() * DIMENSIONS.length)];
  const jitter = new THREE.Vector3(
    (Math.random() - 0.5) * 0.6,
    (Math.random() - 0.5) * 0.6,
    (Math.random() - 0.5) * 0.6,
  );
  spark.pos.copy(dim.center).add(jitter);
  const toOrigin = spark.pos.clone().negate().normalize();
  spark.velocity.copy(toOrigin).multiplyScalar(SPARK_SPEED * (0.7 + Math.random() * 0.6));
  spark.maxLife = SPARK_LIFE * (0.6 + Math.random() * 0.8);
  spark.life = spark.maxLife;
  spark.tint.copy(dim.color);
}

function makeSparks(): Spark[] {
  const sparks: Spark[] = [];
  for (let i = 0; i < SPARK_COUNT; i++) {
    const spark: Spark = {
      pos: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      life: 0,
      maxLife: 1,
      tint: new THREE.Color(),
    };
    spawnSpark(spark);
    spark.life = Math.random() * spark.maxLife;
    sparks.push(spark);
  }
  return sparks;
}

function Sparks() {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const sparks = useMemo(() => makeSparks(), []);

  const uniforms = useMemo(
    () => ({ uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) } }),
    [],
  );

  const geometry = useMemo(() => {
    const positions = new Float32Array(SPARK_COUNT * 3);
    const colors = new Float32Array(SPARK_COUNT * 3);
    const alphas = new Float32Array(SPARK_COUNT);
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geom.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    return geom;
  }, []);

  useFrame((_, delta) => {
    const positionAttr = geometry.attributes.position as THREE.BufferAttribute;
    const colorAttr = geometry.attributes.aColor as THREE.BufferAttribute;
    const alphaAttr = geometry.attributes.aAlpha as THREE.BufferAttribute;

    sparks.forEach((spark, i) => {
      spark.life -= delta;
      if (spark.life <= 0 || spark.pos.lengthSq() < 0.16) {
        spawnSpark(spark);
      }
      spark.pos.addScaledVector(spark.velocity, delta);

      positionAttr.setXYZ(i, spark.pos.x, spark.pos.y, spark.pos.z);
      const fade = Math.min(1, spark.life / (spark.maxLife * 0.3));
      const tintedR = 0.7 + spark.tint.r * 0.3;
      const tintedG = 0.7 + spark.tint.g * 0.3;
      const tintedB = 0.7 + spark.tint.b * 0.3;
      colorAttr.setXYZ(i, tintedR, tintedG, tintedB);
      alphaAttr.setX(i, fade);
    });

    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    alphaAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={sparkVertex}
        fragmentShader={sparkFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export function Particles() {
  return (
    <>
      <Dust />
      <EnergyWisps />
      <Sparks />
    </>
  );
}
