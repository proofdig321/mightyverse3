#!/usr/bin/env node

/**
 * Debug Livepeer Assets
 * Check detailed status of failed assets
 */

const LIVEPEER_API_KEY = "99764289-df40-4cba-ab77-3105df4bf7a9";

async function debugLivepeerAssets() {
  console.log('🔍 Debugging Livepeer assets...\n');

  try {
    const response = await fetch('https://livepeer.studio/api/asset', {
      headers: {
        'Authorization': `Bearer ${LIVEPEER_API_KEY}`
      }
    });

    const assets = await response.json();
    
    console.log(`Found ${assets.length} assets:\n`);
    
    for (const asset of assets) {
      console.log(`📹 ${asset.name} (${asset.id})`);
      console.log(`   Status: ${asset.status?.phase || 'unknown'}`);
      console.log(`   Created: ${new Date(asset.createdAt).toLocaleString()}`);
      console.log(`   Size: ${asset.size ? (asset.size / 1024 / 1024).toFixed(1) + ' MB' : 'unknown'}`);
      
      if (asset.status?.errorMessage) {
        console.log(`   ❌ Error: ${asset.status.errorMessage}`);
      }
      
      if (asset.playbackId) {
        console.log(`   🎬 Playback ID: ${asset.playbackId}`);
        console.log(`   📺 HLS URL: https://lp-playback.com/hls/${asset.playbackId}/index.m3u8`);
        console.log(`   🖼️ Thumbnail: https://lp-playback.com/hls/${asset.playbackId}/thumbnail.jpg`);
      }
      
      if (asset.storage && asset.storage.ipfs) {
        console.log(`   📦 IPFS CID: ${asset.storage.ipfs.cid || 'not exported'}`);
      }
      
      console.log('');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugLivepeerAssets();