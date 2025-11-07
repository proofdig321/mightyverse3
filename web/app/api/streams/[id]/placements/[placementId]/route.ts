import { NextRequest, NextResponse } from 'next/server';
import { enhancedDataManager } from '../../../../../../utils/storage/enhanced-data-store';

export async function PATCH(
  request: NextRequest, 
  { params }: { params: { id: string; placementId: string } }
) {
  try {
    const { id: streamId, placementId } = params;
    const updates = await request.json();

    // Update placement in database
    const placement = await enhancedDataManager.updateItem('placements', placementId, {
      start_time: updates.startTime,
      duration: updates.duration,
      asset_cid: updates.assetCid,
      updated_at: new Date().toISOString()
    });

    // Trigger MCP content analysis
    await fetch('/api/agents/content-curation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contentId: placementId,
        contentType: 'placement',
        action: 'analyze',
        metadata: { streamId, updates }
      })
    }).catch(console.warn);

    return NextResponse.json({
      success: true,
      placement: {
        id: placement.id,
        startTime: placement.start_time,
        duration: placement.duration,
        assetCid: placement.asset_cid
      }
    });

  } catch (error) {
    console.error('Failed to update placement:', error);
    return NextResponse.json({
      error: 'Failed to update placement'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; placementId: string } }
) {
  try {
    const { placementId } = params;
    
    await enhancedDataManager.deleteItem('placements', placementId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete placement:', error);
    return NextResponse.json({
      error: 'Failed to delete placement'
    }, { status: 500 });
  }
}