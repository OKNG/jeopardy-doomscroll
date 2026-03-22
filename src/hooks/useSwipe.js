import { useRef, useEffect } from 'react'

const V_THRESHOLD = 80
const LOCK_DIST = 10

export function useSwipe({ onDragMove, onSwipeUp, onSwipeDown, onDragEnd, disabled } = {}) {
  const ref = useRef(null)

  const startX = useRef(0)
  const startY = useRef(0)
  const lockedAxis = useRef(null) // 'h' | 'v' | null
  const dragActive = useRef(false)

  const callbacks = useRef({})
  callbacks.current = { onDragMove, onSwipeUp, onSwipeDown, onDragEnd }
  const disabledRef = useRef(disabled)
  disabledRef.current = disabled

  useEffect(() => {
    const el = ref.current
    if (!el) return

    function onPointerDown(e) {
      if (disabledRef.current) return
      dragActive.current = true
      startX.current = e.clientX
      startY.current = e.clientY
      lockedAxis.current = null
      el.setPointerCapture(e.pointerId)
    }

    function onPointerMove(e) {
      if (!dragActive.current) return

      const dx = e.clientX - startX.current
      const dy = e.clientY - startY.current

      if (!lockedAxis.current) {
        if (Math.abs(dx) > LOCK_DIST) lockedAxis.current = 'h'
        else if (Math.abs(dy) > LOCK_DIST) lockedAxis.current = 'v'
        else return
      }

      e.preventDefault()

      if (lockedAxis.current === 'v') {
        callbacks.current.onDragMove?.(dy)
      }
    }

    function onPointerUp(e) {
      if (!dragActive.current) return

      const dy = e.clientY - startY.current
      const axis = lockedAxis.current

      dragActive.current = false
      lockedAxis.current = null

      if (axis === 'v' && !disabledRef.current) {
        if (dy < -V_THRESHOLD) { e.stopPropagation(); callbacks.current.onSwipeUp?.(); return }
        if (dy > V_THRESHOLD) { e.stopPropagation(); callbacks.current.onSwipeDown?.(); return }
      }

      callbacks.current.onDragEnd?.()
    }

    function onPointerCancel() {
      if (!dragActive.current) return
      dragActive.current = false
      lockedAxis.current = null
      callbacks.current.onDragEnd?.()
    }

    function onClick(e) {
      // Suppress clicks that follow a swipe gesture
      if (Math.abs(e.clientX - startX.current) > LOCK_DIST ||
          Math.abs(e.clientY - startY.current) > LOCK_DIST) {
        e.stopPropagation()
      }
    }

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove, { passive: false })
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerCancel)
    el.addEventListener('click', onClick, { capture: true })

    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerCancel)
      el.removeEventListener('click', onClick, { capture: true })
    }
  }, [])

  return { ref }
}
