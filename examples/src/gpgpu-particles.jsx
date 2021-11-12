import { useEffect, useRef, useState } from 'react'
import * as OGL from 'ogl'
import { useOGL, useFrame, Canvas } from 'react-ogl/web'

const numParticles = 65536

// Create the initial data arrays for position and velocity. 4 values for RGBA channels in texture.
const initialPositionData = new Float32Array(numParticles * 4)
const initialVelocityData = new Float32Array(numParticles * 4)

// Random to be used as regular static attribute
const random = new Float32Array(numParticles * 4)
for (let i = 0; i < numParticles; i++) {
  initialPositionData.set(
    [
      (Math.random() - 0.5) * 2.0,
      (Math.random() - 0.5) * 2.0,
      0, // the Green and Alpha channels go unused in this example, however I set
      1, // unused Alpha to 1 so that texture is visible in WebGL debuggers
    ],
    i * 4,
  )
  initialVelocityData.set([0, 0, 0, 1], i * 4)
  random.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4)
}

const vertex = `
  attribute vec2 coords;
  attribute vec4 random;
  uniform float uTime;
  uniform sampler2D tPosition;
  uniform sampler2D tVelocity;
  varying vec4 vRandom;
  varying vec4 vVelocity;
  void main() {
    vRandom = random;
    // Get position from texture, rather than attribute
    vec4 position = texture2D(tPosition, coords);
    vVelocity = texture2D(tVelocity, coords);
    
    // Add some subtle random oscillating so it never fully stops
    position.xy += sin(vec2(uTime) * vRandom.wy + vRandom.xz * 6.28) * vRandom.zy * 0.1;
    gl_Position = vec4(position.xy, 0, 1);
    gl_PointSize = mix(2.0, 15.0, vRandom.x);
    // Make bigger while moving
    gl_PointSize *= 1.0 + min(1.0, length(vVelocity.xy));
  }
`

const fragment = `
  precision highp float;
  varying vec4 vRandom;
  varying vec4 vVelocity;
  void main() {
    // Circle shape
    if (step(0.5, length(gl_PointCoord.xy - 0.5)) > 0.0) discard;
    // Random colour
    vec3 color = vec3(vRandom.zy, 1.0) * mix(0.7, 2.0, vRandom.w);
    // Fade to white when not moving, with an ease off curve
    gl_FragColor.rgb = mix(vec3(1), color, 1.0 - pow(1.0 - smoothstep(0.0, 0.7, length(vVelocity.xy)), 2.0));
    gl_FragColor.a = 1.0;
  }
`

const positionFragment = `
  precision highp float;
  uniform float uTime;
  uniform sampler2D tVelocity;
  // Default texture uniform for GPGPU pass is 'tMap'.
  // Can use the textureUniform parameter to update.
  uniform sampler2D tMap;
  varying vec2 vUv;
  void main() {
    vec4 position = texture2D(tMap, vUv);
    vec4 velocity = texture2D(tVelocity, vUv);
    position.xy += velocity.xy * 0.01;
                    
    // Keep in bounds
    vec2 limits = vec2(1);
    position.xy += (1.0 - step(-limits.xy, position.xy)) * limits.xy * 2.0;
    position.xy -= step(limits.xy, position.xy) * limits.xy * 2.0;
    gl_FragColor = position;
  }
`

const velocityFragment = `
  precision highp float;
  uniform float uTime;
  uniform sampler2D tPosition;
  uniform sampler2D tMap;
  uniform vec2 uMouse;
  varying vec2 vUv;
  void main() {
    vec4 position = texture2D(tPosition, vUv);
    vec4 velocity = texture2D(tMap, vUv);
    // Repulsion from mouse
    vec2 toMouse = position.xy - uMouse;
    float strength = smoothstep(0.3, 0.0, length(toMouse));
    velocity.xy += strength * normalize(toMouse) * 0.5;
    // Friction
    velocity.xy *= 0.98;
    gl_FragColor = velocity;
  }
`

const Points = () => {
  const time = useRef(0)
  const mouse = useRef(new OGL.Vec2())
  const { gl } = useOGL()
  const [position] = useState(() => new OGL.GPGPU(gl, { data: initialPositionData }))
  const [velocity] = useState(() => new OGL.GPGPU(gl, { data: initialVelocityData }))

  useEffect(() => {
    // Add the simulation shaders as passes to each GPGPU class
    position.addPass({
      fragment: positionFragment,
      uniforms: {
        uTime: { value: time.current },
        tVelocity: velocity.uniform,
      },
    })
    velocity.addPass({
      fragment: velocityFragment,
      uniforms: {
        uTime: { value: time.current },
        uMouse: { value: mouse.current },
        tPosition: position.uniform,
      },
    })

    // Get mouse value in -1 to 1 range, with y flipped
    const updateMouse = ({ clientX, clientY }) => {
      mouse.current.set((clientX / gl.renderer.width) * 2 - 1, (1.0 - clientY / gl.renderer.height) * 2 - 1)
    }

    // Add handlers to get mouse position
    window.addEventListener('pointermove', updateMouse, { passive: false })

    return () => {
      window.removeEventListener('pointermove', updateMouse)
    }
  }, [])

  useFrame((_, t) => {
    // Update GPGPU uniforms
    time.current = t * 0.001

    // Update GPGPU classes
    velocity.render()
    position.render()
  })

  return (
    <mesh mode={gl.POINTS}>
      <geometry random={{ size: 4, data: random }} coords={{ size: 2, data: position.coords }} />
      <program
        vertex={vertex}
        fragment={fragment}
        uniforms={{
          uTime: { value: time.current },
          tPosition: position.uniform,
          tVelocity: velocity.uniform,
        }}
      />
    </mesh>
  )
}

const GPGPUParticles = () => (
  <Canvas camera={{ fov: 45, position: [0, 0, 5] }} onCreated={({ gl }) => gl.clearColor(1, 1, 1, 1)}>
    <Points />
  </Canvas>
)

export default GPGPUParticles
