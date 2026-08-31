import { snoise } from "./noise";

export const portalVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Doctor Strange multiverse-jump reference, not Interstellar's Gargantua:
// a bright kaleidoscopic vortex with no dark event-horizon core, folded into
// symmetric wedges like fractured glass, blending the current dimension's
// color into the next one it's about to arrive at.
export const portalFragment = /* glsl */ `
  ${snoise}

  uniform float uTime;
  uniform float uTurbulence;
  uniform float uFresnelPower;
  uniform float uEmissiveIntensity;
  uniform vec3 uColor;
  uniform vec3 uColorB;
  varying vec2 vUv;

  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p) * 2.0;
    float angle = atan(p.y, p.x);

    // kaleidoscope fold, mirror the angle into six symmetric wedges
    float wedge = 3.14159265 * 2.0 / 6.0;
    float folded = abs(mod(angle, wedge) - wedge * 0.5);

    float depth = uTime * 0.7 + r * 1.6;
    float swirl = folded * 3.0 + depth * 0.35 - uTime * 0.5;

    float turb = snoise(vec3(p * 2.5, uTime * 0.2)) * uTurbulence;
    float bands = sin(swirl * 4.0 + turb * 1.5) * 0.5 + 0.5;
    float bands2 = sin(swirl * 8.0 - uTime * 0.9) * 0.5 + 0.5;

    float huePhase = r * 1.4 - uTime * 0.3 + bands * 0.5;
    vec3 rainbow = mix(uColor, uColorB, 0.5 + 0.5 * sin(huePhase * 6.28318));
    vec3 banded = mix(uColor, uColorB, bands2);

    // bright all the way to the center, no dark core, only fades at the outer edge
    float rim = smoothstep(1.0, 0.3, r);
    vec3 color = mix(rainbow, banded, bands) * rim * uEmissiveIntensity;

    float spark = pow(bands * bands2, 6.0);
    color += vec3(1.0) * spark * 0.18;

    float fresnel = pow(1.0 - clamp(r, 0.0, 1.0), uFresnelPower);
    color += mix(uColor, uColorB, 0.5) * fresnel * 0.09;

    float alpha = smoothstep(1.0, 0.62, r);
    gl_FragColor = vec4(color, alpha);
  }
`;
