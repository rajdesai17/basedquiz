import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://basedquiz.vercel.app'
  
  const manifest = {
    frame: {
      name: 'basedquiz',
      homeUrl: baseUrl,
      iconUrl: `${baseUrl}/icon.png`,
      version: '1',
      imageUrl: `${baseUrl}/image.png`,
      subtitle: 'play quiz win rewards',
      webhookUrl: `${baseUrl}/api/webhook`,
      description: 'a social quiz app',
      splashImageUrl: `${baseUrl}/splash.png`,
      primaryCategory: 'games',
      splashBackgroundColor: '#6200EA',
    },
    accountAssociation: {
      header: process.env.FARCASTER_HEADER || '',
      payload: process.env.FARCASTER_PAYLOAD || '',
      signature: process.env.FARCASTER_SIGNATURE || '',
    },
  }
  return NextResponse.json(manifest)
}

