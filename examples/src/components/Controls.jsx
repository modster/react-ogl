import { useRef, useEffect } from 'react'
import { useFrame, useOGL } from 'react-ogl/web'

const Controls = (props) => {
  const controls = useRef()
  const { camera } = useOGL()

  useEffect(() => {
    document.body.className = 'controls'

    return () => {
      document.body.className = ''
    }
  }, [])

  useFrame(() => controls.current.update())

  return <orbit {...props} ref={controls} args={[camera]} />
}

export default Controls
