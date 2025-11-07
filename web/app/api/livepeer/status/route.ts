import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../../utils/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const assetId = searchParams.get('assetId');
  
  if (!assetId) {
    return NextResponse.json({ error: 'Asset ID required' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://livepeer.studio/api/asset/${assetId}`, {
      headers: { 'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}` }
    });
    
    if (!response.ok) {
      throw new Error(`Livepeer API error: ${response.status}`);
    }
    
    const asset = await response.json();
    
    await supabaseServer
      .from('asset_streams')
      .update({ 
        status: asset.status?.phase || 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('livepeer_asset_id', assetId);
      
    return NextResponse.json(asset);
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({ error: 'Status check failed' }, { status: 500 });
  }
}