import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { AuthProvider } from '@/contexts/auth-context'
import { PermissionProvider } from '@/contexts/permission-context'
import { WebSocketProvider } from '@/contexts/websocket-context'
import { Toaster } from 'sonner' // NEW: Sonner toast notifications
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Coach Sidekick - AI-Powered Meeting Assistant',
  description:
    'Real-time meeting transcription and AI insights for coaches. Join Zoom, Google Meet, and Teams calls automatically.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <PermissionProvider>
            <WebSocketProvider>
              {children}
              {/* NEW: Sonner toast notifications */}
              <Toaster
                position="top-right"
                richColors
                closeButton
                duration={4000}
              />
            </WebSocketProvider>
          </PermissionProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
