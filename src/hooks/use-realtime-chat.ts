/**
 * Hook for managing OpenAI Realtime API WebSocket connection
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  AudioProcessor,
  MicrophoneCapture,
  RealtimeAudioFormat,
} from '@/utils/audio-processing'

export interface RealtimeMessage {
  type: string
  [key: string]: any
}

export interface RealtimeSource {
  date: string
  topics: string[]
  relevance: number
}

export interface RealtimeConfig {
  clientId: string
  token: string
  enabled?: boolean // Add enabled flag
  voice?: string // Add voice option
  onMessage?: (message: RealtimeMessage) => void
  onTranscript?: (transcript: string, isFinal: boolean) => void
  onSources?: (sources: RealtimeSource[]) => void
  onError?: (error: Error) => void
  onConnectionChange?: (connected: boolean) => void
}

export function useRealtimeChat(config: RealtimeConfig) {
  const {
    clientId,
    token,
    enabled = true, // Default to enabled
    voice = 'alloy', // Default voice
    onMessage,
    onTranscript,
    onSources,
    onError,
    onConnectionChange,
  } = config

  // State
  const [isConnected, setIsConnected] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [sources, setSources] = useState<RealtimeSource[]>([])
  const [currentVoice, setCurrentVoice] = useState(voice)

  // Refs
  const wsRef = useRef<WebSocket | null>(null)
  const audioProcessorRef = useRef<AudioProcessor | null>(null)
  const microphoneCaptureRef = useRef<MicrophoneCapture | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const audioBufferRef = useRef<ArrayBuffer[]>([])
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectDelayRef = useRef(1000) // Start with 1 second
  const isConnectingRef = useRef(false) // Prevent multiple connection attempts

  // Initialize audio processor
  useEffect(() => {
    audioProcessorRef.current = new AudioProcessor()

    return () => {
      audioProcessorRef.current?.destroy()
    }
  }, [])

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(() => {
    // Prevent multiple simultaneous connections
    if (
      isConnectingRef.current ||
      wsRef.current?.readyState === WebSocket.OPEN ||
      wsRef.current?.readyState === WebSocket.CONNECTING
    ) {
      console.log('WebSocket already connected or connecting')
      return
    }

    isConnectingRef.current = true

    try {
      // Construct WebSocket URL with token
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
      const url = `${wsUrl}/api/v1/realtime/ws/realtime/${clientId}?token=${encodeURIComponent(token)}`

      console.log('Creating new WebSocket connection to:', url)
      wsRef.current = new WebSocket(url)

      wsRef.current.onopen = () => {
        console.log('Realtime WebSocket connected')
        setIsConnected(true)
        onConnectionChange?.(true)
        isConnectingRef.current = false // Reset connecting flag

        // Reset reconnection attempts on successful connection
        reconnectAttemptsRef.current = 0
        reconnectDelayRef.current = 1000

        // Clear any reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }

        // Send initial session configuration with voice
        if (wsRef.current) {
          const sessionConfig: RealtimeMessage = {
            type: 'session.update',
            session: {
              voice: currentVoice,
            },
          }
          wsRef.current.send(JSON.stringify(sessionConfig))
        }
      }

      wsRef.current.onmessage = async event => {
        try {
          const message: RealtimeMessage = JSON.parse(event.data)

          // Call general message handler
          onMessage?.(message)

          // Handle specific message types
          switch (message.type) {
            case 'response.audio.delta':
              // Play audio delta
              if (message.delta) {
                setIsSpeaking(true)
                await audioProcessorRef.current?.playPCM16Audio(message.delta)
              }
              break

            case 'response.audio.done':
              setIsSpeaking(false)
              break

            case 'response.audio_transcript.delta':
              // Update interim transcript
              if (message.delta) {
                setInterimTranscript(prev => prev + message.delta)
                onTranscript?.(message.delta, false)
              }
              break

            case 'response.audio_transcript.done':
              // Finalize transcript
              if (message.transcript) {
                setTranscript(message.transcript)
                setInterimTranscript('')
                onTranscript?.(message.transcript, true)
              }
              break

            case 'conversation.item.created':
              // Handle function call results (sources)
              if (message.item?.type === 'function_call_output') {
                try {
                  const output = JSON.parse(message.item.output)
                  if (output.sources) {
                    setSources(output.sources)
                    onSources?.(output.sources)
                  }
                } catch (e) {
                  console.error('Error parsing function output:', e)
                }
              }
              break

            case 'error':
              console.error('Realtime API error:', message.error)
              onError?.(new Error(message.error?.message || 'Unknown error'))
              break
          }
        } catch (error) {
          console.error('Error processing message:', error)
          onError?.(error as Error)
        }
      }

      wsRef.current.onerror = error => {
        console.error('WebSocket error:', error)
        onError?.(new Error('WebSocket connection error'))
        isConnectingRef.current = false // Reset connecting flag
      }

      wsRef.current.onclose = event => {
        console.log('Realtime WebSocket disconnected', event.code, event.reason)
        setIsConnected(false)
        setIsSpeaking(false)
        onConnectionChange?.(false)
        isConnectingRef.current = false // Reset connecting flag

        // Only attempt to reconnect if not a deliberate close and under max attempts
        if (
          event.code !== 1000 &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          reconnectAttemptsRef.current++
          const delay = Math.min(
            reconnectDelayRef.current *
              Math.pow(2, reconnectAttemptsRef.current - 1),
            30000,
          )

          console.log(
            `Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts}) in ${delay}ms...`,
          )

          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.error('Max reconnection attempts reached')
          onError?.(
            new Error('Unable to establish connection after multiple attempts'),
          )
        }
      }
    } catch (error) {
      console.error('Failed to connect:', error)
      onError?.(error as Error)
      isConnectingRef.current = false // Reset connecting flag on error
    }
  }, [
    clientId,
    token,
    currentVoice,
    onMessage,
    onTranscript,
    onSources,
    onError,
    onConnectionChange,
  ])

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setIsConnected(false)
    setIsSpeaking(false)
  }, [])

  /**
   * Send message to WebSocket
   */
  const sendMessage = useCallback(
    (message: RealtimeMessage) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(message))
      } else {
        console.error('WebSocket not connected')
        onError?.(new Error('WebSocket not connected'))
      }
    },
    [onError],
  )

  /**
   * Start recording audio
   */
  const startRecording = useCallback(async () => {
    if (isRecording) return

    try {
      // Resume audio context if needed
      await audioProcessorRef.current?.resumeContext()

      // Create microphone capture
      microphoneCaptureRef.current = new MicrophoneCapture(audioData => {
        // Buffer audio data
        audioBufferRef.current.push(audioData)

        // Send audio in chunks (every 100ms worth of data)
        if (audioBufferRef.current.length >= 2) {
          const combined = combineAudioBuffers(audioBufferRef.current)
          audioBufferRef.current = []

          // Send audio to Realtime API
          const message = RealtimeAudioFormat.createAudioAppendMessage(combined)
          sendMessage(message as RealtimeMessage)
        }
      })

      const success = await microphoneCaptureRef.current.start()
      if (success) {
        setIsRecording(true)
        setTranscript('')
        setInterimTranscript('')
      } else {
        throw new Error('Failed to start microphone')
      }
    } catch (error) {
      console.error('Error starting recording:', error)
      onError?.(error as Error)
    }
  }, [isRecording, sendMessage, onError])

  /**
   * Stop recording audio
   */
  const stopRecording = useCallback(() => {
    if (!isRecording) return

    // Send any remaining buffered audio
    if (audioBufferRef.current.length > 0) {
      const combined = combineAudioBuffers(audioBufferRef.current)
      audioBufferRef.current = []
      const message = RealtimeAudioFormat.createAudioAppendMessage(combined)
      sendMessage(message as RealtimeMessage)
    }

    // Commit audio buffer to trigger response
    sendMessage(
      RealtimeAudioFormat.createAudioCommitMessage() as RealtimeMessage,
    )

    // Stop microphone
    microphoneCaptureRef.current?.stop()
    microphoneCaptureRef.current = null
    setIsRecording(false)
  }, [isRecording, sendMessage])

  /**
   * Send text message
   */
  const sendText = useCallback(
    (text: string) => {
      const message: RealtimeMessage = {
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text,
            },
          ],
        },
      }

      sendMessage(message)

      // Trigger response
      sendMessage({ type: 'response.create' } as RealtimeMessage)
    },
    [sendMessage],
  )

  /**
   * Stop audio playback
   */
  const stopSpeaking = useCallback(() => {
    audioProcessorRef.current?.stopPlayback()
    setIsSpeaking(false)

    // Send cancel message to API
    sendMessage({ type: 'response.cancel' } as RealtimeMessage)
  }, [sendMessage])

  /**
   * Clear conversation
   */
  const clearConversation = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setSources([])

    // Only clear conversation on server if connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      sendMessage({ type: 'input_audio_buffer.clear' } as RealtimeMessage)
    }
  }, [sendMessage])

  /**
   * Update voice setting
   */
  const updateVoice = useCallback(
    (voice: string) => {
      setCurrentVoice(voice)

      // Update session configuration if connected
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const message: RealtimeMessage = {
          type: 'session.update',
          session: {
            voice: voice,
          },
        }
        sendMessage(message)
      }
    },
    [sendMessage],
  )

  // Auto-connect/disconnect based on enabled flag
  useEffect(() => {
    if (enabled) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]) // Only depend on enabled flag to avoid circular dependencies

  return {
    // State
    isConnected,
    isRecording,
    isSpeaking,
    transcript,
    interimTranscript,
    sources,
    currentVoice,

    // Actions
    connect,
    disconnect,
    startRecording,
    stopRecording,
    sendText,
    stopSpeaking,
    clearConversation,
    sendMessage,
    updateVoice,
  }
}

/**
 * Combine multiple audio buffers into one
 */
function combineAudioBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
  const totalLength = buffers.reduce((sum, buf) => sum + buf.byteLength, 0)
  const combined = new Uint8Array(totalLength)

  let offset = 0
  for (const buffer of buffers) {
    combined.set(new Uint8Array(buffer), offset)
    offset += buffer.byteLength
  }

  return combined.buffer
}
