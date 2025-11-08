import { NextRequest, NextResponse } from 'next/server';
import { enhancedDataManager } from '../../../../utils/storage/enhanced-data-store';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get asset record first
    const asset = await enhancedDataManager.getItemById('assets', params.id);
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const livepeerAssetId = asset.metadata?.livepeer_asset_id;
    const ipfsCid = asset.file_cid;

    // Delete from Livepeer if exists
    if (livepeerAssetId && process.env.LIVEPEER_API_KEY) {
      try {
        await fetch(`https://livepeer.studio/api/asset/${livepeerAssetId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}`
          }
        });
      } catch (error) {
        console.warn('Failed to delete from Livepeer:', error);
      }
    }

    // Optional: Unpin from IPFS (Pinata)
    if (ipfsCid && process.env.PINATA_JWT) {
      try {
        await fetch(`https://api.pinata.cloud/pinning/unpin/${ipfsCid}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.PINATA_JWT}`
          }
        });
      } catch (error) {
        console.warn('Failed to unpin from IPFS:', error);
      }
    }

    // Delete from database
    await enhancedDataManager.deleteItem('assets', params.id);
    
    return NextResponse.json({ 
      success: true, 
      deleted: {
        database: true,
        livepeer: !!livepeerAssetId,
        ipfs: !!ipfsCid
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Delete failed' 
    }, { status: 500 });
  }
}