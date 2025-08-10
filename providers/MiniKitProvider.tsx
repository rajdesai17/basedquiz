'use client'

import { ReactNode } from 'react'
import { MiniKitProvider } from '@coinbase/onchainkit/minikit'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { base } from 'wagmi/chains'

export function MiniKitContextProvider({ children }: { children: ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_CDP_CLIENT_API_KEY || ''
  
  return (
    <OnchainKitProvider 
      apiKey={apiKey} 
      chain={base}
      projectName={process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'basedquiz'}
    >
      <MiniKitProvider>
        {children}
      </MiniKitProvider>
    </OnchainKitProvider>
  )
}

