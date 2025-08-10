import { NextRequest, NextResponse } from 'next/server'

// Minimal stub to acknowledge Farcaster webhook checks
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    return NextResponse.json({ ok: true, received: !!body }, { status: 200 })
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 })
}


