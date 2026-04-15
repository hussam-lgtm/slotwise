export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Calendar, Link2, Copy, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react'
import CopyButton from '@/components/ui/CopyButton'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('*, calendar_connections(*), booking_links(*, bookings(id))')
    .eq('id', id)
    .single()

  if (!client) notFound()

  const calConn = client.calendar_connections?.[0]

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/dashboard/clients" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft size={15} /> Back to clients
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-lg font-semibold text-gray-900">
            {client.name[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{client.name}</h1>
            <p className="text-sm text-gray-500">{client.company ?? client.email ?? 'No contact info'}</p>
          </div>
        </div>
        <Link
          href={`/dashboard/links/new?client=${id}`}
          className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-gray-800 text-gray-900 text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={15} />
          New booking link
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Calendar status */}
        <div className="col-span-1 bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={15} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Calendar</span>
          </div>
          {calConn ? (
            <div className="flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircle size={14} />
              {calConn.provider === 'google' ? 'Google Calendar' : 'Outlook'} connected
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-sm text-amber-600">
              <AlertCircle size={14} />
              No calendar connected
            </div>
          )}
          {!calConn && (
            <Link
              href={`/dashboard/clients/${id}/connect-calendar`}
              className="mt-2 text-xs text-gray-900 hover:text-gray-900 font-medium"
            >
              Connect calendar →
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Booking links</p>
          <p className="text-2xl font-semibold text-gray-900">{client.booking_links?.length ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Total bookings</p>
          <p className="text-2xl font-semibold text-gray-900">
            {client.booking_links?.reduce((sum: number, l: any) => sum + (l.bookings?.length ?? 0), 0) ?? 0}
          </p>
        </div>
      </div>

      {/* Booking links */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-medium text-gray-900">Booking links</h2>
          <Link
            href={`/dashboard/links/new?client=${id}`}
            className="flex items-center gap-1 text-xs text-gray-900 hover:text-gray-900 font-medium"
          >
            <Plus size={13} /> Add link
          </Link>
        </div>

        {client.booking_links && client.booking_links.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {client.booking_links.map((link: any) => {
              const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://yourapp.com'}/book/${link.slug}`
              return (
                <div key={link.id} className="px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${link.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{link.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {link.duration_mins} min · {link.bookings?.length ?? 0} bookings
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CopyButton text={publicUrl} />
                    <Link
                      href={`/book/${link.slug}`}
                      target="_blank"
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ExternalLink size={14} />
                    </Link>
                    <Link
                      href={`/dashboard/links/${link.id}`}
                      className="text-xs text-gray-900 hover:text-gray-900 font-medium px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="px-5 py-10 text-center text-sm text-gray-400">
            No booking links yet.{' '}
            <Link href={`/dashboard/links/new?client=${id}`} className="text-gray-900 hover:text-gray-900">
              Create one
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
