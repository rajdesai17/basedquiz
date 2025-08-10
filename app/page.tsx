'use client'

import Link from 'next/link'
import { useMiniKit } from '@coinbase/onchainkit/minikit'
import { useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

export default function HomePage() {
  const { setFrameReady, isFrameReady } = useMiniKit()

  useEffect(() => {
    ;(async () => {
      try {
        await sdk.actions.ready()
      } catch {}
    })()

    if (!isFrameReady) setFrameReady()
  }, [isFrameReady, setFrameReady])
  
  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="card">
        <h1 className="text-2xl font-semibold">Base Trivia</h1>
        <p className="mt-2 text-neutral-300">
          5 easy daily questions about Base, Coinbase, Web3, blockchain, and onchain.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/play" className="btn btn-primary">Play now</Link>
          <Link href="/leaderboard" className="btn border border-neutral-700 hover:bg-neutral-800">Leaderboard</Link>
        </div>
      </div>
    </main>
  )
}

