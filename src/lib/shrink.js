import { useE, useEventListener, useInterval } from "./hooks"

export const useShrink = (inner) => {

  const clear = () => {
    let outer = document.querySelector('#index')
    outer.style.width = ''
    outer.classList.remove('shrink')
  }
  const resize = () => {
    if (inner) {
      let outer = document.querySelector('#index')
      let outerRect = outer.getBoundingClientRect()
      let innerRect = inner.getBoundingClientRect()
      if (innerRect.width < outerRect.width) {
        outer.style.width = `${innerRect.width}px`
        outer.classList.add('shrink')
      }
    }
  }

  useE(inner, () => {
    resize()
    return clear
  })
  useEventListener(window, 'resize', resize)
  // resize()

  return resize
}