import { useState } from 'react'
import * as OGL from 'ogl'
import { useOGL, Canvas } from 'react-ogl/web'
import Controls from './components/Controls'

const Plane = () => {
  const { gl } = useOGL()
  const [texture] = useState(() =>
    OGL.TextureLoader.load(gl, {
      src: {
        s3tc: 'assets/compressed/s3tc-m-y.ktx',
        etc: 'assets/compressed/etc-m-y.ktx',
        pvrtc: 'assets/compressed/pvrtc-m-y.ktx',
        jpg: 'assets/compressed/uv.jpg',
      },
      wrapS: gl.REPEAT,
      wrapT: gl.REPEAT,
    }),
  )

  return (
    <mesh>
      <plane />
      <program
        vertex={`
          attribute vec2 uv;
          attribute vec3 position;
          uniform mat4 modelViewMatrix;
          uniform mat4 projectionMatrix;

          varying vec2 vUv;

          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragment={`
          precision highp float;
          uniform sampler2D tMap;

          varying vec2 vUv;

          void main() {
            gl_FragColor = texture2D(tMap, vUv * 2.0);
          }
        `}
        cullFace={null}
        uniforms={{
          tMap: { value: texture },
        }}
      />
    </mesh>
  )
}

const CompressedTextures = () => (
  <Canvas camera={{ fov: 45, position: [-1, 0.5, 2] }}>
    <Plane />
    <Controls />
  </Canvas>
)

export default CompressedTextures
