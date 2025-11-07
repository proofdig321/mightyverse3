#!/usr/bin/env node

const LIVEPEER_API_KEY = "99764289-df40-4cba-ab77-3105df4bf7a9";

async function testSync() {
  try {
    console.log('🔍 Fetching assets from Livepeer...');
    
    const response = await fetch('https://livepeer.studio/api/asset', {
      headers: {
        'Authorization': `Bearer ${LIVEPEER_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`API failed: ${response.status}`);
    }

    const assets = await response.json();
    console.log(`Found ${assets.length} total assets`);
    
    // Find your animation
    const yourAsset = assets.find(asset => asset.playbackId === '80e1344yfvkuzixp');
    
    if (yourAsset) {
      console.log('\n🎬 Found your animation:');
      console.log('Name:', yourAsset.name);
      console.log('Status:', yourAsset.status?.phase);
      console.log('Playback ID:', yourAsset.playbackId);
      console.log('Size:', yourAsset.size ? `${(yourAsset.size / 1024 / 1024).toFixed(1)} MB` : 'unknown');
      console.log('Created:', new Date(yourAsset.createdAt).toLocaleString());
    } else {
      console.log('❌ Animation with playback ID 80e1344yfvkuzixp not found');
    }
    
    // Show ready assets
    const readyAssets = assets.filter(asset => asset.status?.phase === 'ready');
    console.log(`\n✅ ${readyAssets.length} ready assets:`);
    readyAssets.forEach(asset => {
      console.log(`- ${asset.name} (${asset.playbackId})`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSync();