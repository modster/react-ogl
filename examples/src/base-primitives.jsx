import { useRef } from 'react'
import { useFrame, Canvas } from 'react-ogl/web'
import Controls from './components/Controls'

const Material = () => (
  <program
    cullFace={null}
    vertex={`
      attribute vec3 position;
      attribute vec3 normal;
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      uniform mat3 normalMatrix;

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
        vec3 normal = normalize(vNormal);
        float lighting = dot(normal, normalize(vec3(-0.3, 0.8, 0.6)));
        gl_FragColor.rgb = vec3(0.2, 0.8, 1.0) + lighting * 0.1;
        gl_FragColor.a = 1.0;
      }
    `}
  />
)

const Scene = () => {
  const plane = useRef()
  const sphere = useRef()
  const cube = useRef()
  const cylinder = useRef()

  useFrame(() => {
    plane.current.rotation.y -= 0.02
    sphere.current.rotation.y -= 0.03
    cube.current.rotation.y -= 0.04
    cylinder.current.rotation.y -= 0.02
  })

  return (
    <>
      <mesh ref={plane} position={[0, 1.3, 0]}>
        <plane />
        <Material />
      </mesh>
      <mesh ref={sphere} position={[1.3, 0, 0]}>
        <sphere />
        <Material />
      </mesh>
      <mesh ref={cube} position={[0, -1.3, 0]}>
        <box />
        <Material />
      </mesh>
      <mesh ref={cylinder} position={[-1.3, 0, 0]}>
        <cylinder />
        <Material />
      </mesh>
    </>
  )
}

const BasePrimitives = () => (
  <Canvas camera={{ fov: 35, position: [0, 1, 7] }}>
    <Scene />
    <Controls />
  </Canvas>
)

export default BasePrimitives
