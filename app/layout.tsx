import '@coinbase/onchainkit/styles.css'
import './globals.css'
import type { Metadata } from 'next'
import { MiniKitContextProvider } from '../providers/MiniKitProvider'
import Link from 'next/link'
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet'
import { Address, Avatar, Name, Identity } from '@coinbase/onchainkit/identity'

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
        <MiniKitContextProvider>
          <header className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur">
            <div className="mx-auto flex max-w-4xl items-center justify-between p-4">
              <nav className="flex items-center gap-4 text-sm">
                <Link href="/" className="font-semibold">basedquiz</Link>
                <Link href="/play" className="text-neutral-300 hover:text-white">Play</Link>
                <Link href="/leaderboard" className="text-neutral-300 hover:text-white">Leaderboard</Link>
              </nav>
              <div className="flex items-center">
                <Wallet>
                  <ConnectWallet>
                    <Avatar className="h-6 w-6" />
                    <Name className="ml-2" />
                  </ConnectWallet>
                  <WalletDropdown>
                    <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                      <Avatar />
                      <Name />
                      <Address className="text-neutral-400" />
                    </Identity>
                    <WalletDropdownDisconnect />
                  </WalletDropdown>
                </Wallet>
              </div>
            </div>
          </header>
          {children}
        </MiniKitContextProvider>
      </body>
    </html>
  )
}

