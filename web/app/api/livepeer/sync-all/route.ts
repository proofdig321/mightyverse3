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

    // Get all Livepeer assets
    console.log('Fetching Livepeer assets...');
    const livepeerResponse = await fetch('https://livepeer.studio/api/asset', {
      headers: {
        'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!livepeerResponse.ok) {
      console.error('Livepeer API error:', livepeerResponse.status, livepeerResponse.statusText);
      throw new Error('Failed to fetch Livepeer assets');
    }

    const livepeerAssets = await livepeerResponse.json();
    console.log('Livepeer assets found:', livepeerAssets.length);
    console.log('First asset sample:', livepeerAssets[0]);
    const results = { created: 0, updated: 0, errors: [] as any[] };

    for (const asset of livepeerAssets) {
      try {
        console.log('Processing asset:', { id: asset.id, name: asset.name, status: asset.status?.phase });
        
        // Check if asset already exists in database
        const { data: existingAssets } = await supabase
          .from('assets')
          .select('id, livepeer_asset_id')
          .eq('livepeer_asset_id', asset.id);

        console.log('Existing assets found:', existingAssets?.length || 0);

        if (existingAssets && existingAssets.length > 0) {
          // Update existing asset
          const { error } = await supabase
            .from('assets')
            .update({
              livepeer_playback_id: asset.playbackId,
              livepeer_playback_url: asset.playbackUrl,
              livepeer_status: asset.status?.phase || 'unknown',
              file_cid: asset.storage?.ipfs?.cid || null,
              updated_at: new Date().toISOString()
            })
            .eq('livepeer_asset_id', asset.id);

          if (!error) results.updated++;
        } else {
          // Create new asset entry
          console.log('Creating new asset:', asset.name);
          const newAsset = {
            name: asset.name || `Livepeer Asset ${asset.id.slice(0, 8)}`,
            creator_wallet: '0x860Ec697167Ba865DdE1eC9e172004100613e970',
            asset_type: 'video',
            file_cid: asset.storage?.ipfs?.cid || null,
            status: 'approved',
            livepeer_asset_id: asset.id,
            livepeer_playback_id: asset.playbackId,
            livepeer_playback_url: asset.playbackUrl,
            livepeer_status: asset.status?.phase || 'unknown',
            mime_type: 'video/mp4',
            metadata: {
              source: 'livepeer_dashboard',
              duration: asset.videoSpec?.duration,
              width: asset.videoSpec?.tracks?.[0]?.width,
              height: asset.videoSpec?.tracks?.[0]?.height
            }
          };
          
          console.log('Asset data to insert:', newAsset);
          
          const { error } = await supabase
            .from('assets')
            .insert(newAsset);

          if (error) {
            console.error('Insert error:', error);
            results.errors.push({ asset_id: asset.id, error: error.message });
          } else {
            console.log('Asset created successfully');
            results.created++;
          }
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
      message: `Sync complete: ${results.created} created, ${results.updated} updated`,
      results
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Sync failed'
    }, { status: 500 });
  }
}