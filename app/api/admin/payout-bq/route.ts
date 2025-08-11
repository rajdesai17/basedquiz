import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ethers } from 'ethers'

export async function POST(req: NextRequest) {
  const secret = (req.headers.get('x-cron-secret') || '').toString()
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const rpc = process.env.BASE_RPC_URL
  const pk = process.env.OWNER_PK
  const tokenAddr = process.env.BQ_TOKEN_ADDRESS
  const vaultAddr = process.env.VAULT_ADDRESS
  if (!url || !anon || !rpc || !pk || !tokenAddr || !vaultAddr) {
    return NextResponse.json({ error: 'env' }, { status: 500 })
  }

  const supabase = createClient(url, anon)
  const body = await req.json().catch(() => null) as { roundId?: number; limit?: number }
  const roundId = Number(body?.roundId) || null
  const limit = Number(body?.limit ?? 20)
  if (!roundId) return NextResponse.json({ error: 'roundId' }, { status: 400 })

  const { data: pending, error } = await supabase
    .from('payouts')
    .select('id, wallet_address, amount_tokens')
    .eq('round_id', roundId)
    .is('tx_hash', null)
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!pending || pending.length === 0) return NextResponse.json({ ok: true, processed: 0 })

  const provider = new ethers.JsonRpcProvider(rpc)
  const signer = new ethers.Wallet(pk, provider)

  const tokenAbi = [ 'function decimals() view returns (uint8)' ]
  const vaultAbi = [ 'function payout(address to, uint256 amount) external' ]
  const token = new ethers.Contract(tokenAddr, tokenAbi, signer)
  const decimals: number = await token.decimals()
  const vault = new ethers.Contract(vaultAddr, vaultAbi, signer)

  let success = 0
  for (const row of pending) {
    const amount = ethers.parseUnits(row.amount_tokens.toString(), decimals)
    try {
      const tx = await vault.payout(row.wallet_address, amount)
      await tx.wait()
      await supabase.from('payouts').update({ tx_hash: tx.hash }).eq('id', row.id)
      success++
    } catch (e: any) {
      // continue on failure
    }
  }

  return NextResponse.json({ ok: true, processed: success, remaining: pending.length - success })
}


