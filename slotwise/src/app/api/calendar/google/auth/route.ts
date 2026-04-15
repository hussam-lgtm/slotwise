import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

export function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('client_id')
  if (!clientId) return NextResponse.json({ error: 'Missing client_id' }, { status: 400 })

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/google/callback`,
    response_type: 'code',
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly',
    ].join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state: clientId,   // we'll read this back in the callback
  })

  return NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params}`)
}
