'use client'

import { useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'

export default function ConnectButton() {
  const { address, isConnecting } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const [error, setError] = useState<string | null>(null)

  if (address) {
    return (
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-neutral-300">{address.slice(0, 6)}…{address.slice(-4)}</span>
        <button className="btn border border-neutral-700 hover:bg-neutral-800" onClick={() => disconnect()}>
          Disconnect
        </button>
      </div>
    )
  }

  const primary = connectors?.[0]

  return (
    <div className="flex items-center gap-3">
      <button
        className="btn btn-primary"
        disabled={!primary || isConnecting || isPending}
        onClick={async () => {
          setError(null)
          try {
            await connect({ connector: primary })
          } catch (e: any) {
            setError(e?.message || 'Failed to connect')
          }
        }}
      >
        {isConnecting || isPending ? 'Connecting…' : 'Connect wallet'}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}


