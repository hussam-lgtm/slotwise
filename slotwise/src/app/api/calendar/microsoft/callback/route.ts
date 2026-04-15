import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const clientId = searchParams.get('state')

  if (!code || !clientId) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/clients?error=oauth_failed`)
  }

  const tokenRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/microsoft/callback`,
      grant_type: 'authorization_code',
      scope: 'offline_access Calendars.ReadWrite',
    }),
  })

  const tokens = await tokenRes.json()

  if (!tokens.access_token) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/clients?error=no_token`)
  }

  const supabase = await createClient()

  await supabase.from('calendar_connections').upsert({
    client_id: clientId,
    provider: 'microsoft',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    token_expiry: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'client_id,provider' })

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/clients/${clientId}?connected=microsoft`)
}
