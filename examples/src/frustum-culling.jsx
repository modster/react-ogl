import { memo, Suspense, useEffect, useRef } from 'react'
import * as OGL from 'ogl'
import { useOGL, useFrame, Canvas } from 'react-ogl/web'
import { suspend } from 'suspend-react'
import Controls from './components/Controls'

// Create random positions
const size = 20
const num = size * size

const tempVec = new OGL.Vec3()

const positions = new Array(num).fill(null).map((_, i) => {
  const position = tempVec.set(((i % size) - size * 0.5) * 2, 0, (Math.floor(i / size) - size * 0.5) * 2)
  position.y += Math.sin(position.x * 0.5) * Math.sin(position.z * 0.5) * 0.5

  return position.toArray()
})

const vertex = `
  attribute vec2 uv;
  attribute vec3 position;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  varying vec2 vUv;
  varying vec4 vMVPos;
  varying vec3 vPos;

  void main() {
    vUv = uv;
    vPos = position;
    vMVPos = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * vMVPos;
  }
`

const fragment = `
  precision highp float;
  uniform sampler2D tMap;
  varying vec2 vUv;
  varying vec4 vMVPos;
  varying vec3 vPos;

  void main() {
    vec3 tex = texture2D(tMap, vUv).rgb;
    
    float dist = length(vMVPos);
    float fog = smoothstep(2.0, 15.0, dist);
    tex = mix(tex, vec3(1), fog * 0.8);
    tex = mix(tex, vec3(1), smoothstep(1.0, 0.0, vPos.y)); 
    
    gl_FragColor.rgb = tex;
    gl_FragColor.a = 1.0;
  }
`

const Model = memo(({ modelUrl, textureUrl }) => {
  const { gl } = useOGL()
  const program = suspend(
    async (src) => {
      const image = await new Promise((resolve) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.src = src
      })

      return new OGL.Program(gl, {
        vertex,
        fragment,
        uniforms: {
          tMap: { value: new OGL.Texture(gl, { image }) },
        },
      })
    },
    [textureUrl],
  )
  const geometry = suspend(
    async (url) => {
      const data = await fetch(url).then((res) => res.json())

      return new OGL.Geometry(gl, {
        position: { size: 3, data: new Float32Array(data.position) },
        uv: { size: 2, data: new Float32Array(data.uv) },
      })
    },
    [modelUrl],
  )

  return positions.map((position, i) => (
    <mesh
      key={i}
      program={program}
      geometry={geometry}
      position={position}
      rotation-y={Math.random() * Math.PI * 2}
      scale={0.8 + Math.random() * 0.3}
    />
  ))
})

const cullTarget = new OGL.Vec3()

const CullCamera = () => {
  const cullCamera = useRef()
  const cullMesh = useRef()
  const { scene } = useOGL()

  useEffect(() => {
    cullMesh.current.rotation.reorder('XYZ')
    cullMesh.current.rotation.x = -Math.PI / 2
    cullMesh.current.rotation.y = Math.PI / 4
  }, [])

  const cameraPath = (vec, time, y) => {
    const x = 4 * Math.sin(time)
    const z = 2 * Math.sin(time * 2)
    vec.set(x, y, z)
  }

  useFrame((_, t) => {
    // Move camera around a path
    cameraPath(cullCamera.current.position, t * 0.001, 2)
    cameraPath(cullTarget, t * 0.001 + 1, 1)
    cullCamera.current.lookAt(cullTarget)
    cullCamera.current.updateMatrixWorld()
    cullCamera.current.updateFrustum()

    // Traverse all meshes in the scene
    scene.traverse((node) => {
      if (!node?.draw || node.name?.startsWith('cull-')) return

      // perform the frustum test using the demo camera
      node.visible = cullCamera.current.frustumIntersectsMesh(node)
    })
  })

  return (
    <camera ref={cullCamera} name="cull-camera" fov={65} far={10}>
      <mesh ref={cullMesh} name="cull-mesh">
        <cylinder radiusBottom={0.2} height={0.7} radialSegments={4} openEnded />
        <normalProgram cullFace={null} />
      </mesh>
    </camera>
  )
}

const FrustumCulling = () => (
  <Canvas camera={{ fov: 45, position: [6, 6, 12] }} onCreated={({ gl }) => gl.clearColor(1, 1, 1, 1)}>
    <Suspense fallback={null}>
      <Model modelUrl="assets/forest.json" textureUrl="assets/forest.jpg" />
    </Suspense>
    <CullCamera />
    <Controls />
  </Canvas>
)

export default FrustumCulling
