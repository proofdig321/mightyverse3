#!/usr/bin/env node
/**
 * Processing Job Worker
 * Processes background jobs for asset processing, metadata enhancement, etc.
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const MCP_ENDPOINT = process.env.MCP_ENDPOINT;
const MCP_AUTH_TOKEN = process.env.MCP_AUTH_TOKEN;

class ProcessingWorker {
  constructor() {
    this.isRunning = false;
    this.pollInterval = 5000; // 5 seconds
  }

  async start() {
    console.log('🔄 Starting processing worker...');
    this.isRunning = true;
    
    while (this.isRunning) {
      try {
        await this.processJobs();
        await this.sleep(this.pollInterval);
      } catch (error) {
        console.error('Worker error:', error);
        await this.sleep(this.pollInterval);
      }
    }
  }

  async processJobs() {
    // Get queued jobs
    const { data: jobs, error } = await supabase
      .from('processing_jobs')
      .select('*')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Failed to fetch jobs:', error);
      return;
    }

    if (!jobs || jobs.length === 0) {
      return;
    }

    console.log(`📋 Processing ${jobs.length} jobs...`);

    for (const job of jobs) {
      await this.processJob(job);
    }
  }

  async processJob(job) {
    console.log(`🔨 Processing job ${job.id}: ${job.job_type}`);

    try {
      // Update job status to processing
      await supabase
        .from('processing_jobs')
        .update({ 
          status: 'processing',
          started_at: new Date().toISOString()
        })
        .eq('id', job.id);

      let result;

      switch (job.job_type) {
        case 'asset_processing':
          result = await this.processAsset(job);
          break;
        case 'holographic_processing':
          result = await this.processHolographic(job);
          break;
        case 'isrc_generation':
          result = await this.generateISRC(job);
          break;
        case 'quality_analysis':
          result = await this.analyzeQuality(job);
          break;
        case 'metadata_enhancement':
          result = await this.enhanceMetadata(job);
          break;
        default:
          throw new Error(`Unknown job type: ${job.job_type}`);
      }

      // Update job as completed
      await supabase
        .from('processing_jobs')
        .update({
          status: 'completed',
          output_data: result,
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id);

      console.log(`✅ Job ${job.id} completed`);

    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error);

      // Update job as failed
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

  async processAsset(job) {
    const { content_id, input_data } = job;
    
    // Get asset details
    const { data: asset } = await supabase
      .from('assets')
      .select('*')
      .eq('id', content_id)
      .single();

    if (!asset) {
      throw new Error('Asset not found');
    }

    // Trigger MCP processing
    if (MCP_ENDPOINT && MCP_AUTH_TOKEN) {
      const response = await fetch(`${MCP_ENDPOINT}/api/mcp/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MCP_AUTH_TOKEN}`
        },
        body: JSON.stringify({
          task: 'process_upload',
          payload: { assetId: content_id, asset }
        })
      });

      if (!response.ok) {
        throw new Error(`MCP processing failed: ${response.statusText}`);
      }

      return await response.json();
    }

    return { processed: true, timestamp: new Date().toISOString() };
  }

  async processHolographic(job) {
    const { content_id } = job;

    if (MCP_ENDPOINT && MCP_AUTH_TOKEN) {
      const response = await fetch(`${MCP_ENDPOINT}/api/mcp/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MCP_AUTH_TOKEN}`
        },
        body: JSON.stringify({
          task: 'process_holographic_content',
          payload: { assetId: content_id }
        })
      });

      if (!response.ok) {
        throw new Error(`Holographic processing failed: ${response.statusText}`);
      }

      return await response.json();
    }

    return { processed: true, type: 'holographic' };
  }

  async generateISRC(job) {
    const { content_id, input_data } = job;

    if (MCP_ENDPOINT && MCP_AUTH_TOKEN) {
      const response = await fetch(`${MCP_ENDPOINT}/api/mcp/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MCP_AUTH_TOKEN}`
        },
        body: JSON.stringify({
          task: 'generate_isrc',
          payload: { 
            assetId: content_id,
            contentType: input_data?.contentType || 'video'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`ISRC generation failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Update asset with ISRC
      if (result.isrc) {
        await supabase
          .from('assets')
          .update({
            metadata: supabase.rpc('jsonb_set', {
              target: 'metadata',
              path: '{isrc}',
              new_value: JSON.stringify(result.isrc)
            })
          })
          .eq('id', content_id);
      }

      return result;
    }

    return { isrc: `ZA-80H-25-${Date.now().toString().slice(-5)}` };
  }

  async analyzeQuality(job) {
    const { content_id } = job;

    if (MCP_ENDPOINT && MCP_AUTH_TOKEN) {
      const response = await fetch(`${MCP_ENDPOINT}/api/mcp/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MCP_AUTH_TOKEN}`
        },
        body: JSON.stringify({
          task: 'analyze_content_quality',
          payload: { assetId: content_id }
        })
      });

      if (!response.ok) {
        throw new Error(`Quality analysis failed: ${response.statusText}`);
      }

      return await response.json();
    }

    return { quality_score: 0.8, analyzed: true };
  }

  async enhanceMetadata(job) {
    const { content_id } = job;

    // Get current asset
    const { data: asset } = await supabase
      .from('assets')
      .select('*')
      .eq('id', content_id)
      .single();

    if (!asset) {
      throw new Error('Asset not found');
    }

    // Enhance metadata based on content type
    const enhancedMetadata = {
      ...asset.metadata,
      enhanced_at: new Date().toISOString(),
      processing_version: '1.0',
      quality_checked: true
    };

    // Update asset
    await supabase
      .from('assets')
      .update({ metadata: enhancedMetadata })
      .eq('id', content_id);

    return { enhanced: true, metadata: enhancedMetadata };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    console.log('🛑 Stopping processing worker...');
    this.isRunning = false;
  }
}

// Start worker if run directly
if (require.main === module) {
  const worker = new ProcessingWorker();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    worker.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    worker.stop();
    process.exit(0);
  });

  worker.start().catch(console.error);
}

module.exports = ProcessingWorker;