import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { AuthProvider } from '@/contexts/auth-context'
import { PermissionProvider } from '@/contexts/permission-context'
import { WebSocketProvider } from '@/contexts/websocket-context'
import { ProcessingProvider } from '@/contexts/processing-context'
import { QueryProvider } from '@/components/providers/query-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Toaster } from 'sonner'
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <PermissionProvider>
                <WebSocketProvider>
                  <ProcessingProvider>
                    {children}
                    <Toaster
                      position="top-right"
                      richColors
                      closeButton
                      duration={5000}
                      expand={true}
                      toastOptions={{
                        style: {
                          zIndex: 99999,
                        },
                      }}
                    />
                  </ProcessingProvider>
                </WebSocketProvider>
              </PermissionProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
