import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return NextResponse.json({ error: 'env' }, { status: 500 })
  const supabase = createClient(url, anon)

  const { searchParams } = new URL(req.url)
  const roundId = Number(searchParams.get('roundId'))
  const wallet = (searchParams.get('wallet') || '').toLowerCase()
  if (!roundId || !wallet) return NextResponse.json({ error: 'params' }, { status: 400 })

  const { data, error } = await supabase
    .from('token_claims')
    .select('amount_tokens, nonce, signature')
    .eq('round_id', roundId)
    .ilike('wallet_address', wallet)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json({ roundId, wallet, amount: data.amount_tokens, nonce: data.nonce, signature: data.signature })
}


