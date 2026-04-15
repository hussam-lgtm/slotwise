'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react'
import QuestionBuilder from '@/components/dashboard/QuestionBuilder'
import type { Client, Availability, WeekdayKey, BookingQuestion } from '@/types'

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
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 50)
}

type ClientWithCal = Client & { calendar_connections: { provider: string }[] }

export default function NewLinkPage() {
  const searchParams = useSearchParams()
  const preselectedClientId = searchParams.get('client')
  const router = useRouter()
  const supabase = createClient()

  const [clients, setClients] = useState<ClientWithCal[]>([])
  const [form, setForm] = useState({
    client_id: preselectedClientId ?? '',
    name: '', slug: '', description: '',
    duration_mins: 30, buffer_before: 0, buffer_after: 15,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })
  const [availability, setAvailability] = useState<Availability>(DEFAULT_AVAILABILITY)
  const [questions, setQuestions] = useState<Omit<BookingQuestion, 'id' | 'booking_link_id' | 'created_at'>[]>([])
  const [slugEdited, setSlugEdited] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('clients').select('id, name, calendar_connections(provider)').order('name').then(({ data }) => {
      if (data) setClients(data as ClientWithCal[])
    })
  }, [])

  useEffect(() => {
    if (!slugEdited && form.name) setForm(f => ({ ...f, slug: slugify(f.name) }))
  }, [form.name, slugEdited])

  const selectedClient = clients.find(c => c.id === form.client_id)
  const hasCalendar = (selectedClient?.calendar_connections?.length ?? 0) > 0

  function toggleDay(day: WeekdayKey) {
    setAvailability(prev => {
      const next = { ...prev }
      if (next[day]) delete next[day]
      else next[day] = [{ start: '09:00', end: '17:00' }]
      return next
    })
  }

  function updateDaySlot(day: WeekdayKey, field: 'start' | 'end', value: string) {
    setAvailability(prev => ({ ...prev, [day]: [{ ...prev[day]![0], [field]: value }] }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!hasCalendar) { setError('This client has no connected calendar. Connect one first.'); return }
    setLoading(true); setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: link, error: linkError } = await supabase
      .from('booking_links')
      .insert({ ...form, availability, created_by: user!.id, is_active: true })
      .select().single()
    if (linkError) { setError(linkError.message); setLoading(false); return }
    if (questions.length > 0) {
      await supabase.from('booking_questions').insert(
        questions.map((q, i) => ({ ...q, booking_link_id: link.id, position: i }))
      )
    }
    router.push('/dashboard/links')
  }

  const inputCls = "w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-gray-400"
  const cardCls = "bg-white rounded-xl border border-gray-200 p-5 space-y-4"
  const labelCls = "block text-sm font-medium text-gray-700 mb-1"
  const sectionTitle = "text-xs font-semibold text-gray-500 uppercase tracking-wider"

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/dashboard/links" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft size={15} /> Back to links
      </Link>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Create booking link</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />{error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className={cardCls}>
          <h2 className={sectionTitle}>Details</h2>
          <div>
            <label className={labelCls}>Client <span className="text-red-500">*</span></label>
            <select required value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })}
              className={inputCls}>
              <option value="">Select a client...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}{(c.calendar_connections?.length ?? 0) === 0 ? ' (no calendar)' : ''}
                </option>
              ))}
            </select>
            {form.client_id && !hasCalendar && (
              <div className="mt-2 flex items-center gap-2 text-xs text-amber-600">
                <AlertCircle size={12} />
                No calendar connected.{' '}
                <Link href={`/dashboard/clients/${form.client_id}/connect-calendar`} className="underline hover:text-amber-700">Connect one first →</Link>
              </div>
            )}
            {form.client_id && hasCalendar && (
              <p className="mt-1.5 text-xs text-green-600">✓ Calendar connected — real-time availability will be used</p>
            )}
          </div>

          <div>
            <label className={labelCls}>Name <span className="text-red-500">*</span></label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className={inputCls} placeholder="30-min discovery call" />
          </div>

          <div>
            <label className={labelCls}>URL slug <span className="text-red-500">*</span></label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 shrink-0">yourapp.com/book/</span>
              <input required value={form.slug}
                onChange={e => { setSlugEdited(true); setForm({ ...form, slug: slugify(e.target.value) }) }}
                className={inputCls + " font-mono flex-1"} placeholder="discovery-call" />
              <button type="button"
                onClick={() => { setSlugEdited(false); setForm(f => ({ ...f, slug: slugify(f.name) })) }}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={2} className={inputCls + " resize-none"} placeholder="Tell bookers what this meeting is about..." />
          </div>
        </div>

        <div className={cardCls}>
          <h2 className={sectionTitle}>Duration & buffers</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Duration (min)', key: 'duration_mins' },
              { label: 'Buffer before (min)', key: 'buffer_before' },
              { label: 'Buffer after (min)', key: 'buffer_after' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className={labelCls}>{label}</label>
                <input type="number" min={0} max={480}
                  value={form[key as keyof typeof form] as number}
                  onChange={e => setForm({ ...form, [key]: parseInt(e.target.value) })}
                  className={inputCls} />
              </div>
            ))}
          </div>
        </div>

        <div className={cardCls}>
          <h2 className={sectionTitle}>Working hours</h2>
          <p className="text-xs text-gray-500">Set allowed hours. Calendar events automatically block slots within these hours.</p>
          <div className="space-y-2">
            {DAYS.map(({ key, label }) => {
              const enabled = !!availability[key]
              const slot = availability[key]?.[0]
              return (
                <div key={key} className="flex items-center gap-3">
                  <button type="button" onClick={() => toggleDay(key)}
                    className={`w-24 text-left text-sm py-1.5 px-2 rounded-md transition-colors font-medium ${
                      enabled ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}>
                    {label.slice(0, 3)}
                  </button>
                  {enabled && slot ? (
                    <div className="flex items-center gap-2">
                      <input type="time" value={slot.start} onChange={e => updateDaySlot(key, 'start', e.target.value)}
                        className="px-2 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-black/20" />
                      <span className="text-gray-400 text-sm">to</span>
                      <input type="time" value={slot.end} onChange={e => updateDaySlot(key, 'end', e.target.value)}
                        className="px-2 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-black/20" />
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 italic">Unavailable</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className={cardCls}>
          <h2 className={sectionTitle}>Intake questions</h2>
          <p className="text-xs text-gray-500">Ask bookers questions before they confirm. Answers appear in the bookings dashboard.</p>
          <QuestionBuilder questions={questions} onChange={setQuestions} />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading || (!!form.client_id && !hasCalendar)}
            className="px-5 py-2.5 bg-black hover:bg-gray-800 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors">
            {loading ? 'Creating...' : 'Create booking link'}
          </button>
          <Link href="/dashboard/links"
            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
