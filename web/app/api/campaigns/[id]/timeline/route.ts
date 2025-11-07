import { NextRequest, NextResponse } from 'next/server';
import { enhancedDataManager } from '../../../../../utils/storage/enhanced-data-store';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: campaignId } = params;

    // Get campaign
    const campaign = await enhancedDataManager.getItemById('campaigns', campaignId);
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Get all stream sessions for this campaign
    const sessions = await enhancedDataManager.getData('stream_sessions');
    const campaignSessions = sessions.filter((s: any) => s.campaign_id === campaignId);

    // Get all placements for campaign sessions
    const placements = await enhancedDataManager.getData('placements');
    const campaignPlacements = placements.filter((p: any) => 
      campaignSessions.some((s: any) => s.id === p.stream_id)
    );

    // Build timeline structure
    const timeline = {
      campaign,
      sessions: campaignSessions,
      placements: campaignPlacements,
      totalDuration: Math.max(
        ...campaignPlacements.map((p: any) => (p.start_time || 0) + (p.duration || 0)),
        0
      ),
      stats: {
        totalPlacements: campaignPlacements.length,
        activeSessions: campaignSessions.filter((s: any) => s.status === 'active').length,
        layers: Array.from(new Set(campaignPlacements.map((p: any) => p.layer || 0))).length
      }
    };

    return NextResponse.json({
      success: true,
      timeline
    });

  } catch (error) {
    console.error('Failed to get campaign timeline:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get campaign timeline' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: campaignId } = params;
    const { placements, metadata } = await request.json();

    if (!Array.isArray(placements)) {
      return NextResponse.json(
        { success: false, error: 'Placements must be an array' },
        { status: 400 }
      );
    }

    // Validate campaign exists
    const campaign = await enhancedDataManager.getItemById('campaigns', campaignId);
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Update all placements
    const updatePromises = placements.map(async (placement: any) => {
      if (!placement.id) {
        // Create new placement
        return enhancedDataManager.createItem('placements', {
          stream_id: placement.stream_id,
          asset_cid: placement.asset_cid,
          start_time: placement.start_time || 0,
          duration: placement.duration || 10,
          layer: placement.layer || 0,
          z_index: placement.z_index || 10,
          metadata: { ...placement.metadata, campaign_id: campaignId }
        });
      } else {
        // Update existing placement
        return enhancedDataManager.updateItem('placements', placement.id, {
          start_time: placement.start_time,
          duration: placement.duration,
          layer: placement.layer,
          z_index: placement.z_index,
          updated_at: new Date().toISOString()
        });
      }
    });

    const updatedPlacements = await Promise.all(updatePromises);

    // Update campaign metadata if provided
    if (metadata) {
      await enhancedDataManager.updateItem('campaigns', campaignId, {
        metadata: { ...campaign.metadata, ...metadata },
        timeline_updated_at: new Date().toISOString()
      });
    }

    // Trigger MCP content analysis
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/agents/content-curation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: campaignId,
          contentType: 'campaign',
          action: 'timeline_bulk_update',
          metadata: { 
            placementCount: updatedPlacements.length,
            totalDuration: Math.max(...placements.map((p: any) => (p.start_time || 0) + (p.duration || 0)), 0)
          }
        })
      });
    } catch (mcpError) {
      console.warn('MCP analysis failed:', mcpError);
    }

    return NextResponse.json({
      success: true,
      placements: updatedPlacements,
      message: `Updated ${updatedPlacements.length} placements`
    });

  } catch (error) {
    console.error('Failed to update campaign timeline:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update campaign timeline' },
      { status: 500 }
    );
  }
}