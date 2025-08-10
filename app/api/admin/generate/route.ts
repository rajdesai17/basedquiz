import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const service = process.env.SUPABASE_SERVICE_ROLE
  if (!url || !service) return null
  return createClient(url, service)
}

function toISODate(d = new Date()): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString().slice(0, 10)
}

export async function POST() {
  const supabaseService = getServiceClient()
  if (!supabaseService) return NextResponse.json({ error: 'Supabase env missing' }, { status: 500 })
  const adminKey = process.env.CRON_SECRET
  // Simple guard for cron calls
  // In Vercel, set a header X-CRON-SECRET that matches CRON_SECRET
  // or use Vercel's built-in protection. Minimal for MVP.

  // Optional: uncomment to enforce header secret
  // const headerSecret = req.headers.get('x-cron-secret')
  // if (!adminKey || headerSecret !== adminKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = toISODate()

  // Ensure round exists
  const { data: round, error: rErr } = await supabaseService
    .from('daily_rounds')
    .upsert({ date: today }, { onConflict: 'date' })
    .select('*')
    .single()

  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 })

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `You are generating 5 beginner-friendly, fun trivia questions related to Base, Coinbase, Web3, blockchain, and onchain.
Constraints:
- Multiple choice with exactly 4 options each.
- Only one correct option per question.
- Keep language simple; avoid niche jargon.
- Spread across categories: Base, Coinbase, Web3, Blockchain, Onchain.
Return strict JSON with this shape:
{"questions":[{"category":"Base|Coinbase|Web3|Blockchain|Onchain","question":string,"options":[string,string,string,string],"correctIndex":0|1|2|3,"explanation":string}]}
`

  const response = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.6, maxOutputTokens: 600, responseMimeType: 'application/json' },
  })

  let payload: any
  try {
    payload = JSON.parse(response.response.text())
  } catch (e) {
    return NextResponse.json({ error: 'Bad JSON from Gemini' }, { status: 500 })
  }

  const items = Array.isArray(payload?.questions) ? payload.questions.slice(0, 5) : []
  if (items.length !== 5) return NextResponse.json({ error: 'Expected 5 questions' }, { status: 500 })

  type Row = {
    round_id: number
    category: string
    question_text: string
    options: [string, string, string, string]
    correct_index: number
    explanation: string | null
  }

  const rows: Row[] = items.map((q: any) => ({
    round_id: round.id,
    category: String(q.category ?? 'Web3'),
    question_text: String(q.question ?? '').slice(0, 800),
    options: [
      String(q.options?.[0] ?? ''),
      String(q.options?.[1] ?? ''),
      String(q.options?.[2] ?? ''),
      String(q.options?.[3] ?? ''),
    ],
    correct_index: Number(q.correctIndex ?? 0),
    explanation: q.explanation ? String(q.explanation).slice(0, 1000) : null,
  }))

  // Basic validation
  if (!rows.every((r: Row) => r.question_text && r.options.every(Boolean) && r.correct_index >= 0 && r.correct_index <= 3)) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
  }

  // Clean any previous questions for today (idempotent cron)
  await supabaseService.from('questions').delete().eq('round_id', round.id)

  const { error: insErr } = await supabaseService.from('questions').insert(rows)
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

  return NextResponse.json({ ok: true, count: rows.length })
}

