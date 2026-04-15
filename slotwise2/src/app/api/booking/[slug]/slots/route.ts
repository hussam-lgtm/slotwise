import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAvailableSlots } from '@/lib/availability'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const date = req.nextUrl.searchParams.get('date')  // YYYY-MM-DD

  if (!date) return NextResponse.json({ error: 'Missing date' }, { status: 400 })

  const supabase = await createClient()

  const { data: link } = await supabase
    .from('booking_links')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!link) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Get existing bookings for this date
  const dayStart = new Date(`${date}T00:00:00.000Z`)
  const dayEnd = new Date(`${date}T23:59:59.999Z`)

  const { data: existingBookings } = await supabase
    .from('bookings')
    .select('starts_at, ends_at')
    .eq('booking_link_id', link.id)
    .eq('status', 'confirmed')
    .gte('starts_at', dayStart.toISOString())
    .lte('starts_at', dayEnd.toISOString())

  const slots = getAvailableSlots(
    new Date(date),
    link.availability ?? {},
    link.duration_mins,
    link.buffer_before,
    link.buffer_after,
    existingBookings ?? [],
    link.timezone
  )

  return NextResponse.json({ slots })
}
