export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, ExternalLink } from 'lucide-react'
import CopyButton from '@/components/ui/CopyButton'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yourapp.com'

export default async function LinksPage() {
  const supabase = await createClient()

  const { data: links } = await supabase
    .from('booking_links')
    .select('*, client:clients(name), bookings(id)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Booking links</h1>
          <p className="text-sm text-zinc-500 mt-1">{links?.length ?? 0} total links</p>
        </div>
        <Link
          href="/dashboard/links/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-zinc-100 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          New link
        </Link>
      </div>

      {links && links.length > 0 ? (
        <div className="bg-zinc-950 rounded-xl border border-zinc-800 divide-y divide-zinc-800">
          {links.map((link: any) => {
            const publicUrl = `${APP_URL}/book/${link.slug}`
            return (
              <div key={link.id} className="px-5 py-4 flex items-center justify-between hover:bg-zinc-900">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${link.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{link.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {link.client?.name} · {link.duration_mins} min · {link.bookings?.length ?? 0} bookings
                    </p>
                    <p className="text-xs text-zinc-600 font-mono mt-0.5 truncate">/book/{link.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <CopyButton text={publicUrl} />
                  <Link
                    href={`/book/${link.slug}`}
                    target="_blank"
                    className="p-1.5 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <ExternalLink size={14} />
                  </Link>
                  <Link
                    href={`/dashboard/links/${link.id}`}
                    className="text-xs text-white hover:text-white font-medium px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-zinc-950 rounded-xl border border-zinc-800 py-16 text-center">
          <div className="text-zinc-600 text-sm">No booking links yet</div>
          <Link
            href="/dashboard/links/new"
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-zinc-100 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={15} /> Create your first link
          </Link>
        </div>
      )}
    </div>
  )
}
