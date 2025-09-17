'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Loader2,
  Wifi,
  WifiOff,
  Activity,
} from 'lucide-react'
import { useRealtimeChat } from '@/hooks/use-realtime-chat'
import { cn } from '@/lib/utils'

interface RealtimeVoiceModalProps {
  open: boolean
  onClose: () => void
  clientId: string
  clientName?: string
}

export function RealtimeVoiceModal({
  open,
  onClose,
  clientId,
  clientName,
}: RealtimeVoiceModalProps) {
  const [currentUserTranscript, setCurrentUserTranscript] = useState('')
  const [currentAssistantTranscript, setCurrentAssistantTranscript] =
    useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [hasUserSpoken, setHasUserSpoken] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState('alloy')

  // Get auth token
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('auth_token') || ''
      : ''

  // Initialize Realtime chat
  const {
    isConnected,
    isSpeaking,
    currentVoice,
    startRecording,
    stopRecording,
    stopSpeaking,
    clearConversation,
    sendMessage,
  } = useRealtimeChat({
    clientId,
    token,
    voice: selectedVoice,
    enabled: open, // Only connect when modal is open
    onTranscript: (_text, _isFinal) => {
      // Don't handle here - we'll handle transcripts directly in onMessage
      // This callback receives both user AND AI transcripts from the hook
    },
    onMessage: message => {
      console.log('Received message:', message.type)

      // Handle user speech transcripts
      if (
        message.type === 'conversation.item.input_audio_transcription.completed'
      ) {
        // This is the user's final transcript from VAD
        if (message.transcript) {
          console.log('User transcript:', message.transcript)
          setCurrentUserTranscript(message.transcript)
          setHasUserSpoken(true)
          // Clear AI transcript when user speaks
          setCurrentAssistantTranscript('')
        }
      } else if (message.type === 'input_audio_buffer.speech_started') {
        // User started speaking - clear AI transcript
        console.log('User started speaking')
        setCurrentAssistantTranscript('')
      } else if (message.type === 'input_audio_buffer.speech_stopped') {
        // User stopped speaking
        console.log('User stopped speaking')
      }

      // Handle assistant responses
      else if (
        message.type === 'response.audio_transcript.delta' &&
        message.delta
      ) {
        // AI is speaking - accumulate transcript
        console.log('AI transcript delta:', message.delta)
        // Clear user transcript when AI starts responding
        if (hasUserSpoken) {
          setCurrentUserTranscript('')
          setHasUserSpoken(false)
        }
        setCurrentAssistantTranscript(prev => prev + message.delta)
      } else if (message.type === 'response.audio_transcript.done') {
        // AI finished speaking - keep the final transcript visible
        if (message.transcript) {
          console.log('AI transcript done:', message.transcript)
          setCurrentAssistantTranscript(message.transcript)
        }
      } else if (message.type === 'response.done') {
        // Response completely done
        console.log('Response complete')
      }
    },
    onError: error => {
      console.error('Realtime chat error:', error)
    },
  })

  // Toggle recording
  const handleToggleRecording = async () => {
    if (isRecording) {
      stopRecording()
      setIsRecording(false)
    } else {
      // Clear only assistant transcript when starting new recording
      // Keep user transcript visible until AI responds
      setCurrentAssistantTranscript('')
      await startRecording()
      setIsRecording(true)
    }
  }

  // Interrupt AI speaking
  const handleInterrupt = () => {
    if (isSpeaking) {
      stopSpeaking()
      // Send cancel message to stop generation
      sendMessage({ type: 'response.cancel' })
      setCurrentAssistantTranscript('')
    }
  }

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      // Clear local state when opening
      setCurrentUserTranscript('')
      setCurrentAssistantTranscript('')
      setIsRecording(false)
      setHasUserSpoken(false)
    }
  }, [open])

  // Handle voice change
  const handleVoiceChange = (voice: string) => {
    // Only allow voice change when not connected
    // OpenAI doesn't allow changing voice mid-conversation
    if (!isConnected) {
      setSelectedVoice(voice)
    }
  }

  // Sync voice from hook if it changes
  useEffect(() => {
    if (currentVoice && currentVoice !== selectedVoice) {
      setSelectedVoice(currentVoice)
    }
  }, [currentVoice, selectedVoice])

  // Voice options - updated to match OpenAI's supported values
  const voices = [
    { value: 'alloy', label: 'Alloy (Neutral)' },
    { value: 'ash', label: 'Ash (Conversational)' },
    { value: 'ballad', label: 'Ballad (Warm)' },
    { value: 'coral', label: 'Coral (Friendly)' },
    { value: 'echo', label: 'Echo (Smooth)' },
    { value: 'sage', label: 'Sage (Wise)' },
    { value: 'shimmer', label: 'Shimmer (Soft)' },
    { value: 'verse', label: 'Verse (Professional)' },
  ]

  // Voice can only be set before connection
  // OpenAI Realtime API doesn't allow changing voice after audio is present

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] h-[600px] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle>Voice Chat with AI</DialogTitle>
              {clientName && (
                <Badge variant="secondary">About {clientName}</Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={selectedVoice}
                onValueChange={handleVoiceChange}
                disabled={isConnected}
              >
                <SelectTrigger className="w-[140px] h-8" disabled={isConnected}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {voices.map(voice => (
                    <SelectItem key={voice.value} value={voice.value}>
                      {voice.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isConnected ? (
                <Badge variant="default" className="gap-1">
                  <Wifi className="h-3 w-3" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <WifiOff className="h-3 w-3" />
                  Connecting...
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Current Transcript Area */}
          <ScrollArea className="flex-1 px-6 py-4">
            <div className="min-h-full flex items-center justify-center">
              <div className="w-full max-w-lg space-y-6 py-4">
                {/* User transcript */}
                {currentUserTranscript && (
                  <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2">
                    <div className="max-w-[85%] rounded-2xl px-6 py-4 bg-primary text-primary-foreground shadow-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Mic className="h-4 w-4" />
                        <span className="text-xs font-medium">You</span>
                      </div>
                      <p className="text-base break-words max-h-[200px] overflow-y-auto">
                        {currentUserTranscript}
                      </p>
                    </div>
                  </div>
                )}

                {/* AI is speaking */}
                {currentAssistantTranscript && (
                  <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2">
                    <div className="max-w-[85%] rounded-2xl px-6 py-4 bg-muted shadow-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Volume2 className="h-4 w-4 animate-pulse" />
                        <span className="text-xs font-medium">
                          AI is speaking
                        </span>
                      </div>
                      <ScrollArea className="max-h-[300px]">
                        <p className="text-base break-words pr-2">
                          {currentAssistantTranscript}
                        </p>
                      </ScrollArea>
                    </div>
                  </div>
                )}

                {/* Ready state */}
                {!currentUserTranscript && !currentAssistantTranscript && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium mb-2">Ready to chat</p>
                    <p className="text-sm opacity-70">
                      {isConnected
                        ? 'Click the microphone to start speaking'
                        : 'Connecting...'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          {/* Controls */}
          <div className="border-t px-6 py-4">
            <div className="flex items-center justify-center gap-4">
              {/* Interrupt Button - Show when AI is speaking */}
              {isSpeaking && (
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={handleInterrupt}
                  className="h-12 w-12 rounded-full"
                  title="Interrupt AI"
                >
                  <VolumeX className="h-5 w-5" />
                </Button>
              )}

              {/* Main Recording Button */}
              <Button
                variant={isRecording ? 'destructive' : 'default'}
                size="icon"
                onClick={handleToggleRecording}
                disabled={!isConnected || isSpeaking}
                className={cn(
                  'h-16 w-16 rounded-full transition-all shadow-lg',
                  isRecording && 'animate-pulse',
                  isSpeaking && 'opacity-50',
                )}
              >
                {!isConnected ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="h-6 w-6" />
                ) : (
                  <Mic className="h-6 w-6" />
                )}
              </Button>

              {/* Clear Conversation Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setCurrentUserTranscript('')
                  setCurrentAssistantTranscript('')
                  setHasUserSpoken(false)
                  // Only clear server-side conversation if connected
                  if (isConnected) {
                    clearConversation()
                  }
                }}
                className="h-12 w-12 rounded-full"
                title="Clear conversation"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-3">
              {isRecording ? (
                <span className="text-destructive font-medium">
                  Recording... Click to stop
                </span>
              ) : (
                'Click the microphone to start speaking'
              )}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
