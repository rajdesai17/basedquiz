import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'
import { encodePacked, keccak256, toBytes } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

function toISODate(d = new Date()): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString().slice(0, 10)
}

type RankedScore = {
  wallet_address: string
  correct_count: number
  total: number
  time_ms: number
}

export async function POST(req: NextRequest) {
  const secret = (req.headers.get('x-cron-secret') || '').toString()
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return NextResponse.json({ error: 'Supabase env missing' }, { status: 500 })
  const supabase = createClient(url, anon)

  const body = await req.json().catch(() => null) as { roundId?: number; freeDay?: boolean; topN?: number; poolAddress?: string }
  const roundId = Number(body?.roundId) || null
  const freeDay = Boolean(body?.freeDay)
  const topN = Number(body?.topN ?? 10)
  const poolAddress = (body?.poolAddress || process.env.POOL_ADDRESS || '').toString()
  if (!roundId) return NextResponse.json({ error: 'roundId' }, { status: 400 })

  const { data: scores, error } = await supabase
    .from('scores')
    .select('wallet_address, correct_count, total, time_ms')
    .eq('round_id', roundId)
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ranked: RankedScore[] = (scores ?? []).sort((a: any, b: any) => {
    const aPerfect = a.correct_count === a.total ? 1 : 0
    const bPerfect = b.correct_count === b.total ? 1 : 0
    if (aPerfect !== bPerfect) return bPerfect - aPerfect
    if (a.correct_count !== b.correct_count) return b.correct_count - a.correct_count
    return a.time_ms - b.time_ms
  }).slice(0, topN)

  if (freeDay) {
    // Free day: create signed token claims for TokenAirdrop; users claim and pay gas
    const perWinner = process.env.FREE_DAY_TOKENS_PER_WINNER || '10'
    const signerPk = process.env.OWNER_PK
    if (!signerPk) return NextResponse.json({ error: 'signer env' }, { status: 500 })
    const account = privateKeyToAccount(('0x' + signerPk.replace(/^0x/, '')) as `0x${string}`)
    const chainId = 8453n
    const airdropAddr = (process.env.AIRDROP_ADDRESS || '').toString()
    if (!airdropAddr) return NextResponse.json({ error: 'airdrop addr missing' }, { status: 500 })

    const decimals = BigInt(18)
    const amountWei = BigInt(Number(perWinner)) * 10n ** decimals

    const rows: { round_id: number; wallet_address: string; amount_tokens: string; nonce: string; signature: string }[] = []
    for (const r of ranked) {
      const wallet = r.wallet_address as `0x${string}`
      const nonceHex = ('0x' + randomBytes(32).toString('hex')) as `0x${string}`
      const packed = encodePacked(
        ['uint256','address','uint256','address','uint256','bytes32'],
        [chainId, airdropAddr as `0x${string}`, BigInt(roundId), wallet, amountWei, nonceHex]
      )
      const digest = keccak256(packed)
      const signature = await account.signMessage({ message: { raw: toBytes(digest) } })
      rows.push({ round_id: roundId, wallet_address: wallet, amount_tokens: amountWei.toString(), nonce: nonceHex, signature })
    }

    const { error: insErr } = await supabase.from('token_claims').insert(rows)
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
    return NextResponse.json({ ok: true, winners: ranked.length, perWinner: perWinner })
  }

  // Paid day: create signed ETH claims using BaseRallyPool domain separation
  const signerPk = process.env.OWNER_PK
  const payoutSigner = (process.env.PAYOUT_SIGNER || '').toLowerCase()
  const entryFeeWei = process.env.ENTRY_FEE_WEI || '0'
  if (!signerPk || !payoutSigner) return NextResponse.json({ error: 'signer env' }, { status: 500 })
  if (!poolAddress) return NextResponse.json({ error: 'pool addr missing' }, { status: 500 })

  // simple split: pool total = entryFee * participants; distribute to ranked proportionally (70/20/10 if 3, else equal topN)
  const participants = (scores ?? []).length
  const totalPool = BigInt(entryFeeWei) * BigInt(participants)
  const amounts: bigint[] = ranked.map(() => totalPool / BigInt(ranked.length))

  // Sign claims with payout signer
  const chainId = 8453n
  const account = privateKeyToAccount(('0x' + signerPk.replace(/^0x/, '')) as `0x${string}`)

  const rows: { round_id: number; wallet_address: string; amount_wei: string; nonce: string; signature: string }[] = []
  for (let i = 0; i < ranked.length; i++) {
    const wallet = ranked[i].wallet_address as `0x${string}`
    const amount = amounts[i]
    const nonceHex = ('0x' + randomBytes(32).toString('hex')) as `0x${string}`
    const packed = encodePacked(
      ['uint256','address','uint256','address','uint256','bytes32'],
      [chainId, poolAddress as `0x${string}`, BigInt(roundId), wallet, amount, nonceHex]
    )
    const digest = keccak256(packed)
    const signature = await account.signMessage({ message: { raw: toBytes(digest) } })
    rows.push({ round_id: roundId, wallet_address: wallet, amount_wei: amount.toString(), nonce: nonceHex, signature })
  }

  const { error: cErr } = await supabase.from('claims').insert(rows)
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })
  return NextResponse.json({ ok: true, winners: ranked.length, totalPool: totalPool.toString(), claims: rows.length })
}


