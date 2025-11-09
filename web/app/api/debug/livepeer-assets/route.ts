import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://livepeer.studio/api/asset', {
      headers: {
        'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return NextResponse.json({
        error: 'Livepeer API failed',
        status: response.status,
        statusText: response.statusText
      }, { status: response.status });
    }

    const assets = await response.json();
    
    return NextResponse.json({
      count: assets.length,
      assets: assets.map((asset: any) => ({
        id: asset.id,
        name: asset.name,
        status: asset.status?.phase,
        playbackId: asset.playbackId,
        playbackUrl: asset.playbackUrl,
        storage: asset.storage,
        createdAt: asset.createdAt
      }))
    });

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}