import { useRef, useState, useEffect } from 'react'

const V_THRESHOLD = 80
const LOCK_DIST = 10

export function useSwipe({ onSwipeUp, onSwipeDown, disabled } = {}) {
  const ref = useRef(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const startX = useRef(0)
  const startY = useRef(0)
  const lockedAxis = useRef(null) // 'h' | 'v' | null
  const dragActive = useRef(false)

  const callbacks = useRef({})
  callbacks.current = { onSwipeUp, onSwipeDown }
  const disabledRef = useRef(disabled)
  disabledRef.current = disabled

  useEffect(() => {
    const el = ref.current
    if (!el) return

    function onPointerDown(e) {
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
        setDragOffset({ x: 0, y: dy })
      }
    }

    function onPointerUp(e) {
      if (!dragActive.current) return

      const dy = e.clientY - startY.current
      const axis = lockedAxis.current

      dragActive.current = false
      lockedAxis.current = null
      setDragOffset({ x: 0, y: 0 })

      if (disabledRef.current) return

      if (axis === 'v') {
        const { onSwipeUp, onSwipeDown } = callbacks.current
        if (dy < -V_THRESHOLD) { e.stopPropagation(); onSwipeUp?.() }
        else if (dy > V_THRESHOLD) { e.stopPropagation(); onSwipeDown?.() }
      }
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
    el.addEventListener('pointercancel', onPointerUp)
    el.addEventListener('click', onClick, { capture: true })

    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerUp)
      el.removeEventListener('click', onClick, { capture: true })
    }
  }, [])

  const dragStyle = dragOffset.y
    ? { transform: `translateY(${dragOffset.y}px)`, transition: 'none' }
    : {}

  return { ref, dragStyle }
}
