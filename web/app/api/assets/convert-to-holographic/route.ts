import { NextRequest, NextResponse } from 'next/server';
import { enhancedDataManager } from '../../../../utils/storage/enhanced-data-store';

export async function POST(request: NextRequest) {
  try {
    const { assetId } = await request.json();
    
    if (!assetId) {
      return NextResponse.json({ error: 'Asset ID required' }, { status: 400 });
    }

    const asset = await enhancedDataManager.getItemById('assets', assetId);
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Create holographic layers from existing video
    const holographicLayers = {
      background: asset.livepeer_playback_id ? 
        `https://lp-playback.com/hls/${asset.livepeer_playback_id}/index.m3u8` :
        asset.file_cid || asset.fileCid,
      // Use Livepeer HLS for video, IPFS for images
      // AI separation would generate additional layers
    };

    // Update asset with holographic metadata
    await enhancedDataManager.updateItem('assets', assetId, {
      asset_type: 'holographic',
      metadata: {
        ...asset.metadata,
        holographicType: '2.5d',
        layers: holographicLayers,
        converted_from: asset.asset_type
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Asset converted to holographic',
      layers: holographicLayers
    });

  } catch (error) {
    console.error('Holographic conversion failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Conversion failed'
    }, { status: 500 });
  }
}