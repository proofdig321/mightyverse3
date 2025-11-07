import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { cid } = await request.json();
    
    if (!cid) {
      return NextResponse.json({ error: 'CID required' }, { status: 400 });
    }

    const response = await fetch('https://api.pinata.cloud/pinning/pinByHash', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PINATA_JWT}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        hashToPin: cid,
        pinataMetadata: {
          name: `Livepeer Asset ${cid}`,
          keyvalues: {
            source: 'livepeer',
            type: 'video'
          }
        }
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      return NextResponse.json({ error: result.error }, { status: response.status });
    }

    return NextResponse.json({ 
      success: true, 
      pinned: true,
      cid: result.IpfsHash 
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Pin failed' 
    }, { status: 500 });
  }
}