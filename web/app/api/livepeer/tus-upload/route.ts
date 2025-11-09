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

    const livepeer = new Livepeer({ apiKey });

    // Create asset upload request using SDK as documented
    const assetData = {
      name,
      storage: enableIPFS ? { ipfs: true } : undefined
    };

    console.log('Creating Livepeer asset upload request:', assetData);
    
    const response = await livepeer.asset.create(assetData);
    console.log('Livepeer SDK response:', JSON.stringify(response, null, 2));

    // The response should contain the TUS endpoint and asset info
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid response from Livepeer SDK');
    }

    // Extract TUS endpoint from response
    const tusEndpoint = (response as any).tusEndpoint || (response as any).url;
    const asset = (response as any).asset || response;

    if (!tusEndpoint) {
      console.error('No TUS endpoint in SDK response:', response);
      throw new Error('TUS endpoint not provided by Livepeer SDK');
    }

    console.log('TUS endpoint found:', tusEndpoint);

    return NextResponse.json({
      success: true,
      assetId: asset?.id,
      tusEndpoint: tusEndpoint,
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