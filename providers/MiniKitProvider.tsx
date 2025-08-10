'use client'

import { ReactNode } from 'react'
import { MiniKitProvider } from '@coinbase/onchainkit/minikit'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { base } from 'wagmi/chains'

export function MiniKitContextProvider({ children }: { children: ReactNode }) {
  return (
    <OnchainKitProvider apiKey={process.env.NEXT_PUBLIC_CDP_CLIENT_API_KEY} chain={base}>
      <MiniKitProvider apiKey={process.env.NEXT_PUBLIC_CDP_CLIENT_API_KEY} chain={base}>
        {children}
      </MiniKitProvider>
    </OnchainKitProvider>
  )
}

