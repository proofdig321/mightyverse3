import { NextRequest, NextResponse } from 'next/server';
import { requestLivepeerUpload, uploadToLivepeer, checkLivepeerStatus } from '../../../../utils/livepeer/import-service';
import { enhancedDataManager } from '../../../../utils/storage/enhanced-data-store';
import { createMetadataPayload, embedMetadataIntoFile } from '../../../../utils/metadata/metadata-embedder';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const thumbnail = formData.get('thumbnail') as File | null;
    const name = formData.get('name') as string;
    const assetType = formData.get('assetType') as string;
    const metadata = JSON.parse(formData.get('metadata') as string || '{}');
    const creatorWallet = formData.get('creatorWallet') as string;
    const tags = JSON.parse(formData.get('tags') as string || '[]');
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('Starting Livepeer direct upload:', { name, assetType });

    // Step 1: Upload thumbnail to IPFS (bypasses Livepeer)
    let thumbnailCid;
    if (thumbnail) {
      const { ipfsClient } = await import('../../../../utils/storage/ipfs-client');
      thumbnailCid = await ipfsClient.pinFile(
        thumbnail,
        `${name}-thumb-${Date.now()}`
      );
      console.log('Thumbnail uploaded to IPFS:', thumbnailCid);
    }

    // Step 2: Prepare metadata for embedding
    const metadataPayload = createMetadataPayload(
      name || file.name,
      creatorWallet || '0x860Ec697167Ba865DdE1eC9e172004100613e970',
      metadata,
      description,
      tags,
      category,
      metadata.isrc
    );

    // Step 3: Pre-process file with metadata (non-breaking)
    let processedFile = file;
    try {
      const fileBuffer = await file.arrayBuffer();
      const embeddedBuffer = await embedMetadataIntoFile(
        Buffer.from(fileBuffer),
        metadataPayload,
        file.type
      );
      
      // Create new file with embedded metadata
      processedFile = new File([new Uint8Array(embeddedBuffer)], file.name, { type: file.type });
      console.log('Metadata embedded successfully');
    } catch (embedError) {
      console.warn('Metadata embedding failed, using original file:', embedError);
      // Continue with original file (non-breaking)
    }

    // Step 4: Request upload URL from Livepeer
    const uploadRequest = await requestLivepeerUpload({
      name: name || file.name,
      enableExport: true // Enable IPFS export
    });

    // Step 5: Upload processed file to Livepeer
    await uploadToLivepeer(uploadRequest.uploadUrl, processedFile);

    // Step 6: Create asset record with all metadata (bypasses Livepeer)
    const assetData = await enhancedDataManager.createItem('assets', {
      name: name || file.name,
      creator_wallet: creatorWallet || '0x860Ec697167Ba865DdE1eC9e172004100613e970',
      asset_type: assetType || 'video',
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      thumbnail_cid: thumbnailCid, // Direct IPFS storage
      category: category,
      tags: tags,
      status: 'processing',
      livepeer_asset_id: uploadRequest.assetId,
      livepeer_status: 'processing',
      export_status: 'pending',
      metadata: {
        ...metadata,
        description: description,
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