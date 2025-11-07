import { NextRequest, NextResponse } from 'next/server';
import { requestLivepeerUpload, uploadToLivepeer, checkLivepeerStatus } from '../../../../utils/livepeer/import-service';
import { enhancedDataManager } from '../../../../utils/storage/enhanced-data-store';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const assetType = formData.get('assetType') as string;
    const metadata = JSON.parse(formData.get('metadata') as string || '{}');
    const creatorWallet = formData.get('creatorWallet') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('Starting Livepeer direct upload:', { name, assetType });

    // Step 1: Request upload URL from Livepeer
    const uploadRequest = await requestLivepeerUpload({
      name: name || file.name,
      enableExport: true // Enable IPFS export
    });

    // Step 2: Upload file directly to Livepeer
    await uploadToLivepeer(uploadRequest.uploadUrl, file);

    // Step 3: Create asset record with Livepeer data
    const assetData = await enhancedDataManager.createItem('assets', {
      name: name || file.name,
      creator_wallet: creatorWallet || '0x860Ec697167Ba865DdE1eC9e172004100613e970',
      asset_type: assetType || 'video',
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      status: 'processing',
      livepeer_asset_id: uploadRequest.assetId,
      livepeer_status: 'processing',
      export_status: 'pending',
      metadata: {
        ...metadata,
        upload_method: 'livepeer_direct',
        original_filename: file.name
      }
    });

    console.log('Asset created with Livepeer integration:', assetData.id);

    return NextResponse.json({
      success: true,
      assetId: assetData.id,
      livepeerAssetId: uploadRequest.assetId,
      message: 'Upload successful, transcoding in progress'
    });

  } catch (error) {
    console.error('Livepeer upload error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}