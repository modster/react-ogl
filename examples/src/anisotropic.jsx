import { useRef, useEffect, Suspense } from 'react'
import * as OGL from 'ogl'
import { useOGL, Canvas } from 'react-ogl/web'
import { suspend } from 'suspend-react'

const Plane = ({ imgSrc }) => {
  const program = useRef()
  const { gl } = useOGL()
  const [texture, textureAnisotropy] = suspend(
    async (src) => {
      // Load image
      const image = await new Promise((resolve) => {
        const img = new Image()
        img.src = src
        img.onload = () => resolve(img)
      })

      // Create textures, one with anisotropy
      const texture = new OGL.Texture(gl, { image })
      const textureAnisotropy = new OGL.Texture(gl, { image, anisotropy: 16 })

      return [texture, textureAnisotropy]
    },
    [imgSrc],
  )

  useEffect(() => {
    const onPointerMove = (event) => {
      program.current.uniforms.fSlide.value = event.clientX / gl.canvas.width
    }
    gl.canvas.addEventListener('pointermove', onPointerMove, { passive: true })

    return () => {
      gl.canvas.removeEventListener('pointermove', onPointerMove)
    }
  }, [gl.canvas])

  return (
    <mesh scale={[1, 2, 1]} rotation={[-1.5, 0, 0]}>
      <plane />
      <program
        ref={program}
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
          uniform sampler2D tMapA;
          uniform float fSlide;
          
          varying vec2 vUv;

          void main() {
            vec3 tex = texture2D(tMap, vUv).rgb;
            vec3 texA = texture2D(tMapA, vUv).rgb;
            
            gl_FragColor.rgb = mix(tex, texA, step(fSlide, vUv.x)) + 0.1;
            gl_FragColor.a = 1.0;
          }
        `}
        uniforms={{
          tMap: { value: texture },
          tMapA: { value: textureAnisotropy },
          fSlide: { value: 0.5 },
        }}
      />
    </mesh>
  )
}

const Anisotropic = () => (
  <Canvas camera={{ position: [0, 0, 1] }}>
    <Suspense fallback={null}>
      <Plane imgSrc="assets/grid.jpg" />
    </Suspense>
  </Canvas>
)

export default Anisotropic
