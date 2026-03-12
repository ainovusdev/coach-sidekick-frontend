/**
 * Coach Meeting Layout
 * Provides WebSocketProvider for real-time meeting data (transcripts, bot status, coaching)
 * ThemeProvider is now in root layout
 */
'use client'

import { WebSocketProvider } from '@/contexts/websocket-context'

export default function MeetingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <WebSocketProvider>{children}</WebSocketProvider>
}
