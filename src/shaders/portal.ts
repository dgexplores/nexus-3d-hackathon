export const portalVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const portalFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  varying vec2 vUv;

  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p) * 2.0;
    float angle = atan(p.y, p.x);

    float swirl = angle + uTime * 0.55 - r * 4.2;
    float bands = pow(sin(swirl * 6.0) * 0.5 + 0.5, 2.0);
    float bands2 = pow(sin(swirl * 13.0 + 1.7) * 0.5 + 0.5, 3.0);

    float core = smoothstep(0.24, 0.0, r);
    float rim = smoothstep(1.0, 0.5, r) * smoothstep(0.16, 0.42, r);

    vec3 color = uColor * (rim * (0.55 + bands * 0.9 + bands2 * 0.5));
    color = mix(color, vec3(0.0), core);

    float alpha = smoothstep(1.0, 0.62, r) * (1.0 - core * 0.15);
    gl_FragColor = vec4(color, alpha);
  }
`;
