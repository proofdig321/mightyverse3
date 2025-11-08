import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../utils/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { assetId, newCid } = await request.json();

    if (!assetId || !newCid) {
      return NextResponse.json({ error: 'Asset ID and CID required' }, { status: 400 });
    }

    // Update asset with new CID
    const { data, error } = await supabase
      .from('assets')
      .update({ 
        file_cid: newCid,
        updated_at: new Date().toISOString()
      })
      .eq('id', assetId)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'CID updated successfully',
      data
    });

  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Fix failed' 
    }, { status: 500 });
  }
}