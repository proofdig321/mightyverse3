import { NextRequest, NextResponse } from 'next/server';
import { enhancedDataManager } from '../../../../utils/storage/enhanced-data-store';
import { createMetadataPayload, embedMetadataIntoFile } from '../../../../utils/metadata/metadata-embedder';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, assetType, metadata, creatorWallet, tags, category, description, fileSize, fileName, mimeType } = body;

    if (!name) {
      return NextResponse.json({ error: 'Asset name required' }, { status: 400 });
    }

    console.log('MCP Livepeer Agent: Getting upload URL', { name, assetType, fileSize });

    // Get upload URL from Livepeer (server-side to avoid CORS)
    const LIVEPEER_API_KEY = process.env.LIVEPEER_API_KEY;
    if (!LIVEPEER_API_KEY) {
      throw new Error('LIVEPEER_API_KEY not configured');
    }

    const uploadResponse = await fetch('https://livepeer.studio/api/asset/request-upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LIVEPEER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: name,
        storage: { ipfs: true }
      })
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload request failed: ${uploadResponse.status} - ${errorText}`);
    }

    const uploadData = await uploadResponse.json();

    // Create asset record (will be updated after client upload)
    const assetData = await enhancedDataManager.createItem('assets', {
      name: name,
      creator_wallet: creatorWallet || '0x860Ec697167Ba865DdE1eC9e172004100613e970',
      asset_type: assetType || 'video',
      file_name: fileName,
      file_size: fileSize,
      mime_type: mimeType,
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
        original_filename: fileName,
        isrc: metadata.isrc
      }
    });

    console.log('MCP Livepeer Agent: Upload URL ready', assetData.id);

    return NextResponse.json({
      success: true,
      agent: 'livepeer-upload',
      data: {
        assetId: assetData.id,
        livepeerAssetId: uploadData.asset.id,
        uploadUrl: uploadData.url
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