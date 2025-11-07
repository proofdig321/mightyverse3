import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { data, name } = await request.json();

    const pinataJWT = process.env.PINATA_JWT;
    if (!pinataJWT) {
      return NextResponse.json({ error: 'PINATA_JWT not configured' }, { status: 500 });
    }

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pinataJWT}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pinataContent: data,
        pinataMetadata: {
          name: name || `mv-data-${Date.now()}`,
          keyvalues: {
            platform: 'mighty-verse',
            timestamp: new Date().toISOString()
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`IPFS pin failed: ${response.statusText}`);
    }

    const result = await response.json();
    return NextResponse.json({ ipfsHash: result.IpfsHash });

  } catch (error) {
    console.error('IPFS pin error:', error);
    return NextResponse.json({ error: 'Pin failed' }, { status: 500 });
  }
}