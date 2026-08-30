import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { useTexture } from "@react-three/drei"
import * as THREE from "three"
import { scrollState } from "./scrollStore"
import { dimensionWeight } from "./clusters"

// free textures from your refs: blue dense galaxy + pink-purple nebula
// placed far behind to fill screen like your images, 8K feel, no extra fetch beyond public folder

export function ImagePlanes() {
  const blue = useTexture("/blue-galaxy.jpg")
  const pink = useTexture("/pink-nebula.png")
  const refBlue = useRef<THREE.Mesh>(null)
  const refPink = useRef<THREE.Mesh>(null)

  // fix color space
  blue.colorSpace = THREE.SRGBColorSpace
  pink.colorSpace = THREE.SRGBColorSpace
  blue.wrapS = blue.wrapT = THREE.ClampToEdgeWrapping
  pink.wrapS = pink.wrapT = THREE.ClampToEdgeWrapping

  useFrame(() => {
    // cross-fade based on scroll: early = blue dense (your Image1), later = pink nebula (Image2)
    const blueW = 1 - dimensionWeight(scrollState.current, 6) * 0.6
    const pinkW = dimensionWeight(scrollState.current, 6) * 0.7 + dimensionWeight(scrollState.current, 1) * 0.5 + 0.25
    if (refBlue.current) (refBlue.current.material as THREE.MeshBasicMaterial).opacity = 0.42 * blueW
    if (refPink.current) (refPink.current.material as THREE.MeshBasicMaterial).opacity = 0.38 * pinkW
  })

  return (
    <>
      {/* Image 1 — dense blue elliptical galaxy, like your blue glitter galaxy */}
      <mesh ref={refBlue} position={[0, 0.5, -32]} scale={[42, 26, 1]} rotation={[0, 0, -0.08]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={blue} transparent opacity={0.42} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {/* Image 2 — vibrant purple-pink nebula with wisps, like your pink nebula */}
      <mesh ref={refPink} position={[2, -1, -28]} scale={[38, 22, 1]} rotation={[0, 0, 0.06]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={pink} transparent opacity={0.38} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </>
  )
}
