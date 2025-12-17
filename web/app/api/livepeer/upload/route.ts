import { NextRequest, NextResponse } from 'next/server';
import { requestLivepeerUpload, uploadToLivepeer, checkLivepeerStatus } from '../../../../utils/livepeer/import-service';
import { enhancedDataManager } from '../../../../utils/storage/enhanced-data-store';
import { createMetadataPayload, embedMetadataIntoFile } from '../../../../utils/metadata/metadata-embedder';

export async function POST(request: NextRequest) {
  try {
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 200 * 1024 * 1024) {
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

    console.log('Starting Livepeer upload with MCP integration:', { name, assetType });

    // Step 1: Upload thumbnail to IPFS
    let thumbnailCid;
    if (thumbnail) {
      const { ipfsClient } = await import('../../../../utils/storage/ipfs-client');
      thumbnailCid = await ipfsClient.pinFile(
        thumbnail,
        `${name}-thumb-${Date.now()}`
      );
    }

    // Step 2: Prepare metadata
    const metadataPayload = createMetadataPayload(
      name || file.name,
      creatorWallet || '0x860Ec697167Ba865DdE1eC9e172004100613e970',
      metadata,
      description,
      tags,
      category,
      metadata.isrc
    );

    // Step 3: Process file with metadata
    let processedFile = file;
    try {
      const fileBuffer = await file.arrayBuffer();
      const embeddedBuffer = await embedMetadataIntoFile(
        Buffer.from(fileBuffer),
        metadataPayload,
        file.type
      );
      processedFile = new File([new Uint8Array(embeddedBuffer)], file.name, { type: file.type });
    } catch (embedError) {
      console.warn('Metadata embedding failed, using original file:', embedError);
    }

    // Step 4: Upload to Livepeer
    const uploadRequest = await requestLivepeerUpload({
      name: name || file.name,
      enableExport: true
    });

    await uploadToLivepeer(uploadRequest.uploadUrl, processedFile);

    // Step 5: Create asset record
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
      metadata: {
        ...metadata,
        description: description,
        upload_method: 'livepeer_direct',
        original_filename: file.name
      }
    });

    // Step 6: IMMEDIATE MCP INTEGRATION - Trigger comprehensive processing
    if (process.env.MCP_ENDPOINT && process.env.MCP_AUTH_TOKEN) {
      try {
        // Holographic processing for video/mural content
        if (assetType === 'mural' || assetType === 'holographic' || file.type.startsWith('video/')) {
          await fetch(`${process.env.MCP_ENDPOINT}/api/mcp/execute`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.MCP_AUTH_TOKEN}`
            },
            body: JSON.stringify({
              task: 'process_holographic_content',
              payload: {
                assetId: assetData.id,
                livepeerAssetId: uploadRequest.assetId,
                assetType,
                asset: assetData,
                steps: ['layer_separation', 'depth_mapping', 'mural_creation', 'holographic_optimization']
              }
            })
          });
        }

        // ISRC generation for audio/video
        if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
          await fetch(`${process.env.MCP_ENDPOINT}/api/mcp/execute`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.MCP_AUTH_TOKEN}`
            },
            body: JSON.stringify({
              task: 'generate_isrc',
              payload: {
                assetId: assetData.id,
                contentType: file.type.startsWith('audio/') ? 'audio' : 'video'
              }
            })
          });
        }

        // Main processing pipeline
        await fetch(`${process.env.MCP_ENDPOINT}/api/mcp/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MCP_AUTH_TOKEN}`
          },
          body: JSON.stringify({
            task: 'process_upload',
            payload: {
              assetId: assetData.id,
              asset: assetData,
              assetType,
              livepeerAssetId: uploadRequest.assetId
            }
          })
        });

        console.log('MCP processing initiated for asset:', assetData.id);
      } catch (mcpError) {
        console.warn('MCP processing failed:', mcpError);
      }
    }

    return NextResponse.json({
      success: true,
      assetId: assetData.id,
      livepeerAssetId: uploadRequest.assetId,
      processing_pipeline: getProcessingPipeline(assetType, file.type),
      message: 'Upload successful - comprehensive processing initiated',
      details: {
        fileSize: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        mimeType: file.type,
        thumbnailUploaded: !!thumbnailCid,
        mcpIntegrated: !!(process.env.MCP_ENDPOINT && process.env.MCP_AUTH_TOKEN)
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

function getProcessingPipeline(assetType: string, mimeType: string): string[] {
  const pipeline = ['livepeer_processing'];
  
  if (assetType === 'mural' || assetType === 'holographic') {
    pipeline.push('holographic_layer_separation', 'depth_map_generation', 'mural_creation');
  }
  
  if (mimeType.startsWith('video/')) {
    pipeline.push('holographic_layer_generation', 'quality_analysis');
  }
  
  if (mimeType.startsWith('audio/')) {
    pipeline.push('isrc_generation', 'audio_analysis');
  }
  
  pipeline.push('ipfs_export', 'metadata_enhancement', 'content_curation');
  
  return pipeline;
}