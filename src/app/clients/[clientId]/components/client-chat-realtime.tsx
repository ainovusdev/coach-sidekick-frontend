'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import {
  Send,
  Bot,
  User,
  Sparkles,
  MessageSquare,
  Loader2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Headphones,
  Wifi,
  WifiOff,
  X,
  ChevronDown,
  BookOpen,
  Database,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChatMarkdown } from '@/components/ui/chat-markdown'
import { useRealtimeChat } from '@/hooks/use-realtime-chat'
import { chatService, type ChatStats } from '@/services/chat-service'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ClientChatRealtimeProps {
  clientId: string
  clientName?: string
  onClose?: () => void
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: any[]
  isVoice?: boolean
}

export function ClientChatRealtime({
  clientId,
  clientName,
  onClose,
}: ClientChatRealtimeProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [stats, setStats] = useState<ChatStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [mode, setMode] = useState<'text' | 'voice'>('voice')
  const [showSources, setShowSources] = useState<{ [key: string]: boolean }>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Get auth token
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('auth_token') || ''
      : ''

  // Initialize Realtime chat hook
  const {
    isConnected,
    isRecording,
    isSpeaking,
    // transcript,
    interimTranscript,
    sources,
    startRecording,
    stopRecording,
    sendText,
    stopSpeaking,
    clearConversation,
  } = useRealtimeChat({
    clientId,
    token,
    onTranscript: (text, isFinal) => {
      if (isFinal && text) {
        // Add user message
        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          content: text,
          timestamp: new Date(),
          isVoice: true,
        }
        setMessages(prev => [...prev, userMessage])
      }
    },
    onMessage: message => {
      // Handle assistant responses
      if (
        message.type === 'response.audio_transcript.done' &&
        message.transcript
      ) {
        const assistantMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: message.transcript,
          timestamp: new Date(),
          sources: sources,
          isVoice: true,
        }
        setMessages(prev => [...prev, assistantMessage])
      }
    },
    onError: error => {
      console.error('Realtime chat error:', error)
    },
  })

  const fetchStats = useCallback(async () => {
    setLoadingStats(true)
    try {
      const data = await chatService.getClientKnowledgeStats(clientId)
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }, [clientId])

  // Load stats on mount
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendText = () => {
    if (!input.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      isVoice: false,
    }
    setMessages(prev => [...prev, userMessage])

    // Send via Realtime API
    sendText(input)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendText()
    }
  }

  const toggleSources = (messageId: string) => {
    setShowSources(prev => ({ ...prev, [messageId]: !prev[messageId] }))
  }

  const handleClearChat = () => {
    setMessages([])
    clearConversation()
  }

  if (loadingStats) {
    return (
      <Card className="flex flex-col h-full">
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </Card>
    )
  }

  if (!stats || stats.total_chunks === 0) {
    return (
      <Card className="flex flex-col h-full p-4">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              No Knowledge Base Yet
            </h3>
            <p className="text-xs text-gray-500">
              The AI assistant will be available after analyzing coaching
              sessions.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col h-full bg-gradient-to-b from-white to-gray-50/50">
      {/* Header */}
      <div className="border-b bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Headphones className="h-5 w-5 text-white" />
              </div>
              <div
                className={cn(
                  'absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white',
                  isConnected ? 'bg-green-500' : 'bg-red-500',
                )}
              />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Realtime Voice Chat
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className="text-xs">
                  {isConnected ? (
                    <>
                      <Wifi className="h-3 w-3 mr-1" />
                      Connected
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3 mr-1" />
                      Connecting...
                    </>
                  )}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Database className="h-3 w-3 mr-1" />
                  {stats.total_chunks} insights
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <Button
                size="sm"
                variant={mode === 'voice' ? 'default' : 'ghost'}
                onClick={() => setMode('voice')}
                className="h-7 px-2.5 text-xs"
              >
                <Mic className="h-3.5 w-3.5 mr-1" />
                Voice
              </Button>
              <Button
                size="sm"
                variant={mode === 'text' ? 'default' : 'ghost'}
                onClick={() => setMode('text')}
                className="h-7 px-2.5 text-xs"
              >
                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                Text
              </Button>
            </div>

            {onClose && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="h-7 w-7 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8">
            <div className="text-center max-w-md">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 mx-auto mb-4 flex items-center justify-center">
                <Bot className="h-8 w-8 text-violet-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Ready for conversation
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                {mode === 'voice'
                  ? `Hold the record button and speak naturally about ${
                      clientName || 'your client'
                    }`
                  : `Type your questions about ${clientName || 'your client'}`}
              </p>
              {stats.suggested_questions &&
                stats.suggested_questions.length > 0 && (
                  <div className="space-y-2 mt-6">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">
                      Try asking
                    </p>
                    {stats.suggested_questions.slice(0, 2).map((q, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        onClick={() => (mode === 'text' ? setInput(q) : null)}
                        className="text-xs text-left justify-start h-auto py-2 px-3 w-full"
                      >
                        <Sparkles className="h-3 w-3 mr-2 flex-shrink-0 text-violet-500" />
                        <span className="line-clamp-2">{q}</span>
                      </Button>
                    ))}
                  </div>
                )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start',
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[80%] space-y-2',
                    message.role === 'user' && 'text-right',
                  )}
                >
                  <div
                    className={cn(
                      'rounded-xl px-4 py-2.5 shadow-sm',
                      message.role === 'user'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white border border-gray-200',
                    )}
                  >
                    {message.isVoice && (
                      <div
                        className={cn(
                          'flex items-center gap-1.5 mb-1.5 text-xs',
                          message.role === 'user'
                            ? 'text-gray-400'
                            : 'text-gray-500',
                        )}
                      >
                        <Volume2 className="h-3 w-3" />
                        <span>Voice message</span>
                      </div>
                    )}

                    {message.role === 'assistant' ? (
                      <ChatMarkdown content={message.content} />
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                  </div>

                  {/* Sources for assistant messages */}
                  {message.role === 'assistant' &&
                    message.sources &&
                    message.sources.length > 0 && (
                      <button
                        onClick={() => toggleSources(message.id)}
                        className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-800"
                      >
                        <BookOpen className="h-3 w-3" />
                        {showSources[message.id] ? 'Hide' : 'Show'} sources
                        <ChevronDown
                          className={cn(
                            'h-3 w-3 transition-transform',
                            showSources[message.id] && 'rotate-180',
                          )}
                        />
                      </button>
                    )}

                  {showSources[message.id] && message.sources && (
                    <div className="space-y-1.5">
                      {message.sources.map((source: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-gray-50 rounded-lg p-2.5 text-xs"
                        >
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-600">{source.date}</span>
                            <span className="text-gray-500">
                              {(source.relevance * 100).toFixed(0)}% match
                            </span>
                          </div>
                          {source.topics && source.topics.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {source.topics.map((topic: string, i: number) => (
                                <Badge
                                  key={i}
                                  variant="secondary"
                                  className="text-xs py-0"
                                >
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shadow-sm">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Voice Status Indicators */}
            {isRecording && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8" />
                <div className="bg-red-50 text-red-600 rounded-lg px-3 py-2 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm">Listening...</span>
                  {interimTranscript && (
                    <span className="text-sm italic ml-2">
                      {interimTranscript}
                    </span>
                  )}
                </div>
              </div>
            )}

            {isSpeaking && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8" />
                <div className="bg-violet-50 text-violet-600 rounded-lg px-3 py-2 flex items-center gap-2">
                  <Volume2 className="h-4 w-4 animate-pulse" />
                  <span className="text-sm">Speaking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t bg-white p-4">
        {mode === 'voice' ? (
          <div className="flex flex-col items-center gap-3">
            <TooltipProvider>
              <div className="flex items-center gap-3">
                {/* Record Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="lg"
                      variant={isRecording ? 'destructive' : 'default'}
                      onMouseDown={startRecording}
                      onMouseUp={stopRecording}
                      onTouchStart={startRecording}
                      onTouchEnd={stopRecording}
                      disabled={!isConnected}
                      className={cn(
                        'h-16 w-16 rounded-full shadow-lg transition-all',
                        isRecording && 'scale-110',
                      )}
                    >
                      {isRecording ? (
                        <MicOff className="h-6 w-6" />
                      ) : (
                        <Mic className="h-6 w-6" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Hold to record</p>
                  </TooltipContent>
                </Tooltip>

                {/* Stop Speaking Button */}
                {isSpeaking && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={stopSpeaking}
                        className="h-12 w-12 rounded-full"
                      >
                        <VolumeX className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Stop speaking</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Clear Button */}
                {messages.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleClearChat}
                        className="h-10 w-10 rounded-full"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Clear chat</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TooltipProvider>

            <p className="text-xs text-gray-500">
              Hold the button and speak naturally
            </p>
          </div>
        ) : (
          <div className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask about ${clientName || 'this client'}...`}
              className="w-full min-h-[44px] max-h-[120px] pl-4 pr-12 py-3 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              disabled={!isConnected}
              rows={1}
            />
            <Button
              onClick={handleSendText}
              disabled={!input.trim() || !isConnected}
              size="sm"
              className="absolute right-2 bottom-2 h-8 w-8 p-0 rounded-lg"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
