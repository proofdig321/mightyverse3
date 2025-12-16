# Real System Integration Fixes

## Connect MCP to Actual Livepeer Upload Flow

### Fix 1: Add MCP Notification to Livepeer Upload
```typescript
// In /web/app/api/livepeer/upload/route.ts - ADD after asset creation
if (process.env.MCP_ENDPOINT && process.env.MCP_AUTH_TOKEN) {
  try {
    await fetch(process.env.MCP_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MCP_AUTH_TOKEN}`
      },
      body: JSON.stringify({
        task: 'process_livepeer_upload',
        payload: {
          assetId: assetData.id,
          livepeerAssetId: uploadRequest.assetId,
          name: name || file.name,
          creatorWallet,
          assetType
        }
      })
    });
  } catch (mcpError) {
    console.warn('MCP notification failed:', mcpError);
  }
}
```

### Fix 2: Add n8n Webhook to Livepeer Upload
```typescript
// In /web/app/api/livepeer/upload/route.ts - ADD after success response
if (process.env.N8N_WEBHOOK_URL) {
  try {
    await fetch(process.env.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'livepeer_upload_complete',
        assetId: assetData.id,
        livepeerAssetId: uploadRequest.assetId,
        name: name || file.name,
        creatorWallet,
        timestamp: new Date().toISOString()
      })
    });
  } catch (n8nError) {
    console.warn('n8n notification failed:', n8nError);
  }
}
```

### Fix 3: Update MCP Coordinator for Real Tasks
```python
# In agents/mcp_coordinator.py - ADD real Livepeer task handler
@app.post("/api/mcp/execute")
async def execute_task(task_data: dict):
    if task_data.get("task") == "process_livepeer_upload":
        return await process_livepeer_upload(task_data.get("payload", {}))
    # ... existing tasks

