import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../utils/supabase/server';

export async function POST() {
  try {
    // Delete the problematic "Test 2" asset with wrong CID
    const { data: deletedAsset, error: deleteError } = await supabaseServer
      .from('assets')
      .delete()
      .eq('id', '7456590f-39d3-4f8c-b1e6-3eaa9caec9bc')
      .eq('name', 'Test 2')
      .select();

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json({ 
        success: false, 
        error: deleteError.message 
      }, { status: 500 });
    }

    // Verify remaining assets
    const { data: remainingAssets, error: selectError } = await supabaseServer
      .from('assets')
      .select('id, name, file_cid, mime_type, asset_type')
      .or('asset_type.eq.video,mime_type.like.video/%')
      .order('created_at', { ascending: false });

    if (selectError) {
      console.error('Select error:', selectError);
    }

    return NextResponse.json({
      success: true,
      deleted: deletedAsset,
      remaining: remainingAssets,
      message: 'Database cleanup completed'
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Cleanup failed'
    }, { status: 500 });
  }
}