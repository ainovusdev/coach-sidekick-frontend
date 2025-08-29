'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export function useSimpleVoice() {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const recognitionRef = useRef<any>(null)
  const isListeningRef = useRef(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Check if speech recognition is supported
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  useEffect(() => {
    if (!isSupported) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      console.log('Speech recognition started')
      setIsListening(true)
      isListeningRef.current = true
    }

    recognition.onend = () => {
      console.log('Speech recognition ended')
      setIsListening(false)
      isListeningRef.current = false
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
      isListeningRef.current = false
    }

    recognition.onresult = (event: any) => {
      let final = ''
      let interim = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcript + ' '
        } else {
          interim += transcript
        }
      }

      if (final) {
        setTranscript(prev => prev + final)
        setInterimTranscript('')
      } else {
        setInterimTranscript(interim)
      }
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {
          // Ignore
        }
      }
    }
  }, [isSupported])

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListeningRef.current) {
      console.log('Cannot start: already listening or no recognition')
      return
    }

    setTranscript('')
    setInterimTranscript('')
    
    try {
      recognitionRef.current.start()
    } catch (e) {
      console.error('Failed to start:', e)
    }
  }, [])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListeningRef.current) {
      console.log('Cannot stop: not listening')
      return
    }

    try {
      recognitionRef.current.stop()
    } catch (e) {
      console.error('Failed to stop:', e)
    }
  }, [])

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      utteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      utteranceRef.current = null
    }
  }, [])

  return {
    isListening,
    isSpeaking,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    isSupported,
    fullTranscript: transcript + interimTranscript
  }
}