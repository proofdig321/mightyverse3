import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    agent: 'security',
    status: 'active',
    mission: 'Security audit and vulnerability assessment'
  });
}