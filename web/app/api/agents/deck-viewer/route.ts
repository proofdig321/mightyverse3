import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    agent: 'deck-viewer',
    status: 'active',
    mission: 'Holographic deck viewing and navigation'
  });
}