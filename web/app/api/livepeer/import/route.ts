import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../../utils/supabase/server';
import { importFromIPFS } from '../../../../utils/livepeer/import-service';
import { enhancedDataManager } from '../../../../utils/storage/enhanced-data-store';

export async function POST(request: NextRequest) {
  try {
    const { ipfsCid, name, uploaderWallet } = await request.json();
    
    // Validate required fields
    if (!ipfsCid) {
      return NextResponse.json({ error: 'IPFS CID is required' }, { status: 400 });
    }
    
    if (!process.env.LIVEPEER_API_KEY) {
      console.error('LIVEPEER_API_KEY not configured');
      return NextResponse.json({ error: 'Livepeer API not configured' }, { status: 500 });
    }
    
    console.log('Importing to Livepeer:', { ipfsCid, name });
    
    // Import to Livepeer using service
    const livepeerAsset = await importFromIPFS(ipfsCid, name || 'Imported Asset');
    console.log('Livepeer import successful:', livepeerAsset);
    
    // Store in enhanced data manager
    const assetData = await enhancedDataManager.createItem('assets', {
      name: name || 'Livepeer Import',
      creator_wallet: uploaderWallet || '0x860Ec697167Ba865DdE1eC9e172004100613e970',
      asset_type: 'video',
      file_cid: ipfsCid,
      status: 'approved',
      livepeer_asset_id: livepeerAsset.assetId,
      livepeer_playback_id: livepeerAsset.playbackId,
      livepeer_playback_url: livepeerAsset.playbackUrl,
      livepeer_status: livepeerAsset.status,
      metadata: {
        import_source: 'livepeer',
        original_url: `https://gateway.pinata.cloud/ipfs/${ipfsCid}`
      }
    });
    
    console.log('Successfully created asset:', assetData.id);

    return NextResponse.json({ 
      success: true, 
      playbackId: livepeerAsset.playbackId,
      playbackUrl: livepeerAsset.playbackUrl,
      livepeerAssetId: livepeerAsset.assetId,
      assetId: assetData.id,
      message: 'Import and transcoding initiated successfully'
    });
    
  } catch (error) {
    console.error('Livepeer import error:', error);
    
    // Return detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({ 
      success: false,
      error: 'Import failed',
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}