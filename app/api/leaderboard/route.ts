import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function toISODate(d = new Date()): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return NextResponse.json([])
  const supabase = createClient(url, anon)
  const { searchParams } = new URL(req.url)
  const roundIdParam = searchParams.get('roundId')

  let roundId: number | null = roundIdParam ? Number(roundIdParam) : null
  if (!roundId) {
    const today = toISODate()
    const { data: round } = await supabase
      .from('daily_rounds')
      .select('id')
      .eq('date', today)
      .maybeSingle()
    roundId = round?.id ?? null
  }

  if (!roundId) return NextResponse.json([])

  const { data: scores, error } = await supabase
    .from('scores')
    .select('wallet_address, correct_count, time_ms')
    .eq('round_id', roundId)
    .order('correct_count', { ascending: false })
    .order('time_ms', { ascending: true })
    .limit(50)

  if (error) return NextResponse.json([], { status: 200 })
  return NextResponse.json(scores ?? [])
}

