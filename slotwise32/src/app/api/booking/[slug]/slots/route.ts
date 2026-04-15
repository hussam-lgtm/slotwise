import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAvailableSlots } from '@/lib/availability'
import { getGoogleBusyTimes, getMicrosoftBusyTimes } from '@/lib/calendarBusy'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const date = req.nextUrl.searchParams.get('date')

  if (!date) return NextResponse.json({ error: 'Missing date' }, { status: 400 })

  const supabase = await createClient()

  const { data: link } = await supabase
    .from('booking_links')
    .select('*, client:clients(calendar_connections(*))')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!link) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const dayStart = new Date(`${date}T00:00:00.000Z`)
  const dayEnd = new Date(`${date}T23:59:59.999Z`)

  const { data: existingBookings } = await supabase
    .from('bookings')
    .select('starts_at, ends_at')
    .eq('booking_link_id', link.id)
    .eq('status', 'confirmed')
    .gte('starts_at', dayStart.toISOString())
    .lte('starts_at', dayEnd.toISOString())

  const calConn = (link.client as any)?.calendar_connections?.[0]
  let calendarBusy: { starts_at: string; ends_at: string }[] = []

  if (calConn) {
    let busyBlocks: { start: string; end: string }[] = []
    if (calConn.provider === 'google') {
      busyBlocks = await getGoogleBusyTimes(
        calConn.access_token,
        calConn.calendar_id ?? 'primary',
        dayStart.toISOString(),
        dayEnd.toISOString()
      )
    } else if (calConn.provider === 'microsoft') {
      busyBlocks = await getMicrosoftBusyTimes(
        calConn.access_token,
        dayStart.toISOString(),
        dayEnd.toISOString()
      )
    }
    calendarBusy = busyBlocks.map(b => ({ starts_at: b.start, ends_at: b.end }))
  }

  const allBusy = [...(existingBookings ?? []), ...calendarBusy]

  const slots = getAvailableSlots(
    new Date(date),
    link.availability ?? {},
    link.duration_mins,
    link.buffer_before,
    link.buffer_after,
    allBusy,
    link.timezone
  )

  return NextResponse.json({ slots })
}
