import '@coinbase/onchainkit/styles.css'
import './globals.css'
import type { Metadata } from 'next'
import { MiniKitContextProvider } from '../providers/MiniKitProvider'

export const metadata: Metadata = {
  title: 'Base Trivia Mini App',
  description: 'Daily Web3 trivia inside Base MiniKit',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
        <MiniKitContextProvider>{children}</MiniKitContextProvider>
      </body>
    </html>
  )
}

