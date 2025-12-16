#!/usr/bin/env node

/**
 * Asset Health Check Script
 * Investigates recent uploads and playback issues
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Environment check
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAssetHealth() {
  console.log('🔍 Asset Health Check - Starting...\n');

  try {
    // Check recent assets
    const { data: assets, error } = await supabase
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Database query failed:', error.message);
      return;
    }

    console.log(`📊 Found ${assets.length} recent assets\n`);

    for (const asset of assets) {
      console.log(`🎬 Asset: ${asset.name}`);
      console.log(`   Type: ${asset.asset_type}`);
      console.log(`   Status: ${asset.status}`);
      console.log(`   MIME: ${asset.mime_type || 'N/A'}`);
      console.log(`   File CID: ${asset.file_cid || 'N/A'}`);
      console.log(`   Livepeer ID: ${asset.livepeer_asset_id || 'N/A'}`);
      console.log(`   Livepeer Status: ${asset.livepeer_status || 'N/A'}`);
      console.log(`   Created: ${asset.created_at}`);

      // Test IPFS access if CID exists
      if (asset.file_cid) {
        await testIPFSAccess(asset.file_cid, asset.name);
      }

      // Test Livepeer access if available
      if (asset.livepeer_playback_id) {
        await testLivepeerAccess(asset.livepeer_playback_id, asset.name);
      }

      console.log('   ---');
    }

  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }
}

async function testIPFSAccess(cid, assetName) {
  try {
    const url = `https://gateway.pinata.cloud/ipfs/${cid}`;
    const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
    
    if (response.ok) {
      console.log(`   ✅ IPFS accessible (${response.status})`);
      console.log(`   📦 Content-Type: ${response.headers.get('content-type')}`);
      console.log(`   📏 Content-Length: ${response.headers.get('content-length')}`);
    } else {
      console.log(`   ❌ IPFS failed (${response.status})`);
    }
  } catch (error) {
    console.log(`   ⚠️ IPFS timeout/error: ${error.message}`);
  }
}

async function testLivepeerAccess(playbackId, assetName) {
  try {
    const url = `https://vod-cdn.lp-playback.studio/raw/jxf4iblf6wlsyor6526t4tcmtmqa/catalyst-vod-com/hls/${playbackId}/video/download.mp4`;
    const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
    
    if (response.ok) {
      console.log(`   ✅ Livepeer accessible (${response.status})`);
    } else {
      console.log(`   ❌ Livepeer failed (${response.status})`);
    }
  } catch (error) {
    console.log(`   ⚠️ Livepeer timeout/error: ${error.message}`);
  }
}

// Run the check
checkAssetHealth().then(() => {
  console.log('\n🏁 Asset health check completed');
}).catch(console.error);