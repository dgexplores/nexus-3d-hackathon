import { snoise } from "./noise";

export const portalVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const portalFragment = /* glsl */ `
  ${snoise}

  uniform float uTime;
  uniform float uTurbulence;
  uniform float uFresnelPower;
  uniform float uEmissiveIntensity;
  uniform vec3 uColor;
  varying vec2 vUv;

  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p) * 2.0;
    float angle = atan(p.y, p.x);

    // 3D tunnel: rings recede into depth
    float depth = uTime * 0.5 + r * 2.0;
    float swirl = angle + depth * 0.3;
    float bands = pow(sin(swirl * 6.0 + uTime * 0.55) * 0.5 + 0.5, 2.0);
    float bands2 = pow(sin(swirl * 13.0 + uTime * 0.3 + 1.7) * 0.5 + 0.5, 3.0);

    // Turbulence, volumetric distortion
    float turb = snoise(vec3(p * 3.0, uTime * 0.2)) * uTurbulence;
    bands += turb * 0.3;

    // Fresnel rim, deep purple edge
    float rim = smoothstep(0.0, 0.15, r) * smoothstep(1.0, 0.4, r);
    float fresnel = pow(1.0 - r, uFresnelPower);

    vec3 color = uColor * (rim * (0.55 + bands * 0.9 + bands2 * 0.5) + fresnel * 0.8);
    color = mix(color, vec3(0.0), smoothstep(0.24, 0.0, r));

    // Accretion disk colored glow at outer edge
    float disk = smoothstep(0.9, 0.7, r) * smoothstep(1.0, 1.05, r);
    color += vec3(1.0, 0.85, 0.6) * disk * 0.5;

    float alpha = smoothstep(1.0, 0.62, r) * (1.0 - smoothstep(0.24, 0.0, r) * 0.15);
    gl_FragColor = vec4(color * uEmissiveIntensity, alpha);
  }
`;

// Approximated gravity lens shimmer, a thin ring with noise-jittered UVs.
// Not true background lensing, no render-to-texture pass exists in this scene.
export const lensFragment = /* glsl */ `
  ${snoise}

  uniform float uTime;
  uniform vec3 uColor;
  varying vec2 vUv;

  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p) * 2.0;
    vec2 distortedUv = vUv + snoise(vec3(vUv * 20.0, uTime * 0.3)) * 0.02;
    float shimmer = snoise(vec3(distortedUv * 6.0, uTime * 0.15)) * 0.5 + 0.5;

    float ring = smoothstep(0.0, 0.5, r) * smoothstep(1.0, 0.55, r);
    float alpha = ring * shimmer * 0.18;

    gl_FragColor = vec4(uColor * shimmer, alpha);
  }
`;
