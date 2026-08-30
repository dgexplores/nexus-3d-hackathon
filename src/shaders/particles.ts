import { snoise } from "./noise";

export const particlesVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aScale;
  attribute float aSeed;

  varying float vAlpha;

  ${snoise}

  void main() {
    vec3 pos = position;
    float t = uTime * 0.05;
    float n = snoise(pos * 0.4 + t + aSeed);
    pos += normalize(pos) * n * 0.4;
    pos.y += sin(t * 2.0 + aSeed * 6.2831) * 0.15;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aScale * uPixelRatio * (60.0 / -mvPosition.z);
    vAlpha = smoothstep(9.0, 2.0, length(mvPosition.xyz)) * 0.9 + 0.1;
  }
`;

export const particlesFragment = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    float alpha = smoothstep(0.5, 0.0, d) * vAlpha;
    gl_FragColor = vec4(uColor, alpha);
  }
`;
