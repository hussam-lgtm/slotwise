'use client'

import { useState, useEffect, use } from 'react'
import { format, addDays, startOfDay, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Clock, Calendar, CheckCircle, Globe } from 'lucide-react'

interface Slot {
  start: string
  end: string
  label: string
}

type Step = 'pick-date' | 'pick-time' | 'confirm' | 'booked'

interface BookingLink {
  id: string
  name: string
  description?: string
  duration_mins: number
  timezone: string
  client: { name: string; company?: string }
}

export default function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)

  const [link, setLink] = useState<BookingLink | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [step, setStep] = useState<Step>('pick-date')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [calendarOffset, setCalendarOffset] = useState(0) // weeks offset
  const [form, setForm] = useState({ name: '', email: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [booking, setBooking] = useState<any>(null)

  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  // Fetch link info
  useEffect(() => {
    fetch(`/api/booking/${slug}/info`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setNotFound(true)
        else setLink(d.link)
      })
  }, [slug])

  // Fetch slots when date selected
  useEffect(() => {
    if (!selectedDate) return
    setLoadingSlots(true)
    setSlots([])
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    fetch(`/api/booking/${slug}/slots?date=${dateStr}`)
      .then(r => r.json())
      .then(d => {
        setSlots(d.slots ?? [])
        setLoadingSlots(false)
      })
  }, [selectedDate, slug])

  function selectDate(date: Date) {
    setSelectedDate(date)
    setSelectedSlot(null)
    setStep('pick-time')
  }

  function selectSlot(slot: Slot) {
    setSelectedSlot(slot)
    setStep('confirm')
  }

  async function confirmBooking(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSlot) return
    setSubmitting(true)

    const res = await fetch(`/api/booking/${slug}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booker_name: form.name,
        booker_email: form.email,
        starts_at: selectedSlot.start,
        timezone: userTimezone,
        notes: form.notes || undefined,
      }),
    })
    const data = await res.json()
    if (data.success) {
      setBooking(data.booking)
      setStep('booked')
    }
    setSubmitting(false)
  }

  // Build 2-week grid starting from today + offset
  const today = startOfDay(new Date())
  const gridStart = addDays(today, calendarOffset * 7)
  const days = Array.from({ length: 14 }, (_, i) => addDays(gridStart, i))

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-2xl font-semibold text-gray-700">Link not found</p>
          <p className="text-gray-400 text-sm mt-2">This booking link may have been removed or deactivated.</p>
        </div>
      </div>
    )
  }

  if (!link) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="bg-violet-600 px-6 py-5 text-white">
            <p className="text-sm opacity-80 mb-1">{link.client.name}</p>
            <h1 className="text-xl font-semibold">{link.name}</h1>
            {link.description && <p className="text-sm opacity-80 mt-1">{link.description}</p>}
            <div className="flex items-center gap-4 mt-3 text-sm opacity-80">
              <span className="flex items-center gap-1.5">
                <Clock size={14} /> {link.duration_mins} min
              </span>
              <span className="flex items-center gap-1.5">
                <Globe size={14} /> {userTimezone}
              </span>
            </div>
          </div>

          <div className="p-6">
            {/* Step: pick date */}
            {(step === 'pick-date' || step === 'pick-time') && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-medium text-gray-900">
                    {format(gridStart, 'MMMM yyyy')}
                  </h2>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCalendarOffset(o => Math.max(0, o - 1))}
                      disabled={calendarOffset === 0}
                      className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setCalendarOffset(o => o + 1)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Day labels */}
                <div className="grid grid-cols-7 mb-1">
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                    <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>
                  ))}
                </div>

                {/* Date grid — 2 rows of 7 */}
                <div className="grid grid-cols-7 gap-1 mb-6">
                  {days.map(day => {
                    const isPast = day < today
                    const isSelected = selectedDate && isSameDay(day, selectedDate)
                    return (
                      <button
                        key={day.toISOString()}
                        disabled={isPast}
                        onClick={() => selectDate(day)}
                        className={`aspect-square rounded-lg text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-violet-600 text-white'
                            : isPast
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'hover:bg-violet-50 text-gray-700'
                        }`}
                      >
                        {format(day, 'd')}
                      </button>
                    )
                  })}
                </div>

                {/* Time slots */}
                {step === 'pick-time' && selectedDate && (
                  <>
                    <div className="border-t border-gray-100 pt-5">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">
                        {format(selectedDate, 'EEEE, MMMM d')}
                      </h3>
                      {loadingSlots ? (
                        <div className="flex justify-center py-6">
                          <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : slots.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {slots.map(slot => (
                            <button
                              key={slot.start}
                              onClick={() => selectSlot(slot)}
                              className="py-2.5 px-3 border border-gray-200 hover:border-violet-400 hover:bg-violet-50 text-sm font-medium text-gray-700 rounded-lg transition-colors"
                            >
                              {slot.label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 text-center py-4">
                          No available times on this day.
                        </p>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {/* Step: confirm details */}
            {step === 'confirm' && selectedSlot && selectedDate && (
              <div>
                <button onClick={() => setStep('pick-time')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-5">
                  <ChevronLeft size={15} /> Back
                </button>

                <div className="flex items-center gap-2 p-3 bg-violet-50 rounded-lg mb-5">
                  <Calendar size={15} className="text-violet-600 shrink-0" />
                  <div className="text-sm">
                    <span className="font-medium text-violet-700">
                      {format(selectedDate, 'EEEE, MMMM d')}
                    </span>
                    <span className="text-violet-600"> · {selectedSlot.label}</span>
                  </div>
                </div>

                <form onSubmit={confirmBooking} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your name <span className="text-red-500">*</span></label>
                    <input
                      required
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="jane@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes <span className="text-xs text-gray-400">(optional)</span></label>
                    <textarea
                      value={form.notes}
                      onChange={e => setForm({ ...form, notes: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                      placeholder="Anything you'd like to share before the call..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-medium rounded-lg transition-colors"
                  >
                    {submitting ? 'Confirming...' : 'Confirm booking'}
                  </button>
                </form>
              </div>
            )}

            {/* Step: booked confirmation */}
            {step === 'booked' && (
              <div className="text-center py-6">
                <div className="flex justify-center mb-4">
                  <CheckCircle size={48} className="text-green-500" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">You're booked!</h2>
                <p className="text-gray-500 text-sm mb-4">
                  A calendar invite will be sent to <strong>{form.email}</strong>.
                </p>
                {selectedDate && selectedSlot && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">
                    <Calendar size={14} />
                    {format(selectedDate, 'EEEE, MMMM d')} · {selectedSlot.label}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">Powered by SlotWise</p>
      </div>
    </div>
  )
}
