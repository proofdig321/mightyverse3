import { NextResponse } from 'next/server';
import { supabase } from '../../../../utils/supabase/client';

export async function POST() {
  try {
    // Get Livepeer assets
    const livepeerResponse = await fetch('https://livepeer.studio/api/asset', {
      headers: {
        'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!livepeerResponse.ok) {
      throw new Error('Failed to fetch Livepeer assets');
    }

    const livepeerAssets = await livepeerResponse.json();
    const updates = [];

    for (const asset of livepeerAssets) {
      if (asset.status?.phase === 'ready' && asset.playbackId) {
        // Find matching Supabase asset by name
        const { data: supabaseAssets } = await supabase
          .from('assets')
          .select('id, name')
          .ilike('name', `%${asset.name.split('.')[0]}%`);

        if (supabaseAssets && supabaseAssets.length > 0) {
          const supabaseAsset = supabaseAssets[0];
          
          // Update with Livepeer data
          const { error } = await supabase
            .from('assets')
            .update({
              livepeer_asset_id: asset.id,
              livepeer_playback_id: asset.playbackId,
              livepeer_playback_url: asset.playbackUrl,
              file_cid: asset.storage?.ipfs?.cid || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', supabaseAsset.id);

          if (!error) {
            updates.push({
              supabase_id: supabaseAsset.id,
              name: supabaseAsset.name,
              livepeer_id: asset.id,
              playback_id: asset.playbackId,
              ipfs_cid: asset.storage?.ipfs?.cid
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${updates.length} assets`,
      updates
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Sync failed'
    }, { status: 500 });
  }
}