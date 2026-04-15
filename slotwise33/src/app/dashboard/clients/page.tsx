export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, ExternalLink, Calendar } from 'lucide-react'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('organisation_id, role')
    .eq('id', user!.id)
    .single()

  const { data: clients } = await supabase
    .from('clients')
    .select('*, calendar_connections(provider), booking_links(id)')
    .eq('organisation_id', profile?.organisation_id ?? '')
    .order('name')

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">{clients?.length ?? 0} clients in your workspace</p>
        </div>
        {profile?.role !== 'client' && (
          <Link
            href="/dashboard/clients/new"
            className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-gray-800 text-gray-900 text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={16} />
            Add client
          </Link>
        )}
      </div>

      {clients && clients.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {clients.map((client: any) => {
            const hasCalendar = client.calendar_connections?.length > 0
            const linkCount = client.booking_links?.length ?? 0
            return (
              <div key={client.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-900 shrink-0">
                    {client.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">{client.name}</p>
                    <p className="text-xs text-gray-500">
                      {client.company ?? client.email ?? 'No email'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Calendar size={13} />
                    {hasCalendar ? (
                      <span className="text-green-600 font-medium">Calendar connected</span>
                    ) : (
                      <span className="text-amber-600">No calendar</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {linkCount} {linkCount === 1 ? 'link' : 'links'}
                  </div>
                  <Link
                    href={`/dashboard/clients/${client.id}`}
                    className="flex items-center gap-1 text-xs text-gray-900 hover:text-gray-900 font-medium"
                  >
                    View <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <div className="text-gray-400 text-sm">No clients yet</div>
          <p className="text-gray-400 text-xs mt-1">Add your first client to get started</p>
          <Link
            href="/dashboard/clients/new"
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-gray-800 text-gray-900 text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={15} />
            Add client
          </Link>
        </div>
      )}
    </div>
  )
}
