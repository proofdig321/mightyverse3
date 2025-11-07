import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../../utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { ipfsCid, name, uploaderWallet } = await request.json();
    
    // Validate required fields
    if (!ipfsCid) {
      return NextResponse.json({ error: 'IPFS CID is required' }, { status: 400 });
    }
    
    if (!process.env.LIVEPEER_API_KEY) {
      console.error('LIVEPEER_API_KEY not configured');
      return NextResponse.json({ error: 'Livepeer API not configured' }, { status: 500 });
    }
    
    console.log('Importing to Livepeer:', { ipfsCid, name });
    
    const livepeerResponse = await fetch('https://livepeer.studio/api/asset/import', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: `https://gateway.pinata.cloud/ipfs/${ipfsCid}`,
        name: name || 'Imported Asset'
      })
    });
    
    if (!livepeerResponse.ok) {
      const errorText = await livepeerResponse.text();
      console.error('Livepeer API error:', livepeerResponse.status, errorText);
      return NextResponse.json({ 
        error: `Livepeer API error: ${livepeerResponse.status}`,
        details: errorText 
      }, { status: 500 });
    }

    const livepeerData = await livepeerResponse.json();
    console.log('Livepeer response:', livepeerData);
    
    // Store in database with comprehensive error handling
    let data, error;
    
    // Try asset_streams table first (most compatible)
    try {
      console.log('Inserting into asset_streams...');
      const result = await supabaseServer
        .from('asset_streams')
        .insert({
          ipfs_cid: ipfsCid,
          livepeer_asset_id: livepeerData.asset?.id,
          livepeer_playback_id: livepeerData.asset?.playbackId,
          status: 'processing',
          name: name || 'Livepeer Import',
          uploader_wallet: uploaderWallet || '0x860Ec697167Ba865DdE1eC9e172004100613e970'
        })
        .select()
        .single();
      
      data = result.data;
      error = result.error;
      
      if (error) {
        console.error('asset_streams insert error:', error);
        throw error;
      }
      
      console.log('Successfully inserted into asset_streams:', data?.id);
      
    } catch (streamError) {
      console.log('asset_streams failed, trying assets table...');
      
      // Fallback to assets table
      try {
        const result = await supabaseServer
          .from('assets')
          .insert({
            name: name || 'Livepeer Import',
            creator_wallet: uploaderWallet || '0x860Ec697167Ba865DdE1eC9e172004100613e970',
            asset_type: 'video',
            file_cid: ipfsCid,
            status: 'processing',
            livepeer_asset_id: livepeerData.asset?.id,
            livepeer_playback_id: livepeerData.asset?.playbackId,
            metadata: {
              import_source: 'livepeer',
              original_url: `https://gateway.pinata.cloud/ipfs/${ipfsCid}`
            }
          })
          .select()
          .single();
        
        data = result.data;
        error = result.error;
        
        if (error) {
          console.error('assets insert error:', error);
          throw error;
        }
        
        console.log('Successfully inserted into assets:', data?.id);
        
      } catch (assetsError) {
        console.error('Both table inserts failed:', { streamError, assetsError });
        throw new Error(`Database insert failed: ${assetsError}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      playbackId: livepeerData.asset?.playbackId,
      livepeerAssetId: livepeerData.asset?.id,
      assetId: data?.id,
      message: 'Import initiated successfully'
    });
    
  } catch (error) {
    console.error('Livepeer import error:', error);
    
    // Return detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({ 
      success: false,
      error: 'Import failed',
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}