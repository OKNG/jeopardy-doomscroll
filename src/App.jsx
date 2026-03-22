import { useEffect, useRef, useState } from 'react'
import { useClueHistory } from './hooks/useClueHistory'
import { useSwipe } from './hooks/useSwipe'
import { CategoryHeader } from './components/CategoryHeader/CategoryHeader'
import { ClueCard } from './components/ClueCard/ClueCard'
import { LoadingCard } from './components/LoadingCard/LoadingCard'

export default function App() {
  const {
    history,
    currentIndex,
    isRevealed,
    isLoading,
    error,
    advanceForward,
    goBack,
    revealAnswer,
    hideAnswer,
    retry,
  } = useClueHistory()

  const [containerOffset, setContainerOffset] = useState(0)
  const [isSnapping, setIsSnapping] = useState(false)
  const offsetRef = useRef(0)
  const snapDirection = useRef(null) // 'up' | 'down' | 'back' | null
  const isAnimating = useRef(false)

  const currentClue = currentIndex >= 0 ? history[currentIndex] : null
  const prevClue = currentIndex > 0 ? history[currentIndex - 1] : null
  const nextClue = currentIndex < history.length - 1 ? history[currentIndex + 1] : null

  function setOffset(val) {
    offsetRef.current = val
    setContainerOffset(val)
  }

  function handleDragMove(dy) {
    if (isAnimating.current) return

    // Rubber-band effect when no card in that direction
    if (dy > 0 && !prevClue) {
      setOffset(dy * 0.3)
      return
    }
    if (dy < 0 && !nextClue) {
      setOffset(dy * 0.3)
      return
    }
    setOffset(dy)
  }

  function handleSwipeUp() {
    if (isAnimating.current) return
    if (!nextClue) {
      // No buffered clue, snap back
      snapDirection.current = 'back'
      setIsSnapping(true)
      setOffset(0)
      return
    }
    isAnimating.current = true
    snapDirection.current = 'up'
    setIsSnapping(true)
    setOffset(-window.innerHeight)
  }

  function handleSwipeDown() {
    if (isAnimating.current) return
    if (currentIndex <= 0) {
      // Can't go back, snap back
      snapDirection.current = 'back'
      setIsSnapping(true)
      setOffset(0)
      return
    }
    isAnimating.current = true
    snapDirection.current = 'down'
    setIsSnapping(true)
    setOffset(window.innerHeight)
  }

  function handleDragEnd() {
    if (isAnimating.current) return
    if (offsetRef.current === 0) return
    snapDirection.current = 'back'
    setIsSnapping(true)
    setOffset(0)
  }

  function handleTransitionEnd(e) {
    if (e.target !== e.currentTarget) return // ignore child transitions
    if (e.propertyName !== 'transform') return

    const dir = snapDirection.current
    snapDirection.current = null
    setIsSnapping(false)
    setOffset(0)

    if (dir === 'up') {
      advanceForward()
    } else if (dir === 'down') {
      goBack()
    }

    isAnimating.current = false
  }

  const { ref } = useSwipe({
    onDragMove: handleDragMove,
    onSwipeUp: handleSwipeUp,
    onSwipeDown: handleSwipeDown,
    onDragEnd: handleDragEnd,
    disabled: isAnimating.current,
  })

  function handleTap() {
    revealAnswer()
  }

  useEffect(() => {
    advanceForward()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stackStyle = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    transform: `translateY(${containerOffset}px)`,
    transition: isSnapping ? 'transform 300ms ease-out' : 'none',
  }

  const cardSlotStyle = (top) => ({
    position: 'absolute',
    width: '100%',
    height: '100%',
    top,
  })

  return (
    <div data-name="app-root" style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      <div
        data-name="swipe-container"
        ref={ref}
        style={{ width: '100%', height: '100%', touchAction: 'none', cursor: 'grab' }}
      >
        <div
          data-name="card-stack"
          style={stackStyle}
          onTransitionEnd={handleTransitionEnd}
        >
          {/* Previous card */}
          {prevClue && (
            <div data-name="card-slot-prev" style={cardSlotStyle('-100%')}>
              <CategoryHeader categoryName={prevClue.categoryName} />
              <ClueCard clue={prevClue} isRevealed={false} onTap={() => {}} />
            </div>
          )}

          {/* Current card */}
          <div data-name="card-slot-current" style={cardSlotStyle('0')}>
            {currentIndex === -1 ? (
              <LoadingCard />
            ) : error ? (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                background: 'var(--color-bg)',
                padding: '32px',
              }}>
                <p style={{ fontSize: 'var(--text-lg)', textAlign: 'center' }}>
                  Failed to load question
                </p>
                <button
                  onClick={retry}
                  style={{
                    padding: '12px 24px',
                    background: 'var(--color-secondary)',
                    color: '#fff',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderRadius: 'var(--radius-md)',
                    fontFamily: 'var(--font-family)',
                    fontSize: 'var(--text-base)',
                    cursor: 'pointer',
                  }}
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                <CategoryHeader categoryName={currentClue?.categoryName ?? null} />
                <ClueCard clue={currentClue} isRevealed={isRevealed} onTap={handleTap} />
              </>
            )}
          </div>

          {/* Next card */}
          {nextClue && (
            <div data-name="card-slot-next" style={cardSlotStyle('100%')}>
              <CategoryHeader categoryName={nextClue.categoryName} />
              <ClueCard clue={nextClue} isRevealed={false} onTap={() => {}} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
