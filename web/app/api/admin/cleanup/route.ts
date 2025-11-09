import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../utils/supabase/server';

export async function POST() {
  try {
    // OPTION B: Complete database reset - delete ALL assets
    const { data: deletedAssets, error: deleteError } = await supabaseServer
      .from('assets')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
      .select();

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json({ 
        success: false, 
        error: deleteError.message 
      }, { status: 500 });
    }

    // Also clean related tables
    const tables = ['asset_streams', 'processing_jobs'];
    const cleanupResults = [];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabaseServer
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')
          .select();
        
        cleanupResults.push({ table, deleted: data?.length || 0, error: error?.message });
      } catch (err) {
        cleanupResults.push({ table, deleted: 0, error: 'Table not found or accessible' });
      }
    }

    // Verify complete cleanup
    const { data: remainingAssets, error: selectError } = await supabaseServer
      .from('assets')
      .select('id, name, file_cid')
      .limit(10);

    return NextResponse.json({
      success: true,
      deleted: deletedAssets?.length || 0,
      cleanupResults,
      remaining: remainingAssets?.length || 0,
      message: 'COMPLETE DATABASE RESET - All assets deleted. Ready for fresh start.'
    });
  } catch (error) {
    console.error('Complete cleanup error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Complete cleanup failed'
    }, { status: 500 });
  }
}