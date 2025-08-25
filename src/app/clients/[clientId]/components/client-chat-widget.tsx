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
  AlertCircle
} from 'lucide-react'
import { chatService, type ChatMessage, type ChatStats } from '@/services/chat-service'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ClientChatWidgetProps {
  clientId: string
  clientName?: string
}

export function ClientChatWidget({ clientId, clientName }: ClientChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<ChatStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])
  const [showSources, setShowSources] = useState<{ [key: number]: boolean }>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await chatService.askQuestion(
        clientId,
        userMessage.content,
        messages
      )

      const assistantMessage: ChatMessage & { sources?: any[], confidence?: string } = {
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        confidence: response.confidence
      }

      setMessages(prev => [...prev, assistantMessage])

      if (response.suggested_questions && response.suggested_questions.length > 0) {
        setSuggestedQuestions(response.suggested_questions)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'I encountered an error processing your question. Please try again.'
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
      case 'high': return 'text-gray-700 bg-gray-50 border-gray-200'
      case 'medium': return 'text-gray-600 bg-gray-50 border-gray-200'
      case 'low': return 'text-gray-500 bg-gray-50 border-gray-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
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
            <h3 className="text-sm font-medium text-gray-900 mb-1">No Knowledge Base Yet</h3>
            <p className="text-xs text-gray-500">
              The AI assistant will be available after analyzing coaching sessions.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Stats Bar */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-gray-500">Sessions:</span>
              <span className="ml-1 font-semibold text-gray-900">{stats.unique_sessions}</span>
            </div>
            <div>
              <span className="text-gray-500">Knowledge:</span>
              <span className="ml-1 font-semibold text-gray-900">{stats.total_chunks}</span>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setMessages([])}
            className="h-7 px-2 text-gray-500 hover:text-gray-700"
          >
            <RotateCw className="h-3 w-3" />
          </Button>
        </div>
        {stats.top_topics.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {stats.top_topics.slice(0, 3).map((topic, idx) => (
              <Badge key={idx} className="text-xs bg-white border-gray-200 text-gray-600 py-0">
                {topic.topic}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {messages.length === 0 ? (
            <div>
              <div className="text-center py-4">
                <Bot className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-4">
                  Ask me about {clientName || 'this client'}
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
                      className="w-full text-left p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all group"
                    >
                      <div className="flex items-start gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0 group-hover:text-gray-600" />
                        <span className="text-xs text-gray-700 leading-relaxed">{question}</span>
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
                  <div key={idx} className={cn(
                    "flex gap-2",
                    isAssistant ? "justify-start" : "justify-end"
                  )}>
                    {isAssistant && (
                      <div className="flex-shrink-0">
                        <div className="h-7 w-7 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-gray-600" />
                        </div>
                      </div>
                    )}
                    
                    <div className={cn(
                      "max-w-[85%] space-y-2",
                      !isAssistant && "text-right"
                    )}>
                      <div className={cn(
                        "rounded-lg px-3 py-2",
                        isAssistant 
                          ? "bg-gray-50 text-gray-900 border border-gray-200" 
                          : "bg-gray-900 text-white"
                      )}>
                        {isAssistant ? (
                          <div className="text-sm">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({children}) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                                h3: ({children}) => <h3 className="text-sm font-semibold text-gray-800 mb-1 mt-2 first:mt-0">{children}</h3>,
                                ul: ({children}) => <ul className="list-disc list-inside pl-2 mb-2 space-y-0.5 text-gray-700">{children}</ul>,
                                ol: ({children}) => <ol className="list-decimal list-inside pl-2 mb-2 space-y-0.5 text-gray-700">{children}</ol>,
                                li: ({children}) => <li className="text-sm">{children}</li>,
                                code: ({className, children}: any) => {
                                  const inline = !className
                                  return inline ? (
                                    <code className="bg-gray-200 text-gray-800 px-1 py-0.5 rounded text-xs font-mono">
                                      {children}
                                    </code>
                                  ) : (
                                    <code className="block bg-gray-100 text-gray-800 p-2 rounded text-xs font-mono overflow-x-auto my-2">
                                      {children}
                                    </code>
                                  )
                                },
                                strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>,
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {message.content}
                          </p>
                        )}
                      </div>
                      
                      {/* Sources for assistant messages */}
                      {isAssistant && messageData.sources && messageData.sources.length > 0 && (
                        <div className="space-y-1">
                          <button
                            onClick={() => toggleSources(idx)}
                            className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                          >
                            <BookOpen className="h-3 w-3" />
                            <span>{showSources[idx] ? 'Hide' : 'Show'} {messageData.sources.length} source{messageData.sources.length > 1 ? 's' : ''}</span>
                            <ChevronDown className={cn(
                              "h-3 w-3 transition-transform",
                              showSources[idx] && "rotate-180"
                            )} />
                          </button>
                          
                          {showSources[idx] && (
                            <div className="space-y-2 mt-2">
                              {messageData.sources.map((source: any, sourceIdx: number) => (
                                <div key={sourceIdx} className="bg-white rounded-lg border border-gray-200 p-2.5">
                                  <div className="flex items-start justify-between mb-1">
                                    <span className="text-xs text-gray-600">
                                      {new Date(source.date || source.timestamp).toLocaleDateString()}
                                    </span>
                                    <span className="text-xs font-medium text-gray-500">
                                      {(source.relevance_score * 100).toFixed(0)}% match
                                    </span>
                                  </div>
                                  {source.content && (
                                    <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">
                                      {source.content}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {messageData.confidence && (
                            <div className={cn(
                              "inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border",
                              getConfidenceColor(messageData.confidence)
                            )}>
                              <AlertCircle className="h-3 w-3" />
                              <span className="font-medium capitalize">{messageData.confidence} confidence</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {!isAssistant && (
                      <div className="flex-shrink-0">
                        <div className="h-7 w-7 rounded-lg bg-gray-900 flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              
              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="h-7 w-7 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-600" />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-3 bg-white">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask about ${clientName || 'this client'}...`}
            className="flex-1 min-h-[36px] max-h-[80px] px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400"
            disabled={isLoading}
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="sm"
            className="bg-gray-900 hover:bg-gray-800 text-white h-9 w-9 p-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}