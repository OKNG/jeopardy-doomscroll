import { useRef, useState } from 'react'
import { fetchRandomClue, fetchCategory } from '../api/clues'

export function useClueHistory() {
  const [state, setState] = useState({
    history: [],
    currentIndex: -1,
    isRevealed: false,
    isLoading: false,
    error: null,
  })

  // Mirror latest state in a ref so async functions can read it without stale closures
  const stateRef = useRef(state)
  stateRef.current = state

  const categoryCache = useRef(new Map())
  const seenIds = useRef(new Set())

  async function advanceForward() {
    const { history, currentIndex } = stateRef.current

    // Navigate forward through existing history without fetching
    if (currentIndex < history.length - 1) {
      setState(s => ({ ...s, currentIndex: s.currentIndex + 1, isRevealed: false }))
      return
    }

    // Need to fetch a new clue
    setState(s => ({ ...s, isLoading: true, error: null }))

    try {
      let clue = await fetchRandomClue()
      if (seenIds.current.has(clue.clueId)) {
        clue = await fetchRandomClue()
      }
      seenIds.current.add(clue.clueId)

      const newClue = {
        clueId: clue.clueId,
        categoryId: clue.categoryId,
        question: clue.question,
        answer: clue.answer,
        categoryName: categoryCache.current.get(clue.categoryId) ?? null,
      }

      setState(s => ({
        ...s,
        history: [...s.history, newClue],
        currentIndex: s.history.length,
        isRevealed: false,
        isLoading: false,
        error: null,
      }))

      // Fire-and-forget category fetch
      if (!categoryCache.current.has(clue.categoryId)) {
        fetchCategory(clue.categoryId)
          .then(cat => {
            categoryCache.current.set(clue.categoryId, cat.name)
            setState(s => ({
              ...s,
              history: s.history.map(entry =>
                entry.categoryId === clue.categoryId && entry.categoryName === null
                  ? { ...entry, categoryName: cat.name }
                  : entry
              ),
            }))
          })
          .catch(() => {
            // Category fetch failed — categoryName stays null, header shows —
          })
      }
    } catch (err) {
      setState(s => ({ ...s, isLoading: false, error: err.message }))
    }
  }

  function goBack() {
    setState(s => {
      if (s.currentIndex <= 0) return s
      return { ...s, currentIndex: s.currentIndex - 1, isRevealed: false }
    })
  }

  function revealAnswer() {
    setState(s => ({ ...s, isRevealed: true }))
  }

  function hideAnswer() {
    setState(s => ({ ...s, isRevealed: false }))
  }

  function retry() {
    advanceForward()
  }

  return {
    history: state.history,
    currentIndex: state.currentIndex,
    isRevealed: state.isRevealed,
    isLoading: state.isLoading,
    error: state.error,
    advanceForward,
    goBack,
    revealAnswer,
    hideAnswer,
    retry,
  }
}
