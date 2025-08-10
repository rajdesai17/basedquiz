import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return NextResponse.json({ error: 'Supabase env missing' }, { status: 500 })
  const supabase = createClient(url, anon)
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { roundId, wallet, answers, elapsedMs } = body as {
    roundId: number
    wallet: string
    answers: number[]
    elapsedMs: number
  }

  if (!roundId || !wallet || !Array.isArray(answers)) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data: questions, error: qErr } = await supabase
    .from('questions')
    .select('id, correct_index')
    .eq('round_id', roundId)
    .order('id', { ascending: true })

  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 })
  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: 'No questions found' }, { status: 400 })
  }

  let correct = 0
  for (let i = 0; i < Math.min(questions.length, answers.length); i++) {
    if (answers[i] === questions[i].correct_index) correct++
  }

  const { error: insErr } = await supabase.from('scores').insert({
    round_id: roundId,
    wallet_address: wallet,
    correct_count: correct,
    total: questions.length,
    time_ms: Math.max(0, Number(elapsedMs) || 0),
  })

  if (insErr) {
    // 23505 unique violation -> already submitted
    if (insErr.code === '23505')
      return NextResponse.json({ ok: true, duplicate: true })
    return NextResponse.json({ error: insErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, correct })
}

