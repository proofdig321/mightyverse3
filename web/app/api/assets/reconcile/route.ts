import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all assets with Livepeer data but missing metadata
    const { data: assets } = await supabase
      .from('assets')
      .select('*')
      .not('livepeer_asset_id', 'is', null);

    const results = { updated: 0, errors: [] as any[] };

    for (const asset of assets || []) {
      try {
        // Get full Livepeer asset data
        const livepeerResponse = await fetch(`https://livepeer.studio/api/asset/${asset.livepeer_asset_id}`, {
          headers: {
            'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (!livepeerResponse.ok) continue;

        const livepeerAsset = await livepeerResponse.json();
        
        // Extract thumbnail from Livepeer
        const thumbnailUrl = `https://image.livepeer.studio/asset/${asset.livepeer_asset_id}/thumbnail.jpg`;
        
        // Create enriched metadata
        const enrichedMetadata = {
          ...asset.metadata,
          duration: livepeerAsset.videoSpec?.duration,
          bitrate: livepeerAsset.videoSpec?.bitrate,
          format: livepeerAsset.videoSpec?.format,
          livepeer_download_url: livepeerAsset.downloadUrl,
          livepeer_thumbnail_url: thumbnailUrl,
          livepeer_gateway_url: livepeerAsset.storage?.ipfs?.gatewayUrl,
          nft_metadata_cid: livepeerAsset.storage?.ipfs?.nftMetadata?.cid,
          source: 'livepeer_dashboard',
          reconciled_at: new Date().toISOString()
        };

        // Update asset with enriched data
        const { error } = await supabase
          .from('assets')
          .update({
            metadata: enrichedMetadata,
            duration: Math.round(livepeerAsset.videoSpec?.duration || 0),
            updated_at: new Date().toISOString()
          })
          .eq('id', asset.id);

        if (!error) {
          results.updated++;
          console.log(`✅ Reconciled asset: ${asset.name}`);
        }

      } catch (error) {
        results.errors.push({
          asset_id: asset.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Asset reconciliation complete: ${results.updated} assets updated`,
      results
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Reconciliation failed'
    }, { status: 500 });
  }
}