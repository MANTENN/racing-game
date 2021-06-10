import create from 'zustand'

import { useState, useEffect } from 'react'
import { useStore, cameras } from '../store'
import _ from 'lodash'

const DEBUG_CONSOLE = false
const gyroScopeHandler = (value) => value / SENSITIVITY_VALUE
const SENSITIVITY_VALUE = _.clamp(0.05, 0.02, 1)
const SENSITIVITY = 1

const DIR_X = 'x'
const DIR_Y = 'y'
const DPAD = 'dpad-'
const L = 'left-'
const R = 'right-'

// xBox controllers
const keyMapping = {
  // first Left Stick and the second is right stick
  axes: [L + DIR_X, L + DIR_Y, 'lt', R + DIR_X, R + DIR_Y, 'rt'], //includes buttons
  buttons: [
    'A',
    'B',
    'X',
    'Y',
    'LB',
    'RB',
    'Left JoyStick',
    'Right JoyStick',
    'menu',
    'view',
    'XBOX Logo',
    DPAD + 'up',
    DPAD + 'bottom',
    DPAD + 'left',
    DPAD + 'right',
  ],
}

const useDebugStoreZustand = create((set) => ({
  state: {
    id: '',
    axes: [],
    buttons: [],
    connected: false,
    index: 0,
    mapping: 0,
    timestamp: 0,
  },
  updateDebugStore: (newState) => set({ ...newState, updateDebugStore: set }),
}))

function useControls(controlConfig) {
  const [connected, updateConnectionStatus] = useState(false)
  const { updateDebugStore: updateDebugStoreZustand, ...debugInfoZustand } = useDebugStoreZustand(
    (state) => state,
    (prevState, newState) => {
      let update = false
      Object.keys(prevState).forEach((value, index, array) => {
        if (newState[index] == value) {
          update = true
          return update
        }
      })
      console.log('update', update)
      return update
    },
  )
  const set = useStore((state) => state.set)

  // console.log('state', debugInfoZustand)
  const [debugInfo, updateDebugStore] = useState({ id: '', axes: [], buttons: [], connected: false, index: 0, mapping: 0, timestamp: 0 })
  const debug = true
  // const debug = useStore((state) => state.debug)

  useEffect(() => {
    const keyMap = controlConfig.reduce((out, { keys, fn, up = true }) => {
      keys.forEach((key) => (out[key] = { fn, pressed: false, up }))
      return out
    }, {})

    // const downHandler = ({ key }) => {
    //   if (!keyMap[key]) return

    //   const { fn, pressed, up } = keyMap[key]
    //   keyMap[key].pressed = true
    //   if (up || !pressed) fn(true)
    // }

    // const upHandler = ({ key }) => {
    //   if (!keyMap[key]) return

    //   const { fn, up } = keyMap[key]
    //   keyMap[key].pressed = false
    //   if (up) fn(false)
    // }
    let connectedController = false
    console.log('Initializing Gamepad Controls')
    const gamepadConnected = (e) => {
      updateConnectionStatus(true)
      set((state) => ({ ...state, controls: { ...state.controls, gamepadController: true } }))
      connectedController = true
      console.log('Gamepad connected at index %d: %s. %d buttons, %d axes.', e.gamepad.index, e.gamepad.id, e.gamepad.buttons.length, e.gamepad.axes.length, e)
    }
    const gamepadDisconnected = (e) => {
      updateConnectionStatus(false)
      set((state) => ({ ...state, controls: { ...state.controls, gamepadController: false } }))
      connectedController = false
      console.log('Gamepad disconnected from index %d: %s', e.gamepad.index, e.gamepad.id, e)
    }
    if (debug) {
      console.log('debugging useControls gamePad', connected, connectedController)
    }
    window.addEventListener('gamepadconnected', gamepadConnected)
    window.addEventListener('gamepaddisconnected', gamepadDisconnected)
    let interval, raf
    // if (connected) {
    // if (window.requestAnimationFrame) {
    //   console.log('settingUpRequestAnimationFrame Handler')
    //   raf = requestAnimationFrame(() => console.log(gamePadAPI()[0]))
    // } else {
    console.log('controlConfig', controlConfig)
    interval = setInterval(() => {
      if (connected) {
        const controller = navigator.getGamepads()[0]
        !connectedController || controller
        // const debugInfoElement = document.querySelector('gamePadDebugInfo')
        if (debug) updateDebugStore(controller) // only run when debug is on e
        if (controller) {
          // handleAxes
          controller.axes.map((value, i) => {
            if (keyMapping.axes[i] == 'left-x') {
              const { fn, up } = keyMap[keyMapping.axes[i]]
              fn(value)
            }
            if (
              (value.toFixed(SENSITIVITY) < -0.2 || value.toFixed(SENSITIVITY) > 0.2) &&
              keyMapping.axes[i] != 'rt' &&
              keyMapping.axes[i] != 'lt' &&
              keyMapping.axes[i] != 'left-x'
            ) {
              const { fn, up } = keyMap[keyMapping.axes[i]] || { fn: () => {}, up: false }
              if (value != 0) {
                // console.log('pressed axes', keyMapping.axes[i])
                fn(value)
              } else {
                fn(0)
              }
            }
            if (keyMapping.axes[i] == 'rt' || keyMapping.axes[i] == 'lt') {
              const { fn, up } = keyMap[keyMapping.axes[i]]
              if (value > -1) {
                fn(value + 1)
              } else {
                fn(0)
              }
              // console.log('pressed axes', keyMapping.axes[i])
            }
          })
          // handleButtons
          controller.buttons.map(({ pressed, value }, i) => {
            if (pressed || value) {
              // console.log('pressed', keyMapping.buttons[i])
              const { fn, up } = keyMap[keyMapping.buttons[i]]
              fn(1)
            }
          })
        }
        // if (debug) {
        //   let update = false
        //   console.log('controller', controller)
        //   console.log('controller', debugInfoZustand)
        //   Object.keys(debugInfoZustand).forEach((value, index, array) => {})
        //   // if (update) updateDebugStoreZustand(controller)
        // } // only run when debug is on e
      }
    }, 100)
    // }
    // }
    return () => {
      // if (connected) {
      console.log('useEffect?')
      if (raf) cancelAnimationFrame(raf)
      if (interval) clearInterval(interval)
      // }
      window.removeEventListener('gamepadconnected', gamepadConnected, { passive: true })
      window.removeEventListener('gamepaddisconnected', gamepadDisconnected, { passive: true })
    }
  }, [connected, controlConfig])
  return [connected, debugInfo]
}

