import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../../utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { id, status } = await request.json();
    
    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await supabaseServer
      .from('asset_streams')
      .update({ 
        status: status.phase || status,
        updated_at: new Date().toISOString()
      })
      .eq('livepeer_asset_id', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}