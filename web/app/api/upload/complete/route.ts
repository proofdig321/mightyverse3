import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { assetId, key, bucket } = await request.json();
    
    if (!assetId) {
      return NextResponse.json({ error: 'assetId required' }, { status: 400 });
    }

    // Update asset status in Supabase
    const { data: asset, error: updateError } = await supabase
      .from('assets')
      .update({
        status: 'uploaded',
        file_cid: key, // S3 key for now, will be replaced with IPFS CID
        updated_at: new Date().toISOString()
      })
      .eq('id', assetId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 });
    }

    // Create processing job
    const { error: jobError } = await supabase
      .from('processing_jobs')
      .insert({
        job_type: 'asset_processing',
        content_id: assetId,
        content_type: 'asset',
        status: 'queued',
        input_data: { key, bucket, asset_type: asset.asset_type }
      });

    if (jobError) {
      console.error('Failed to create processing job:', jobError);
    }

    // Notify MCP if configured
    if (process.env.MCP_ENDPOINT && process.env.MCP_AUTH_TOKEN) {
      try {
        await fetch(process.env.MCP_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MCP_AUTH_TOKEN}`
          },
          body: JSON.stringify({
            task: 'process_upload',
            payload: { assetId, asset }
          })
        });
      } catch (mcpError) {
        console.warn('MCP notification failed:', mcpError);
      }
    }

    // Notify n8n if configured
    if (process.env.N8N_WEBHOOK_URL) {
      try {
        await fetch(process.env.N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'upload_complete',
            assetId,
            asset,
            timestamp: new Date().toISOString()
          })
        });
      } catch (n8nError) {
        console.warn('n8n notification failed:', n8nError);
      }
    }

    return NextResponse.json({
      success: true,
      asset,
      status: 'processing_queued'
    });

  } catch (error) {
    console.error('Upload complete error:', error);
    return NextResponse.json({ error: 'Upload completion failed' }, { status: 500 });
  }
}