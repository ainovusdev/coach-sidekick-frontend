'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  AlertCircle,
  Mic,
  Brain,
  Zap,
  Database,
} from 'lucide-react'
import {
  chatService,
  type ChatMessage,
  type ChatStats,
} from '@/services/chat-service'
import { cn } from '@/lib/utils'
import { ChatMarkdown } from '@/components/ui/chat-markdown'
import { useSimpleVoice } from '@/hooks/use-simple-voice'
import {
  AIProviderSelector,
  type AIProvider,
} from '@/components/ui/ai-provider-selector'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { formatDate } from '@/lib/date-utils'

interface ClientChatWidgetProps {
  clientId: string
  clientName?: string
}

export function ClientChatWidget({
  clientId,
  clientName,
}: ClientChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<ChatStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])
  const [showSources, setShowSources] = useState<{ [key: number]: boolean }>({})
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('openai')
  const [showProviderSettings, setShowProviderSettings] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const lastTranscriptRef = useRef<string>('')

  // Initialize simple voice
  const {
    isListening,
    isSpeaking,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    isSupported: isVoiceSupported,
    fullTranscript,
  } = useSimpleVoice()

  // Handle voice transcript updates
  useEffect(() => {
    if (
      voiceEnabled &&
      transcript &&
      transcript !== lastTranscriptRef.current
    ) {
      setInput(fullTranscript)
      lastTranscriptRef.current = transcript
    }
  }, [transcript, fullTranscript, voiceEnabled])

  // Auto-send when stop listening with content
  useEffect(() => {
    if (
      !isListening &&
      voiceEnabled &&
      transcript.trim() &&
      lastTranscriptRef.current
    ) {
      const finalText = transcript.trim()
      setInput('')
      lastTranscriptRef.current = ''
      handleSend(finalText)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, voiceEnabled, transcript])

  useEffect(() => {
    fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchStats = async () => {
    setLoadingStats(true)
    try {
      const data = await chatService.getClientKnowledgeStats(clientId)
      setStats(data)
      setSuggestedQuestions(data.suggested_questions || [])
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim()
    if (!textToSend || isLoading) return

    const userMessage: ChatMessage = { role: 'user', content: textToSend }
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

      const assistantMessage: ChatMessage & {
        sources?: any[]
        confidence?: string
        provider?: string
      } = {
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        confidence: response.confidence,
        provider: response.provider,
      }

      setMessages(prev => [...prev, assistantMessage])

      // Text-to-speech for the response if voice is enabled
      if (voiceEnabled && response.answer) {
        speak(response.answer)
      }

      if (
        response.suggested_questions &&
        response.suggested_questions.length > 0
      ) {
        setSuggestedQuestions(response.suggested_questions)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content:
          'I encountered an error processing your question. Please try again.',
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
    inputRef.current?.focus()
  }

  const toggleSources = (index: number) => {
    setShowSources(prev => ({ ...prev, [index]: !prev[index] }))
  }

  const getConfidenceColor = (confidence?: string) => {
    switch (confidence) {
      case 'high':
        return 'text-gray-700 bg-gray-50 border-gray-200'
      case 'medium':
        return 'text-gray-600 bg-gray-50 border-gray-200'
      case 'low':
        return 'text-gray-500 bg-gray-50 border-gray-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Handle keyboard shortcuts for voice
  useEffect(() => {
    if (!voiceEnabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Space for push-to-talk (when not typing)
      if (e.code === 'Space' && document.activeElement !== inputRef.current) {
        e.preventDefault()
        if (!isListening) {
          startListening()
        }
      }
      // Escape to stop speaking
      if (e.code === 'Escape') {
        stopSpeaking()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      // Release space to stop listening
      if (e.code === 'Space' && document.activeElement !== inputRef.current) {
        e.preventDefault()
        if (isListening) {
          stopListening()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [voiceEnabled, isListening, startListening, stopListening, stopSpeaking])

  const handleToggleVoice = () => {
    setVoiceEnabled(!voiceEnabled)
    if (isListening) {
      stopListening()
    }
    stopSpeaking()
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
    return (
      <div className="flex flex-col h-full p-4">
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
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Modern Header */}
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
                  {clientName ? `Chat with ${clientName}'s AI` : 'AI Assistant'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Powered by your coaching session insights
                </p>
              </div>
            </div>

            {/* AI Provider Selector - Modern Style */}
            <Popover
              open={showProviderSettings}
              onOpenChange={setShowProviderSettings}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 bg-white hover:bg-gray-50 border-gray-200 shadow-sm"
                >
                  {selectedProvider === 'openai' && (
                    <Brain className="h-3.5 w-3.5 mr-1.5 text-gray-600" />
                  )}
                  {selectedProvider === 'gemini' && (
                    <Sparkles className="h-3.5 w-3.5 mr-1.5 text-gray-600" />
                  )}
                  {selectedProvider === 'claude' && (
                    <Zap className="h-3.5 w-3.5 mr-1.5 text-gray-600" />
                  )}
                  <span className="text-sm font-medium capitalize text-gray-700">
                    {selectedProvider}
                  </span>
                  <ChevronDown className="h-3 w-3 ml-1.5 text-gray-400" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">
                      AI Model
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
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
          </div>

          {/* Stats Bar - Modern Pills */}
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
              {stats.top_topics.length > 0 && (
                <div className="hidden sm:flex items-center gap-1 ml-2">
                  {stats.top_topics.slice(0, 2).map((topic, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="text-xs bg-gray-100 text-gray-600 border-0 font-normal"
                    >
                      {topic.topic}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons - Refined */}
            <div className="flex items-center gap-1">
              {isVoiceSupported && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleToggleVoice}
                  className={cn(
                    'h-8 px-2.5 rounded-lg transition-all',
                    voiceEnabled
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
                  )}
                >
                  <Mic className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-xs font-medium">
                    {voiceEnabled ? 'On' : 'Off'}
                  </span>
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setMessages([])}
                className="h-8 w-8 p-0 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                title="Clear chat"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area - Clean Background */}
      <ScrollArea className="flex-1 bg-gray-50/50">
        <div className="p-5 space-y-4">
          {messages.length === 0 ? (
            <div>
              <div className="text-center py-8">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mx-auto mb-4 flex items-center justify-center shadow-sm">
                  <Bot className="h-7 w-7 text-gray-600" />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Ready to assist you
                </p>
                <p className="text-xs text-gray-500">
                  Ask me anything about {clientName || 'your client'}
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
                const messageData = message as any

                return (
                  <div
                    key={idx}
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
                        messageData.sources &&
                        messageData.sources.length > 0 && (
                          <div className="space-y-1">
                            <button
                              onClick={() => toggleSources(idx)}
                              className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                            >
                              <BookOpen className="h-3 w-3" />
                              <span>
                                {showSources[idx] ? 'Hide' : 'Show'}{' '}
                                {messageData.sources.length} source
                                {messageData.sources.length > 1 ? 's' : ''}
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
                                {messageData.sources.map(
                                  (source: any, sourceIdx: number) => (
                                    <div
                                      key={sourceIdx}
                                      className="bg-white rounded-lg border border-gray-200 p-2.5"
                                    >
                                      <div className="flex items-start justify-between mb-1">
                                        <span className="text-xs text-gray-600">
                                          {formatDate(
                                            source.date || source.timestamp,
                                          )}
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

                            {(messageData.confidence ||
                              messageData.provider) && (
                              <div className="flex items-center gap-2">
                                {messageData.confidence && (
                                  <div
                                    className={cn(
                                      'inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border',
                                      getConfidenceColor(
                                        messageData.confidence,
                                      ),
                                    )}
                                  >
                                    <AlertCircle className="h-3 w-3" />
                                    <span className="font-medium capitalize">
                                      {messageData.confidence} confidence
                                    </span>
                                  </div>
                                )}
                                {messageData.provider && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs capitalize bg-white border-gray-200 text-gray-600 py-0"
                                  >
                                    {messageData.provider}
                                  </Badge>
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

              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </ScrollArea>

      {/* Input Area - Modern Style */}
      <div className="border-t border-gray-200 p-4 bg-gradient-to-b from-white to-gray-50">
        {/* Voice Controls */}
        {voiceEnabled && (
          <div className="mb-2 flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => (isListening ? stopListening() : startListening())}
              className={cn(
                'gap-2',
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gray-900 hover:bg-gray-800 text-white',
              )}
            >
              {isListening ? (
                <>
                  <div className="h-3 w-3 rounded-full bg-white animate-pulse" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  Start Recording
                </>
              )}
            </Button>

            {isSpeaking && (
              <Button
                size="sm"
                onClick={stopSpeaking}
                className="gap-2 bg-orange-500 hover:bg-orange-600 text-white"
              >
                <div className="h-3 w-3 rounded-full bg-white animate-pulse" />
                Stop Speaking
              </Button>
            )}

            {isListening && interimTranscript && (
              <span className="text-sm text-gray-500 italic">
                {interimTranscript}
              </span>
            )}

            {isSpeaking && !isListening && (
              <span className="text-sm text-orange-600 font-medium animate-pulse">
                AI is speaking...
              </span>
            )}
          </div>
        )}

        <div className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              voiceEnabled
                ? `Speak or type to ask about ${clientName || 'this client'}...`
                : `Ask about ${clientName || 'this client'}...`
            }
            className="w-full min-h-[44px] max-h-[120px] pl-4 pr-12 py-3 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent placeholder:text-gray-400 bg-white shadow-sm"
            disabled={isLoading || isListening}
            rows={1}
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading || isListening}
            size="sm"
            className="absolute right-2 bottom-2 bg-gray-900 hover:bg-gray-800 text-white h-8 w-8 p-0 rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">
            {voiceEnabled
              ? 'Hold Space to talk • Esc to stop AI'
              : 'Enter to send • Shift+Enter for new line'}
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
