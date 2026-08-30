export const synapseVertex = /* glsl */ `
  attribute float aProgress;
  attribute float aPhase;
  attribute vec3 aColor;

  varying float vProgress;
  varying float vPhase;
  varying vec3 vColor;

  void main() {
    vProgress = aProgress;
    vPhase = aPhase;
    vColor = aColor;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const synapseFragment = /* glsl */ `
  uniform float uTime;
  varying float vProgress;
  varying float vPhase;
  varying vec3 vColor;

  void main() {
    float wave = sin(vProgress * 6.2831853 * 1.5 - uTime * 3.0 + vPhase * 6.2831853) * 0.5 + 0.5;
    float core = pow(wave, 8.0);
    float aura = pow(wave, 2.0);
    vec3 color = vColor * (aura + core * 2.0);
    float alpha = 0.2 + core * 0.8 + aura * 0.3;
    gl_FragColor = vec4(color, alpha);
  }
`;
