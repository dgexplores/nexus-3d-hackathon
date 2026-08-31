export const planetAtmVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldPos;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`

export const planetAtmFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uRimColor;
  uniform float uOpacity;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float NdotV = max(dot(vNormal, vViewDir), 0.0);
    float fresnel = pow(1.0 - NdotV, 2.5);
    float glow = pow(1.0 - NdotV, 5.0);
    vec3 base = uColor;
    vec3 rim = mix(uColor, uRimColor, fresnel);
    vec3 finalColor = mix(base, rim, fresnel * 0.6 + glow * 0.4);
    float pulse = 0.92 + sin(uTime * 1.3) * 0.08;
    float alpha = (fresnel * 0.55 + glow * 0.35) * uOpacity * pulse;
    gl_FragColor = vec4(finalColor, alpha);
  }
`

export const planetCloudVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec2 vUv;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    vUv = uv;
    gl_Position = projectionMatrix * mvPosition;
  }
`

export const planetCloudFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec2 vUv;
  void main() {
    float n = sin(vUv.x * 12.0 + uTime * 0.1) * sin(vUv.y * 10.0 + uTime * 0.08) * 0.5 + 0.5;
    float n2 = sin(vUv.x * 20.0 - uTime * 0.06) * sin(vUv.y * 16.0 + uTime * 0.05) * 0.5 + 0.5;
    float cloud = pow(n * n2, 2.5);
    float fresnel = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 3.0);
    vec3 color = uColor * (0.6 + cloud * 0.4);
    float alpha = cloud * fresnel * uOpacity * 0.35;
    gl_FragColor = vec4(color, alpha);
  }
`
