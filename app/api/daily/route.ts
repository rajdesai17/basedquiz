import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function toISODate(d = new Date()): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString().slice(0, 10)
}

export async function GET() {
  const today = toISODate()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return NextResponse.json({ error: 'Supabase env missing' }, { status: 500 })
  const supabase = createClient(url, anon)

  // Ensure there's exactly one round per date
  let { data: roundData, error: roundErr } = await supabase
    .from('daily_rounds')
    .select('*')
    .eq('date', today)
    .limit(1)
    .maybeSingle()

  if (roundErr) return NextResponse.json({ error: roundErr.message }, { status: 500 })

  // If missing, auto-create an empty round (works in prod to guarantee availability)
  if (!roundData) {
    const { data, error } = await supabase
      .from('daily_rounds')
      .insert({ date: today })
      .select('*')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    roundData = data
  }

  if (!roundData) {
    return NextResponse.json({ error: 'Today\'s round not ready' }, { status: 404 })
  }

  const { data: questions, error: qErr } = await supabase
    .from('questions')
    .select('id, question_text, options, correct_index')
    .eq('round_id', roundData.id)
    .order('id', { ascending: true })

  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 })

  return NextResponse.json({ round: roundData, questions: questions ?? [] })
}

