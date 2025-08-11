'use client'

import { ReactNode } from 'react'
import { MiniKitProvider } from '@coinbase/onchainkit/minikit'
import { base } from 'wagmi/chains'

export function MiniKitContextProvider({ children }: { children: ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_CDP_CLIENT_API_KEY || ''

  return (
    <MiniKitProvider apiKey={apiKey} chain={base}>
      {children}
    </MiniKitProvider>
  )
}

