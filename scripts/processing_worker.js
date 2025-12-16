const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const DATA_DIR = path.join(__dirname, '..', 'services', 'upload_service', 'data');
const ASSETS_FILE = path.join(DATA_DIR, 'assets.json');
const QUEUE_DIR = path.join(DATA_DIR, 'queue');

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function processQueue() {
  try {
    // Get queued processing jobs from Supabase
    const { data: jobs, error } = await supabase
      .from('processing_jobs')
      .select('*')
      .eq('status', 'queued')
      .limit(10);

    if (error) {
      console.error('Failed to fetch processing jobs:', error);
      return;
    }

    if (!jobs || jobs.length === 0) {
      console.log('No jobs in queue');
      return;
    }

    for (const job of jobs) {
      try {
        console.log(`Processing job ${job.id} for asset ${job.content_id}`);

        // Update job status to processing
        await supabase
          .from('processing_jobs')
          .update({ status: 'processing', started_at: new Date().toISOString() })
          .eq('id', job.id);

        // Get asset record
        const { data: asset, error: assetError } = await supabase
          .from('assets')
          .select('*')
          .eq('id', job.content_id)
          .single();

        if (assetError || !asset) {
          console.log(`Asset not found for job ${job.id}`);
          await supabase
            .from('processing_jobs')
            .update({ status: 'failed', error_message: 'Asset not found' })
            .eq('id', job.id);
          continue;
        }

        // Simulate processing time
        await sleep(1500);

        // Process based on asset type
        let processingResult = {};
        if (asset.mime_type?.startsWith('video/')) {
          processingResult = await processVideo(asset);
        } else if (asset.mime_type?.startsWith('image/')) {
          processingResult = await processImage(asset);
        } else {
          processingResult = await processGenericFile(asset);
        }

        // Update asset with processing results
        await supabase
          .from('assets')
          .update({
            status: 'ready',
            thumbnail_cid: processingResult.thumbnailCid,
            metadata: {
              ...asset.metadata,
              processed: true,
              processing_time: processingResult.processingTime
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', asset.id);

        // Complete the job
        await supabase
          .from('processing_jobs')
          .update({
            status: 'completed',
            output_data: processingResult,
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id);

        console.log(`Asset ${asset.id} processed and ready`);
      } catch (err) {
        console.error('Worker error processing job', job.id, err);
        
        // Mark job as failed
        await supabase
          .from('processing_jobs')
          .update({
            status: 'failed',
            error_message: err.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id);
      }
    }
  } catch (error) {
    console.error('Queue processing error:', error);
  }
}

async function processVideo(asset) {
  // Simulate video processing
  return {
    thumbnailCid: `thumb_${asset.id}`,
    processingTime: 1500,
    transcoded: true
  };
}

async function processImage(asset) {
  // Simulate image processing
  return {
    thumbnailCid: asset.file_cid, // Use original as thumbnail
    processingTime: 500,
    optimized: true
  };
}

async function processGenericFile(asset) {
  // Simulate generic file processing
  return {
    thumbnailCid: null,
    processingTime: 200,
    validated: true
  };
}

async function main() {
  console.log('Processing worker started');
  while (true) {
    try {
      await processQueue();
    } catch (e) {
      console.error('Worker main loop error', e);
    }
    await sleep(3000);
  }
}

if (require.main === module) {
  main();
}

module.exports = { processQueue };
