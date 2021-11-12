import { Suspense } from 'react'
import * as OGL from 'ogl'
import { useOGL, Canvas } from 'react-ogl/web'
import { suspend } from 'suspend-react'
import Controls from './components/Controls'

const vertex = `#version 300 es
  #define attribute in
  #define varying out

  attribute vec3 position;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  varying vec4 vMVPos;
  void main() {
    vMVPos = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * vMVPos;
  }
`

const fragment = `#version 300 es
  precision highp float;
  #define varying in
  #define texture2D texture
  #define gl_FragColor FragColor
  out vec4 FragColor;

  uniform sampler2D tMap;
  varying vec4 vMVPos;
  vec3 normals(vec3 pos) {
    vec3 fdx = dFdx(pos);
    vec3 fdy = dFdy(pos);
    return normalize(cross(fdx, fdy));
  }
  vec2 matcap(vec3 eye, vec3 normal) {
    vec3 reflected = reflect(eye, normal);
    float m = 2.8284271247461903 * sqrt(reflected.z + 1.0);
    return reflected.xy / m + 0.5;
  }
  void main() {
    vec3 normal = normals(vMVPos.xyz);
    // We're using the matcap to add some shininess to the model
    float mat = texture2D(tMap, matcap(normalize(vMVPos.xyz), normal)).g;
    
    gl_FragColor.rgb = normal + mat;
    gl_FragColor.a = 1.0;
  }
`

const Model = ({ modelUrl, matcapUrl }) => {
  const { gl } = useOGL()
  const texture = suspend(
    async (src) => {
      const image = await new Promise((resolve) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.src = src
      })

      return new OGL.Texture(gl, { image })
    },
    [matcapUrl],
  )
  const position = suspend(
    async (url) => {
      const data = await fetch(url).then((res) => res.json())
      return { size: 3, data: new Float32Array(data.position) }
    },
    [modelUrl],
  )

  return (
    <mesh>
      <program
        vertex={vertex}
        fragment={fragment}
        uniforms={{
          tMap: { value: texture },
        }}
        cullFace={null}
      />
      <geometry position={position} />
    </mesh>
  )
}

const FlatShadingMatcap = () => (
  <Canvas>
    <Suspense fallback={null}>
      <Model modelUrl="assets/octopus.json" matcapUrl="assets/matcap.jpg" />
    </Suspense>
    <Controls />
  </Canvas>
)

export default FlatShadingMatcap
