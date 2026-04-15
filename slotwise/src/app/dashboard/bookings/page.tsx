import { createClient } from '@/lib/supabase/server'
import { format, parseISO } from 'date-fns'
import { Calendar, Clock } from 'lucide-react'

export default async function BookingsPage() {
  const supabase = await createClient()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, booking_link:booking_links(name, duration_mins, client:clients(name))')
    .order('starts_at', { ascending: false })
    .limit(100)

  const upcoming = bookings?.filter(b =>
    b.status === 'confirmed' && new Date(b.starts_at) > new Date()
  ) ?? []

  const past = bookings?.filter(b =>
    b.status === 'confirmed' && new Date(b.starts_at) <= new Date()
  ) ?? []

  const cancelled = bookings?.filter(b => b.status === 'cancelled') ?? []

  function BookingRow({ b }: { b: any }) {
    const start = parseISO(b.starts_at)
    const isPast = start <= new Date()
    return (
      <div className="px-5 py-4 flex items-center justify-between hover:bg-gray-50">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`shrink-0 w-2 h-2 rounded-full ${isPast ? 'bg-gray-300' : 'bg-green-500'}`} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{b.booker_name}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {b.booking_link?.client?.name} · {b.booking_link?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-5 shrink-0 ml-4">
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm text-gray-700">
              <Calendar size={13} className="text-gray-400" />
              {format(start, 'MMM d, yyyy')}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
              <Clock size={11} className="text-gray-400" />
              {format(start, 'h:mm a')} · {b.booking_link?.duration_mins} min
            </div>
          </div>
          <p className="text-xs text-gray-400 w-28 truncate">{b.booker_email}</p>
        </div>
      </div>
    )
  }

  function Section({ title, items, empty }: { title: string; items: any[]; empty: string }) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-medium text-gray-900">{title}</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{items.length}</span>
        </div>
        {items.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {items.map(b => <BookingRow key={b.id} b={b} />)}
          </div>
        ) : (
          <div className="px-5 py-8 text-center text-sm text-gray-400">{empty}</div>
        )}
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Bookings</h1>
        <p className="text-sm text-gray-500 mt-1">{bookings?.length ?? 0} total across all clients</p>
      </div>

      <Section title="Upcoming" items={upcoming} empty="No upcoming bookings." />
      <Section title="Past" items={past} empty="No past bookings yet." />
      {cancelled.length > 0 && (
        <Section title="Cancelled" items={cancelled} empty="" />
      )}
    </div>
  )
}
