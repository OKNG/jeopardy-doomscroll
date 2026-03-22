import { useRef, useState, useEffect, useCallback } from 'react'

const SpeechRecognition = typeof window !== 'undefined'
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : null

export function useSpeechRecognition({ onResult, timeout = 5000 }) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)
  const timeoutRef = useRef(null)
  const gotResultRef = useRef(false)
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult

  const isSupported = !!SpeechRecognition

  const stop = useCallback(() => {
    clearTimeout(timeoutRef.current)
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch {}
      recognitionRef.current = null
    }
    setIsListening(false)
  }, [])

  const start = useCallback(() => {
    if (!SpeechRecognition) return

    // Clean up any existing instance
    stop()

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 3
    recognition.continuous = false
    recognitionRef.current = recognition
    gotResultRef.current = false

    recognition.onresult = (event) => {
      gotResultRef.current = true
      const transcripts = []
      for (let i = 0; i < event.results[0].length; i++) {
        transcripts.push(event.results[0][i].transcript)
      }
      clearTimeout(timeoutRef.current)
      recognitionRef.current = null
      setIsListening(false)
      onResultRef.current(transcripts)
    }

    recognition.onerror = (event) => {
      clearTimeout(timeoutRef.current)
      recognitionRef.current = null
      setIsListening(false)
      if (event.error === 'not-allowed') {
        onResultRef.current([], 'mic-denied')
      } else {
        onResultRef.current([])
      }
    }

    recognition.onend = () => {
      clearTimeout(timeoutRef.current)
      if (!gotResultRef.current) {
        recognitionRef.current = null
        setIsListening(false)
        onResultRef.current([])
      }
    }

    // Safety timeout
    timeoutRef.current = setTimeout(() => {
      stop()
      if (!gotResultRef.current) {
        onResultRef.current([])
      }
    }, timeout)

    setIsListening(true)
    recognition.start()
  }, [stop, timeout])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current)
      if (recognitionRef.current) {
        try { recognitionRef.current.abort() } catch {}
      }
    }
  }, [])

  return { start, stop, isListening, isSupported }
}
