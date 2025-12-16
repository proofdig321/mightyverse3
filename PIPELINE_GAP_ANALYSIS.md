# Data Pipeline Gap Analysis

## Current System Architecture

### 1. Upload Flow
```
Web App → /api/upload/init → S3 Presigned URL OR Local Upload Service
       → /api/upload/complete → MCP Notification (optional)
```

### 2. Processing Flow  
```
Upload Service → Queue File → Processing Worker → Asset Status Update
```

### 3. MCP Integration
```
MCP Coordinator → Database/S3 Validation → Agent Orchestration
```

## Critical Gaps Identified

### 🚨 Gap 1: Missing n8n Integration
**Current**: n8n exists but not connected to data pipeline
**Missing**: 
- Webhook endpoints from upload complete to n8n workflows
- n8n to MCP communication for approval workflows
- Automated processing triggers

**Fix Required**:
```javascript
// In /web/pages/api/upload/complete.js - ADD:
if (process.env.N8N_WEBHOOK_URL) {
  await fetch(process.env.N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'upload_complete', assetId, data })
  });
}
```

### 🚨 Gap 2: MCP-Supabase Integration Incomplete
**Current**: MCP has basic database connection
**Missing**:
- Asset workflow state management
- Processing job tracking in Supabase
- Real-time status updates

**Fix Required**:
```python
# In agents/mcp_coordinator.py - ADD:
async def update_asset_workflow(self, asset_id, stage, status):
    if self.db_connection:
        with self.db_connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO workflow_states (content_id, content_type, workflow_type, current_stage, status)
                VALUES (%s, 'asset', 'processing', %s, %s)
                ON CONFLICT (content_id, content_type) DO UPDATE SET
                current_stage = %s, status = %s, updated_at = NOW()
            """, (asset_id, stage, status, stage, status))
```

### 🚨 Gap 3: Upload Pipeline Disconnected
**Current**: Two separate upload systems (pages/api vs app/api)
**Missing**: 
- Unified upload endpoint
- Proper asset creation in Supabase
- Livepeer integration trigger

**Fix Required**:
```typescript
// Replace /web/pages/api/upload/init.js with app/api/upload/init/route.ts
export async function POST(request: NextRequest) {
  // Create asset record in Supabase
  const { data: asset } = await supabase.from('assets').insert({
    name: filename,
    creator_wallet: userWallet,
    asset_type: 'upload',
    status: 'uploading'
  }).select().single();
  
  // Generate S3 presigned URL
  // Return both asset ID and upload URL
}
```

### 🚨 Gap 4: Processing Worker Not Connected to Supabase
**Current**: Uses local JSON file storage
**Missing**:
- Supabase asset updates
- Processing job tracking
- Status synchronization

**Fix Required**:
```javascript
// In scripts/processing_worker.js - REPLACE file operations with:
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function processAsset(assetId) {
  await supabase.from('assets').update({
    status: 'processing'
  }).eq('id', assetId);
  
  // Process asset...
  
  await supabase.from('assets').update({
    status: 'ready',
    thumbnail_cid: posterCid,
    metadata: { transcoded: true }
  }).eq('id', assetId);
}
```

### 🚨 Gap 5: Livepeer Integration Missing
**Current**: Livepeer API exists but not in pipeline
**Missing**:
- Automatic video upload to Livepeer
- Playback ID generation
- Status synchronization

**Fix Required**:
```typescript
// In web/app/api/livepeer/process/route.ts - ADD to upload complete:
if (asset.mime_type?.startsWith('video/')) {
  const livepeerResponse = await fetch('https://livepeer.studio/api/asset/upload/url', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}` },
    body: JSON.stringify({ name: asset.name })
  });
  
  // Update asset with Livepeer data
}
```

### 🚨 Gap 6: MCP Agent Task Execution Missing
**Current**: MCP has task framework but no real implementations
**Missing**:
- Actual file processing agents
- IPFS pinning integration
- Metadata generation

**Fix Required**:
```python
# In agents/mcp_coordinator.py - ADD real agent implementations:
class UploadAgent(MCPAgent):
    async def execute_task(self, task: AgentTask):
        if "process_upload" in task.description:
            # Pin to IPFS
            # Generate metadata
            # Update Supabase
            # Trigger Livepeer if video
```

## Missing Environment Variables

### Web App (.env.local)
```env
# Missing for n8n integration
N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook/upload-complete
N8N_AUTH_TOKEN=your-n8n-webhook-token

# Missing for MCP integration  
MCP_ENDPOINT=https://mcp.railway.app/api/mcp/execute
MCP_AUTH_TOKEN=your-mcp-token
```

### MCP Coordinator
```env
# Missing Supabase integration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Missing n8n integration
N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook/mcp-notify
```

## Integration Flow Fixes Needed

### 1. Complete Upload Pipeline
```
1. Web Upload → 2. Supabase Asset Record → 3. S3 Upload → 
4. MCP Notification → 5. n8n Workflow → 6. Processing Agents → 
7. Livepeer Upload → 8. IPFS Pinning → 9. Status Updates
```

### 2. Workflow State Management
```
Supabase workflow_states table ↔ MCP Agent Tasks ↔ n8n Workflows
```

### 3. Real-time Updates
```
Processing Updates → MCP → WebSocket → Web App UI
```

## Priority Fixes (Immediate)

1. **Connect upload complete to Supabase** - Replace JSON file storage
2. **Add MCP notification to upload pipeline** - Enable agent orchestration  
3. **Implement processing job tracking** - Use Supabase processing_jobs table
4. **Add Livepeer auto-upload** - For video assets
5. **Connect n8n webhooks** - Enable workflow automation

## Testing Requirements

After fixes, validate:
- [ ] Upload creates Supabase asset record
- [ ] MCP receives upload notifications
- [ ] Processing worker updates Supabase
- [ ] Livepeer processes video files
- [ ] n8n workflows trigger correctly
- [ ] Status updates reach web app

## Deployment Dependencies

1. **Supabase Schema** - Deploy content_schemas.sql
2. **MCP Environment** - Add Supabase credentials
3. **n8n Setup** - Configure webhook workflows
4. **Web App Config** - Add MCP/n8n endpoints
5. **Processing Worker** - Update to use Supabase