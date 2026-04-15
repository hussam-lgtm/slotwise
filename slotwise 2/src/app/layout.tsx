import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SlotWise — Agency Booking Platform',
  description: 'Manage booking pages for all your clients',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>{children}</body>
    </html>
  )
}
