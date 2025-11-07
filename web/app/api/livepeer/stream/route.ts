import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../../utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cid = searchParams.get('cid');
    
    if (!cid) {
      return NextResponse.json({ error: 'CID required' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('asset_streams')
      .select('livepeer_playback_id, status')
      .eq('ipfs_cid', cid)
      .eq('status', 'ready')
      .single();

    if (error || !data) {
      return NextResponse.json({ playbackId: null });
    }

    return NextResponse.json({ 
      playbackId: data.livepeer_playback_id,
      status: data.status 
    });
  } catch (error) {
    console.error('Stream lookup error:', error);
    return NextResponse.json({ playbackId: null });
  }
}