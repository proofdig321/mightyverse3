import { NextRequest, NextResponse } from 'next/server';
import { enhancedDataManager } from '../../../../utils/storage/enhanced-data-store';
import { MCPWebhook } from '../../../../utils/integrations/mcp-webhook';

export async function POST(request: NextRequest) {
  try {
    const webhook = await request.json();
    console.log('Livepeer webhook received:', webhook);

    const { event, asset } = webhook;
    
    if (!asset?.id) {
      return NextResponse.json({ error: 'No asset ID in webhook' }, { status: 400 });
    }

    // Find asset in database by livepeer_asset_id
    const assets = await enhancedDataManager.getData('assets');
    const dbAsset = assets.find(a => a.livepeer_asset_id === asset.id);

    if (!dbAsset) {
      console.warn(`Asset not found for Livepeer ID: ${asset.id}`);
      return NextResponse.json({ received: true });
    }

    // Update asset based on webhook event
    const updates: any = {
      livepeer_status: asset.status?.phase || 'unknown',
      updated_at: new Date().toISOString()
    };

    // Handle different webhook events
    switch (event) {
      case 'asset.ready':
        updates.status = 'ready';
        updates.livepeer_playback_id = asset.playbackId;
        updates.livepeer_playback_url = `https://lp-playback.com/hls/${asset.playbackId}/index.m3u8`;
        
        // Add IPFS CID if exported
        if (asset.storage?.ipfs?.cid) {
          updates.ipfs_cid = asset.storage.ipfs.cid;
        }
        
        // Trigger MCP processing for ready assets
        await MCPWebhook.notifyAssetUpload(dbAsset.id, { 
          ...dbAsset, 
          ...updates,
          livepeer_ready: true 
        });
        break;

      case 'asset.failed':
        updates.status = 'failed';
        updates.error_message = asset.status?.errorMessage || 'Livepeer processing failed';
        break;

      case 'asset.updated':
        // Update progress or other status changes
        if (asset.status?.progress !== undefined) {
          updates.processing_progress = asset.status.progress;
        }
        break;
    }

    // Update asset in database
    await enhancedDataManager.updateItem('assets', dbAsset.id, updates);

    console.log(`Updated asset ${dbAsset.id} from Livepeer webhook:`, updates);

    return NextResponse.json({ 
      received: true, 
      processed: true,
      assetId: dbAsset.id,
      event 
    });

  } catch (error) {
    console.error('Livepeer webhook error:', error);
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}