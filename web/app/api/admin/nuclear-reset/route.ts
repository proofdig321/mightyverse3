import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase configuration',
        config: {
          url: !!supabaseUrl,
          key: !!supabaseKey
        }
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Nuclear option: Delete everything
    const { data: deletedAssets, error: deleteError } = await supabase
      .from('assets')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .select();

    if (deleteError) {
      return NextResponse.json({
        success: false,
        error: deleteError.message,
        code: deleteError.code
      }, { status: 500 });
    }

    // Verify cleanup
    const { data: remaining } = await supabase
      .from('assets')
      .select('id')
      .limit(1);

    return NextResponse.json({
      success: true,
      deleted: deletedAssets?.length || 0,
      remaining: remaining?.length || 0,
      message: `NUCLEAR RESET COMPLETE: ${deletedAssets?.length || 0} assets deleted`
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Nuclear reset failed'
    }, { status: 500 });
  }
}