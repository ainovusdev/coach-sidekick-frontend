'use client'

import { useEffect, useState } from 'react'
import { useWebSocket } from '@/contexts/websocket-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestWebSocketPage() {
  const { isConnected, joinRoom, leaveRoom, on, send } = useWebSocket()
  const [messages, setMessages] = useState<any[]>([])
  const [inRoom, setInRoom] = useState(false)
  const botId = 'de0a5be2-ee7a-4147-b7c7-1417f1c42566'
  const roomName = `bot:${botId}`

  useEffect(() => {
    // Subscribe to all events
    const unsubscribes = [
      on('transcript:new', (data) => {
        console.log('Received transcript:new', data)
        setMessages(prev => [...prev, { type: 'transcript:new', data, timestamp: new Date() }])
      }),
      on('bot:status', (data) => {
        console.log('Received bot:status', data)
        setMessages(prev => [...prev, { type: 'bot:status', data, timestamp: new Date() }])
      }),
      on('error', (data) => {
        console.log('Received error', data)
        setMessages(prev => [...prev, { type: 'error', data, timestamp: new Date() }])
      }),
      on('connection', (data) => {
        console.log('Connection event', data)
        setMessages(prev => [...prev, { type: 'connection', data, timestamp: new Date() }])
      })
    ]

    return () => {
      unsubscribes.forEach(unsub => unsub())
    }
  }, [on])

  const handleJoinRoom = () => {
    console.log(`Joining room: ${roomName}`)
    joinRoom(roomName)
    setInRoom(true)
  }

  const handleLeaveRoom = () => {
    console.log(`Leaving room: ${roomName}`)
    leaveRoom(roomName)
    setInRoom(false)
  }

  const sendTestMessage = () => {
    send('ping', { test: true })
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>WebSocket Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span>Status:</span>
            <span className={`font-semibold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span>Room:</span>
            <span className="font-mono text-sm">{roomName}</span>
            <span className={`font-semibold ${inRoom ? 'text-green-600' : 'text-gray-400'}`}>
              {inRoom ? '(Joined)' : '(Not joined)'}
            </span>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleJoinRoom} disabled={!isConnected || inRoom}>
              Join Room
            </Button>
            <Button onClick={handleLeaveRoom} disabled={!isConnected || !inRoom}>
              Leave Room
            </Button>
            <Button onClick={sendTestMessage} disabled={!isConnected}>
              Send Ping
            </Button>
          </div>

          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold mb-2">Messages ({messages.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {messages.map((msg, idx) => (
                <div key={idx} className="border-b pb-2">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-sm font-semibold text-blue-600">
                      {msg.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="text-xs mt-1 whitespace-pre-wrap">
                    {JSON.stringify(msg.data, null, 2)}
                  </pre>
                </div>
              ))}
              {messages.length === 0 && (
                <p className="text-gray-500 text-sm">No messages received yet</p>
              )}
            </div>
          </div>

          <div className="text-xs text-gray-500">
            <p>Bot ID: {botId}</p>
            <p>Send a webhook to this bot ID to test transcript broadcasting</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}