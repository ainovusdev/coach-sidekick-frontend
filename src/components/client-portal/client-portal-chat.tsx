'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Send,
  Bot,
  User,
  Sparkles,
  MessageSquare,
  Loader2,
  RotateCw,
  BookOpen,
  ChevronDown,
  Mic,
  Database,
  Keyboard,
  MicOff,
  Volume2,
  VolumeX,
} from 'lucide-react'
import {
  ClientChatService,
  type ChatMessage,
  type ChatStats,
} from '@/services/client-chat-service'
import { cn } from '@/lib/utils'
import { ChatMarkdown } from '@/components/ui/chat-markdown'
import { useSimpleVoice } from '@/hooks/use-simple-voice'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface DisplayMessage extends ChatMessage {
  id?: string
  timestamp?: Date
  sources?: any[]
  confidence?: string
  isVoice?: boolean
}

export function ClientPortalChat() {
  // State
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<ChatStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])
  const [showSources, setShowSources] = useState<{ [key: number]: boolean }>({})
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text')

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const lastTranscriptRef = useRef<string>('')

  // Initialize simple voice
  const {
    isListening: simpleIsListening,
    isSpeaking: simpleIsSpeaking,
    transcript: simpleTranscript,
    interimTranscript: simpleInterimTranscript,
    startListening: simpleStartListening,
    stopListening: simpleStopListening,
    speak: simpleSpeak,
    stopSpeaking: simpleStopSpeaking,
    isSupported: isVoiceSupported,
    fullTranscript: simpleFullTranscript,
  } = useSimpleVoice()

  const isListening = simpleIsListening
  const isSpeaking = simpleIsSpeaking
  const interimTranscript = simpleInterimTranscript

  const fetchStats = useCallback(async () => {
    setLoadingStats(true)
    try {
      const data = await ClientChatService.getKnowledgeStats()
      setStats(data)
      setSuggestedQuestions(data.suggested_questions || [])
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      setStats({
        total_chunks: 0,
        unique_sessions: 0,
        top_topics: [],
        suggested_questions: [],
      })
    } finally {
      setLoadingStats(false)
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = useCallback(
    async (messageText?: string) => {
      const textToSend = messageText || input.trim()
      if (!textToSend || isLoading) return

      const userMessage: DisplayMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: textToSend,
        timestamp: new Date(),
        isVoice: inputMode === 'voice',
      }
      setMessages(prev => [...prev, userMessage])
      setInput('')
      setIsLoading(true)

      try {
        const response = await ClientChatService.askQuestion(
          userMessage.content,
          messages,
        )

        const assistantMessage: DisplayMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.answer,
          timestamp: new Date(),
          sources: response.sources,
          confidence: response.confidence,
        }

        setMessages(prev => [...prev, assistantMessage])

        if (inputMode === 'voice' && response.answer) {
          simpleSpeak(response.answer)
        }

        if (
          response.suggested_questions &&
          response.suggested_questions.length > 0
        ) {
          setSuggestedQuestions(response.suggested_questions)
        }
      } catch (error) {
        console.error('Failed to send message:', error)
        const errorMessage: DisplayMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            'I encountered an error processing your question. Please try again.',
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, errorMessage])
      } finally {
        setIsLoading(false)
      }
    },
    [input, isLoading, messages, inputMode, simpleSpeak],
  )

  // Load stats on mount
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle simple voice transcript updates
  useEffect(() => {
    if (
      inputMode === 'voice' &&
      simpleTranscript &&
      simpleTranscript !== lastTranscriptRef.current
    ) {
      setInput(simpleFullTranscript)
      lastTranscriptRef.current = simpleTranscript
    }
  }, [simpleTranscript, simpleFullTranscript, inputMode])

  // Auto-send when stop listening
  useEffect(() => {
    if (
      !simpleIsListening &&
      inputMode === 'voice' &&
      simpleTranscript.trim() &&
      lastTranscriptRef.current
    ) {
      const finalText = simpleTranscript.trim()
      setInput('')
      lastTranscriptRef.current = ''
      handleSend(finalText)
    }
  }, [simpleIsListening, inputMode, simpleTranscript, handleSend])

  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
    inputRef.current?.focus()
  }

  const toggleSources = (index: number) => {
    setShowSources(prev => ({ ...prev, [index]: !prev[index] }))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleVoiceToggle = () => {
    if (inputMode === 'voice') {
      setInputMode('text')
      if (simpleIsListening) simpleStopListening()
    } else {
      setInputMode('voice')
    }
  }

  const handleStartVoice = async () => {
    simpleStartListening()
  }

  const handleStopVoice = () => {
    simpleStopListening()
  }

  const handleStopSpeaking = () => {
    simpleStopSpeaking()
  }

  const handleClearChat = () => {
    setMessages([])
  }

  if (loadingStats) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  if (!stats || stats.total_chunks === 0) {
    const hasSessionData = stats && stats.unique_sessions > 0

    return (
      <div className="flex flex-col h-full p-4">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              AI Assistant Not Available Yet
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              {hasSessionData
                ? 'Your coaching sessions are being processed. Please try again in a few moments.'
                : 'The AI assistant will be available after your coaching sessions are analyzed.'}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchStats()}
              className="mt-4"
            >
              <RotateCw className="h-3 w-3 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
        <div className="px-5 py-4">
          {/* Title Row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-white shadow-sm flex items-center justify-center border border-gray-200">
                <MessageSquare className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  AI Coaching Assistant
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Reflect on your coaching journey
                </p>
              </div>
            </div>

            {/* Clear Chat */}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClearChat}
              className="h-9 w-9 p-0 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              title="Clear chat"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-gray-200 shadow-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                <span className="text-xs font-medium text-gray-700">
                  {stats.unique_sessions} sessions
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-gray-200 shadow-sm">
                <Database className="h-3 w-3 text-gray-500" />
                <span className="text-xs font-medium text-gray-700">
                  {stats.total_chunks} insights
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 bg-gray-50/50">
        <div className="p-5 space-y-4">
          {messages.length === 0 ? (
            <div>
              <div className="text-center py-8">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mx-auto mb-4 flex items-center justify-center shadow-sm">
                  <Bot className="h-7 w-7 text-gray-600" />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Ask about your coaching journey
                </p>
                <p className="text-xs text-gray-500">
                  Reflect on your sessions, goals, and progress
                </p>
              </div>

              {/* Suggested Questions */}
              {suggestedQuestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wider text-center">
                    Suggested Questions
                  </p>
                  {suggestedQuestions.slice(0, 3).map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestedQuestion(question)}
                      className="w-full text-left p-3 rounded-lg bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 transition-colors">
                          <Sparkles className="h-3 w-3 text-gray-600" />
                        </div>
                        <span className="text-xs text-gray-700 leading-relaxed font-medium">
                          {question}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {messages.map((message, idx) => {
                const isAssistant = message.role === 'assistant'

                return (
                  <div
                    key={message.id || idx}
                    className={cn(
                      'flex gap-2',
                      isAssistant ? 'justify-start' : 'justify-end',
                    )}
                  >
                    {isAssistant && (
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-sm">
                          <Bot className="h-4 w-4 text-gray-700" />
                        </div>
                      </div>
                    )}

                    <div
                      className={cn(
                        'max-w-[85%] space-y-2',
                        !isAssistant && 'text-right',
                      )}
                    >
                      <div
                        className={cn(
                          'rounded-lg px-3.5 py-2.5 shadow-sm',
                          isAssistant
                            ? 'bg-white text-gray-900 border border-gray-200'
                            : 'bg-gray-900 text-white border border-gray-800',
                        )}
                      >
                        {message.isVoice && (
                          <div
                            className={cn(
                              'flex items-center gap-1.5 mb-1.5 text-xs',
                              isAssistant ? 'text-gray-500' : 'text-gray-400',
                            )}
                          >
                            <Volume2 className="h-3 w-3" />
                            <span>Voice message</span>
                          </div>
                        )}

                        {isAssistant ? (
                          <ChatMarkdown content={message.content} />
                        ) : (
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {message.content}
                          </p>
                        )}
                      </div>

                      {/* Sources for assistant messages */}
                      {isAssistant &&
                        message.sources &&
                        message.sources.length > 0 && (
                          <div className="space-y-1">
                            <button
                              onClick={() => toggleSources(idx)}
                              className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                            >
                              <BookOpen className="h-3 w-3" />
                              <span>
                                {showSources[idx] ? 'Hide' : 'Show'}{' '}
                                {message.sources.length} source
                                {message.sources.length > 1 ? 's' : ''}
                              </span>
                              <ChevronDown
                                className={cn(
                                  'h-3 w-3 transition-transform',
                                  showSources[idx] && 'rotate-180',
                                )}
                              />
                            </button>

                            {showSources[idx] && (
                              <div className="space-y-2 mt-2">
                                {message.sources.map(
                                  (source: any, sourceIdx: number) => (
                                    <div
                                      key={sourceIdx}
                                      className="bg-white rounded-lg border border-gray-200 p-2.5"
                                    >
                                      <div className="flex items-start justify-between mb-1">
                                        <span className="text-xs text-gray-600">
                                          {new Date(
                                            source.date || source.timestamp,
                                          ).toLocaleDateString()}
                                        </span>
                                        <span className="text-xs font-medium text-gray-500">
                                          {(
                                            source.relevance_score * 100
                                          ).toFixed(0)}
                                          % match
                                        </span>
                                      </div>
                                      {source.content && (
                                        <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">
                                          {source.content}
                                        </p>
                                      )}
                                    </div>
                                  ),
                                )}
                              </div>
                            )}
                          </div>
                        )}
                    </div>

                    {!isAssistant && (
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-sm">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Loading state */}
              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-sm">
                    <Bot className="h-4 w-4 text-gray-700" />
                  </div>
                  <div className="bg-white rounded-lg px-4 py-3 border border-gray-200 shadow-sm flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-600" />
                    <span className="text-xs text-gray-500">Thinking...</span>
                  </div>
                </div>
              )}

              {/* Voice status indicators */}
              {isListening && (
                <div className="flex gap-2 justify-end">
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
                <div className="flex gap-2 justify-start">
                  <div className="h-8 w-8" />
                  <div className="bg-violet-50 text-violet-600 rounded-lg px-3 py-2 flex items-center gap-2">
                    <Volume2 className="h-4 w-4 animate-pulse" />
                    <span className="text-sm">Speaking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-gradient-to-b from-white to-gray-50">
        <div className="flex gap-2">
          {/* Voice/Text Toggle */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={inputMode === 'voice' ? 'default' : 'outline'}
                  onClick={handleVoiceToggle}
                  className={cn(
                    'h-10 w-10 p-0 rounded-lg transition-all flex-shrink-0',
                    inputMode === 'voice'
                      ? 'bg-gray-900 hover:bg-gray-800 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
                  )}
                  disabled={isListening}
                >
                  {inputMode === 'voice' ? (
                    <Mic className="h-4 w-4" />
                  ) : (
                    <Keyboard className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {inputMode === 'voice'
                    ? 'Switch to text input'
                    : 'Switch to voice input'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Input Field or Voice Controls */}
          {inputMode === 'text' ? (
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your coaching journey..."
                className="w-full min-h-[40px] max-h-[120px] pl-4 pr-12 py-2.5 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent placeholder:text-gray-400 bg-white shadow-sm"
                disabled={isLoading}
                rows={1}
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-900 hover:bg-gray-800 text-white h-7 w-7 p-0 rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-3">
              {/* Voice Record Button */}
              <Button
                size="lg"
                variant={isListening ? 'destructive' : 'default'}
                onMouseDown={handleStartVoice}
                onMouseUp={handleStopVoice}
                onTouchStart={handleStartVoice}
                onTouchEnd={handleStopVoice}
                disabled={!isVoiceSupported}
                className={cn(
                  'h-12 w-12 rounded-full shadow-lg transition-all',
                  isListening && 'scale-110',
                )}
              >
                {isListening ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>

              {/* Stop Speaking Button */}
              {isSpeaking && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleStopSpeaking}
                  className="h-10 px-3"
                >
                  <VolumeX className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              )}

              <span className="text-xs text-gray-500">
                {isListening ? 'Release to send' : 'Hold to speak'}
              </span>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">
            {inputMode === 'voice'
              ? 'Classic Voice \u2022 Text-to-speech enabled'
              : 'Enter to send \u2022 Shift+Enter for new line'}
          </p>
          {messages.length > 0 && (
            <span className="text-xs text-gray-400">
              {messages.length} messages
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
