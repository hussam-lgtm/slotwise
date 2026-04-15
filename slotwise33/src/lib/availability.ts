import { addMinutes, format, parseISO, startOfDay, isAfter, isBefore, setHours, setMinutes } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import type { Availability, WeekdayKey } from '@/types'

const DAY_KEYS: WeekdayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export interface Slot {
  start: string  // ISO string
  end: string
  label: string  // "9:00 AM"
}

export function getAvailableSlots(
  date: Date,
  availability: Availability,
  durationMins: number,
  bufferBefore: number,
  bufferAfter: number,
  existingBookings: { starts_at: string; ends_at: string }[],
  timezone: string
): Slot[] {
  const dayKey = DAY_KEYS[date.getDay()] as WeekdayKey
  const daySlots = availability[dayKey]
  if (!daySlots || daySlots.length === 0) return []

  const slots: Slot[] = []
  const slotStep = durationMins

  for (const window of daySlots) {
    const [startH, startM] = window.start.split(':').map(Number)
    const [endH, endM] = window.end.split(':').map(Number)

    // Build window start/end in the booking timezone
    let current = fromZonedTime(
      setMinutes(setHours(startOfDay(toZonedTime(date, timezone)), startH), startM),
      timezone
    )
    const windowEnd = fromZonedTime(
      setMinutes(setHours(startOfDay(toZonedTime(date, timezone)), endH), endM),
      timezone
    )

    while (isBefore(addMinutes(current, durationMins), windowEnd) ||
           +addMinutes(current, durationMins) === +windowEnd) {
      const slotStart = current
      const slotEnd = addMinutes(current, durationMins)

      // Check against existing bookings (with buffers)
      const blocked = existingBookings.some(b => {
        const bStart = addMinutes(parseISO(b.starts_at), -bufferBefore)
        const bEnd = addMinutes(parseISO(b.ends_at), bufferAfter)
        return isBefore(slotStart, bEnd) && isAfter(slotEnd, bStart)
      })

      // Don't show slots in the past
      const isPast = isBefore(slotStart, addMinutes(new Date(), 30))

      if (!blocked && !isPast) {
        const zonedStart = toZonedTime(slotStart, timezone)
        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          label: format(zonedStart, 'h:mm a'),
        })
      }

      current = addMinutes(current, slotStep)
    }
  }

  return slots
}
