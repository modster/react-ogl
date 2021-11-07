import * as OGL from 'ogl'
import { reconciler } from './reconciler'
import { RENDER_MODES } from './constants'

// Store roots here since we can render to multiple canvases
const roots = new Map()

/**
 * Renders an element to a canvas, creating a renderer, scene, etc.
 */
export const render = (element, canvas, { mode = 'blocking', ...config } = {}) => {
  // Get store and init/update OGL state
  let store = roots.get(canvas)
  let root = store?.root
  const state = Object.assign(store?.state || {}, config)

  // Create root
  if (!root) {
    if (!state.scene) state.scene = new OGL.Transform()
    root = reconciler.createContainer(state.scene, RENDER_MODES[mode], false, null)
  }

  // Update root
  roots.set(canvas, { root, state })

  // Update fiber
  state.scene.state = state
  reconciler.updateContainer(element, root, null, () => undefined)

  return state
}

/**
 * Removes and cleans up internals on unmount.
 */
export const unmountComponentAtNode = (canvas) => {
  const state = roots.get(canvas)
  if (!state) return

  reconciler.updateContainer(null, state.root, null, () => roots.delete(canvas))
}

/**
 * Creates a root to safely render/unmount.
 */
export const createRoot = (canvas, config) => ({
  render: (element) => render(element, canvas, config),
  unmount: () => unmountComponentAtNode(canvas),
})
