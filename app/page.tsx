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
    <main className="mx-auto max-w-2xl p-6">
      <div className="card">
        <h1 className="text-2xl font-semibold">Base Trivia</h1>
        <p className="mt-2 text-neutral-300">
          5 easy daily questions about Base, Coinbase, Web3, blockchain, and onchain.
        </p>
        
        {/* Debug info */}
        <div className="mt-4 text-xs text-neutral-500 border border-neutral-800 p-2 rounded">
          <div>Frame Ready: {isFrameReady ? '✅' : '❌'}</div>
          <div>Wallet Connected: {isConnected ? '✅' : '❌'}</div>
          <div>Address: {address || 'None'}</div>
        </div>
        
        {!isConnected && (
          <div className="mt-4 p-4 border border-blue-800 bg-blue-950/20 rounded">
            <p className="text-sm text-blue-300 mb-3">Connect your wallet to play trivia and compete!</p>
            <ConnectWallet className="btn btn-primary">
              <span>Connect Wallet</span>
            </ConnectWallet>
          </div>
        )}
        
        <div className="mt-6 flex gap-3">
          <Link href="/play" className="btn btn-primary">Play now</Link>
          <Link href="/leaderboard" className="btn border border-neutral-700 hover:bg-neutral-800">Leaderboard</Link>
        </div>
      </div>
    </main>
  )
}

