import { useRef, useState } from 'react'
import { fetchRandomClues, fetchCategory } from '../api/clues'

const BUFFER_SIZE = 5

export function useClueHistory() {
  const [state, setState] = useState({
    history: [],
    currentIndex: -1,
    isRevealed: false,
    isLoading: false,
    error: null,
  })

  const stateRef = useRef(state)
  stateRef.current = state

  const categoryCache = useRef(new Map())
  const seenIds = useRef(new Set())
  const isReplenishing = useRef(false)
  const isInitializing = useRef(false)

  function prefetchCategory(categoryId) {
    if (categoryCache.current.has(categoryId)) return
    fetchCategory(categoryId)
      .then(cat => {
        categoryCache.current.set(categoryId, cat.name)
        setState(s => ({
          ...s,
          history: s.history.map(entry =>
            entry.categoryId === categoryId && entry.categoryName === null
              ? { ...entry, categoryName: cat.name }
              : entry
          ),
        }))
      })
      .catch(() => {})
  }

  function mapClue(raw) {
    return {
      clueId: raw.clueId,
      categoryId: raw.categoryId,
      question: raw.question,
      answer: raw.answer,
      categoryName: categoryCache.current.get(raw.categoryId) ?? null,
    }
  }

  function filterClues(clues) {
    const out = []
    for (const c of clues) {
      if (seenIds.current.has(c.clueId)) continue
      if (c.question && c.question.toLowerCase().includes('seen here')) continue // Filter out clues that reference image/videos
      seenIds.current.add(c.clueId)
      out.push(c)
    }
    return out
  }

  // Runs in background: keeps the buffer at BUFFER_SIZE clues ahead of currentIndex.
  // Serialized via isReplenishing so only one loop runs at a time.
  async function replenish() {
    if (isReplenishing.current) return
    isReplenishing.current = true
    try {
      while (true) {
        const { history, currentIndex } = stateRef.current
        const ahead = history.length - 1 - currentIndex
        if (ahead >= BUFFER_SIZE) break

        const raw = await fetchRandomClues(1)
        const [clue] = filterClues(raw)
        if (!clue) continue // already seen, skip

        setState(s => ({ ...s, history: [...s.history, mapClue(clue)] }))
        prefetchCategory(clue.categoryId)
      }
    } catch {
      // silent — buffer replenishment failures are non-fatal
    }
    isReplenishing.current = false
  }

  // Initial load: fetch BUFFER_SIZE clues at once, wait for the first clue's
  // category name before showing the card.
  async function initialize() {
    if (isInitializing.current) return
    isInitializing.current = true
    setState(s => ({ ...s, isLoading: true, error: null }))
    try {
      const raw = await fetchRandomClues(BUFFER_SIZE)
      const clues = filterClues(raw)
      const mapped = clues.map(mapClue)

      // Await the first clue's category so the splash screen stays up
      const first = mapped[0]
      if (first && first.categoryName === null) {
        try {
          const cat = await fetchCategory(first.categoryId)
          categoryCache.current.set(first.categoryId, cat.name)
          for (const c of mapped) {
            if (c.categoryId === first.categoryId) c.categoryName = cat.name
          }
        } catch {
          // Category fetch failed — show card anyway with "—"
        }
      }

      setState(s => ({
        ...s,
        history: mapped,
        currentIndex: 0,
        isRevealed: false,
        isLoading: false,
        error: null,
      }))

      // Prefetch remaining categories in the background
      for (const c of clues.slice(1)) prefetchCategory(c.categoryId)
    } catch (err) {
      setState(s => ({ ...s, isLoading: false, error: err.message }))
    }
  }

  async function advanceForward() {
    const { history, currentIndex } = stateRef.current

    // First ever call — do the bulk initial load
    if (currentIndex === -1 && history.length === 0) {
      return initialize()
    }

    // Buffer has clues ready — advance instantly
    if (currentIndex < history.length - 1) {
      setState(s => ({ ...s, currentIndex: s.currentIndex + 1, isRevealed: false }))
      replenish()
      return
    }

    // Buffer empty (shouldn't normally happen) — fetch one and wait
    setState(s => ({ ...s, isLoading: true, error: null }))
    try {
      let raw = await fetchRandomClues(1)
      let [clue] = filterClues(raw)
      if (!clue) {
        raw = await fetchRandomClues(1)
        ;[clue] = filterClues(raw)
      }

      if (!clue) throw new Error('No clue available')

      setState(s => ({
        ...s,
        history: [...s.history, mapClue(clue)],
        currentIndex: s.history.length,
        isRevealed: false,
        isLoading: false,
        error: null,
      }))
      prefetchCategory(clue.categoryId)
      replenish()
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
