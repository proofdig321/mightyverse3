#!/usr/bin/env node
/**
 * Livepeer Status Monitor
 * Monitors Livepeer assets and updates database with playback URLs
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const LIVEPEER_API_KEY = process.env.LIVEPEER_API_KEY;

class LivepeerStatusMonitor {
  constructor() {
    this.isRunning = false;
    this.pollInterval = 30000; // 30 seconds
  }

  async start() {
    console.log('🎬 Starting Livepeer status monitor...');
    this.isRunning = true;
    
    while (this.isRunning) {
      try {
        await this.checkPendingAssets();
        await this.sleep(this.pollInterval);
      } catch (error) {
        console.error('Monitor error:', error);
        await this.sleep(this.pollInterval);
      }
    }
  }

  async checkPendingAssets() {
    // Get assets with Livepeer IDs that are still processing
    const { data: assets, error } = await supabase
      .from('assets')
      .select('*')
      .not('livepeer_asset_id', 'is', null)
      .in('livepeer_status', ['processing', 'waiting', 'uploading'])
      .limit(20);

    if (error) {
      console.error('Failed to fetch pending assets:', error);
      return;
    }

    if (!assets || assets.length === 0) {
      return;
    }

    console.log(`📋 Checking ${assets.length} pending Livepeer assets...`);

    for (const asset of assets) {
      await this.checkAssetStatus(asset);
    }
  }

  async checkAssetStatus(asset) {
    try {
      const response = await fetch(`https://livepeer.studio/api/asset/${asset.livepeer_asset_id}`, {
        headers: {
          'Authorization': `Bearer ${LIVEPEER_API_KEY}`
        }
      });

      if (!response.ok) {
        console.error(`Failed to check asset ${asset.livepeer_asset_id}: ${response.statusText}`);
        return;
      }

      const livepeerAsset = await response.json();
      const status = livepeerAsset.status?.phase || 'unknown';
      
      console.log(`📊 Asset ${asset.id}: ${asset.livepeer_status} → ${status}`);

      // Prepare updates
      const updates = {
        livepeer_status: status,
        updated_at: new Date().toISOString()
      };

      // Handle status changes
      switch (status) {
        case 'ready':
          updates.status = 'ready';
          updates.livepeer_playback_id = livepeerAsset.playbackId;
          updates.livepeer_playback_url = `https://lp-playback.com/hls/${livepeerAsset.playbackId}/index.m3u8`;
          
          // Add IPFS CID if available
          if (livepeerAsset.storage?.ipfs?.cid) {
            updates.ipfs_cid = livepeerAsset.storage.ipfs.cid;
          }

          // Create processing job for post-processing
          await supabase
            .from('processing_jobs')
            .insert({
              job_type: 'livepeer_ready_processing',
              content_id: asset.id,
              content_type: 'asset',
              status: 'queued',
              input_data: {
                playback_id: livepeerAsset.playbackId,
                ipfs_cid: livepeerAsset.storage?.ipfs?.cid
              }
            });

          console.log(`✅ Asset ${asset.id} is ready with playback ID: ${livepeerAsset.playbackId}`);
          break;

        case 'failed':
          updates.status = 'failed';
          updates.error_message = livepeerAsset.status?.errorMessage || 'Livepeer processing failed';
          console.log(`❌ Asset ${asset.id} failed: ${updates.error_message}`);
          break;

        case 'processing':
          // Update progress if available
          if (livepeerAsset.status?.progress !== undefined) {
            updates.processing_progress = livepeerAsset.status.progress;
          }
          break;
      }

      // Update asset in database
      const { error: updateError } = await supabase
        .from('assets')
        .update(updates)
        .eq('id', asset.id);

      if (updateError) {
        console.error(`Failed to update asset ${asset.id}:`, updateError);
      }

    } catch (error) {
      console.error(`Error checking asset ${asset.id}:`, error);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    console.log('🛑 Stopping Livepeer status monitor...');
    this.isRunning = false;
  }
}

// Start monitor if run directly
if (require.main === module) {
  const monitor = new LivepeerStatusMonitor();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    monitor.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    monitor.stop();
    process.exit(0);
  });

  monitor.start().catch(console.error);
}

module.exports = LivepeerStatusMonitor;