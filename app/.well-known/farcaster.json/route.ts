import { NextResponse } from 'next/server'

export async function GET() {
  const manifest = {
    accountAssociation: {
      header: process.env.FARCASTER_HEADER || '',
      payload: process.env.FARCASTER_PAYLOAD || '',
      signature: process.env.FARCASTER_SIGNATURE || '',
    },
    frame: {
      version: '1',
      name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'Base Trivia',
      iconUrl: `${process.env.NEXT_PUBLIC_URL || ''}/favicon.ico`,
      homeUrl: process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
      splashImageUrl: undefined,
      splashBackgroundColor: '#000000',
    },
  }
  return NextResponse.json(manifest)
}

