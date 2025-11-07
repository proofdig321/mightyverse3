import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    agent: 'isrc-generator',
    status: 'active',
    mission: 'ISRC code generation for audio assets'
  });
}