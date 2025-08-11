'use client'

import Link from 'next/link'
import { useMiniKit } from '@coinbase/onchainkit/minikit'
import { useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import { useAccount } from 'wagmi'
import { ConnectWallet } from '@coinbase/onchainkit/wallet'

export default function HomePage() {
  const { setFrameReady, isFrameReady } = useMiniKit()
  const { isConnected, address } = useAccount()

  useEffect(() => {
    ;(async () => {
      try {
        await sdk.actions.ready()
      } catch {}
    })()

    if (!isFrameReady) setFrameReady()
  }, [isFrameReady, setFrameReady])
  
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
          <div className="flex gap-2">
            <Link href="/play" className="btn btn-primary">Play now</Link>
            <Link href="/leaderboard" className="btn btn-ghost">Leaderboard</Link>
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
      </section>
    </main>
  )
}

