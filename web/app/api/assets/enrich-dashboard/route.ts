import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { assetId, coverImageUrl, metadata } = await request.json();
    
    if (!assetId) {
      return NextResponse.json({ error: 'Asset ID required' }, { status: 400 });
    }

    // Get Livepeer asset data
    const livepeerResponse = await fetch(`https://livepeer.studio/api/asset/${assetId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!livepeerResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch Livepeer asset' }, { status: 500 });
    }

    const livepeerAsset = await livepeerResponse.json();
    
    // Create complete metadata with ISRC, tags, category
    const enrichedMetadata = {
      description: metadata?.description || `Professional video: ${livepeerAsset.name}`,
      duration: livepeerAsset.videoSpec?.duration,
      bitrate: livepeerAsset.videoSpec?.bitrate,
      format: livepeerAsset.videoSpec?.format,
      isrc: `ZA-80H-25-${String(Date.now()).slice(-5)}`, // Video ISRC
      source: 'dashboard_complete',
      enriched_at: new Date().toISOString(),
      tags: metadata?.tags || ['video', 'professional'],
      category: metadata?.category || 'Animation'
    };

    // Update Livepeer with cover image if provided
    if (coverImageUrl) {
      await fetch(`https://livepeer.studio/api/asset/${assetId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ playbackPolicy: { type: 'public' } })
      });
    }

    // Update database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const { error } = await supabase
      .from('assets')
      .update({
        metadata: enrichedMetadata,
        tags: enrichedMetadata.tags,
        category: enrichedMetadata.category,
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('livepeer_asset_id', assetId);

    if (error) {
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Dashboard upload enrichment complete',
      isrc: enrichedMetadata.isrc
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Enrichment failed'
    }, { status: 500 });
  }
}