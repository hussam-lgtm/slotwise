'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import type { Client, Availability, WeekdayKey } from '@/types'

const DAYS: { key: WeekdayKey; label: string }[] = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
]

const DEFAULT_AVAILABILITY: Availability = {
  mon: [{ start: '09:00', end: '17:00' }],
  tue: [{ start: '09:00', end: '17:00' }],
  wed: [{ start: '09:00', end: '17:00' }],
  thu: [{ start: '09:00', end: '17:00' }],
  fri: [{ start: '09:00', end: '17:00' }],
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50)
}

export default function NewLinkPage() {
  const searchParams = useSearchParams()
  const preselectedClientId = searchParams.get('client')
  const router = useRouter()
  const supabase = createClient()

  const [clients, setClients] = useState<Client[]>([])
  const [form, setForm] = useState({
    client_id: preselectedClientId ?? '',
    name: '',
    slug: '',
    description: '',
    duration_mins: 30,
    buffer_before: 0,
    buffer_after: 15,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })
  const [availability, setAvailability] = useState<Availability>(DEFAULT_AVAILABILITY)
  const [slugEdited, setSlugEdited] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('clients').select('id, name').order('name').then(({ data }) => {
      if (data) setClients(data as Client[])
    })
  }, [])

  useEffect(() => {
    if (!slugEdited && form.name) {
      setForm(f => ({ ...f, slug: slugify(f.name) }))
    }
  }, [form.name, slugEdited])

  function toggleDay(day: WeekdayKey) {
    setAvailability(prev => {
      const next = { ...prev }
      if (next[day]) {
        delete next[day]
      } else {
        next[day] = [{ start: '09:00', end: '17:00' }]
      }
      return next
    })
  }

  function updateDaySlot(day: WeekdayKey, field: 'start' | 'end', value: string) {
    setAvailability(prev => ({
      ...prev,
      [day]: [{ ...prev[day]![0], [field]: value }],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('booking_links').insert({
      ...form,
      availability,
      created_by: user!.id,
      is_active: true,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard/links')
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/dashboard/links" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft size={15} /> Back to links
      </Link>

      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Create booking link</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Details</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client <span className="text-red-500">*</span></label>
            <select
              required
              value={form.client_id}
              onChange={e => setForm({ ...form, client_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            >
              <option value="">Select a client...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
            <input
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="30-min discovery call"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL slug <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 shrink-0">yourapp.com/book/</span>
              <input
                required
                value={form.slug}
                onChange={e => { setSlugEdited(true); setForm({ ...form, slug: slugify(e.target.value) }) }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
                placeholder="discovery-call"
              />
              <button
                type="button"
                onClick={() => { setSlugEdited(false); setForm(f => ({ ...f, slug: slugify(f.name) })) }}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                title="Reset to auto-generated"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              placeholder="Tell bookers what this meeting is about..."
            />
          </div>
        </div>

        {/* Duration & buffers */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Duration & buffers</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Duration (min)', key: 'duration_mins' },
              { label: 'Buffer before (min)', key: 'buffer_before' },
              { label: 'Buffer after (min)', key: 'buffer_after' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type="number"
                  min={0}
                  max={480}
                  value={form[key as keyof typeof form] as number}
                  onChange={e => setForm({ ...form, [key]: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Weekly availability</h2>
          <p className="text-xs text-gray-500">Set which days and hours bookings are available.</p>

          <div className="space-y-2">
            {DAYS.map(({ key, label }) => {
              const enabled = !!availability[key]
              const slot = availability[key]?.[0]
              return (
                <div key={key} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleDay(key)}
                    className={`w-24 text-left text-sm py-1.5 px-2 rounded-md transition-colors font-medium ${
                      enabled ? 'text-violet-700 bg-violet-50' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {label.slice(0, 3)}
                  </button>
                  {enabled && slot ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={slot.start}
                        onChange={e => updateDaySlot(key, 'start', e.target.value)}
                        className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                      <span className="text-gray-400 text-sm">to</span>
                      <input
                        type="time"
                        value={slot.end}
                        onChange={e => updateDaySlot(key, 'end', e.target.value)}
                        className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 italic">Unavailable</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {loading ? 'Creating...' : 'Create booking link'}
          </button>
          <Link
            href="/dashboard/links"
            className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
