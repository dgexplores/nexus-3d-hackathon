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
    float wave = sin(vProgress * 6.2831853 * 1.5 - uTime * 2.6 + vPhase * 6.2831853) * 0.5 + 0.5;
    float pulse = pow(wave, 5.0);
    float glow = 0.1 + pulse * 1.5;
    gl_FragColor = vec4(vColor * glow, 0.3 + pulse * 0.7);
  }
`;
