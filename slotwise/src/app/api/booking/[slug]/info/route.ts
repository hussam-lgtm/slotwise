import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: link } = await supabase
    .from('booking_links')
    .select('id, name, description, duration_mins, timezone, client:clients(name, company)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!link) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ link })
}
