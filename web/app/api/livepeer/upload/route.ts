import { NextRequest, NextResponse } from 'next/server';
import { requestLivepeerUpload, uploadToLivepeer, checkLivepeerStatus } from '../../../../utils/livepeer/import-service';
import { enhancedDataManager } from '../../../../utils/storage/enhanced-data-store';
import { createMetadataPayload, embedMetadataIntoFile } from '../../../../utils/metadata/metadata-embedder';

export async function POST(request: NextRequest) {
  try {
    // Handle large file uploads - check content length
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 200 * 1024 * 1024) { // 200MB limit
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 200MB.' 
      }, { status: 413 });
    }
    
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

    // Step 6: Check for existing content groups and manage versions
    const existingGroups = await enhancedDataManager.searchItems(
      'content_groups', 
      name || file.name, 
      ['title']
    );

    let contentGroup;
    let versionNumber = 1;
    let isNewGroup = true;

    if (existingGroups.length > 0) {
      const similarGroup = existingGroups.find(group => 
        group.title.toLowerCase() === (name || file.name).toLowerCase() &&
        Math.abs((group.duration || 0) - (metadata.duration || 0)) < 10
      );
      
      if (similarGroup) {
        contentGroup = similarGroup;
        const existingVersions = await enhancedDataManager.getData('content_versions');
        const groupVersions = existingVersions.filter(v => v.group_id === similarGroup.id);
        versionNumber = groupVersions.length + 1;
        isNewGroup = false;
        
        await enhancedDataManager.updateItem('content_groups', similarGroup.id, {
          total_versions: versionNumber,
          updated_at: new Date().toISOString()
        });
      }
    }

    if (!contentGroup) {
      contentGroup = await enhancedDataManager.createItem('content_groups', {
        title: name || file.name,
        original_artist: metadata.artist || 'Unknown',
        genre: category || 'Digital Art',
        duration: metadata.duration || 180,
        total_versions: 1
      });
    }

    // Step 7: Create asset record with version info
    const assetData = await enhancedDataManager.createItem('assets', {
      name: name || file.name,
      creator_wallet: creatorWallet || '0x860Ec697167Ba865DdE1eC9e172004100613e970',
      asset_type: assetType || 'video',
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      thumbnail_cid: thumbnailCid,
      category: category,
      tags: tags,
      status: 'processing',
      livepeer_asset_id: uploadRequest.assetId,
      livepeer_status: 'processing',
      export_status: 'pending',
      content_group_id: contentGroup.id,
      metadata: {
        ...metadata,
        description: description,
        upload_method: 'livepeer_direct',
        original_filename: file.name,
        version_number: versionNumber,
        is_new_group: isNewGroup
      }
    });

    // Step 8: Create version record
    const contentVersion = await enhancedDataManager.createItem('content_versions', {
      group_id: contentGroup.id,
      asset_id: assetData.id,
      animator_wallet: creatorWallet || '0x860Ec697167Ba865DdE1eC9e172004100613e970',
      animator_style: metadata.animator_style || 'standard',
      version_number: versionNumber,
      is_official: false, // Becomes true when admin approves
      quality_score: 0.8
    });

    console.log('Asset created with Livepeer integration:', assetData.id);

    return NextResponse.json({
      success: true,
      assetId: assetData.id,
      livepeerAssetId: uploadRequest.assetId,
      contentGroupId: contentGroup.id,
      versionId: contentVersion.id,
      versionNumber: versionNumber,
      isNewGroup: isNewGroup,
      message: isNewGroup ? 'New content uploaded' : `Version ${versionNumber} uploaded for existing content`,
      details: {
        fileSize: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        mimeType: file.type,
        thumbnailUploaded: !!thumbnailCid,
        metadataEmbedded: processedFile !== file
      }
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