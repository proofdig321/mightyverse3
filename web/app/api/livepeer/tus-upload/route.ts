import { NextRequest, NextResponse } from 'next/server';
import { Livepeer } from 'livepeer';

export async function POST(request: NextRequest) {
  try {
    const { name, enableIPFS = true } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const apiKey = process.env.LIVEPEER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Livepeer API key not configured' }, { status: 500 });
    }

    // Use direct API call - SDK asset.create() is for URL imports, not uploads
    const response = await fetch('https://livepeer.studio/api/asset/request-upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        storage: enableIPFS ? { ipfs: true } : undefined
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Livepeer API error:', response.status, errorText);
      throw new Error(`Livepeer API failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Livepeer response:', JSON.stringify(data, null, 2));

    if (!data.tusEndpoint && !data.url) {
      throw new Error('No TUS endpoint in response');
    }

    const tusEndpoint = data.tusEndpoint || data.url;
    const asset = data.asset;

    return NextResponse.json({
      success: true,
      assetId: asset?.id,
      tusEndpoint,
      playbackId: asset?.playbackId,
      status: asset?.status?.phase || 'created'
    });

  } catch (error) {
    console.error('TUS upload request failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create upload request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}