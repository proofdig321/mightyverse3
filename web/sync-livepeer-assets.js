#!/usr/bin/env node

/**
 * Sync Livepeer Assets to Database
 * Import working Livepeer assets into our database for testing
 */

const LIVEPEER_API_KEY = "99764289-df40-4cba-ab77-3105df4bf7a9";

async function syncLivepeerAssets() {
  console.log('🔄 Syncing Livepeer assets to database...\n');

  try {
    // Get Livepeer assets
    const response = await fetch('https://livepeer.studio/api/asset', {
      headers: {
        'Authorization': `Bearer ${LIVEPEER_API_KEY}`
      }
    });

    const livepeerAssets = await response.json();
    const readyAssets = livepeerAssets.filter(asset => asset.status?.phase === 'ready');
    
    console.log(`Found ${readyAssets.length} ready assets in Livepeer`);

    for (const asset of readyAssets) {
      console.log(`\n📹 Processing: ${asset.name}`);
      
      // Create database entry via API
      const dbAsset = {
        name: asset.name,
        creator_wallet: '0x860Ec697167Ba865DdE1eC9e172004100613e970',
        asset_type: 'video',
        status: 'approved',
        livepeer_asset_id: asset.id,
        livepeer_status: 'ready',
        livepeer_playback_id: asset.playbackId,
        livepeer_playback_url: `https://lp-playback.com/hls/${asset.playbackId}/index.m3u8`,
        livepeer_thumbnail_url: `https://lp-playback.com/hls/${asset.playbackId}/thumbnail.jpg`,
        file_size: asset.size || 0,
        mime_type: 'video/mp4',
        metadata: {
          upload_method: 'livepeer_direct',
          transcoded: true,
          hls_ready: true,
          original_livepeer_id: asset.id
        }
      };

      // Add to database via API call
      const createResponse = await fetch('http://localhost:3000/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dbAsset)
      });

      if (createResponse.ok) {
        console.log(`✅ Added to database`);
        console.log(`   HLS URL: ${dbAsset.livepeer_playback_url}`);
        console.log(`   Thumbnail: ${dbAsset.livepeer_thumbnail_url}`);
      } else {
        console.log(`❌ Failed to add to database: ${createResponse.statusText}`);
      }
    }

    console.log(`\n🎉 Sync complete! Check admin dashboard for Livepeer assets.`);

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
  }
}

syncLivepeerAssets();