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

  const [transitionPhase, setTransitionPhase] = useState('idle')
  const isAnimating = useRef(false)

  const currentClue = currentIndex >= 0 ? history[currentIndex] : null

  function handleSwipeUp() {
    if (isAnimating.current) return
    isAnimating.current = true
    setTransitionPhase('exiting-up')

    setTimeout(() => {
      advanceForward()
      setTransitionPhase('entering-down')

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransitionPhase('idle')
          isAnimating.current = false
        })
      })
    }, 180)
  }

  function handleSwipeDown() {
    if (isAnimating.current) return
    isAnimating.current = true
    setTransitionPhase('exiting-down')

    setTimeout(() => {
      goBack()
      setTransitionPhase('entering-up')

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransitionPhase('idle')
          isAnimating.current = false
        })
      })
    }, 180)
  }

  const { ref, dragStyle } = useSwipe({
    onSwipeUp: handleSwipeUp,
    onSwipeDown: handleSwipeDown,
    disabled: isAnimating.current,
  })

  function handleTap() {
    if (isRevealed) hideAnswer()
    else revealAnswer()
  }

  useEffect(() => {
    advanceForward()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      <CategoryHeader categoryName={currentClue?.categoryName ?? null} />

      <div
        ref={ref}
        style={{ ...dragStyle, height: '100%', touchAction: 'none', cursor: 'grab' }}
      >
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
          <ClueCard
            clue={currentClue}
            isRevealed={isRevealed}
            transitionPhase={transitionPhase}
            onTap={handleTap}
          />
        )}
      </div>
    </div>
  )
}
