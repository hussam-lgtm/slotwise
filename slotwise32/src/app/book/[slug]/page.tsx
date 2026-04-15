'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, use } from 'react'
import { format, addDays, startOfDay, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Clock, Calendar, CheckCircle, Globe } from 'lucide-react'
import type { BookingQuestion } from '@/types'

interface Slot { start: string; end: string; label: string }
type Step = 'pick-date' | 'pick-time' | 'confirm' | 'booked'

interface BookingLink {
  id: string; name: string; description?: string
  duration_mins: number; timezone: string
  client: { name: string; company?: string }
}

export default function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [link, setLink] = useState<BookingLink | null>(null)
  const [questions, setQuestions] = useState<BookingQuestion[]>([])
  const [notFound, setNotFound] = useState(false)
  const [step, setStep] = useState<Step>('pick-date')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [calendarOffset, setCalendarOffset] = useState(0)
  const [form, setForm] = useState({ name: '', email: '', notes: '' })
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  useEffect(() => {
    fetch(`/api/booking/${slug}/info`).then(r => r.json()).then(d => {
      if (d.error) setNotFound(true)
      else { setLink(d.link); setQuestions(d.questions ?? []) }
    })
  }, [slug])

  useEffect(() => {
    if (!selectedDate) return
    setLoadingSlots(true)
    setSlots([])
    fetch(`/api/booking/${slug}/slots?date=${format(selectedDate, 'yyyy-MM-dd')}`)
      .then(r => r.json()).then(d => { setSlots(d.slots ?? []); setLoadingSlots(false) })
  }, [selectedDate, slug])

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
        answers: Object.entries(answers).map(([question_id, answer]) => ({ question_id, answer })),
      }),
    })
    const data = await res.json()
    if (data.success) setStep('booked')
    setSubmitting(false)
  }

  const today = startOfDay(new Date())
  const gridStart = addDays(today, calendarOffset * 7)
  const days = Array.from({ length: 14 }, (_, i) => addDays(gridStart, i))

  const inputCls = "w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"

  if (notFound) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <p className="text-xl font-semibold text-white">Link not found</p>
        <p className="text-zinc-500 text-sm mt-2">This booking link may have been removed.</p>
      </div>
    </div>
  )

  if (!link) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-black flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-5">
            <p className="text-sm text-zinc-500 mb-1">{link.client.name}</p>
            <h1 className="text-lg font-semibold text-white">{link.name}</h1>
            {link.description && <p className="text-sm text-zinc-400 mt-1">{link.description}</p>}
            <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5"><Clock size={12} /> {link.duration_mins} min</span>
              <span className="flex items-center gap-1.5"><Globe size={12} /> {userTimezone}</span>
            </div>
          </div>

          <div className="p-6">
            {/* Date + time picker */}
            {(step === 'pick-date' || step === 'pick-time') && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-white">{format(gridStart, 'MMMM yyyy')}</h2>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCalendarOffset(o => Math.max(0, o - 1))} disabled={calendarOffset === 0}
                      className="p-1.5 rounded-lg hover:bg-zinc-800 disabled:opacity-30 text-zinc-400 transition-colors">
                      <ChevronLeft size={15} />
                    </button>
                    <button onClick={() => setCalendarOffset(o => o + 1)}
                      className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 transition-colors">
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 mb-1">
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                    <div key={d} className="text-center text-xs text-zinc-600 py-1">{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1 mb-5">
                  {days.map(day => {
                    const isPast = day < today
                    const isSelected = selectedDate && isSameDay(day, selectedDate)
                    return (
                      <button key={day.toISOString()} disabled={isPast} onClick={() => { setSelectedDate(day); setSelectedSlot(null); setStep('pick-time') }}
                        className={`aspect-square rounded-lg text-sm font-medium transition-colors ${
                          isSelected ? 'bg-white text-black'
                          : isPast ? 'text-zinc-700 cursor-not-allowed'
                          : 'hover:bg-zinc-800 text-zinc-300'
                        }`}>
                        {format(day, 'd')}
                      </button>
                    )
                  })}
                </div>

                {step === 'pick-time' && selectedDate && (
                  <div className="border-t border-zinc-800 pt-5">
                    <h3 className="text-sm font-medium text-white mb-3">
                      {format(selectedDate, 'EEEE, MMMM d')}
                    </h3>
                    {loadingSlots ? (
                      <div className="flex justify-center py-6">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : slots.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {slots.map(slot => (
                          <button key={slot.start} onClick={() => { setSelectedSlot(slot); setStep('confirm') }}
                            className="py-2.5 px-3 border border-zinc-700 hover:border-white hover:bg-zinc-800 text-sm font-medium text-zinc-300 hover:text-white rounded-lg transition-colors">
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-600 text-center py-4">No available times on this day.</p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Confirm form */}
            {step === 'confirm' && selectedSlot && selectedDate && (
              <div>
                <button onClick={() => setStep('pick-time')} className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white mb-5 transition-colors">
                  <ChevronLeft size={15} /> Back
                </button>

                <div className="flex items-center gap-2 p-3 bg-zinc-900 border border-zinc-800 rounded-lg mb-5">
                  <Calendar size={14} className="text-zinc-400 shrink-0" />
                  <span className="text-sm text-white font-medium">{format(selectedDate, 'EEEE, MMMM d')}</span>
                  <span className="text-zinc-500 text-sm">· {selectedSlot.label}</span>
                </div>

                <form onSubmit={confirmBooking} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">Your name <span className="text-red-500">*</span></label>
                    <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                      className={inputCls} placeholder="Jane Smith" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">Email <span className="text-red-500">*</span></label>
                    <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                      className={inputCls} placeholder="jane@company.com" />
                  </div>

                  {/* Dynamic questions */}
                  {questions.map(q => (
                    <div key={q.id}>
                      <label className="block text-sm font-medium text-zinc-300 mb-1">
                        {q.label} {q.required && <span className="text-red-500">*</span>}
                      </label>
                      {q.type === 'text' ? (
                        <input
                          required={q.required}
                          value={answers[q.id] ?? ''}
                          onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                          className={inputCls}
                          placeholder="Your answer..."
                        />
                      ) : (
                        <div className="space-y-2">
                          {(q.options ?? []).map(opt => (
                            <label key={opt} className="flex items-center gap-2.5 cursor-pointer group">
                              <input
                                type="radio"
                                name={q.id}
                                value={opt}
                                required={q.required}
                                checked={answers[q.id] === opt}
                                onChange={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                                className="accent-white"
                              />
                              <span className="text-sm text-zinc-400 group-hover:text-white transition-colors">{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">
                      Notes <span className="text-xs text-zinc-600">(optional)</span>
                    </label>
                    <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                      rows={2} className={inputCls + " resize-none"}
                      placeholder="Anything you'd like to share beforehand..." />
                  </div>

                  <button type="submit" disabled={submitting}
                    className="w-full py-3 bg-white hover:bg-zinc-100 disabled:opacity-60 text-black font-medium rounded-lg transition-colors">
                    {submitting ? 'Confirming...' : 'Confirm booking'}
                  </button>
                </form>
              </div>
            )}

            {/* Success */}
            {step === 'booked' && (
              <div className="text-center py-6">
                <CheckCircle size={44} className="text-emerald-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">You're booked!</h2>
                <p className="text-zinc-500 text-sm mb-4">
                  A confirmation will be sent to <span className="text-white">{form.email}</span>
                </p>
                {selectedDate && selectedSlot && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300">
                    <Calendar size={13} />
                    {format(selectedDate, 'EEEE, MMMM d')} · {selectedSlot.label}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <p className="text-center text-xs text-zinc-700 mt-4">Powered by SlotWise</p>
      </div>
    </div>
  )
}
