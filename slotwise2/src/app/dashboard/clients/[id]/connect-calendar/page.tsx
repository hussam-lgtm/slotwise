'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { use } from 'react'

export default function ConnectCalendarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <div className="p-8 max-w-lg">
      <Link href={`/dashboard/clients/${id}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft size={15} /> Back to client
      </Link>

      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Connect calendar</h1>
      <p className="text-sm text-gray-500 mb-6">
        Connect a calendar so bookings automatically appear and free/busy times are respected.
      </p>

      <div className="space-y-3">
        {/* Google */}
        <a
          href={`/api/calendar/google/auth?client_id=${id}`}
          className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-lg shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Google Calendar</p>
            <p className="text-xs text-gray-500 mt-0.5">Connect via Google OAuth</p>
          </div>
        </a>

        {/* Microsoft */}
        <a
          href={`/api/calendar/microsoft/auth?client_id=${id}`}
          className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
              <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
              <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
              <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
              <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Outlook / Microsoft 365</p>
            <p className="text-xs text-gray-500 mt-0.5">Connect via Microsoft OAuth</p>
          </div>
        </a>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        We only request read/write access to create calendar events and check availability. We never read event content.
      </p>
    </div>
  )
}
