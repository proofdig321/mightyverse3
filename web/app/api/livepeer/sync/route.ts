import { NextResponse } from 'next/server';
import { enhancedDataManager } from '../../../../utils/storage/enhanced-data-store';

export async function POST() {
  try {
    console.log('Starting Livepeer sync...');
    
    const response = await fetch('https://livepeer.studio/api/asset', {
      headers: {
        'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}`
      }
    });

    const livepeerAssets = await response.json();
    console.log(`Total Livepeer assets: ${livepeerAssets.length}`);
    
    const readyAssets = livepeerAssets.filter((asset: any) => asset.status?.phase === 'ready');
    console.log(`Ready assets: ${readyAssets.length}`);
    
    // Get existing assets
    const existing = await enhancedDataManager.getData('assets');
    console.log(`Existing assets in system: ${existing.length}`);
    
    const existingLivepeerIds = existing
      .filter((a: any) => a.metadata?.livepeer_asset_id)
      .map((a: any) => a.metadata.livepeer_asset_id);
    console.log(`Existing Livepeer IDs: ${existingLivepeerIds.length}`);
    
    let synced = 0;
    for (const asset of readyAssets) {
      try {
        const alreadyExists = existingLivepeerIds.includes(asset.id);
        console.log(`Asset ${asset.name} (${asset.id}) - exists: ${alreadyExists}`);
        
        if (!alreadyExists) {
          console.log(`Syncing asset: ${asset.name}`);
          
          const newAsset = {
            name: asset.name || 'Untitled',
            creator_wallet: '0x860Ec697167Ba865DdE1eC9e172004100613e970',
            asset_type: 'video',
            status: 'approved',
            file_size: asset.size || 0,
            tags: ['livepeer', 'video'],
            metadata: {
              upload_method: 'livepeer_dashboard',
              transcoded: true,
              hls_ready: true,
              livepeer_asset_id: asset.id,
              livepeer_playback_id: asset.playbackId,
              livepeer_playback_url: asset.playbackUrl || `https://vod-cdn.lp-playback.studio/raw/jxf4iblf6wlsyor6526t4tcmtmqa/catalyst-vod-com/hls/${asset.playbackId}/index.m3u8`,
              livepeer_thumbnail_url: `https://vod-cdn.lp-playback.studio/raw/jxf4iblf6wlsyor6526t4tcmtmqa/catalyst-vod-com/hls/${asset.playbackId}/thumbnail.jpg`,
              ipfs_cid: asset.storage?.ipfs?.cid,
              ipfs_url: asset.storage?.ipfs?.url
            }
          };
          
          const created = await enhancedDataManager.createItem('assets', newAsset);
          console.log(`✅ Created asset with ID: ${created.id}`);
          synced++;
        }
      } catch (itemError) {
        console.error(`Failed to sync asset ${asset.name}:`, itemError);
      }
    }

    console.log(`Sync complete: ${synced} new assets synced`);
    
    return NextResponse.json({ 
      success: true, 
      synced,
      total: readyAssets.length,
      existing: existing.length,
      message: `Synced ${synced} new assets from Livepeer dashboard`
    });
  } catch (error) {
    console.error('Livepeer sync failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Sync failed' 
    }, { status: 500 });
  }
}