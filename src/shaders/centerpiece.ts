import { snoise } from "./noise";

// One shared shader powering each dimension's signature centerpiece shape,
// so every dimension has real visual weight instead of only a scatter of
// small nodes. Parameterized per dimension via uniforms rather than one
// bespoke shader per shape.
export const centerpieceVertex = /* glsl */ `
  ${snoise}

  uniform float uTime;
  uniform float uAmp;
  uniform float uFreq;

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vDisplacement;

  void main() {
    float n = snoise(position * uFreq + vec3(0.0, 0.0, uTime * 0.08));
    float displacement = n * uAmp;
    vec3 newPosition = position + normal * displacement;
    vDisplacement = displacement;
    vNormal = normalize(normalMatrix * normal);

    vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const centerpieceFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uColorB;
  uniform float uFresnelPower;
  uniform float uOpacity;

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vDisplacement;

  void main() {
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - clamp(dot(vNormal, viewDir), 0.0, 1.0), uFresnelPower);

    vec3 base = mix(uColor, uColorB, clamp(vDisplacement * 0.5 + 0.5, 0.0, 1.0));
    vec3 glow = base + vec3(0.3) * fresnel;
    float core = 0.55 + vDisplacement * 0.4;

    vec3 color = mix(base * core, glow, fresnel);
    gl_FragColor = vec4(color, uOpacity);
  }
`;
