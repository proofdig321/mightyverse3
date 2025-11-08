import { NextRequest, NextResponse } from 'next/server';
import { enhancedDataManager } from '../../../utils/storage/enhanced-data-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const creator = searchParams.get('creator');
    
    let assets = await enhancedDataManager.getData('assets');
    
    // Apply filters
    if (status) {
      assets = assets.filter(asset => asset.status === status);
    }
    
    if (creator) {
      assets = assets.filter(asset => 
        asset.creator_wallet === creator || 
        asset.submittedBy === creator
      );
    }
    
    return NextResponse.json({ success: true, data: assets });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch assets' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newAsset = await enhancedDataManager.createItem('assets', {
      name: body.name,
      creator_wallet: body.creator_wallet || '0x0000000000000000000000000000000000000000',
      asset_type: body.asset_type || 'unknown',
      file_cid: body.file_cid,
      thumbnail_cid: body.thumbnail_cid,
      status: body.status || 'draft',
      quality_score: body.quality_score,
      tags: body.tags || [],
      metadata: body.metadata || {},
      submittedBy: body.submittedBy || body.creator_wallet,
      submittedAt: new Date().toISOString()
    });
    
    return NextResponse.json({ success: true, data: newAsset });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create asset' 
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Asset ID required' }, { status: 400 });
    }
    
    const updatedAsset = await enhancedDataManager.updateItem('assets', id, updates);
    
    return NextResponse.json({ success: true, data: updatedAsset });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to update asset' 
    }, { status: 500 });
  }
}