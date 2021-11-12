import { Suspense } from 'react'
import * as OGL from 'ogl'
import { useOGL, Canvas } from 'react-ogl/web'
import { suspend } from 'suspend-react'
import Controls from './components/Controls'

const SKYBOX_IMAGES = [
  'assets/cube/posx.jpg',
  'assets/cube/negx.jpg',
  'assets/cube/posy.jpg',
  'assets/cube/negy.jpg',
  'assets/cube/posz.jpg',
  'assets/cube/negz.jpg',
]

const Skybox = (props) => {
  const { gl } = useOGL()
  const texture = suspend(async () => {
    // Load images
    const images = await Promise.all(
      SKYBOX_IMAGES.map(
        async (src) =>
          new Promise((res) => {
            const img = new Image()
            img.onload = () => res(img)
            img.src = src
          }),
      ),
    )

    // Create cube texture
    const texture = new OGL.Texture(gl, {
      target: gl.TEXTURE_CUBE_MAP,
      image: images,
    })

    return texture
  }, [])

  return (
    <mesh {...props}>
      <box />
      <program
        vertex={`
          attribute vec3 position;
          uniform mat4 modelViewMatrix;
          uniform mat4 projectionMatrix;
          varying vec3 vDir;

          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragment={`
          precision highp float;

          // uniform type is samplerCube rather than sampler2D
          uniform samplerCube tMap;
          varying vec3 vDir;

          void main() {
            // sample function is textureCube rather than texture2D
            vec3 tex = textureCube(tMap, vDir).rgb;
            
            gl_FragColor.rgb = tex;
            gl_FragColor.a = 1.0;
          }
        `}
        uniforms={{
          tMap: { value: texture },
        }}
        cullFace={null}
      />
    </mesh>
  )
}

const CubeMap = () => (
  <Canvas camera={{ fov: 45, position: [-2, 1, -3] }}>
    <Suspense fallback={null}>
      <Skybox scale={20} />
      <Skybox />
    </Suspense>
    <Controls />
  </Canvas>
)

export default CubeMap
