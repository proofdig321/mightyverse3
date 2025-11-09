import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase configuration missing'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: deletedAssets, error: deleteError } = await supabase
      .from('assets')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .select();

    if (deleteError) {
      return NextResponse.json({
        success: false,
        error: deleteError.message
      }, { status: 500 });
    }

    const { data: remaining } = await supabase
      .from('assets')
      .select('id')
      .limit(1);

    return NextResponse.json({
      success: true,
      deleted: deletedAssets?.length || 0,
      remaining: remaining?.length || 0,
      message: `Deleted ${deletedAssets?.length || 0} assets`
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Force cleanup failed'
    }, { status: 500 });
  }
}