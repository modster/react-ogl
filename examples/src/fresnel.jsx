import { useRef } from 'react'
import * as OGL from 'ogl'
import { useFrame, Canvas } from 'react-ogl/web'
import Controls from './components/Controls'

const params = {
  backgroundColor: new OGL.Color('#B6D8F2'),
  baseColor: new OGL.Color('#B6D8F2'),
  fresnelColor: new OGL.Color('#F7F6CF'),
  fresnelFactor: 1.5,
}

const vertex = `
  attribute vec3 position;
  attribute vec3 normal;
  uniform mat4 modelMatrix;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform vec3 cameraPosition;
  varying vec3 vWorldNormal;
  varying vec3 vViewDirection;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldNormal = normalize(modelMatrix * vec4(normal, 0.0)).xyz;
    vViewDirection = normalize(cameraPosition - worldPosition.xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragment = `
  precision highp float;
  uniform vec3 uBaseColor;
  uniform vec3 uFresnelColor;
  uniform float uFresnelPower;
  varying vec3 vWorldNormal;
  varying vec3 vViewDirection;

  void main() {
    float fresnelFactor = abs(dot(vViewDirection, vWorldNormal));
    float inversefresnelFactor = 1.0 - fresnelFactor;
    // Shaping function
    fresnelFactor = pow(fresnelFactor, uFresnelPower);
    inversefresnelFactor = pow(inversefresnelFactor, uFresnelPower);
    gl_FragColor = vec4(fresnelFactor * uBaseColor + inversefresnelFactor * uFresnelColor, 1.0);
  }
`

const Torus = () => {
  const torus = useRef()

  useFrame(() => (torus.current.rotation.x += 0.01))

  return (
    <mesh ref={torus}>
      <program
        vertex={vertex}
        fragment={fragment}
        uniforms={{
          uBaseColor: { value: params.baseColor },
          uFresnelColor: { value: params.fresnelColor },
          uFresnelPower: { value: params.fresnelFactor },
        }}
      />
      <torus args={[{ radius: 1, tube: 0.4, radialSegments: 32, tubularSegments: 64 }]} />
    </mesh>
  )
}

const Fresnel = () => (
  <Canvas
    camera={{ fov: 35, position: [0, 1, 7] }}
    onCreated={({ gl }) => {
      gl.clearColor(...params.backgroundColor, 1)
    }}
  >
    <Torus />
    <Controls />
  </Canvas>
)

export default Fresnel
