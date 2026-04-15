import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { addMinutes, parseISO } from 'date-fns'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const body = await req.json()
  const { booker_name, booker_email, starts_at, timezone, notes } = body

  if (!booker_name || !booker_email || !starts_at) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: link } = await supabase
    .from('booking_links')
    .select('*, client:clients(*, calendar_connections(*))')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!link) return NextResponse.json({ error: 'Booking link not found' }, { status: 404 })

  const ends_at = addMinutes(parseISO(starts_at), link.duration_mins).toISOString()

  // Insert the booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      booking_link_id: link.id,
      booker_name,
      booker_email,
      starts_at,
      ends_at,
      timezone,
      status: 'confirmed',
      notes: notes ?? null,
    })
    .select()
    .single()

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 500 })
  }

  // Create calendar event if a connection exists
  const calConn = link.client?.calendar_connections?.[0]
  if (calConn) {
    try {
      let calEventId: string | null = null

      if (calConn.provider === 'google') {
        calEventId = await createGoogleEvent(calConn.access_token, {
          summary: `${link.name} with ${booker_name}`,
          description: `Booked via SlotWise\n\nBooker: ${booker_email}${notes ? `\n\nNotes: ${notes}` : ''}`,
          start: starts_at,
          end: ends_at,
          attendeeEmail: booker_email,
        })
      } else if (calConn.provider === 'microsoft') {
        calEventId = await createMicrosoftEvent(calConn.access_token, {
          subject: `${link.name} with ${booker_name}`,
          body: `Booked via SlotWise. Booker: ${booker_email}`,
          start: starts_at,
          end: ends_at,
          attendeeEmail: booker_email,
        })
      }

      if (calEventId) {
        await supabase
          .from('bookings')
          .update({ calendar_event_id: calEventId })
          .eq('id', booking.id)
      }
    } catch (err) {
      // Don't fail the booking if calendar creation fails — log and continue
      console.error('Calendar event creation failed:', err)
    }
  }

  return NextResponse.json({ booking, success: true })
}

async function createGoogleEvent(
  accessToken: string,
  event: { summary: string; description: string; start: string; end: string; attendeeEmail: string }
) {
  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: event.summary,
        description: event.description,
        start: { dateTime: event.start },
        end: { dateTime: event.end },
        attendees: [{ email: event.attendeeEmail }],
        conferenceData: {
          createRequest: { requestId: Math.random().toString(36) },
        },
      }),
    }
  )
  const data = await res.json()
  return data.id ?? null
}

async function createMicrosoftEvent(
  accessToken: string,
  event: { subject: string; body: string; start: string; end: string; attendeeEmail: string }
) {
  const res = await fetch('https://graph.microsoft.com/v1.0/me/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subject: event.subject,
      body: { contentType: 'text', content: event.body },
      start: { dateTime: event.start, timeZone: 'UTC' },
      end: { dateTime: event.end, timeZone: 'UTC' },
      attendees: [{ emailAddress: { address: event.attendeeEmail }, type: 'required' }],
    }),
  })
  const data = await res.json()
  return data.id ?? null
}
