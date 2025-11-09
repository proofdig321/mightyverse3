import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { assetId, coverImageUrl } = await request.json();
    
    if (!assetId || !coverImageUrl) {
      return NextResponse.json({ error: 'Asset ID and cover image URL required' }, { status: 400 });
    }

    // Update Livepeer asset with custom cover image
    const livepeerResponse = await fetch(`https://livepeer.studio/api/asset/${assetId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        playbackPolicy: {
          type: 'public',
          thumbnailUrl: coverImageUrl
        }
      })
    });

    if (!livepeerResponse.ok) {
      const error = await livepeerResponse.text();
      return NextResponse.json({ error: `Livepeer update failed: ${error}` }, { status: 500 });
    }

    // Update local database
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase
        .from('assets')
        .update({
          metadata: {
            custom_cover_image: coverImageUrl,
            updated_at: new Date().toISOString()
          }
        })
        .eq('livepeer_asset_id', assetId);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Cover image updated successfully',
      coverImageUrl 
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Cover image update failed'
    }, { status: 500 });
  }
}