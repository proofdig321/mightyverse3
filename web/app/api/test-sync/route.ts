import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  // Prevent automatic sync during build process
  if (process.env.NODE_ENV === 'production' && !process.env.MANUAL_SYNC) {
    return NextResponse.json({ message: 'Sync disabled during build' });
  }
  
  try {
    console.log('🔄 Direct sync test starting...');
    
    // Test Livepeer API
    const livepeerResponse = await fetch('https://livepeer.studio/api/asset', {
      headers: {
        'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!livepeerResponse.ok) {
      return NextResponse.json({ error: 'Livepeer API failed', status: livepeerResponse.status });
    }

    const assets = await livepeerResponse.json();
    console.log('📡 Livepeer assets:', assets.length);

    if (assets.length === 0) {
      return NextResponse.json({ message: 'No Livepeer assets found' });
    }

    const asset = assets[0];
    console.log('🎯 Processing asset:', asset.name, 'CID:', asset.storage?.ipfs?.cid);

    // Test Supabase connection
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase not configured' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for existing asset first
    const { data: existing, error: checkError } = await supabase
      .from('assets')
      .select('id')
      .eq('livepeer_asset_id', asset.id)
      .maybeSingle();

    if (existing) {
      console.log('✅ Asset already exists:', existing.id);
      return NextResponse.json({ success: true, message: 'Asset already exists', asset: existing });
    }

    // Insert only if not exists
    const { data, error } = await supabase
      .from('assets')
      .insert({
        name: asset.name,
        creator_wallet: '0x860Ec697167Ba865DdE1eC9e172004100613e970',
        asset_type: 'video',
        file_cid: asset.storage?.ipfs?.cid || null,
        status: 'approved',
        livepeer_asset_id: asset.id,
        livepeer_playback_id: asset.playbackId,
        mime_type: 'video/mp4',
        file_name: asset.name
      })
      .select();

    if (error) {
      console.error('❌ Insert failed:', error);
      return NextResponse.json({ error: error.message });
    }

    console.log('✅ Asset created:', data);
    return NextResponse.json({ success: true, asset: data[0] });

  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}