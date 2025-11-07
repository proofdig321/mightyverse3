import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../../utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { limit = 10 } = await request.json();
    
    // Get video assets without Livepeer streams
    const { data: assets, error } = await supabaseServer
      .from('assets')
      .select('id, ipfs_cid, name, uploader_wallet')
      .is('livepeer_playback_id', null)
      .or('mime_type.like.video%,file_name.like.%.mp4,file_name.like.%.mov,file_name.like.%.webm')
      .limit(limit);

    if (error) throw error;

    const results = [];
    
    for (const asset of (assets as any[])) {
      try {
        const livepeerResponse = await fetch('https://livepeer.studio/api/asset/import', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: `https://gateway.pinata.cloud/ipfs/${(asset as any).ipfs_cid}`,
            name: (asset as any).name || `Asset ${(asset as any).id}`
          })
        });

        const livepeerData = await livepeerResponse.json();
        
        // Insert into asset_streams table
        await supabaseServer
          .from('asset_streams')
          .upsert({
            ipfs_cid: (asset as any).ipfs_cid,
            livepeer_asset_id: livepeerData.asset?.id,
            livepeer_playback_id: livepeerData.asset?.playbackId,
            status: 'processing',
            name: (asset as any).name,
            uploader_wallet: (asset as any).uploader_wallet
          }, { onConflict: 'ipfs_cid' });

        results.push({ 
          assetId: (asset as any).id, 
          success: true, 
          playbackId: livepeerData.asset?.playbackId 
        });
      } catch (error) {
        results.push({ 
          assetId: (asset as any).id, 
          success: false, 
          error: (error as any).message 
        });
      }
    }

    return NextResponse.json({ 
      processed: results.length,
      results 
    });
  } catch (error) {
    console.error('Batch processing error:', error);
    return NextResponse.json({ error: 'Batch processing failed' }, { status: 500 });
  }
}