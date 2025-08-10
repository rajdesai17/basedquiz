import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return NextResponse.json({ error: 'env missing' }, { status: 500 })
  const supabase = createClient(url, anon)

  const idNum = Number(params.id)
  if (!idNum) return NextResponse.json({ error: 'bad id' }, { status: 400 })

  const { data, error } = await supabase
    .from('daily_rounds')
    .select('id, date, paid_day, entry_fee_wei')
    .eq('id', idNum)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({
    id: data.id,
    date: data.date,
    paidDay: !!data.paid_day,
    entryFeeWei: String(data.entry_fee_wei ?? 0),
  })
}


