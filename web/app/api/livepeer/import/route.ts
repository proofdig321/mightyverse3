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
    
    // Try assets table first, fallback to asset_streams
    let data, error;
    try {
      const result = await supabaseServer
        .from('assets')
        .insert({
          name: name || 'Livepeer Import',
          creator_wallet: uploaderWallet || '0x860Ec697167Ba865DdE1eC9e172004100613e970',
          asset_type: 'video',
          file_cid: ipfsCid,
          status: 'processing',
          metadata: {
            livepeer_asset_id: livepeerData.asset?.id,
            livepeer_playback_id: livepeerData.asset?.playbackId,
            import_source: 'livepeer'
          }
        })
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    } catch (assetsError) {
      // Fallback to asset_streams table
      const result = await supabaseServer
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
      
      data = result.data;
      error = result.error;
    }

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