export function GamepadControls() {
  const set = useStore((state) => state.set)

  const debug = true
  // const debug = useStore((state) => state.debug)
  const [connected, debugInfo] = useControls([
    {
      keys: ['rt'],
      fn: (y) => set((state) => ({ ...state, controls: { ...state.controls, forward: y, y } })),
    },
    {
      keys: ['lt'],
      fn: (backward) => set((state) => ({ ...state, controls: { ...state.controls, backward } })),
    },
    {
      keys: ['left-x'],
      fn: (value) =>
        set((state) => ({
          ...state,
          controls: {
            ...state.controls,
          },
          x: (state.controls.invertGyro ? (value < 0 ? Math.abs(value) : -value) : value).toFixed(SENSITIVITY),
        })),
    },
    // {
    //   keys: ['lt'],
    //   fn: (brake) =>
    //     set((state) => ({
    //       ...state,
    //       controls: { ...state.controls, brake },
    //     })),
    // },
    {
      keys: ['B'],
      fn: (boost) => set((state) => ({ ...state, controls: { ...state.controls, boost } })),
    },
    {
      keys: ['Y'],
      fn: (reset) => set((state) => ({ ...state, controls: { ...state.controls, reset } })),
    },
    {
      keys: ['A'],
      fn: () => set((state) => ({ ...state, map: !state.map })),
    },
    // {
    //   keys: ['e', 'E'],
    //   fn: () => set((state) => ({ ...state, editor: !state.editor })),
    //   up: false,
    // },
    // {
    //   keys: ['i', 'I'],
    //   fn: () => set((state) => ({ ...state, help: !state.help })),
    //   up: false,
    // },
    // {
    //   keys: ['m', 'M'],
    //   fn: () => set((state) => ({ ...state, map: !state.map })),
    //   up: false,
    // },
    {
      keys: ['X'],
      fn: () =>
        set((state) => {
          const current = cameras.indexOf(state.camera)
          const next = (current + 1) % cameras.length
          const camera = cameras[next]
          return { ...state, camera }
        }),
      up: false,
    },
  ])

  if (debug && DEBUG_CONSOLE) {
    console.clear()
    console.log('debugInfo', debugInfo.id)
  }

  return (
    debug && (
      <div
        style={{
          position: 'absolute',
          right: '10px',
          bottom: '10px',
          backgroundColor: '#fff',
          padding: '10px',
          borderRadius: '10px',
          zIndex: 10000,
          color: '#000',
        }}
        id="gamePadDebugInfo">
        Id: {debugInfo.id}
        Axes:{' '}
        {debugInfo.axes.map((value, i) => (
          <div key={i}>
            {keyMapping.axes[i]}:
            {keyMapping.axes[i] == DIR_X || keyMapping.axes[i] == DIR_Y ? gyroScopeHandler(value).toFixed(SENSITIVITY) : value.toFixed(SENSITIVITY)}
          </div>
        ))}
        Buttons:
        {debugInfo.buttons.map(({ pressed, touched, value }, i) => (
          <div key={i}>
            {keyMapping.buttons[i]}: {pressed ? 'T\n' : 'F\n'}
            {/* T: {touched ? 'T\n' : 'F\n'} */}
            {/* V: {value} */}
          </div>
        ))}
      </div>
    )
  )
}
