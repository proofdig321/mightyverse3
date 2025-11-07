import { NextRequest, NextResponse } from 'next/server';
import { enhancedDataManager } from '../../../../utils/storage/enhanced-data-store';

export async function POST(request: NextRequest) {
  try {
    const { assetId } = await request.json();
    
    if (!assetId) {
      return NextResponse.json({ error: 'Asset ID required' }, { status: 400 });
    }

    // Get asset from database
    const asset = await enhancedDataManager.getItemById('assets', assetId);
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Create metadata embedding job
    const job = await enhancedDataManager.createProcessingJob({
      job_type: 'metadata_embedding',
      content_id: assetId,
      content_type: 'asset',
      status: 'queued',
      progress: 0,
      input_data: {
        title: asset.name,
        artist: asset.creator_wallet,
        description: asset.metadata?.description,
        isrc: asset.metadata?.isrc,
        tags: asset.tags,
        category: asset.category
      }
    });

    // Update asset status
    await enhancedDataManager.updateItem('assets', assetId, {
      metadata_embedding_status: 'queued',
      metadata_embedding_job_id: job.id
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Metadata embedding job queued'
    });

  } catch (error) {
    console.error('Metadata embedding job creation failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}