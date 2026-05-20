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
  Brain,
  Zap,
  Database,
  Keyboard,
  MicOff,
  Volume2,
  VolumeX,
} from 'lucide-react'
import {
  chatService,
  type ChatMessage,
  type ChatStats,
} from '@/services/chat-service'
import { cn } from '@/lib/utils'
import { ChatMarkdown } from '@/components/ui/chat-markdown'
import { useSimpleVoice } from '@/hooks/use-simple-voice'
import { RealtimeVoiceModal } from './realtime-voice-modal'
import {
  AIProviderSelector,
  type AIProvider,
} from '@/components/ui/ai-provider-selector'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatDate } from '@/lib/date-utils'

interface ClientChatUnifiedProps {
  clientId: string
  clientName?: string
}

interface DisplayMessage extends ChatMessage {
  id?: string
  timestamp?: Date
  sources?: any[]
  confidence?: string
  provider?: string
  isVoice?: boolean
}

export function ClientChatUnified({
  clientId,
  clientName,
}: ClientChatUnifiedProps) {
  // State
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<ChatStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])
  const [showSources, setShowSources] = useState<{ [key: number]: boolean }>({})
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('openai')
  const [showProviderSettings, setShowProviderSettings] = useState(false)
  const [showRealtimeModal, setShowRealtimeModal] = useState(false)
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text')

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const lastTranscriptRef = useRef<string>('')

  // Initialize simple voice for text mode
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

  // Determine active voice states
  const isListening = simpleIsListening
  const isSpeaking = simpleIsSpeaking
  const interimTranscript = simpleInterimTranscript

  const fetchStats = useCallback(async () => {
    setLoadingStats(true)
    try {
      const data = await chatService.getClientKnowledgeStats(clientId)
      setStats(data)
      setSuggestedQuestions(data.suggested_questions || [])
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      // Set empty stats on error to prevent infinite loading
      setStats({
        total_chunks: 0,
        unique_sessions: 0,
        top_topics: [],
        suggested_questions: [],
      })
    } finally {
      setLoadingStats(false)
    }
  }, [clientId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = useCallback(
    async (messageText?: string) => {
      const textToSend = messageText || input.trim()
      if (!textToSend || isLoading) return

      // TODO: Add realtime voice support
      // if (useRealtimeVoice && realtimeConnected) {
      //   realtimeSendText(textToSend)
      //   setInput('')
      //   return
      // }

      // Otherwise use traditional API
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
        const response = await chatService.askQuestion(
          clientId,
          userMessage.content,
          messages,
          selectedProvider,
        )

        const assistantMessage: DisplayMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.answer,
          timestamp: new Date(),
          sources: response.sources,
          confidence: response.confidence,
          provider: response.provider,
        }

        setMessages(prev => [...prev, assistantMessage])

        // Text-to-speech for the response if voice is enabled
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
    [
      clientId,
      input,
      isLoading,
      messages,
      selectedProvider,
      inputMode,
      simpleSpeak,
    ],
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
      // Switch to text mode
      setInputMode('text')
      if (simpleIsListening) simpleStopListening()
    } else {
      // Switch to voice mode
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
          <Loader2 className="h-6 w-6 animate-spin text-ink-4" />
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
            <MessageSquare className="h-10 w-10 text-ink-2 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-ink mb-1">
              Knowledge Base Not Available
            </h3>
            <p className="text-xs text-ink-3 mb-3">
              {hasSessionData
                ? 'The knowledge base is currently being indexed. Please try again in a few moments.'
                : 'The AI assistant will be available after analyzing coaching sessions.'}
            </p>
            {!hasSessionData && (
              <p className="text-xs text-ink-4 ">
                Upload or record coaching sessions to enable AI-powered
                insights.
              </p>
            )}
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
    <div className="flex flex-col h-full bg-surface-1 rounded-xl shadow-sm border border-line overflow-hidden">
      {/* Header */}
      <div className=" border-b border-line ">
        <div className="px-5 py-4">
          {/* Title Row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-surface-1 shadow-sm flex items-center justify-center border border-line ">
                <MessageSquare className="h-5 w-5 text-ink-2 " />
              </div>
              <div>
                <h3 className="text-base font-semibold text-ink ">
                  {clientName ? `Chat with ${clientName}'s AI` : 'AI Assistant'}
                </h3>
                <p className="text-xs text-ink-3 mt-0.5">
                  Powered by your coaching session insights
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Realtime Voice Button */}
              <TooltipProvider>
                <Tooltip>
                  {/* <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowRealtimeModal(true)}
                      className="h-9 px-3 bg-indigo-bg hover:bg-indigo-bg border-indigo text-indigo"
                    >
                      <Headphones className="h-3.5 w-3.5 mr-1.5" />
                      <span className="text-sm font-medium">Voice Chat</span>
                    </Button>
                  </TooltipTrigger> */}
                  <TooltipContent>
                    <p>Open realtime voice chat (~300ms latency)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* AI Provider Selector */}
              {
                <Popover
                  open={showProviderSettings}
                  onOpenChange={setShowProviderSettings}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-3 bg-surface-1 hover:bg-paper border-line shadow-sm"
                    >
                      {selectedProvider === 'openai' && (
                        <Brain className="h-3.5 w-3.5 mr-1.5 text-ink-3 " />
                      )}
                      {selectedProvider === 'gemini' && (
                        <Sparkles className="h-3.5 w-3.5 mr-1.5 text-ink-3 " />
                      )}
                      {selectedProvider === 'claude' && (
                        <Zap className="h-3.5 w-3.5 mr-1.5 text-ink-3 " />
                      )}
                      <span className="text-sm font-medium capitalize text-ink-2 ">
                        {selectedProvider}
                      </span>
                      <ChevronDown className="h-3 w-3 ml-1.5 text-ink-4 " />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4" align="end">
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold text-ink ">
                          AI Model
                        </h4>
                        <p className="text-xs text-ink-3 mt-1">
                          Choose which AI model to power your conversations
                        </p>
                      </div>
                      <AIProviderSelector
                        value={selectedProvider}
                        onChange={provider => {
                          setSelectedProvider(provider)
                          setShowProviderSettings(false)
                        }}
                        variant="radio"
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              }

              {/* Clear Chat */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearChat}
                className="h-9 w-9 p-0 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-3 "
                title="Clear chat"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-1 rounded-full border border-line shadow-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-forest"></div>
                <span className="text-xs font-medium text-ink-2 ">
                  {stats.unique_sessions} sessions
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-1 rounded-full border border-line shadow-sm">
                <Database className="h-3 w-3 text-ink-3" />
                <span className="text-xs font-medium text-ink-2 ">
                  {stats.total_chunks} insights
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 bg-paper/50 ">
        <div className="p-5 space-y-4">
          {messages.length === 0 ? (
            <div>
              <div className="text-center py-8">
                <div className="h-14 w-14 rounded-full  mx-auto mb-4 flex items-center justify-center shadow-sm">
                  <Bot className="h-7 w-7 text-ink-3 " />
                </div>
                <p className="text-sm font-medium text-ink mb-1">
                  Ready to assist you
                </p>
                <p className="text-xs text-ink-3 ">
                  Ask me anything about {clientName || 'your client'}
                </p>
              </div>

              {/* Suggested Questions */}
              {suggestedQuestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-ink-3 uppercase tracking-wider text-center">
                    Suggested Questions
                  </p>
                  {suggestedQuestions.slice(0, 3).map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestedQuestion(question)}
                      className="w-full text-left p-3 rounded-lg bg-surface-1 border border-line hover:border-line-strong hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="h-6 w-6 rounded-full bg-surface-3 flex items-center justify-center flex-shrink-0 group-hover:bg-surface-3 transition-colors">
                          <Sparkles className="h-3 w-3 text-ink-3 " />
                        </div>
                        <span className="text-xs text-ink-2 leading-relaxed font-medium">
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
                        <div className="h-8 w-8 rounded-lg bg-surface-3 flex items-center justify-center shadow-sm">
                          <Bot className="h-4 w-4 text-ink-2" />
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
                            ? 'bg-surface-1 text-ink border border-line '
                            : 'bg-ink text-ink-on-dark border border-line ',
                        )}
                      >
                        {message.isVoice && (
                          <div
                            className={cn(
                              'flex items-center gap-1.5 mb-1.5 text-xs',
                              isAssistant ? 'text-ink-3' : 'text-ink-4',
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
                              className="inline-flex items-center gap-1.5 text-xs text-ink-3 hover:text-ink-2 bg-surface-3 hover:bg-surface-3 px-2 py-1 rounded transition-colors"
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
                                      className="bg-surface-1 rounded-lg border border-line p-2.5"
                                    >
                                      <div className="flex items-start justify-between mb-1">
                                        <span className="text-xs text-ink-3 ">
                                          {formatDate(
                                            source.date || source.timestamp,
                                          )}
                                        </span>
                                        <span className="text-xs font-medium text-ink-3 ">
                                          {(
                                            source.relevance_score * 100
                                          ).toFixed(0)}
                                          % match
                                        </span>
                                      </div>
                                      {source.content && (
                                        <p className="text-xs text-ink-2 leading-relaxed line-clamp-3">
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
                        <div className="h-8 w-8 rounded-lg bg-surface-3 flex items-center justify-center shadow-sm">
                          <User className="h-4 w-4 text-ink-on-dark" />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Loading state */}
              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="h-8 w-8 rounded-lg bg-surface-3 flex items-center justify-center shadow-sm">
                    <Bot className="h-4 w-4 text-ink-2" />
                  </div>
                  <div className="bg-surface-1 rounded-lg px-4 py-3 border border-line shadow-sm flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-3 " />
                    <span className="text-xs text-ink-3 ">Thinking...</span>
                  </div>
                </div>
              )}

              {/* Voice status indicators */}
              {isListening && (
                <div className="flex gap-2 justify-end">
                  <div className="bg-vermillion-bg text-vermillion rounded-lg px-3 py-2 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-vermillion animate-pulse" />
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
                  <div className="bg-indigo-bg text-indigo rounded-lg px-3 py-2 flex items-center gap-2">
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
      <div className="border-t border-line p-4  ">
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
                      ? 'bg-ink hover:bg-ink-2 text-ink-on-dark '
                      : 'text-ink-3 hover:text-ink hover:bg-surface-3 ',
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
                placeholder={`Ask about ${clientName || 'this client'}...`}
                className="w-full min-h-[40px] max-h-[120px] pl-4 pr-12 py-2.5 text-sm border border-line rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-line-strong focus:border-transparent placeholder:text-ink-4 bg-surface-1 shadow-sm"
                disabled={isLoading}
                rows={1}
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-ink hover:bg-ink-2 text-ink-on-dark h-7 w-7 p-0 rounded-lg shadow-sm transition-all disabled:opacity-50"
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

              <span className="text-xs text-ink-3 ">
                {isListening ? 'Release to send' : 'Hold to speak'}
              </span>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-ink-3 ">
            {inputMode === 'voice'
              ? 'Classic Voice • Text-to-speech enabled'
              : 'Enter to send • Shift+Enter for new line'}
          </p>
          {messages.length > 0 && (
            <span className="text-xs text-ink-4 ">
              {messages.length} messages
            </span>
          )}
        </div>
      </div>

      {/* Realtime Voice Modal */}
      <RealtimeVoiceModal
        open={showRealtimeModal}
        onClose={() => setShowRealtimeModal(false)}
        clientId={clientId}
        clientName={clientName}
      />
    </div>
  )
}
