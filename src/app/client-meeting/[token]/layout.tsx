/**
 * Client Meeting Layout
 * Simple layout for the client live meeting page (no authentication required)
 */

import { Toaster } from 'sonner'

export default function ClientMeetingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {children}
      <Toaster position="top-right" richColors />
    </div>
  )
}
