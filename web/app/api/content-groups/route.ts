import { NextRequest, NextResponse } from 'next/server';
import { enhancedDataManager } from '../../../utils/storage/enhanced-data-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('id');
    
    if (groupId) {
      const group = await enhancedDataManager.getItemById('content_groups', groupId);
      if (!group) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
      }
      
      const versions = await enhancedDataManager.getData('content_versions');
      const groupVersions = versions.filter(v => v.group_id === groupId);
      
      const versionsWithAssets = await Promise.all(
        groupVersions.map(async (version) => {
          const asset = await enhancedDataManager.getItemById('assets', version.asset_id);
          return { ...version, asset };
        })
      );
      
      return NextResponse.json({
        success: true,
        group: { ...group, versions: versionsWithAssets }
      });
    } else {
      const groups = await enhancedDataManager.getData('content_groups');
      return NextResponse.json({ success: true, groups });
    }
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch content groups' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newGroup = await enhancedDataManager.createItem('content_groups', {
      title: body.title,
      original_artist: body.original_artist || 'Unknown',
      genre: body.genre || 'Digital Art',
      duration: body.duration || 180,
      audio_fingerprint: body.audio_fingerprint,
      total_versions: 1
    });
    
    return NextResponse.json({ success: true, group: newGroup });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create content group' 
    }, { status: 500 });
  }
}