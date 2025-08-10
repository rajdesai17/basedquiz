'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMiniKit } from '@coinbase/onchainkit/minikit'
import { createWalletClient, encodeFunctionData, getAddress, http, custom, parseAbi } from 'viem'

const POOL_ADDRESS = process.env.NEXT_PUBLIC_POOL_ADDRESS as `0x${string}` | undefined
const CHAIN_ID = 8453 // Base mainnet
const ABI = parseAbi([
  'function enter(uint256 roundId) payable',
])

export default function EnterPage() {
  const { address } = useMiniKit() as any
  const [roundId, setRoundId] = useState<number | null>(null)
  const [paidDay, setPaidDay] = useState(false)
  const [entryFeeWei, setEntryFeeWei] = useState<bigint>(0n)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isReady = useMemo(() => paidDay && entryFeeWei > 0n && !!POOL_ADDRESS, [paidDay, entryFeeWei])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // Get today's round
        const r = await fetch('/api/daily', { cache: 'no-store' })
        if (!r.ok) throw new Error('Failed to fetch round')
        const daily = await r.json()
        if (!mounted) return
        setRoundId(daily.round.id)

        const m = await fetch(`/api/round/${daily.round.id}`, { cache: 'no-store' })
        if (!m.ok) throw new Error('Failed to fetch round meta')
        const meta = await m.json()
        if (!mounted) return
        setPaidDay(!!meta.paidDay)
        setEntryFeeWei(BigInt(meta.entryFeeWei || '0'))
      } catch (e: any) {
        setError(e?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  async function onEnter() {
    if (!address || !roundId || !POOL_ADDRESS) return
    try {
      // prefer injected provider (Mini App environment)
      const provider = (globalThis as any).ethereum
      const transport = provider ? custom(provider) : http()
      const walletClient = createWalletClient({ transport })
      const [account] = await walletClient.requestAddresses()
      const to = getAddress(POOL_ADDRESS)
      const data = encodeFunctionData({ abi: ABI, functionName: 'enter', args: [BigInt(roundId)] })
      await walletClient.sendTransaction({
        chain: { id: CHAIN_ID, name: 'base', nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: ['https://mainnet.base.org'] } } },
        account,
        to,
        data,
        value: entryFeeWei,
      })
    } catch (e) {
      // ignore
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="card">
        <h1 className="text-2xl font-semibold">Paid Day Entry</h1>
        {loading ? (
          <p className="mt-2 text-neutral-300">Loading…</p>
        ) : error ? (
          <p className="mt-2 text-red-400">{error}</p>
        ) : (
          <>
            <p className="mt-2 text-neutral-300">Round: {roundId}</p>
            <p className="mt-1 text-neutral-300">Paid day: {paidDay ? 'Yes' : 'No'}</p>
            <p className="mt-1 text-neutral-300">Entry fee: {entryFeeWei.toString()} wei</p>
            {!address && <p className="mt-3 text-sm text-yellow-300">Connect your wallet to continue.</p>}
            {!POOL_ADDRESS && <p className="mt-3 text-sm text-yellow-300">Pool address not configured.</p>}
            <button className="btn btn-primary mt-4" disabled={!address || !isReady} onClick={onEnter}>
              Enter
            </button>
          </>
        )}
      </div>
    </main>
  )
}


