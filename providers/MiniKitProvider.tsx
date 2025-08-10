'use client'

import { ReactNode } from 'react'
import { MiniKitProvider } from '@coinbase/onchainkit/minikit'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { base } from 'wagmi/chains'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors: [],
})

export function MiniKitContextProvider({ children }: { children: ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_CDP_CLIENT_API_KEY || ''
  
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <OnchainKitProvider 
          apiKey={apiKey} 
          chain={base}
          projectName={process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'basedquiz'}
        >
          <MiniKitProvider>
            {children}
          </MiniKitProvider>
        </OnchainKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  )
}

