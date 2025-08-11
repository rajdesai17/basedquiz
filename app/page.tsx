'use client'

import Link from 'next/link'
import { useMiniKit } from '@coinbase/onchainkit/minikit'
import { useEffect, useMemo, useState } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import { useAccount, useWalletClient } from 'wagmi'
import { encodeFunctionData } from 'viem'
import { ConnectWallet } from '@coinbase/onchainkit/wallet'

export default function HomePage() {
  const { setFrameReady, isFrameReady } = useMiniKit()
  const { isConnected, address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const [loading, setLoading] = useState(false)
  const [rewards, setRewards] = useState<{ token?: any; eth?: any } | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        await sdk.actions.ready()
      } catch {}
    })()

    if (!isFrameReady) setFrameReady()
  }, [isFrameReady, setFrameReady])

  useEffect(() => {
    if (!address) return
    setLoading(true)
    ;(async () => {
      try {
        const today = new Date()
        const yyyy = today.getUTCFullYear()
        const mm = String(today.getUTCMonth() + 1).padStart(2, '0')
        const dd = String(today.getUTCDate()).padStart(2, '0')
        const { roundId } = await fetch(`/api/daily`, { cache: 'no-store' }).then((r) => r.json()).then((d) => ({ roundId: d.round.id }))
        const [tokenClaim, ethClaim] = await Promise.all([
          fetch(`/api/claim/token?roundId=${roundId}&wallet=${address}`).then((r) => r.ok ? r.json() : null).catch(() => null),
          fetch(`/api/claim?roundId=${roundId}&wallet=${address}`).then((r) => r.ok ? r.json() : null).catch(() => null),
        ])
        setRewards({ token: tokenClaim, eth: ethClaim })
      } catch {
        setRewards(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [address])
  
  return (
    <main className="container-page py-6">
      <section className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold">Base Trivia</h1>
            <p className="mt-2 text-neutral-300 text-sm sm:text-base">
              5 easy daily questions about Base, Coinbase, Web3, blockchain, and onchain.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/play" className="btn btn-primary">Play now</Link>
            <Link href="/leaderboard" className="btn btn-ghost">Leaderboard</Link>
            {isConnected && (
              <>
                <button
                  className="btn btn-ghost"
                  disabled={loading || !rewards?.token}
                  onClick={async () => {
                    try {
                      if (!walletClient) return alert('Connect wallet to claim')
                      const airdrop = process.env.NEXT_PUBLIC_AIRDROP_ADDRESS as string
                      if (!rewards?.token || !airdrop) return
                      const { amount, nonce, signature, roundId } = rewards.token
                      const abi = [{
                        type: 'function',
                        name: 'claim',
                        stateMutability: 'nonpayable',
                        inputs: [
                          { name: 'roundId', type: 'uint256' },
                          { name: 'amount', type: 'uint256' },
                          { name: 'nonce', type: 'bytes32' },
                          { name: 'signature', type: 'bytes' },
                        ],
                        outputs: [],
                      }]
                      const data = encodeFunctionData({ abi: abi as any, functionName: 'claim', args: [BigInt(roundId), BigInt(amount), nonce as `0x${string}`, signature as `0x${string}`] })
                      const hash = await walletClient.sendTransaction({ to: airdrop as `0x${string}`, data })
                      alert(`BQ claim sent: ${hash}`)
                    } catch (e: any) {
                      alert(e?.message || 'Claim failed')
                    }
                  }}
                >
                  Claim BQ
                </button>
                <button
                  className="btn btn-ghost"
                  disabled={loading || !rewards?.eth}
                  onClick={async () => {
                    try {
                      if (!walletClient) return alert('Connect wallet to claim')
                      const pool = process.env.NEXT_PUBLIC_POOL_ADDRESS as string
                      if (!rewards?.eth || !pool) return
                      const { amountWei, nonce, signature, roundId } = rewards.eth
                      const abi = [{
                        type: 'function',
                        name: 'claim',
                        stateMutability: 'nonpayable',
                        inputs: [
                          { name: 'roundId', type: 'uint256' },
                          { name: 'amount', type: 'uint256' },
                          { name: 'nonce', type: 'bytes32' },
                          { name: 'signature', type: 'bytes' },
                        ],
                        outputs: [],
                      }]
                      const data = encodeFunctionData({ abi: abi as any, functionName: 'claim', args: [BigInt(roundId), BigInt(amountWei), nonce as `0x${string}`, signature as `0x${string}`] })
                      const hash = await walletClient.sendTransaction({ to: pool as `0x${string}`, data })
                      alert(`ETH claim sent: ${hash}`)
                    } catch (e: any) {
                      alert(e?.message || 'Claim failed')
                    }
                  }}
                >
                  Claim ETH
                </button>
              </>
            )}
          </div>
        </div>

        {/* Debug (collapsible on small screens) */}
        <div className="mt-4 text-xs text-neutral-500 border border-neutral-800 p-2 rounded sm:max-w-md">
          <div className="flex items-center justify-between"><span>Frame Ready</span><span>{isFrameReady ? '✅' : '❌'}</span></div>
          <div className="flex items-center justify-between"><span>Wallet Connected</span><span>{isConnected ? '✅' : '❌'}</span></div>
          <div className="break-all">{address || 'No address'}</div>
        </div>

        {!isConnected && (
          <div className="mt-4 p-4 border border-blue-800 bg-blue-950/20 rounded">
            <p className="text-sm text-blue-300 mb-3">Connect your wallet to play trivia and compete!</p>
            <ConnectWallet className="btn btn-primary w-full sm:w-auto">
              <span>Connect Wallet</span>
            </ConnectWallet>
          </div>
        )}

        {isConnected && (
          <div className="mt-4 p-4 border border-neutral-800 bg-neutral-900/30 rounded">
            <h3 className="font-medium">Daily rule</h3>
            <p className="text-sm text-neutral-300 mt-2">You can play once per day. After submitting, come back tomorrow for a new round.</p>
          </div>
        )}
      </section>
    </main>
  )
}

