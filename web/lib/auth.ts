import { NextRequest, NextResponse } from 'next/server';

export function requireApiKey(request: NextRequest) {
  const apiKey = process.env.APP_API_KEY;
  if (!apiKey) return null; // no auth required in dev

  const header = request.headers.get('authorization') || request.headers.get('x-api-key');
  if (!header) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (header.startsWith('Bearer ')) {
    const token = header.slice(7);
    if (token === apiKey) return null;
  }

  if (header === apiKey) return null;

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
