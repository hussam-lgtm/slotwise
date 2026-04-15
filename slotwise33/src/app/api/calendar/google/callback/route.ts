import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const clientId = searchParams.get('state')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!code || !clientId) {
    return NextResponse.redirect(`${appUrl}/dashboard/clients?error=oauth_failed`)
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${appUrl}/api/calendar/google/callback`,
      grant_type: 'authorization_code',
    }),
  })

  const tokens = await tokenRes.json()

  if (!tokens.access_token) {
    return NextResponse.redirect(`${appUrl}/dashboard/clients?error=no_token`)
  }

  const supabase = await createClient()

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

  // Use HTML redirect to preserve cookies across the redirect
  const redirectUrl = `${appUrl}/dashboard/clients/${clientId}?connected=google`
  return new NextResponse(
    `<html><head><meta http-equiv="refresh" content="0;url=${redirectUrl}"></head><body><script>window.location.href="${redirectUrl}"</script></body></html>`,
    {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    }
  )
}
