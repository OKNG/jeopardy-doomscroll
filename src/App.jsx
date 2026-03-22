import { useEffect, useRef, useState, useCallback } from 'react'
import { useClueHistory } from './hooks/useClueHistory'
import { useSwipe } from './hooks/useSwipe'
import { useSpeechRecognition } from './hooks/useSpeechRecognition'
import { checkAnswer } from './utils/answerMatch'
import { CategoryHeader } from './components/CategoryHeader/CategoryHeader'
import { ClueCard } from './components/ClueCard/ClueCard'
import { LoadingCard } from './components/LoadingCard/LoadingCard'

export default function App() {
  const {
    history,
    currentIndex,
    isRevealed,
    answerResult,
    isLoading,
    error,
    advanceForward,
    goBack,
    revealAnswer,
    hideAnswer,
    setAnswerResult,
    retry,
  } = useClueHistory()

  const [answerMode, setAnswerMode] = useState(() => {
    try { return localStorage.getItem('answerMode') === 'on' } catch { return false }
  })
  const [containerOffset, setContainerOffset] = useState(0)
  const [isSnapping, setIsSnapping] = useState(false)
  const [onboardingPhase, setOnboardingPhase] = useState('tap') // 'tap' | 'swipe' | 'done'
  const offsetRef = useRef(0)
  const snapDirection = useRef(null) // 'up' | 'down' | 'back' | null
  const isAnimating = useRef(false)
  const revealTimerRef = useRef(null)

  const currentClue = currentIndex >= 0 ? history[currentIndex] : null
  const prevClue = currentIndex > 0 ? history[currentIndex - 1] : null
  const nextClue = currentIndex < history.length - 1 ? history[currentIndex + 1] : null

  const handleSpeechResult = useCallback((transcripts, error) => {
    if (error === 'mic-denied') {
      setAnswerResult(null)
      revealAnswer()
      return
    }

    const answer = history[currentIndex]?.answer
    console.log('[Speech] transcripts:', transcripts, '| correct answer:', answer)

    if (transcripts.length === 0 || !answer) {
      setAnswerResult('incorrect')
    } else {
      const results = transcripts.map(t => ({ transcript: t, ...checkAnswer(t, answer) }))
      console.log('[Speech] match results:', results)
      const matched = results.some(r => r.match)
      setAnswerResult(matched ? 'correct' : 'incorrect')
    }

    revealTimerRef.current = setTimeout(() => {
      revealAnswer()
      if (onboardingPhase === 'tap') setOnboardingPhase('swipe')
    }, 1500)
  }, [history, currentIndex, revealAnswer, setAnswerResult, onboardingPhase])

  const { start: speechStart, stop: speechStop, isListening, isSupported: speechSupported } = useSpeechRecognition({
    onResult: handleSpeechResult,
  })

  // Clean up reveal timer on unmount or navigation
  useEffect(() => {
    return () => clearTimeout(revealTimerRef.current)
  }, [])

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
    // Cancel listening if swiping away
    if (isListening) speechStop()
    clearTimeout(revealTimerRef.current)
    isAnimating.current = true
    snapDirection.current = 'up'
    setIsSnapping(true)
    setOffset(-window.innerHeight)
    if (onboardingPhase === 'swipe') setOnboardingPhase('done')
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
    // Cancel listening if swiping away
    if (isListening) speechStop()
    clearTimeout(revealTimerRef.current)
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

  function toggleAnswerMode() {
    setAnswerMode(prev => {
      const next = !prev
      try { localStorage.setItem('answerMode', next ? 'on' : 'off') } catch {}
      return next
    })
  }

  function handleTap() {
    if (isRevealed || answerResult === 'listening') return

    if (!answerMode || !speechSupported) {
      revealAnswer()
      if (onboardingPhase === 'tap') setOnboardingPhase('swipe')
      return
    }

    setAnswerResult('listening')
    speechStart()
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
        data-name="answer-mode-toggle"
        onClick={toggleAnswerMode}
        style={{
          position: 'fixed',
          top: '80px',
          right: 12,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          userSelect: 'none',
        }}
        title={answerMode ? 'Answer mode: ON' : 'Answer mode: OFF'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ opacity: answerMode ? 0.8 : 0.4, transition: 'opacity 200ms' }}>
          <rect x="9" y="2" width="6" height="12" rx="3" fill="white" />
          <path d="M5 11a7 7 0 0 0 14 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <line x1="12" y1="18" x2="12" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <div style={{
          width: 40,
          height: 22,
          borderRadius: 11,
          background: answerMode ? 'var(--color-correct)' : 'rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.3)',
          position: 'relative',
          transition: 'background 200ms',
        }}>
          <div style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: 'white',
            position: 'absolute',
            top: 2,
            left: answerMode ? 21 : 2,
            transition: 'left 200ms',
          }} />
        </div>
      </div>
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
                <ClueCard
                  clue={currentClue}
                  isRevealed={isRevealed}
                  onTap={handleTap}
                  answerResult={answerResult}
                  promptIcon={onboardingPhase === 'tap' ? '/resources/tap_icon.png' : undefined}
                />
                {onboardingPhase === 'swipe' && isRevealed && (
                  <div data-name="onboarding-prompt" style={{
                    position: 'absolute',
                    bottom: '8vh',
                    left: 0,
                    right: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    zIndex: 'var(--z-overlay)',
                  }}>
                    <img src="/resources/swipe_icon.png" alt="Swipe up for next clue" style={{ height: 72, filter: 'brightness(0) invert(1)', animation: 'swipeHint 1.3s ease-in-out infinite' }} />
                  </div>
                )}
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
