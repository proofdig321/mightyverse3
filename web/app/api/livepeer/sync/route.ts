import { NextResponse } from 'next/server';
import { enhancedDataManager } from '../../../../utils/storage/enhanced-data-store';

export async function POST() {
  try {
    const response = await fetch('https://livepeer.studio/api/asset', {
      headers: {
        'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}`
      }
    });

    const livepeerAssets = await response.json();
    const readyAssets = livepeerAssets.filter((asset: any) => asset.status?.phase === 'ready');
    
    let synced = 0;
    for (const asset of readyAssets) {
      // Check if already exists
      const existing = await enhancedDataManager.getData('assets');
      const found = existing.find((a: any) => a.livepeer_asset_id === asset.id);
      
      if (!found) {
        await enhancedDataManager.createItem('assets', {
          name: asset.name,
          creator_wallet: '0x860Ec697167Ba865DdE1eC9e172004100613e970',
          asset_type: 'video',
          status: 'approved',
          livepeer_asset_id: asset.id,
          livepeer_status: 'ready',
          livepeer_playback_id: asset.playbackId,
          livepeer_playback_url: `https://lp-playback.com/hls/${asset.playbackId}/index.m3u8`,
          livepeer_thumbnail_url: `https://lp-playback.com/hls/${asset.playbackId}/thumbnail.jpg`,
          file_size: asset.size || 0,
          mime_type: 'video/mp4',
          metadata: {
            upload_method: 'livepeer_dashboard',
            transcoded: true,
            hls_ready: true
          }
        });
        synced++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      synced,
      total: readyAssets.length,
      message: `Synced ${synced} new assets from Livepeer dashboard`
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Sync failed' 
    }, { status: 500 });
  }
}