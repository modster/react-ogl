import { useState, useMemo, useRef } from 'react'
import * as OGL from 'ogl'
import { useOGL, useFrame, Canvas } from 'react-ogl/web'
import Controls from './components/Controls'

const Polylines = () => {
  const { gl } = useOGL()
  const [variants] = useState(() => {
    const curve = new OGL.Curve({
      points: [new OGL.Vec3(0, 0.5, 0), new OGL.Vec3(0, 1, 1), new OGL.Vec3(0, -1, 1), new OGL.Vec3(0, -0.5, 0)],
      type: OGL.Curve.CUBICBEZIER,
    })

    const points = curve.getPoints(20)
    const polyline = new OGL.Polyline(gl, {
      points,
      uniforms: {
        uColor: { value: new OGL.Color('#f00') },
        uThickness: { value: 3 },
      },
    })

    curve.type = OGL.Curve.CATMULLROM
    const points2 = curve.getPoints(20)
    const polyline2 = new OGL.Polyline(gl, {
      points: points2,
      uniforms: {
        uColor: { value: new OGL.Color('#00f') },
        uThickness: { value: 2 },
      },
    })

    curve.type = OGL.Curve.QUADRATICBEZIER
    const points3 = curve.getPoints(20)
    const polyline3 = new OGL.Polyline(gl, {
      points: points3,
      uniforms: {
        uColor: { value: new OGL.Color('#0f0') },
        uThickness: { value: 4 },
      },
    })

    return [polyline, polyline2, polyline3]
  })

  const polyLines = useMemo(
    () =>
      Array(60)
        .fill(null)
        .map((_, i) => {
          const { geometry, program } = variants[i % 3]
          return <mesh key={i} args={[{ geometry, program }]} rotation-y={(i * Math.PI) / 60} />
        }),
    [variants],
  )

  return polyLines
}

const Sphere = ({ children }) => {
  const sphere = useRef()

  useFrame(() => (sphere.current.rotation.y -= 0.01))

  return (
    <mesh ref={sphere}>
      <sphere />
      <program
        vertex={`
          attribute vec3 position;
          attribute vec3 normal;
          uniform mat3 normalMatrix;
          uniform mat4 modelViewMatrix;
          uniform mat4 projectionMatrix;

          varying vec3 vNormal;

          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragment={`
          precision highp float;
          varying vec3 vNormal;
          void main() {
            gl_FragColor.rgb = normalize(vNormal);
            gl_FragColor.a = 1.0;
          }
        `}
      />
      {children}
    </mesh>
  )
}

const Curves = () => (
  <Canvas camera={{ fov: 35, position: [0, 0, 5] }}>
    <Sphere>
      <Polylines />
    </Sphere>
    <Controls />
  </Canvas>
)

export default Curves
