import { NextRequest, NextResponse } from 'next/server';
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

    console.log('MCP Livepeer Agent: Processing upload', { name, assetType, fileSize: file.size });

    // Step 1: Upload thumbnail to IPFS (preserves existing flow)
    let thumbnailCid;
    if (thumbnail) {
      const { ipfsClient } = await import('../../../../utils/storage/ipfs-client');
      thumbnailCid = await ipfsClient.pinFile(
        thumbnail,
        `${name}-thumb-${Date.now()}`
      );
      console.log('Thumbnail uploaded to IPFS:', thumbnailCid);
    }

    // Step 2: Prepare metadata for embedding (preserves ISRC, tagging)
    const metadataPayload = createMetadataPayload(
      name || file.name,
      creatorWallet || '0x860Ec697167Ba865DdE1eC9e172004100613e970',
      metadata,
      description,
      tags,
      category,
      metadata.isrc
    );

    // Step 3: Pre-process file with metadata (preserves video tagging)
    let processedFile = file;
    try {
      const fileBuffer = await file.arrayBuffer();
      const embeddedBuffer = await embedMetadataIntoFile(
        Buffer.from(fileBuffer),
        metadataPayload,
        file.type
      );
      
      processedFile = new File([new Uint8Array(embeddedBuffer)], file.name, { type: file.type });
      console.log('Metadata embedded successfully');
    } catch (embedError) {
      console.warn('Metadata embedding failed, using original file:', embedError);
    }

    // Step 4: Server-side Livepeer upload (solves CORS)
    const LIVEPEER_API_KEY = process.env.LIVEPEER_API_KEY;
    if (!LIVEPEER_API_KEY) {
      throw new Error('LIVEPEER_API_KEY not configured');
    }

    // Request upload URL from Livepeer
    const uploadResponse = await fetch('https://livepeer.studio/api/asset/request-upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LIVEPEER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: name || file.name,
        storage: { ipfs: true }
      })
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload request failed: ${uploadResponse.status} - ${errorText}`);
    }

    const uploadData = await uploadResponse.json();

    // Upload processed file to Livepeer
    const fileUploadResponse = await fetch(uploadData.url, {
      method: 'PUT',
      body: processedFile
    });

    if (!fileUploadResponse.ok) {
      throw new Error(`File upload failed: ${fileUploadResponse.statusText}`);
    }

    // Step 5: Create asset record (preserves all metadata)
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
      livepeer_asset_id: uploadData.asset.id,
      livepeer_status: 'processing',
      export_status: 'pending',
      metadata: {
        ...metadata,
        description: description,
        upload_method: 'livepeer_mcp',
        original_filename: file.name,
        isrc: metadata.isrc,
        embedded_metadata: processedFile !== file
      }
    });

    console.log('MCP Livepeer Agent: Upload successful', assetData.id);

    return NextResponse.json({
      success: true,
      agent: 'livepeer-upload',
      data: {
        assetId: assetData.id,
        livepeerAssetId: uploadData.asset.id,
        thumbnailCid: thumbnailCid,
        metadataEmbedded: processedFile !== file
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('MCP Livepeer Agent error:', error);
    
    return NextResponse.json({
      success: false,
      agent: 'livepeer-upload',
      error: error instanceof Error ? error.message : 'Upload failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}