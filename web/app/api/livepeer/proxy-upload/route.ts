import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    
    const response = await fetch('https://livepeer.studio/api/asset/request-upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, storage: { ipfs: true } })
    });

    if (!response.ok) {
      throw new Error(`Livepeer request failed: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Proxy failed' 
    }, { status: 500 });
  }
}