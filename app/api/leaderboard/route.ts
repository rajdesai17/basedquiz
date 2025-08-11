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
    .select('wallet_address, correct_count, time_ms, total')
    .eq('round_id', roundId)
    .limit(200)

  if (error) return NextResponse.json([], { status: 200 })

  const ranked = (scores ?? []).sort((a: any, b: any) => {
    const aPerfect = a.correct_count === a.total ? 1 : 0
    const bPerfect = b.correct_count === b.total ? 1 : 0
    if (aPerfect !== bPerfect) return bPerfect - aPerfect
    if (a.correct_count !== b.correct_count) return b.correct_count - a.correct_count
    return a.time_ms - b.time_ms
  }).slice(0, 50)

  return NextResponse.json(ranked)
}

