import { useRef, useState, useEffect } from 'react'

const H_THRESHOLD = 60
const V_THRESHOLD = 80
const LOCK_DIST = 10

export function useSwipe({ onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, disabled } = {}) {
  const ref = useRef(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const startX = useRef(0)
  const startY = useRef(0)
  const lockedAxis = useRef(null) // 'h' | 'v' | null
  const dragActive = useRef(false)

  // Keep callbacks in refs so the effect doesn't need to re-run when they change
  const callbacks = useRef({})
  callbacks.current = { onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown }
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

      if (lockedAxis.current === 'h') {
        setDragOffset({ x: dx, y: 0 })
      } else {
        setDragOffset({ x: 0, y: dy })
      }
    }

    function onPointerUp(e) {
      if (!dragActive.current) return

      const dx = e.clientX - startX.current
      const dy = e.clientY - startY.current
      const axis = lockedAxis.current

      // Reset all tracking state
      dragActive.current = false
      lockedAxis.current = null
      setDragOffset({ x: 0, y: 0 })

      if (disabledRef.current) return

      const { onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown } = callbacks.current

      if (axis === 'h') {
        if (dx < -H_THRESHOLD) onSwipeLeft?.()
        else if (dx > H_THRESHOLD) onSwipeRight?.()
      } else if (axis === 'v') {
        if (dy < -V_THRESHOLD) onSwipeUp?.()
        else if (dy > V_THRESHOLD) onSwipeDown?.()
      }
    }

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove, { passive: false })
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerUp)

    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerUp)
    }
  }, []) // stable — uses refs for everything that changes

  const dragStyle =
    dragOffset.x || dragOffset.y
      ? { transform: `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px)`, transition: 'none' }
      : {}

  return { ref, dragStyle }
}
