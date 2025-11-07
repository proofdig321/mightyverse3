import { NextRequest, NextResponse } from 'next/server';
import { enhancedDataManager } from '../../../../../../utils/storage/enhanced-data-store';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; placementId: string } }
) {
  try {
    const { id: streamId, placementId } = params;
    const updates = await request.json();

    // Validate updates
    const allowedFields = ['start_time', 'duration', 'layer', 'z_index', 'asset_cid'];
    const validUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {} as any);

    if (Object.keys(validUpdates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update placement
    const updatedPlacement = await enhancedDataManager.updateItem(
      'placements', 
      placementId, 
      {
        ...validUpdates,
        updated_at: new Date().toISOString()
      }
    );

    // Trigger MCP content analysis for timeline changes
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/agents/content-curation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: streamId,
          contentType: 'stream',
          action: 'timeline_updated',
          metadata: { placementId, updates: validUpdates }
        })
      });
    } catch (mcpError) {
      console.warn('MCP analysis failed:', mcpError);
      // Don't fail the main request if MCP fails
    }

    return NextResponse.json({
      success: true,
      placement: updatedPlacement
    });

  } catch (error) {
    console.error('Failed to update placement:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update placement' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; placementId: string } }
) {
  try {
    const { id: streamId, placementId } = params;

    // Delete placement
    await enhancedDataManager.deleteItem('placements', placementId);

    // Trigger MCP content analysis
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/agents/content-curation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: streamId,
          contentType: 'stream',
          action: 'placement_deleted',
          metadata: { placementId }
        })
      });
    } catch (mcpError) {
      console.warn('MCP analysis failed:', mcpError);
    }

    return NextResponse.json({
      success: true,
      message: 'Placement deleted successfully'
    });

  } catch (error) {
    console.error('Failed to delete placement:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete placement' },
      { status: 500 }
    );
  }
}