async def process_livepeer_upload(payload):
    """Process Livepeer upload completion"""
    asset_id = payload.get("assetId")
    livepeer_asset_id = payload.get("livepeerAssetId")
    
    if not asset_id or not livepeer_asset_id:
        return {"error": "Missing required payload data"}
    
    # Create processing job in Supabase
    if coordinator.db_connection:
        try:
            with coordinator.db_connection.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO processing_jobs (job_type, content_id, content_type, status, input_data)
                    VALUES (%s, %s, 'asset', 'queued', %s)
                """, (
                    'livepeer_processing',
                    asset_id,
                    json.dumps({
                        'livepeer_asset_id': livepeer_asset_id,
                        'creator_wallet': payload.get('creatorWallet'),
                        'asset_type': payload.get('assetType')
                    })
                ))
                coordinator.db_connection.commit()
        except Exception as e:
            coordinator.logger.error(f"Failed to create processing job: {e}")
    
    return {
        "status": "processing_queued",
        "asset_id": asset_id,
        "livepeer_asset_id": livepeer_asset_id,
        "timestamp": datetime.now().isoformat()
    }
```

### Fix 4: Update Processing Worker for Real System
```javascript
// In scripts/processing_worker.js - REPLACE with real Livepeer processing
async function processLivepeerJobs() {
  try {
    const { data: jobs, error } = await supabase
      .from('processing_jobs')
      .select('*')
      .eq('job_type', 'livepeer_processing')
      .eq('status', 'queued')
      .limit(5);

    if (error) {
      console.error('Failed to fetch Livepeer jobs:', error);
      return;
    }

    for (const job of jobs || []) {
      try {
        await processLivepeerAsset(job);
      } catch (error) {
        console.error(`Failed to process job ${job.id}:`, error);
        
        await supabase
          .from('processing_jobs')
          .update({
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id);
      }
    }
  } catch (error) {
    console.error('Livepeer job processing error:', error);
  }
}

async function processLivepeerAsset(job) {
  const { content_id: assetId, input_data } = job;
  const { livepeer_asset_id } = input_data;

  // Update job to processing
  await supabase
    .from('processing_jobs')
    .update({ status: 'processing', started_at: new Date().toISOString() })
    .eq('id', job.id);

  // Check Livepeer status
  const livepeerStatus = await checkLivepeerAssetStatus(livepeer_asset_id);
  
  // Update asset with Livepeer data
  const updates = {
    livepeer_status: livepeerStatus.phase,
    updated_at: new Date().toISOString()
  };

  if (livepeerStatus.playbackId) {
    updates.metadata = {
      livepeer_playback_id: livepeerStatus.playbackId,
      livepeer_playback_url: `https://vod-cdn.lp-playback.studio/raw/jxf4iblf6wlsyor6526t4tcmtmqa/catalyst-vod-com/hls/${livepeerStatus.playbackId}/index.m3u8`,
      livepeer_thumbnail_url: `https://vod-cdn.lp-playback.studio/raw/jxf4iblf6wlsyor6526t4tcmtmqa/catalyst-vod-com/hls/${livepeerStatus.playbackId}/thumbnail.jpg`
    };
  }

  if (livepeerStatus.phase === 'ready') {
    updates.status = 'ready';
    
    // Export to IPFS if not already done
    if (!updates.metadata?.ipfs_cid) {
      try {
        const ipfsResult = await exportLivepeerToIPFS(livepeer_asset_id);
        updates.file_cid = ipfsResult.ipfsCid;
        updates.metadata.ipfs_cid = ipfsResult.ipfsCid;
      } catch (ipfsError) {
        console.warn('IPFS export failed:', ipfsError);
      }
    }
  }

  // Update asset
  await supabase
    .from('assets')
    .update(updates)
    .eq('id', assetId);

  // Complete job
  await supabase
    .from('processing_jobs')
    .update({
      status: 'completed',
      output_data: { livepeer_status: livepeerStatus },
      completed_at: new Date().toISOString()
    })
    .eq('id', job.id);

  console.log(`Processed Livepeer asset ${assetId}: ${livepeerStatus.phase}`);
}

async function checkLivepeerAssetStatus(assetId) {
  const response = await fetch(`https://livepeer.studio/api/asset/${assetId}`, {
    headers: { 'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}` }
  });
  
  if (!response.ok) {
    throw new Error(`Livepeer status check failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  return {
    phase: data.status?.phase || 'unknown',
    playbackId: data.playbackId
  };
}

async function exportLivepeerToIPFS(assetId) {
  const response = await fetch(`https://livepeer.studio/api/asset/${assetId}/export`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ipfs: { pinningService: 'pinata' }
    })
  });

  if (!response.ok) {
    throw new Error(`IPFS export failed: ${response.statusText}`);
  }

  const data = await response.json();
  return { ipfsCid: data.ipfs?.cid };
}

// Update main loop
async function main() {
  console.log('Real Livepeer processing worker started');
  while (true) {
    try {
      await processLivepeerJobs();
    } catch (e) {
      console.error('Worker main loop error', e);
    }
    await sleep(10000); // Check every 10 seconds
  }
}
```

## Environment Variables for Real Integration

```env
# Add to web/.env.local
MCP_ENDPOINT=https://mcp-service.railway.app/api/mcp/execute
MCP_AUTH_TOKEN=your-secure-mcp-token
N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook/livepeer-complete

# Add to MCP coordinator (Railway)
LIVEPEER_API_KEY=99764289-df40-4cba-ab77-3105df4bf7a9
NEXT_PUBLIC_SUPABASE_URL=https://sroy6olz8li3u7o3cvummq.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key

# Add to processing worker
LIVEPEER_API_KEY=99764289-df40-4cba-ab77-3105df4bf7a9
NEXT_PUBLIC_SUPABASE_URL=https://sroy6olz8li3u7o3cvummq.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
```

## Real Integration Flow After Fixes

```
1. User uploads via /api/livepeer/upload (existing, working)
2. File processed and uploaded to Livepeer (existing, working)
3. Asset created in Supabase via Enhanced Data Store (existing, working)
4. MCP notification sent (NEW)
5. n8n webhook triggered (NEW)
6. Processing job created in Supabase (NEW)
7. Processing worker checks Livepeer status (NEW)
8. Asset updated with playback info (NEW)
9. IPFS export triggered if ready (NEW)
10. Final status updates (NEW)
```

This connects the existing, working upload system to the MCP orchestration and n8n automation systems.