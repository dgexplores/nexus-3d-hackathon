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
  uniform float uOpacity;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    float alpha = smoothstep(0.5, 0.0, d) * vAlpha * uOpacity;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

export const wispVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uBaseRadius;
  attribute float aSeed;
  attribute float aScale;
  attribute vec3 aColor;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float angle = aSeed + uTime * 0.5;
    float radius = uBaseRadius * (0.4 + 0.5 * (0.5 + 0.5 * sin(aSeed * 3.0))) + sin(uTime * 0.7 + aSeed) * 0.6;
    float y = sin(aSeed * 1.7 + uTime * 0.3) * 2.2;

    vec3 pos = vec3(cos(angle) * radius, y, sin(angle) * radius);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aScale * uPixelRatio * (50.0 / -mvPosition.z);

    vColor = aColor;
    vAlpha = smoothstep(14.0, 3.0, length(mvPosition.xyz));
  }
`;

export const wispFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    float alpha = smoothstep(0.5, 0.0, d) * vAlpha;
    gl_FragColor = vec4(vColor * 1.6, alpha);
  }
`;

export const sparkVertex = /* glsl */ `
  uniform float uPixelRatio;
  attribute vec3 aColor;
  attribute float aAlpha;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = uPixelRatio * (40.0 / -mvPosition.z);
    vColor = aColor;
    vAlpha = aAlpha;
  }
`;

export const sparkFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    float alpha = smoothstep(0.5, 0.0, d) * vAlpha;
    gl_FragColor = vec4(vColor, alpha);
  }
`;
