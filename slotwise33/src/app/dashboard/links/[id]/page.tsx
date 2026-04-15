'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import type { Availability, WeekdayKey } from '@/types'

const DAYS: { key: WeekdayKey; label: string }[] = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
]

export default function EditLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    duration_mins: 30,
    buffer_before: 0,
    buffer_after: 15,
    timezone: 'UTC',
    is_active: true,
  })
  const [availability, setAvailability] = useState<Availability>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientName, setClientName] = useState('')

  useEffect(() => {
    supabase
      .from('booking_links')
      .select('*, client:clients(name)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (!data) return
        setForm({
          name: data.name,
          slug: data.slug,
          description: data.description ?? '',
          duration_mins: data.duration_mins,
          buffer_before: data.buffer_before,
          buffer_after: data.buffer_after,
          timezone: data.timezone,
          is_active: data.is_active,
        })
        setAvailability(data.availability ?? {})
        setClientName((data.client as any)?.name ?? '')
        setLoading(false)
      })
  }, [id])

  function toggleDay(day: WeekdayKey) {
    setAvailability(prev => {
      const next = { ...prev }
      if (next[day]) delete next[day]
      else next[day] = [{ start: '09:00', end: '17:00' }]
      return next
    })
  }

  function updateDaySlot(day: WeekdayKey, field: 'start' | 'end', value: string) {
    setAvailability(prev => ({
      ...prev,
      [day]: [{ ...prev[day]![0], [field]: value }],
    }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const { error } = await supabase
      .from('booking_links')
      .update({ ...form, availability, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) { setError(error.message); setSaving(false) }
    else router.push('/dashboard/links')
  }

  async function handleDelete() {
    if (!confirm('Delete this booking link? This cannot be undone.')) return
    await supabase.from('booking_links').delete().eq('id', id)
    router.push('/dashboard/links')
  }

  if (loading) return (
    <div className="p-8 flex items-center gap-2 text-sm text-gray-400">
      <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      Loading...
    </div>
  )

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/dashboard/links" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft size={15} /> Back to links
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Edit booking link</h1>
          <p className="text-sm text-gray-500 mt-0.5">Client: {clientName}</p>
        </div>
        <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
          <Trash2 size={14} /> Delete
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSave} className="space-y-5">
        {/* Status toggle */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Link active</p>
              <p className="text-xs text-gray-500 mt-0.5">Inactive links show a "not available" page</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-white' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Details</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              required value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL slug</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 shrink-0">yourapp.com/book/</span>
              <input
                required value={form.slug}
                onChange={e => setForm({ ...form, slug: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/20 resize-none"
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
                  type="number" min={0} max={480}
                  value={form[key as keyof typeof form] as number}
                  onChange={e => setForm({ ...form, [key]: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Weekly availability</h2>
          <div className="space-y-2">
            {DAYS.map(({ key, label }) => {
              const enabled = !!availability[key]
              const slot = availability[key]?.[0]
              return (
                <div key={key} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleDay(key)}
                    className={`w-24 text-left text-sm py-1.5 px-2 rounded-md transition-colors font-medium ${enabled ? 'text-gray-900 bg-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    {label.slice(0, 3)}
                  </button>
                  {enabled && slot ? (
                    <div className="flex items-center gap-2">
                      <input type="time" value={slot.start} onChange={e => updateDaySlot(key, 'start', e.target.value)}
                        className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black/20" />
                      <span className="text-gray-400 text-sm">to</span>
                      <input type="time" value={slot.end} onChange={e => updateDaySlot(key, 'end', e.target.value)}
                        className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black/20" />
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
            type="submit" disabled={saving}
            className="px-5 py-2.5 bg-black hover:bg-gray-800 disabled:opacity-60 text-gray-900 text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          <Link href="/dashboard/links" className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
