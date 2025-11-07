import { NextResponse } from 'next/server';
import { enhancedDataManager } from '../../../../utils/storage/enhanced-data-store';
import { checkLivepeerStatus, exportToIPFS } from '../../../../utils/livepeer/import-service';

export async function POST() {
  try {
    console.log('Starting Livepeer processing check...');
    
    // Get assets with pending Livepeer processing
    const assets = await enhancedDataManager.getData('assets');
    const processingAssets = assets.filter(asset => 
      asset.livepeer_asset_id && 
      (asset.livepeer_status === 'processing' || asset.livepeer_status === 'waiting')
    );

    let updatedCount = 0;
    let exportedCount = 0;

    for (const asset of processingAssets) {
      try {
        const status = await checkLivepeerStatus(asset.livepeer_asset_id);
        
        if (status.phase === 'ready' && asset.livepeer_status !== 'ready') {
          // Update asset with playback info
          await enhancedDataManager.updateItem('assets', asset.id, {
            livepeer_status: 'ready',
            livepeer_playback_id: status.playbackId,
            livepeer_playback_url: `https://lp-playback.com/hls/${status.playbackId}/index.m3u8`,
            status: 'approved' // Mark as approved when ready
          });
          
          updatedCount++;
          console.log(`Asset ${asset.id} transcoding completed`);

          // Trigger IPFS export for permanent storage
          if (asset.export_status === 'pending') {
            try {
              const exportResult = await exportToIPFS(asset.livepeer_asset_id, {
                title: asset.name,
                creator: asset.creator_wallet,
                asset_type: asset.asset_type
              });

              await enhancedDataManager.updateItem('assets', asset.id, {
                file_cid: exportResult.ipfsCid,
                export_status: 'completed',
                ipfs_pinned: true
              });

              exportedCount++;
              console.log(`Asset ${asset.id} exported to IPFS: ${exportResult.ipfsCid}`);
            } catch (exportError) {
              console.error(`IPFS export failed for asset ${asset.id}:`, exportError);
              await enhancedDataManager.updateItem('assets', asset.id, {
                export_status: 'failed'
              });
            }
          }
        }
      } catch (error) {
        console.error(`Status check failed for asset ${asset.id}:`, error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      checked: processingAssets.length,
      updated: updatedCount,
      exported: exportedCount,
      message: `Processed ${processingAssets.length} assets, ${updatedCount} ready, ${exportedCount} exported`
    });
  } catch (error) {
    console.error('Processing batch failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}