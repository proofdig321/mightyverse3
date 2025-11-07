import { NextResponse } from 'next/server';
import { enhancedDataManager } from '../../../../utils/storage/enhanced-data-store';
import { checkLivepeerStatus } from '../../../../utils/livepeer/import-service';

export async function POST() {
  try {
    // Get assets with pending Livepeer processing
    const assets = await enhancedDataManager.getData('assets');
    const pendingAssets = assets.filter(asset => 
      asset.livepeer_asset_id && 
      (asset.livepeer_status === 'processing' || asset.livepeer_status === 'waiting')
    );

    let updatedCount = 0;

    for (const asset of pendingAssets) {
      try {
        const status = await checkLivepeerStatus(asset.livepeer_asset_id);
        
        if (status.phase === 'ready' && asset.livepeer_status !== 'ready') {
          await enhancedDataManager.updateItem('assets', asset.id, {
            livepeer_status: 'ready'
          });
          updatedCount++;
          console.log(`Asset ${asset.id} transcoding completed`);
        }
      } catch (error) {
        console.error(`Status check failed for asset ${asset.id}:`, error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      checked: pendingAssets.length,
      updated: updatedCount
    });
  } catch (error) {
    console.error('Status check batch failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}