import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const clientId = searchParams.get('state')   // we passed client_id as state

  if (!code || !clientId) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/clients?error=oauth_failed`)
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/google/callback`,
      grant_type: 'authorization_code',
    }),
  })

  const tokens = await tokenRes.json()

  if (!tokens.access_token) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/clients?error=no_token`)
  }

  const supabase = await createClient()

  // Upsert the connection
  await supabase.from('calendar_connections').upsert({
    client_id: clientId,
    provider: 'google',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    token_expiry: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null,
    calendar_id: 'primary',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'client_id,provider' })

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/clients/${clientId}?connected=google`)
}
