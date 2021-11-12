import { useState, useMemo } from 'react'
import * as OGL from 'ogl'
import { useOGL, useFrame, Canvas } from 'react-ogl/web'

const vertex = `
  attribute vec2 uv;
  attribute vec3 position;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    
    // gl_PointSize only applicable for gl.POINTS draw mode
    gl_PointSize = 5.0;
  }
`

const fragment = `
  precision highp float;
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    gl_FragColor.rgb = 0.5 + 0.3 * sin(vUv.yxx + uTime) + vec3(0.2, 0.0, 0.1);
    gl_FragColor.a = 1.0;
  }
`

const Modes = () => {
  const { gl } = useOGL()
  const [geometry] = useState(
    () =>
      new OGL.Geometry(gl, {
        position: { size: 3, data: new Float32Array([-0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, 0.5, 0, 0.5, -0.5, 0]) },
        uv: { size: 2, data: new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]) },
        index: { data: new Uint16Array([0, 1, 2, 1, 3, 2]) },
      }),
  )
  const [program] = useState(
    () =>
      new OGL.Program(gl, {
        vertex,
        fragment,
        uniforms: {
          uTime: { value: 0 },
        },
      }),
  )

  useFrame((_, t) => (program.uniforms.uTime.value = t * 0.001))

  const modes = useMemo(
    () =>
      [
        {
          mode: gl.POINTS,
          position: [-1, 1, 0],
        },
        {
          mode: gl.LINES,
          position: [1, 1, 0],
        },
        {
          mode: gl.LINE_LOOP,
          position: [-1, -1, 0],
        },
        {
          mode: gl.TRIANGLES,
          position: [1, -1, 0],
        },
      ].map(({ mode, position }, i) => <mesh key={i} args={[{ mode, geometry, program }]} position={position} />),
    [geometry, program],
  )

  return modes
}

const DrawModes = () => (
  <Canvas camera={{ fov: 15, position: [0, 0, 15] }}>
    <Modes />
  </Canvas>
)

export default DrawModes
