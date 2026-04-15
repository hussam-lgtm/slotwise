export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { CalendarDays, Link2, Users, TrendingUp } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: userProfile } = await supabase
    .from('users')
    .select('*, organisations(*)')
    .eq('id', user!.id)
    .single()

  const orgId = userProfile?.organisation_id

  // Stats
  const [{ count: clientCount }, { count: linkCount }, { count: bookingCount }] =
    await Promise.all([
      supabase.from('clients').select('*', { count: 'exact', head: true }).eq('organisation_id', orgId ?? ''),
      supabase.from('booking_links').select('id', { count: 'exact', head: true }),
      supabase.from('bookings').select('id', { count: 'exact', head: true }),
    ])

  // Recent bookings
  const { data: recentBookings } = await supabase
    .from('bookings')
    .select('*, booking_link:booking_links(name, client:clients(name))')
    .order('created_at', { ascending: false })
    .limit(5)

  const stats = [
    { label: 'Total clients', value: clientCount ?? 0, icon: Users, color: 'text-white bg-zinc-800' },
    { label: 'Booking links', value: linkCount ?? 0, icon: Link2, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total bookings', value: bookingCount ?? 0, icon: CalendarDays, color: 'text-green-600 bg-green-50' },
    { label: 'This month', value: 0, icon: TrendingUp, color: 'text-amber-600 bg-amber-50' },
  ]

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">
          Good morning{userProfile?.full_name ? `, ${userProfile.full_name.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="text-zinc-500 mt-1 text-sm">Here's what's happening across your clients.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-zinc-950 rounded-xl border border-zinc-800 p-4">
            <div className={`inline-flex p-2 rounded-lg mb-3 ${color}`}>
              <Icon size={18} />
            </div>
            <p className="text-2xl font-semibold text-white">{value}</p>
            <p className="text-sm text-zinc-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="bg-zinc-950 rounded-xl border border-zinc-800">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="font-medium text-white">Recent bookings</h2>
        </div>
        {recentBookings && recentBookings.length > 0 ? (
          <div className="divide-y divide-zinc-800">
            {recentBookings.map((b: any) => (
              <div key={b.id} className="px-5 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{b.booker_name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {b.booking_link?.name} · {b.booking_link?.client?.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-zinc-400">
                    {new Date(b.starts_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    b.status === 'confirmed'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center text-sm text-zinc-600">
            No bookings yet. Create a booking link to get started.
          </div>
        )}
      </div>
    </div>
  )
}
