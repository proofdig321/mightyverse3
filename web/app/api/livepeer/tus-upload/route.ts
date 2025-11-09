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

    // Create asset upload request
    const assetData = {
      name,
      storage: enableIPFS ? { ipfs: true } : undefined
    };

    console.log('Creating Livepeer asset:', assetData);
    const response = await livepeer.asset.create(assetData);

    if (!response) {
      throw new Error('Failed to create asset upload request');
    }

    console.log('Livepeer response:', JSON.stringify(response, null, 2));

    // Try direct REST API approach if SDK doesn't provide TUS endpoint
    if (!response.tusEndpoint && !response.tus_endpoint) {
      console.log('SDK response missing TUS endpoint, trying direct API...');
      
      const directResponse = await fetch('https://livepeer.studio/api/asset/request-upload', {
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

      if (!directResponse.ok) {
        throw new Error(`Direct API failed: ${directResponse.status}`);
      }

      const directData = await directResponse.json();
      console.log('Direct API response:', JSON.stringify(directData, null, 2));

      return NextResponse.json({
        success: true,
        assetId: directData.asset?.id,
        tusEndpoint: directData.tusEndpoint || directData.url,
        playbackId: directData.asset?.playbackId,
        status: directData.asset?.status?.phase || 'created'
      });
    }

    // Handle SDK response
    const uploadResponse = response as any;
    const asset = uploadResponse.asset || uploadResponse;
    const tusEndpoint = uploadResponse.tusEndpoint || uploadResponse.tus_endpoint || asset.tusEndpoint;

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