import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../../utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { ipfsCid, name, uploaderWallet } = await request.json();
    
    const livepeerResponse = await fetch('https://livepeer.studio/api/asset/import', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: `https://gateway.pinata.cloud/ipfs/${ipfsCid}`,
        name: name
      })
    });

    const livepeerData = await livepeerResponse.json();
    
    const { data, error } = await supabaseServer
      .from('asset_streams')
      .insert({
        ipfs_cid: ipfsCid,
        livepeer_asset_id: livepeerData.asset?.id,
        livepeer_playback_id: livepeerData.asset?.playbackId,
        status: 'processing',
        name,
        uploader_wallet: uploaderWallet
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      playbackId: livepeerData.asset?.playbackId,
      assetId: data?.id 
    });
  } catch (error) {
    console.error('Livepeer import error:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}